import {
  DeleteObjectsCommand, GetObjectCommand, GetObjectCommandInput, ListObjectsCommand, PutObjectCommand, PutObjectCommandInput,
  PutObjectCommandOutput, S3Client
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { generateS3Key, s3KeyType } from './generateS3Key';


export type s3TaggingKeys = 'overlayImageType'; // s3 object 태그 객체 키
export interface S3UploadImageOptions extends  Partial<Omit<PutObjectCommandInput, 'Bucket'>>{
  filename: string | null;
  userMail: string | undefined;
  type: s3KeyType;
  file: File | Buffer | null;
  companyName?: string;
  liveShoppingId?: number;
  isPublic?: boolean; // 공개 이미지로 업로드 할 경우 true 전달 필요
}


// 클로저를 통한 모듈 생성
export const s3 = (() => {
  // 해당 네임 스페이스에서의 객체선언
  // bucket 이름
  const S3_BUCKET_NAME = process.env.NEXT_PUBLIC_S3_BUCKET_NAME!;
  const S3_BUCKET_REGION = 'ap-northeast-2';
  const S3_DOMIAN = 'https://lc-project.s3.ap-northeast-2.amazonaws.com/';

  const s3Client = new S3Client({
    region: S3_BUCKET_REGION,
    credentials: {
      accessKeyId: process.env.NEXT_PUBLIC_AWS_S3_ACCESS_KEY_ID!,
      secretAccessKey: process.env.NEXT_PUBLIC_AWS_S3_ACCESS_KEY_SECRET!,
    },
  });


  /** s3.send(putObjectCommand) 래핑함수. 버킷 제외한 Key, Body, ContentType, ACL등 기입할것
   * @return output : PutObjectCommandOutput
   * @return savedKey : S3 도메인과 key 합친것으로 이미지의 경우 저장된 url
   */
  async function sendPutObjectCommand(
    commandInput: Omit<PutObjectCommandInput, 'Bucket'>,
  ): Promise<{ output: PutObjectCommandOutput; savedKey: string }> {
    const command = new PutObjectCommand({
      ...commandInput,
      Bucket: S3_BUCKET_NAME,
    });
    return {
      output: await s3Client.send(command),
      savedKey: S3_DOMIAN + commandInput.Key,
    };
  }

  /**
   * s3KeyType에 따라 s3 특정 경로에 이미지를 저장하는 함수
   * public 이미지로 업로드할 경우 isPublic: true 전달해야함
   * 
   * 해당 함수 내부에서 사용하는 generateS3Key에서 userMail 값을 필요로 하므로
   * 특정 유저와 관계없는 이미지 저장 시(객체 prefix에 유저메일을 포함하지 않는 경우)에는 
   * sendPutObjectCommand 함수 사용을 권함
   * 
   * @param type: s3KeyType;
   * @param file: 저장할 이미지 파일 File | Buffer | null;
   * @param filename: 저장할 이미지의 이름, 주로 확장자 추출을 위함
   * @param userMail: 업로드할 사용자의 이메일 string | undefined;
   * @param companyName? (optional) 사업자 등록증에 등록하는 사업자명
   * @param liveShoppingId?: (optional) 라이브쇼핑 id
   * @param isPublic?: public-read 이미지의 경우 true를 전달해야함. 기본값 false
   * @param 기타 Tagging, ContentType, ACL 등 putObjectCommandInput props 전달 가능

   * @returns 파일명(privater 객체인 경우) 혹은 객체url(public-read 객체인 경우)
   * 
   */
  async function s3UploadImage({
    filename,
    userMail,
    type,
    file,
    companyName,
    liveShoppingId,
    isPublic = false,
    ...putObjectCommandInput
  }: S3UploadImageOptions): Promise<string> {
    if (!userMail || !file) throw new Error('file should be not null');
    const { key, fileName } = generateS3Key({
      userMail,
      type,
      filename,
      companyName,
      liveShoppingId,
    });
    console.log({key,fileName});

    try {
      await sendPutObjectCommand({
        ACL: isPublic ? 'public-read' : undefined,
        ...putObjectCommandInput,
        Key: key,
        Body: file,
      });

      
      if (isPublic) {
        // public 인 경우 객체 url을 리턴함
        return getSavedObjectUrl(key);
      } else {
        // public 이 아닌 경우 객체 url로 접근하지 못하므로 그냥 파일명만 리턴함
        return fileName;
      }
    } catch (error) {
      console.error(error);
    }
  }

  /**
   * 해당 key 가진 객체가 public-read인 경우에만 이 url로 접근이 가능함
   * private 객체는 getPresignedUrl 함수 사용
   * @param key s3에 저장된 객체 키 (prefix + 파일명 형태)
   * @returns 객체 url
   */
  function getSavedObjectUrl(key: string): string {
    return S3_DOMIAN + key;
  }


  async function getOverlayImagesFromS3(
    broadcasterId: string,
    liveShoppingId: number,
    type: 'vertical-banner' | 'donation-images' | 'overlay-logo' | 'horizontal-banner',
  ): Promise<(string | undefined)[]> {
    const command = new ListObjectsCommand({
      Bucket: S3_BUCKET_NAME,
      Prefix: `${type}/${broadcasterId}/${liveShoppingId}`,
    });
    const response = await s3Client.send(command);
    const imagesLength = response.Contents || null;
    const imagesKey = imagesLength?.map((item) => {
      return item.Key;
    });
    return imagesKey || [];
  }

  async function s3DeleteImages(
    toDeleteImages: (string | undefined)[],
  ): Promise<boolean> {
    const toDeleteObject: { Key: string }[] = [];
    toDeleteImages.forEach((imageName) => {
      toDeleteObject.push({ Key: `${imageName}` });
    });
    const command = new DeleteObjectsCommand({
      Bucket: S3_BUCKET_NAME,
      Delete: { Objects: toDeleteObject },
    });

    try {
      await s3Client.send(command);
      return true;
    } catch (error) {
      console.log(error);
      return false;
    }
  }


  /**
   *  private 객체 url 조회
   * @param getObjectCommandInput {Key: 객체 key 입력}
   * @param options? {expiresIn: 3600} url 유효시간 입력(초), 기본 15분
   * */ 
  async function getPresignedUrl(
    getObjectCommandInput:Omit<GetObjectCommandInput,'Bucket'>,
    options?:{expiresIn: number}): Promise<string> {
    const command = new GetObjectCommand({
      ...getObjectCommandInput,
      Bucket: S3_BUCKET_NAME,
    });
    const imageUrl = await getSignedUrl(s3Client, command, {
      ...options
    });
    return imageUrl;
  }

  return {
    s3UploadImage,
    getOverlayImagesFromS3,
    s3DeleteImages,
    sendPutObjectCommand,
    getPresignedUrl,
    getSavedObjectUrl
  };
})();
