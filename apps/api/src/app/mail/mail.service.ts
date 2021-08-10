import nanoid from 'nanoid';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { PrismaService } from '@project-lc/prisma-orm';
import { createVerificationTemplate } from './mail-templates/createVerificationTemplate';

@Injectable()
export class MailService {
  constructor(
    private readonly mailerService: MailerService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * 이메일 인증 코드를 생성합니다.
   * @param target 타겟 이메일 주소
   * @returns 생성된 이메일 인증 코드
   */
  private async createEmailCode(target: string): Promise<string> {
    const code = nanoid.nanoid(6);
    await this.prisma.mailVerificationCode.create({
      data: {
        email: target,
        verificationCode: code,
      },
    });
    return code;
  }

  /**
   * 이메일 인증을 위해, 인증코드를 포함한 메일을 타겟 이메일에 보냅니다.
   * @returns {boolean} 성공여부 or 500 에러
   */
  public async sendVerificationMail(targetEmail: string): Promise<boolean> {
    const code = await this.createEmailCode(targetEmail);

    try {
      await this.mailerService.sendMail({
        to: targetEmail,
        subject: `${code}은(는) 이메일 확인을 완료할 코드입니다.`,
        html: createVerificationTemplate(code),
      });
      return true;
    } catch (e) {
      console.error(e);
      throw new InternalServerErrorException(e, 'error in send email');
    }
  }
}
