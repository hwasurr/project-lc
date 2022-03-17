import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Header,
  HttpCode,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { JwtAuthGuard, LocalAuthGuard } from '@project-lc/nest-modules-authguard';
import { MailVerificationService } from '@project-lc/nest-modules-mail-verification';
import {
  EmailCodeVerificationDto,
  loginUserRes,
  SendMailVerificationDto,
  UserProfileRes,
  UserType,
} from '@project-lc/shared-types';
import { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { LoginHistoryService } from './login-history/login-history.service';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private readonly loginHistoryService: LoginHistoryService,
    private readonly mailVerificationService: MailVerificationService,
  ) {}

  // 최초 로그인을 담당할 Router 구현하기
  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(
    @Body('stayLogedIn') stayLogedIn: boolean,
    @Query('type') userType: UserType,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<Response> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { user }: any = req;
    user.userType = userType;
    if (user.inactiveFlag) {
      return res.status(200).send(user);
    }
    const loginToken: loginUserRes = this.authService.issueToken(
      user,
      stayLogedIn,
      userType,
    );
    this.authService.handleLogin(res, loginToken);
    // 로그인 히스토리 추가
    this.loginHistoryService.createLoginStamp(req, '이메일');
    return res.status(200).send(loginToken);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  logout(@Res() res): void {
    this.authService.handleLogout(res);
    res.sendStatus(200);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @Header('Cache-Control', 'no-cache, no-store, must-revalidate')
  getProfile(
    @Query('appType') appType: UserType,
    @Req() req: Request,
  ): Promise<UserProfileRes> {
    return this.authService.getProfile(req.user, appType);
  }

  // * 인증코드 메일 전송
  @Post('mail-verification')
  async sendMailVerification(
    @Body(ValidationPipe) dto: SendMailVerificationDto,
  ): Promise<Observable<boolean>> {
    if (dto.isNotInitial) {
      await this.mailVerificationService.deleteSuccessedMailVerification(dto.email);
    }
    return this.mailVerificationService.sendVerificationMail(dto.email);
  }

  // * 인증코드가 맞는지 확인
  @HttpCode(200)
  @Post('code-verification')
  async verifyCode(
    @Body(ValidationPipe) dto: EmailCodeVerificationDto,
  ): Promise<boolean> {
    const matchingRecord = await this.mailVerificationService.checkMailVerification(
      dto.email,
      dto.code,
    );
    if (!matchingRecord) return false;
    await this.mailVerificationService.deleteSuccessedMailVerification(dto.email);
    return true;
  }

  @Post('code-validation')
  public async mailCodeValidation(@Body(ValidationPipe) dto): Promise<boolean> {
    const checkResult = await this.mailVerificationService.checkMailVerification(
      dto.email,
      dto.code,
    );

    if (!checkResult) {
      throw new BadRequestException('인증코드가 올바르지 않습니다.');
    }
    return true;
  }
}
