import {
  Body,
  Controller,
  DefaultValuePipe,
  ForbiddenException,
  Get,
  Header,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
  ValidationPipe,
  Delete,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  Administrator,
  BusinessRegistrationConfirmation,
  GoodsConfirmation,
  LiveShopping,
  PrivacyApproachHistory,
  AdminClassChangeHistory,
} from '@prisma/client';
import { AdminGuard, JwtAuthGuard } from '@project-lc/nest-modules-authguard';
import {
  BroadcasterService,
  BroadcasterSettlementHistoryService,
  BroadcasterSettlementService,
} from '@project-lc/nest-modules-broadcaster';
import { GoodsService } from '@project-lc/nest-modules-goods';
import { OrderCancelService } from '@project-lc/nest-modules-order-cancel';
import { SellerService, SellerSettlementService } from '@project-lc/nest-modules-seller';
import {
  AdminAllLcGoodsList,
  AdminBroadcasterSettlementInfoList,
  AdminSellerListRes,
  AdminSettlementInfoType,
  AdminSignUpDto,
  BroadcasterDTO,
  BroadcasterSettlementInfoConfirmationDto,
  BusinessRegistrationConfirmationDto,
  BusinessRegistrationRejectionDto,
  ChangeSellCommissionDto,
  CreateManyBroadcasterSettlementHistoryDto,
  EmailDupCheckDto,
  ExecuteSettlementDto,
  FindBcSettlementHistoriesRes,
  GoodsByIdRes,
  GoodsConfirmationDto,
  GoodsRejectionDto,
  LiveShoppingDTO,
  LiveShoppingImageDto,
  OrderCancelRequestDetailRes,
  OrderCancelRequestList,
  SellerGoodsSortColumn,
  SellerGoodsSortDirection,
  AdminClassDto,
  PrivacyApproachHistoryDto,
  AdminClassChangeHistoryDtoWithoutId,
} from '@project-lc/shared-types';
import { Request } from 'express';
import { AdminAccountService } from './admin-account.service';
import { AdminSettlementService } from './admin-settlement.service';
import { AdminService } from './admin.service';
import { AdminPrivacyApproachSevice } from './admin-privacy-approach.service';

@Controller('admin')
export class AdminController {
  private allowedIpAddresses: string[] = ['::1'];
  constructor(
    private readonly adminService: AdminService,
    private readonly broadcasterService: BroadcasterService,
    private readonly adminSettlementService: AdminSettlementService,
    private readonly adminAccountService: AdminAccountService,
    private readonly sellerSettlementService: SellerSettlementService,
    private readonly orderCancelService: OrderCancelService,
    private readonly bcSettlementHistoryService: BroadcasterSettlementHistoryService,
    private readonly broadcasterSettlementService: BroadcasterSettlementService,
    private readonly sellerService: SellerService,
    private readonly projectLcGoodsService: GoodsService,
    private readonly config: ConfigService,
    private readonly adminPrivacyApproachSevice: AdminPrivacyApproachSevice,
  ) {
    const wtIp = config.get('WHILETRUE_IP_ADDRESS');
    if (wtIp) this.allowedIpAddresses.push(wtIp);
  }

  // * 관리자 회원가입
  @Post()
  public async signUp(
    @Req() req: Request,
    @Body(ValidationPipe) dto: AdminSignUpDto,
  ): Promise<Administrator> {
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;
    if (!this.allowedIpAddresses.includes(ip)) {
      throw new ForbiddenException(`unexpected ip address - ${ip}`);
    }
    const administrator = await this.adminAccountService.signUp(dto);
    return administrator;
  }

  // * 이메일 주소 중복 체크
  @Get('email-check')
  public async emailDupCheck(
    @Query(ValidationPipe) dto: EmailDupCheckDto,
  ): Promise<boolean> {
    return this.adminAccountService.isEmailDupCheckOk(dto.email);
  }

  /** 판매자 정산 등록 정보 조회 */
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('/settlement')
  @Header('Cache-Control', 'no-cache, no-store, must-revalidate')
  getSettlementInfo(): Promise<AdminSettlementInfoType> {
    return this.adminService.getSettlementInfo();
  }

  /** 판매자 정산처리 */
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post('/settlement')
  executeSettle(@Body(ValidationPipe) dto: ExecuteSettlementDto): Promise<boolean> {
    if (dto.target.options.length === 0) return null;
    return this.sellerSettlementService.executeSettle(dto.sellerEmail, dto);
  }

  /** 판매자 정산 완료 목록 */
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('/settlement-history')
  getSettlementHistory(): ReturnType<SellerSettlementService['findSettlementHistory']> {
    return this.sellerSettlementService.findSettlementHistory();
  }

  /** 방송인 단일 정산처리 */
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post('/settlement/broadcaster')
  async executeBcSettle(
    @Body(ValidationPipe) dto: CreateManyBroadcasterSettlementHistoryDto,
  ): Promise<number> {
    return this.bcSettlementHistoryService.executeSettleMany(dto);
  }

  /** 방송인 정산 완료 목록 조회 */
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('/settlement-history/broadcaster')
  public async findBroadcasterSettlementHistoriesByRound(): Promise<FindBcSettlementHistoriesRes> {
    return this.bcSettlementHistoryService.findHistories();
  }

  /** 판매자 정산 기본 수수료 변경 */
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Put('/sell-commission')
  updateSellCommission(
    @Body(ValidationPipe) dto: ChangeSellCommissionDto,
  ): Promise<boolean> {
    return this.adminService.updateSellCommission(dto.commissionRate);
  }

  // 상품검수를 위한 상품 리스트
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('/goods')
  @Header('Cache-Control', 'no-cache, no-store, must-revalidate')
  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  getGoodsInfo(
    @Query('sort', new DefaultValuePipe(SellerGoodsSortColumn.REGIST_DATE))
    sort: SellerGoodsSortColumn,
    @Query('direction', new DefaultValuePipe(SellerGoodsSortDirection.DESC))
    direction: SellerGoodsSortDirection,
  ) {
    return this.adminService.getGoodsInfo({
      sort,
      direction,
    });
  }

  // 상품검수를 위한 상품 리스트
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('/goods/:goodsId')
  @Header('Cache-Control', 'no-cache, no-store, must-revalidate')
  getAdminGoodsById(@Param('goodsId') goodsId: string | number): Promise<GoodsByIdRes> {
    return this.adminService.getOneGoods(goodsId);
  }

  // 상품 검수 승인을 수행
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Put('/goods/confirm')
  setGoodsConfirmation(@Body() dto: GoodsConfirmationDto): Promise<GoodsConfirmation> {
    return this.adminService.setGoodsConfirmation(dto);
  }

  // 상품 검수 반려를 수행
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Put('/goods/reject')
  setGoodsRejection(@Body() dto: GoodsRejectionDto): Promise<GoodsConfirmation> {
    return this.adminService.setGoodsRejection(dto);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('/live-shoppings')
  @Header('Cache-Control', 'no-cache, no-store, must-revalidate')
  getLiveShoppings(@Query('liveShoppingId') dto?: string): Promise<LiveShopping[]> {
    return this.adminService.getRegisteredLiveShoppings(dto || null);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Patch('/live-shopping')
  @Header('Cache-Control', 'no-cache, no-store, must-revalidate')
  async updateLiveShoppings(
    @Body() data: { dto: LiveShoppingDTO; videoUrlExist?: boolean },
  ): Promise<boolean> {
    let videoId;
    if (data.dto.videoUrl) {
      if (data.videoUrlExist) {
        await this.adminService.deleteVideoUrl(data.dto.id);
      }
      videoId = await this.adminService.registVideoUrl(data.dto.videoUrl);
    }
    return this.adminService.updateLiveShoppings(data.dto, videoId);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('/live-shopping/broadcasters')
  @Header('Cache-Control', 'no-cache, no-store, must-revalidate')
  getAllBroadcasters(): Promise<BroadcasterDTO[]> {
    return this.broadcasterService.getAllBroadcasterIdAndNickname();
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post('/live-shopping/images')
  upsertLiveShoppingImage(@Body() dto: LiveShoppingImageDto): Promise<boolean> {
    console.log('hit upsert', dto);
    return this.adminService.upsertLiveShoppingImage(dto);
  }

  // 상품 검수 승인을 수행
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Put('/business-registration/confirm')
  setBusinessRegistrationConfirmation(
    @Body() dto: BusinessRegistrationConfirmationDto,
  ): Promise<BusinessRegistrationConfirmation> {
    return this.adminSettlementService.setBusinessRegistrationConfirmation(dto);
  }

  // 상품 검수 반려를 수행
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Put('/business-registration/reject')
  setBusinessRegistrationRejection(
    @Body() dto: BusinessRegistrationRejectionDto,
  ): Promise<BusinessRegistrationConfirmation> {
    return this.adminSettlementService.setBusinessRegistrationRejection(dto);
  }

  /** 결제취소 요청 목록 조회 */
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('/order-cancel/list')
  getAllOrderCancelRequests(): Promise<OrderCancelRequestList> {
    return this.orderCancelService.getAllOrderCancelRequests();
  }

  /** 특정 주문에 대한 결제취소 요청 조회 */
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('/order-cancel/:orderId')
  getOneOrderCancelRequest(
    @Param('orderId') orderId: string,
  ): Promise<OrderCancelRequestDetailRes> {
    return this.orderCancelService.getOneOrderCancelRequest(orderId);
  }

  /** 특정 주문에 대한 결제취소 요청 상태 변경 */
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Put('/order-cancel/:requestId')
  setOrderCancelRequestDone(
    @Param('requestId', ParseIntPipe) requestId: number,
  ): Promise<boolean> {
    return this.orderCancelService.setOrderCancelRequestDone(requestId);
  }

  /** 방송인 정산등록정보 신청 목록 조회 */
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('/settelment-info-list/broadcaster')
  getBroadcasterSettlementInfoList(): Promise<AdminBroadcasterSettlementInfoList> {
    return this.broadcasterSettlementService.getBroadcasterSettlementInfoList();
  }

  /** 방송인 정산정보 검수상태, 사유 수정 */
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Patch('/settlement-info/broadcaster/confirmation')
  setBroadcasterSettlementInfoConfirmation(
    @Body()
    dto: BroadcasterSettlementInfoConfirmationDto,
  ): Promise<boolean> {
    return this.adminSettlementService.setBroadcasterSettlementInfoConfirmation(dto);
  }

  /** 전체 판매자 계정 목록 조회 */
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('/sellers')
  getSellerList(): Promise<AdminSellerListRes> {
    return this.sellerService.getSellerList();
  }

  /** ================================= */
  // 상품홍보 ProductPromotion
  /** ================================= */

  /** 전체 상품목록 조회
   * - 상품홍보에 연결하기 위한 상품(project-lc goods) 전체목록. 검수완료 & 정상판매중 일 것
   * goodsConfirmation.status === confirmed && goods.status === normal
   * goodsId, goodsName, sellerId, sellerEmail
   * */
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('confirmed-goods-list')
  async findAllConfirmedLcGoodsList(): Promise<AdminAllLcGoodsList> {
    return this.projectLcGoodsService.findAllConfirmedLcGoodsList();
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post('privacy-approach-history')
  async createPrivacyApproachHistory(
    @Req() req: Request,
    @Body() dto: PrivacyApproachHistoryDto,
  ): Promise<PrivacyApproachHistory> {
    return this.adminPrivacyApproachSevice.createPrivacyApproachHistory(req, dto);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post('class-change-history')
  async createClassChangeHistory(
    @Body() dto: AdminClassChangeHistoryDtoWithoutId,
  ): Promise<AdminClassChangeHistory> {
    return this.adminService.createAdminClassChangeHistory(dto);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('/admin-managers')
  async getAdminUserList(): Promise<AdminClassDto[]> {
    return this.adminService.getAdminUserList();
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Patch('/admin-class')
  async updateAdminClass(@Body() dto: AdminClassDto): Promise<Administrator> {
    return this.adminService.updateAdminClass(dto);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Delete('/user/:userId')
  async deleteAdminUser(@Param('userId') userId: number): Promise<boolean> {
    return this.adminService.deleteAdminUser(userId);
  }
}
