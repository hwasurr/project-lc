import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  UnauthorizedException,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  ValidationPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { BroadcasterChannel } from '@prisma/client';
import {
  BroadcasterInfo,
  HttpCacheInterceptor,
  UserPayload,
} from '@project-lc/nest-core';
import { JwtAuthGuard } from '@project-lc/nest-modules-authguard';
import { MailVerificationService } from '@project-lc/nest-modules-mail';
import {
  BroadcasterAddressDto,
  BroadcasterContractionAgreementDto,
  BroadcasterRes,
  ChangeNicknameDto,
  CreateBroadcasterChannelDto,
  EmailDupCheckDto,
  FindBroadcasterDto,
  PasswordValidateDto,
  SignUpDto,
} from '@project-lc/shared-types';
import { Broadcaster, BroadcasterAddress } from '.prisma/client';
import { BroadcasterChannelService } from './broadcaster-channel.service';
import { BroadcasterSettlementHistoryService } from './broadcaster-settlement-history.service';
import { BroadcasterService } from './broadcaster.service';

@Controller('broadcaster')
export class BroadcasterController {
  constructor(
    private readonly broadcasterService: BroadcasterService,
    private readonly channelService: BroadcasterChannelService,
    private readonly mailVerificationService: MailVerificationService,
    private readonly settlementHistoryService: BroadcasterSettlementHistoryService,
  ) {}

  /** 방송인 정보 조회 */
  @Get()
  @UseInterceptors(HttpCacheInterceptor)
  public async findBroadcaster(
    @Query(ValidationPipe) dto: FindBroadcasterDto,
  ): Promise<BroadcasterRes | null> {
    return this.broadcasterService.getBroadcaster(dto);
  }

  /** 방송인 회원가입 */
  @Post()
  public async signUp(@Body(ValidationPipe) dto: SignUpDto): Promise<Broadcaster> {
    const checkResult = await this.mailVerificationService.checkMailVerification(
      dto.email,
      dto.code,
    );

    if (!checkResult) {
      throw new BadRequestException('인증코드가 올바르지 않습니다.');
    }
    const broadcaster = await this.broadcasterService.signUp(dto);
    await this.mailVerificationService.deleteSuccessedMailVerification(dto.email);
    return broadcaster;
  }

  @Patch('restore')
  public async restoreInactiveBroadcaster(@Body(ValidationPipe) dto): Promise<any> {
    return this.broadcasterService.restoreInactiveBroadcaster(dto.email);
  }

  /** 방송인 이메일 주소 중복 체크 */
  @Get('email-check')
  public async emailDupCheck(
    @Query(ValidationPipe) dto: EmailDupCheckDto,
  ): Promise<boolean> {
    return this.broadcasterService.isEmailDupCheckOk(dto.email);
  }

  /** 방송인 채널 생성 */
  @UseGuards(JwtAuthGuard)
  @Post('/channel')
  createBroadcasterChannel(
    @Body(ValidationPipe) dto: CreateBroadcasterChannelDto,
  ): Promise<BroadcasterChannel> {
    return this.channelService.createBroadcasterChannel(dto);
  }

  /** 방송인 채널 삭제 */
  @UseGuards(JwtAuthGuard)
  @Delete('/channel/:channelId')
  deleteBroadcasterChannel(
    @Param('channelId', ParseIntPipe) channelId: number,
  ): Promise<boolean> {
    return this.channelService.deleteBroadcasterChannel(channelId);
  }

  /** 방송인 채널 목록 조회 */
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(HttpCacheInterceptor)
  @Get('/:broadcasterId/channel-list')
  getBroadcasterChannelList(
    @Param('broadcasterId', ParseIntPipe) broadcasterId: number,
  ): Promise<BroadcasterChannel[]> {
    return this.channelService.getBroadcasterChannelList(broadcasterId);
  }

  /**
   * 방송인 누적 정산 금액 조회
   * @deprecated
   * TODO: 5차 스프린트 배포 이후 삭제
   * - broadcaster/settlement-history:broadcasterId 로 이전.
   * - 2022.02.08 by hwasurr(dan)
   */
  @UseGuards(JwtAuthGuard)
  @Get('/:broadcasterId/accumulated-settlement-amount')
  public async findAccumulatedSettlementAmount(
    @Param('broadcasterId', ParseIntPipe) broadcasterId: number,
  ): Promise<number> {
    const acc = await this.settlementHistoryService.findAccumulatedSettlementAmount(
      broadcasterId,
    );
    return acc._sum.amount;
  }

  /** 방송인 활동명 수정 */
  @UseGuards(JwtAuthGuard)
  @Put('nickname')
  public async updateNickname(
    @BroadcasterInfo() bc: UserPayload,
    @Body(ValidationPipe) dto: ChangeNicknameDto,
  ): Promise<Broadcaster> {
    return this.broadcasterService.updateNickname(bc.id, dto.nickname);
  }

  /** 방송인 주소 수정 */
  @UseGuards(JwtAuthGuard)
  @Put('address')
  public async updateAddress(
    @BroadcasterInfo() bc: UserPayload,
    @Body(ValidationPipe) dto: BroadcasterAddressDto,
  ): Promise<BroadcasterAddress> {
    return this.broadcasterService.upsertAddress(bc.id, dto);
  }

  // 로그인 한 사람이 본인인증을 위해 비밀번호 확인
  @UseGuards(JwtAuthGuard)
  @Post('validate-password')
  public async validatePassword(
    @Body(ValidationPipe) dto: PasswordValidateDto,
  ): Promise<boolean> {
    return this.broadcasterService.checkPassword(dto.email, dto.password);
  }

  // 비밀번호 변경
  @Patch('password')
  public async changePassword(
    @Body(ValidationPipe) dto: PasswordValidateDto,
  ): Promise<Broadcaster> {
    return this.broadcasterService.changePassword(dto.email, dto.password);
  }

  // 이용 동의 상태 변경
  @UseGuards(JwtAuthGuard)
  @Patch('agreement')
  public async changeContractionAgreement(
    @Body(ValidationPipe) dto: BroadcasterContractionAgreementDto,
  ): Promise<Broadcaster> {
    return this.broadcasterService.changeContractionAgreement(
      dto.email,
      dto.agreementFlag,
    );
  }

  /** 방송인 계정 삭제 */
  @UseGuards(JwtAuthGuard)
  @Delete()
  public async deleteBroadcaster(
    @Body('email') email: string,
    @BroadcasterInfo() broadcasterInfo: UserPayload,
  ): Promise<boolean> {
    if (email !== broadcasterInfo.sub) {
      throw new UnauthorizedException('본인의 계정이 아니면 삭제할 수 없습니다.');
    }
    return this.broadcasterService.deleteOne(email);
  }

  /** 방송인 아바타 이미지 s3업로드 후 url 저장 */
  @UseGuards(JwtAuthGuard)
  @Post('/avatar')
  @UseInterceptors(FileInterceptor('file'))
  async addAvatar(
    @BroadcasterInfo() broadcaster: UserPayload,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<boolean> {
    return this.broadcasterService.addBroadcasterAvatar(broadcaster.sub, file);
  }

  /** 방송인 아바타 이미지 null로 저장 */
  @UseGuards(JwtAuthGuard)
  @Delete('/avatar')
  async deleteAvatar(@BroadcasterInfo() broadcaster: UserPayload): Promise<boolean> {
    return this.broadcasterService.removeBroadcasterAvatar(broadcaster.sub);
  }
}
