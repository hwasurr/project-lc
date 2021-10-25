import {
  Body,
  Controller,
  Get,
  Param,
  Put,
  Query,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import {
  GoodsService,
  JwtAuthGuard,
  SellerInfo,
  UserPayload,
  LiveShoppingService,
  AdminGuard,
} from '@project-lc/nest-modules';
import {
  ChangeFmOrderStatusDto,
  convertFmStatusStringToStatus,
  FindFmOrderDetailRes,
  FindFmOrderRes,
  FindFmOrdersDto,
  OrderStats,
  OrderStatsRes,
  SalesStats,
} from '@project-lc/shared-types';
import dayjs from 'dayjs';

import { FmOrdersService } from './fm-orders.service';
@UseGuards(JwtAuthGuard)
@Controller('fm-orders')
export class FmOrdersController {
  constructor(
    private readonly projectLcGoodsService: GoodsService,
    private readonly fmOrdersService: FmOrdersService,
    private readonly liveShoppingService: LiveShoppingService,
  ) {}

  /** 주문 목록 조회 */
  @Get()
  async findOrders(
    @SellerInfo() seller: UserPayload,
    @Query(ValidationPipe) dto: FindFmOrdersDto,
  ): Promise<FindFmOrderRes[]> {
    let gids: number[] | undefined; // project-lc 상품 고유 번호
    if (dto.goodsIds && dto.goodsIds.length > 0) {
      gids = dto.goodsIds.map((x) => Number(x));
    }
    // 판매자의 승인된 상품 ID 목록 조회
    const ids = await this.projectLcGoodsService.findMyGoodsIds(seller.sub, gids);
    if (ids.length === 0) return [];
    return this.fmOrdersService.findOrders(ids, dto);
  }

  @UseGuards(AdminGuard)
  @Get('/admin')
  async findAdminOrders(
    @Query(ValidationPipe) dto: FindFmOrdersDto,
  ): Promise<FindFmOrderRes[]> {
    let gids: number[] | undefined; // project-lc 상품 고유 번호
    if (dto.goodsIds && dto.goodsIds.length > 0) {
      gids = dto.goodsIds.map((x) => Number(x));
    }
    // 판매자의 승인된 상품 ID 목록 조회
    const ids = await this.projectLcGoodsService.findAdminGoodsIds(gids);
    if (ids.length === 0) return [];
    return this.fmOrdersService.findOrders(ids, dto);
  }

  @Get('/stats')
  async getOrdersStats(@SellerInfo() seller: UserPayload): Promise<OrderStatsRes> {
    // 판매자의 승인된 상품 ID 목록 조회
    const ids = await this.projectLcGoodsService.findMyGoodsIds(seller.sub);
    if (ids.length === 0)
      return {
        sales: new SalesStats(),
        orders: new OrderStats(),
      };
    return this.fmOrdersService.getOrdersStats(ids);
  }

  @Get('/per-live-shopping')
  async findSalesPerLiveShopping(): Promise<{ id: number; sales: string }[]> {
    let liveShoppingList = await this.liveShoppingService
      .getRegisteredLiveShoppings({})
      .then((result) => {
        return result.map((val) => {
          if (val.sellStartDate && val.sellEndDate) {
            return {
              id: val.id,
              firstmallGoodsConnectionId: `${val.goods.confirmation.firstmallGoodsConnectionId}`,
              sellStartDate: dayjs(val.sellStartDate).toString(),
              sellEndDate: dayjs(val.sellEndDate).toString(),
            };
          }
          return null;
        });
      });

    liveShoppingList = liveShoppingList?.filter((n) => n);
    return this.fmOrdersService.getOrdersStatsDuringLiveShoppingSales(liveShoppingList);
  }

  /** 개별 주문 조회 */
  @Get(':orderId')
  async findOneOrder(
    @SellerInfo() seller: UserPayload,
    @Param('orderId') orderId: string,
  ): Promise<FindFmOrderDetailRes | null> {
    // 판매자의 승인된 상품 ID 목록 조회
    const ids = await this.projectLcGoodsService.findMyGoodsIds(seller.sub);
    return this.fmOrdersService.findOneOrder(orderId, ids);
  }

  @Put(':orderId')
  async changeOrderStatus(
    @Param('orderId') orderId: string,
    @Body(ValidationPipe) dto: ChangeFmOrderStatusDto,
  ): Promise<boolean> {
    const status = convertFmStatusStringToStatus(dto.targetStatus);
    return this.fmOrdersService.changeOrderStatus(orderId, status);
  }
}
