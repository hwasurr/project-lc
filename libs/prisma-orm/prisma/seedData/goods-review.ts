import { PrismaClient } from '@prisma/client';

export const createGoodsReview = async (prisma: PrismaClient): Promise<void> => {
  await prisma.goodsReview.create({
    data: {
      content: `최근에 구매했었던 미시마 사과도 작은 사이즈였는데
      이 사과도 미니미해요. 1인용으로 딱 좋은 사이즈.
      에어프라이어 용 작은 틀에다 애플크럼블을 구울 거라
      사과 하나로 사과 조림부터 만들었어요.
      
      ## 사과 조림 만들기 ##
      
      사과 1개
      설탕 1 큰 술 ~ 1.25 큰 술
      레몬즙
      
      (사과 사이즈에 따라 입맛에 따라 설탕과 레몬즙 양을 조절하세요.)
      
      1. 껍질을 깎아 나박나박 썰은 사과와 설탕을 넣고 설탕이 타지 않도록 약불에서 은근히 조려 줍니다.
      2. 사과에서 물이 나오면 레몬즙을 조금 뿌려주고 수분이 사라질 때까지 조려준다.
      (저는 포션 버터 하나 깔아주고 졸여 줬는데 맛을 보니 버터리한 맛보다 상큼한 게 먹고 싶어서 레몬즙으로 덮어줬어요.
      깔끔하게 드시고 싶으신 분들은 레몬즙만 넣으셔요.)
      3. 골든 브라운 빛이 나며 표면이 쫀득해지고 사과가 말랑해지면 그대로 식혀줍니다.
      
      끝!
      ㅎㅎ엄청 간단해요.
      이 사과 조림으로 이제 애플크럼블을 만들어요.
      
      
      
      ## 애플크럼블 ##
      
      설탕 60g
      박력분 130g+α
      차가운 상태의 무염버터 90g
      계란
      소금 째끔
      
      아몬드 가루가 있는 줄 알았는데 없어서
      박력분으로만 중량 채워 만들었어요.
      
      
      1. 박력분 130g을 체에 내려 볼에 준비한다.
      2. 설탕을 넣고 냉장실에 있던 차가운 상태의 버터를 작은 큐브 모양으로 잘라 보울에 넣는다.
      3. 단단하고 납작한 주걱을 이용해 세로로 눌러 버터를 잘게 쪼개가며 박력분과 섞어준다.
      4. 계란을 풀어 조금씩 조금씩 넣어가며 섞어 가루가루 -> 보슬보슬 질감으로 만들어 준다.
      (계란 1개 다 넣으면 안 돼요. 쬐끔만.
      저는 조금 질어져 뭉치는 것 같아 박력분을 조금 더 첨가해 주었어요.)
      5. 에어프라이어 용 틀에 유산지를 깔고 크럼블 반죽가루를 꾹꾹 눌러 바닥에 펼쳐준 뒤,
      사과 조림을 올리고 보슬보슬 상태의 크럼블 가루로 덮어준다.
      (에어프라이어용 틀이 아담해서 마치 화분만 한 사막 같아요 ㅎㅎ)
      6. 165도로 35분 구워줍니다.
      
      넘 맛있어요. 빛깔도 맛도 식감도.
      갓 구운 것보다는 시간이 지난 후, 따뜻하게 데워 먹는 것보다는 차갑게, 식혀서 먹는 게 더 맛있어요.
      안에 사과조림이랑 크럼블이랑 너무 잘 어울려요.
      사과 1개만 하지 말고 그냥 다 졸일 걸 그랬나봐요 ㅎㅎ
      레몬즙이 사과에 산미를 더 해줘서 산뜻한 느낌.
      다음에는 사과조림 양을 늘려서 더욱 두툼하게 먹어봐야겠어요.
      아이스크림을 얹어 드셔도 맛있답니다.
      오븐을 사용하지 않고 에어프라이어로도 가능하니 사과가 있으시다면 한번 만들어 보세요.`,
      rating: 5,
      writerId: 1,
      goodsId: 1,
      images: {
        create: [
          {
            imageUrl:
              'https://k-kmarket.com/data/board/goods_review/761167a21b74945284840126978ac0611424122.jpg',
          },
          {
            imageUrl:
              'https://k-kmarket.com/data/board/goods_review/34a037a2d279dd8d52b0f36129b1220a1424202.jpg',
          },
          {
            imageUrl:
              'https://k-kmarket.com/data/board/goods_review/761167a21b74945284840126978ac0611424122.jpg',
          },
          {
            imageUrl:
              'https://k-kmarket.com/data/board/goods_review/34a037a2d279dd8d52b0f36129b1220a1424202.jpg',
          },
          {
            imageUrl:
              'https://k-kmarket.com/data/board/goods_review/761167a21b74945284840126978ac0611424122.jpg',
          },
          {
            imageUrl:
              'https://k-kmarket.com/data/board/goods_review/34a037a2d279dd8d52b0f36129b1220a1424202.jpg',
          },
        ],
      },
      comments: {
        create: [
          {
            content: '리뷰 감사합니다. 언제나 노력하는 000 되겠습니다',
            sellerId: 1,
          },
        ],
      },
    },
  });
};
