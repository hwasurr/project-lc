import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { Order, OrderItemOption, OrderProcessStep, Prisma } from '@prisma/client';
import { UserPwManager } from '@project-lc/nest-core';
import { BroadcasterService } from '@project-lc/nest-modules-broadcaster';
import { PrismaService } from '@project-lc/prisma-orm';
import {
  CreateOrderDto,
  FmOrderStatusNumString,
  FindAllOrderByBroadcasterRes,
  FindManyDto,
  GetNonMemberOrderDetailDto,
  GetOneOrderDetailDto,
  GetOrderListDto,
  getOrderProcessStepNameByStringNumber,
  OrderDetailRes,
  OrderListRes,
  orderProcessStepDict,
  OrderPurchaseConfirmationDto,
  OrderStatsRes,
  sellerOrderSteps,
  UpdateOrderDto,
} from '@project-lc/shared-types';
import { nanoid } from 'nanoid';
import dayjs = require('dayjs');
import isToday = require('dayjs/plugin/isToday');

dayjs.extend(isToday);
@Injectable()
export class OrderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly broadcasterService: BroadcasterService,
    private readonly userPwManager: UserPwManager,
  ) {}

  private async hash(pw: string): Promise<string> {
    return this.userPwManager.hashPassword(pw);
  }

  /** 비회원주문생성시 처리 - 비회원주문비밀번호 암호화하여 리턴, nonMemberOrderFlag: true 설정 */
  private async handleNonMemberOrder(
    dto: CreateOrderDto,
  ): Promise<Partial<Prisma.OrderCreateInput>> {
    const { nonMemberOrderFlag, nonMemberOrderPassword } = dto;
    const hashedPassword = await this.hash(nonMemberOrderPassword);
    return {
      nonMemberOrderFlag,
      nonMemberOrderPassword: hashedPassword,
    };
  }

  /** 선물주문생성시 처리 - 방송인 정보(받는사람 주소, 연락처) 리턴, giftFlag: true 설정 */
  private async handleGiftOrder(
    dto: CreateOrderDto,
  ): Promise<Partial<Prisma.OrderCreateInput>> {
    const { orderItems } = dto;
    // 선물받을 대상 방송인 조회
    const { broadcasterId } = orderItems[0].support;
    const broadcaster = await this.broadcasterService.getBroadcaster({
      id: broadcasterId,
    });
    // 대상 방송인이 존재하지 않는경우 에러
    if (!broadcaster) {
      throw new BadRequestException(
        `후원 대상 방송인이 존재하지 않습니다 broadcasterId: ${broadcasterId}`,
      );
    }

    // 방송인의 주소, 연락처 조회
    const { broadcasterAddress, broadcasterContacts } = broadcaster;
    const defaultContact = broadcasterContacts.find(
      (contact) => contact.isDefault === true,
    );
    return {
      giftFlag: true,
      recipientName: defaultContact?.name || broadcaster.userNickname,
      recipientPhone:
        defaultContact?.phoneNumber || broadcasterContacts[0]?.phoneNumber || '',
      recipientEmail: defaultContact?.email || broadcasterContacts[0]?.email || '',
      recipientAddress: broadcasterAddress.address || '',
      recipientDetailAddress: broadcasterAddress.detailAddress || '',
      recipientPostalCode: broadcasterAddress.postalCode || '',
    };
  }

  /** 주문코드 생성 - 날짜시분초 + nanoid로 생성한 임의의문자열 조합 */
  private createOrderCode(): string {
    return dayjs().format('YYYYMMDDHHmmssSSS') + nanoid(6);
  }

  /** 주문에 포함된 주문상품에 후원정보가 포함되어 있는지 여부 리턴 */
  private hasSupportOrderItem(dto: CreateOrderDto): boolean {
    return (
      dto.orderItems.map((item) => item.support).filter((support) => !!support).length > 0
    );
  }

  /** 주문에서 주문자 정보 빈 문자열로 바꿔서 리턴 */
  private removerecipientInfo<T extends Order>(order: T): T {
    return {
      ...order,
      recipientName: '',
      recipientPhone: '',
      recipientEmail: '',
      recipientAddress: '',
      recipientDetailAddress: '',
      recipientPostalCode: '',
    };
  }

  /** 주문생성 */
  async createOrder(dto: CreateOrderDto): Promise<Order> {
    const { customerId, cartItemIdList, ...data } = dto;
    const { nonMemberOrderFlag, giftFlag, orderItems, payment, supportOrderIncludeFlag } =
      data;

    let createInput: Prisma.OrderCreateInput = {
      ...data,
      orderItems: undefined,
      orderCode: this.createOrderCode(),
      payment: payment ? { connect: { id: payment.id } } : undefined, // TODO: 결제api 작업 이후 CreateOrderDto에서 payment 값 필수로 바꾸고 이부분도 수정필요
      customer: !nonMemberOrderFlag ? { connect: { id: customerId } } : undefined,
    };

    // 비회원 주문의 경우 비밀번호 해시처리
    if (nonMemberOrderFlag) {
      createInput = { ...createInput, ...(await this.handleNonMemberOrder(dto)) };
    }

    // 선물하기의 경우(주문상품은 1개, 후원데이터가 존재함)
    if (giftFlag && orderItems.length === 1 && !!orderItems[0].support) {
      createInput = { ...createInput, ...(await this.handleGiftOrder(dto)) };
    }

    // 주문에 연결된 주문상품, 주문상품옵션, 주문상품후원 생성
    const orderItemsConnectedGoodsIds = orderItems.map((i) => i.goodsId);
    const orderItemConnectedGoodsData = await this.prisma.goods.findMany({
      where: { id: { in: orderItemsConnectedGoodsIds } },
      select: { id: true, goods_name: true, image: true },
    });

    const order = await this.prisma.order.create({
      data: {
        ...createInput,
        supportOrderIncludeFlag: supportOrderIncludeFlag || this.hasSupportOrderItem(dto),
        orderItems: {
          // 주문에 연결된 주문상품 생성
          create: orderItems.map((item) => {
            const { options, support, ...rest } = item;
            const connectedGoodsData = orderItemConnectedGoodsData.find(
              (goodsData) => goodsData.id === item.goodsId,
            );
            // 상품이름
            const goodsName = connectedGoodsData?.goods_name;
            // 상품대표이미지(이미지 중 첫번째)
            const imageUrl = connectedGoodsData?.image[0]?.image;
            return {
              ...rest,
              // 주문상품옵션들 생성
              options: {
                create: options.map((opt) => ({ ...opt, goodsName, imageUrl })),
              },
              // 주문상품에 후원정보가 있는경우 주문상품후원생성
              support: support
                ? {
                    create: {
                      message: support.message,
                      nickname: support.nickname,
                      broadcaster: { connect: { id: support.broadcasterId } },
                    },
                  }
                : undefined,
            };
          }),
        },
      },
    });

    /** *************** */
    // TODO: 주문에 부과된 배송비정보(OrderShipping) 생성???
    /** *************** */

    // 주문 생성 후 장바구니 비우기
    if (cartItemIdList) {
      await this.prisma.cartItem.deleteMany({
        where: { id: { in: cartItemIdList } },
      });
    }

    // 선물주문인경우 생성된 주문데이터에서 받는사람(방송인) 정보 삭제하고 리턴
    if (order.giftFlag) {
      return this.removerecipientInfo(order);
    }

    return order;
  }

  /** 주문목록조회시 사용할 where값 리턴
   * dto 에 포함된 값에 따라 where 절을 다르게 설정한다
   */
  private getOrderListFilterWhere(dto: GetOrderListDto): Prisma.OrderWhereInput {
    const {
      customerId,
      sellerId,
      orderCode,
      periodStart,
      periodEnd,
      supportIncluded,
      search,
      searchDateType,
      searchStatuses,
    } = dto;

    let where: Prisma.OrderWhereInput = {};
    // 특정 소비자의 주문목록 조회시
    if (customerId) {
      where = { ...where, customerId, deleteFlag: false };
    }

    // 특정 판매자가 판매하는 물건들의 주문목록 조회시
    if (sellerId) {
      where = { ...where, orderItems: { some: { goods: { sellerId } } } };
    }

    // 특정 주문코드 조회시
    if (orderCode) {
      where = { ...where, orderCode };
    }

    // 후원주문만 조회시
    if (supportIncluded) {
      where = { ...where, supportOrderIncludeFlag: true };
    }

    // 특정 날짜로 조회시
    if (searchDateType) {
      const dateFilter = {
        gte: periodStart ? new Date(periodStart) : undefined,
        lte: periodEnd ? new Date(periodEnd) : undefined,
      };
      // 주문일 기준으로 조회시
      if (searchDateType === '주문일') {
        where = { ...where, createDate: dateFilter };
      }

      // 입금일 기준으로 조회시
      if (searchDateType === '입금일') {
        where = { ...where, payment: { depositDate: dateFilter } };
      }
    }

    // 특정 주문상태로 조회시
    if (searchStatuses) {
      where = { ...where, step: { in: searchStatuses } };
    }

    // 검색어로 특정컬럼값 조회시
    if (search) {
      // search 텍스트 있는경우 특정컬럼에 search 텍스트가 포함되는지 확인
      const searchTextOrderColumn: Array<keyof Order> = [
        'orderCode',
        'recipientName',
        'recipientPhone',
        'recipientEmail',
        'ordererName',
        'ordererPhone',
        'ordererEmail',
      ];
      const searchTextList = search
        ? [
            { orderItems: { some: { goods: { goods_name: { contains: search } } } } },
            { payment: { depositor: { contains: search } } },
            ...searchTextOrderColumn.map((col) => ({ [col]: { contains: search } })),
          ]
        : undefined;
      where = { ...where, OR: searchTextList };
    }

    return where;
  }

  /** 특정 소비자의 주문목록 조회 - 선물주문인 경우 받는사람 정보 삭제 후처리 추가 */
  async getCustomerOrderList(dto: GetOrderListDto): Promise<OrderListRes> {
    const { orders, ...rest } = await this.getOrderList(dto);

    // 소비자 주문목록 후처리
    const postProcessed = orders.map((order) => {
      let _o = { ...order };
      //  선물하기 주문일 시 받는사람 정보 삭제
      if (_o.giftFlag) {
        _o = this.removerecipientInfo(_o);
      }
      // 비회원 주문인 경우 - 비회원비밀번호 정보 삭제
      if (_o.nonMemberOrderFlag) {
        _o = {
          ..._o,
          nonMemberOrderPassword: undefined,
        };
      }
      return _o;
    });
    return {
      orders: postProcessed,
      ...rest,
    };
  }

  /** '15' 와 같은 stringNumber로 orderReceived와 같은  OrderProcessStep 값 리턴 */
  private getStepNameByStringNumber(
    stringNumber: FmOrderStatusNumString,
  ): OrderProcessStep {
    return getOrderProcessStepNameByStringNumber(stringNumber);
  }

  /** 판매자의 주문조회시 주문에 포함된 판매자의 상품옵션의 상태에 따라 표시될 주문의 상태 구하는 함수
   * (FmOrderService 의 getOrderRealStep와 같은 로직 )
   */
  private getOrderRealStep(
    originOrderStep: OrderProcessStep,
    sellerGoodsOrderItemOptions: OrderItemOption[],
  ): OrderProcessStep {
    // 주문상태가 partial000 인지 확인(부분000인지)
    const isPartialStep = [
      'partialExportReady',
      'partialExportDone',
      'partialShipping',
      'partialShippingDone',
    ].includes(originOrderStep);

    const originOrderStepNum = Number(orderProcessStepDict[originOrderStep]);

    // 원 주문 상태가 부분000 일때
    if (isPartialStep) {
      // 5를 더해 "부분" 상태를 제거한 상태
      const nonPartialStep = String(originOrderStepNum + 5) as FmOrderStatusNumString;
      // 옵션들 모두가 "부분" 상태를 제거한 상태만 있는 지 확인, 그렇다면 "부분" 상태를 제거한 상태를 반환
      if (
        sellerGoodsOrderItemOptions.every(
          (io) => orderProcessStepDict[io.step] === nonPartialStep,
        )
      ) {
        return this.getStepNameByStringNumber(nonPartialStep);
      }
    }

    // 옵션들 모두가 "부분" 상태보다 작은지 확인, 그렇다면 옵션들 중 가장 높은 상태를 반환
    if (
      sellerGoodsOrderItemOptions.every(
        (io) => Number(orderProcessStepDict[io.step]) < originOrderStepNum,
      )
    ) {
      const maxOptionStepStrNum = Math.max(
        ...sellerGoodsOrderItemOptions.map((io) => Number(orderProcessStepDict[io.step])),
      ).toString() as FmOrderStatusNumString;

      return this.getStepNameByStringNumber(maxOptionStepStrNum);
    }
    // 옵션 중 원래 주문상태보다 하나라도 낮거나 높은 상태가 있는 경우 그대로 반환

    return originOrderStep;
  }

  /** 특정 판매자 주문목록 조회 - 주문상품 중 판매자의 상품만 추려냄 & 주문상태 표시는 판매자의 상품 상태에 따라 표시되는 후처리 추가  */
  async getSellerOrderList(dto: GetOrderListDto): Promise<OrderListRes> {
    if (!dto.sellerId)
      throw new BadRequestException('판매자 주문 목록 조회시 sellerId를 입력해야합니다');
    const { orders, ...rest } = await this.getOrderList(dto);

    // 판매자 주문목록 후처리
    // 주문상품옵션 중 자기 상품옵션만 남기기
    // 자기상품옵션 상태에 기반한 주문상태 표시
    const ordersWithOnlySellerGoodsOrderItems = orders.map((o) => {
      const { orderItems, ...orderRestData } = o;

      // 주문상품옵션 중 판매자 본인의 상품옵션만 남기기
      const sellerGoodsOrderItems = orderItems.filter(
        (oi) => oi.goods.sellerId === dto.sellerId,
      );
      // 판매자 본인의 상품옵션 상태에 기반한 주문상태 표시
      let displaySellerOrderStep: OrderProcessStep = o.step;

      if (sellerGoodsOrderItems.length > 0) {
        displaySellerOrderStep = this.getOrderRealStep(
          o.step,
          sellerGoodsOrderItems.flatMap((oi) => oi.options),
        );
      }
      return {
        ...orderRestData,
        step: displaySellerOrderStep,
        orderItems: sellerGoodsOrderItems,
      };
    });

    return {
      orders: ordersWithOnlySellerGoodsOrderItems,
      ...rest,
    };
  }

  /** 전체 주문목록 조회 */
  async getOrderList(dto: GetOrderListDto): Promise<OrderListRes> {
    const { take, skip } = dto;
    const where = this.getOrderListFilterWhere(dto);
    const count = await this.prisma.order.count({ where });
    const orders = await this.prisma.order.findMany({
      where,
      take,
      skip,
      orderBy: [{ createDate: 'desc' }],
      include: {
        orderItems: {
          include: {
            options: true,
            support: {
              include: { broadcaster: { select: { userNickname: true, avatar: true } } },
            },
            review: { select: { id: true } },
            goods: {
              select: {
                id: true,
                goods_name: true,
                image: true,
                sellerId: true,
                seller: {
                  select: {
                    sellerShop: {
                      select: {
                        shopName: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        customerCouponLogs: {
          include: {
            customerCoupon: { include: { coupon: true } },
          },
        },
        mileageLogs: true,
        payment: true,
        refunds: true,
        exports: { include: { items: true } },
        exchanges: { include: { exchangeItems: true } },
        returns: { include: { items: true } },
        orderCancellations: { include: { items: true } },
        shippings: { include: { items: true } },
      },
    });

    const nextCursor = dto.skip + dto.take; // 다음 조회시 skip 값으로 사용
    return {
      orders,
      count,
      nextCursor: nextCursor >= count ? undefined : nextCursor,
    };
  }

  /** 주문 상세 조회 */
  async findOneOrderDetail(where: Prisma.OrderWhereInput): Promise<OrderDetailRes> {
    // 주문이 있는지 확인
    await this.findOneOrder(where);

    return this.prisma.order.findFirst({
      where,
      include: {
        orderItems: {
          include: {
            options: true,
            support: {
              include: { broadcaster: { select: { userNickname: true, avatar: true } } },
            },
            review: { select: { id: true } },
            goods: {
              select: {
                id: true,
                goods_name: true,
                image: true,
                sellerId: true,
                seller: {
                  select: {
                    sellerShop: {
                      select: {
                        shopName: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        customerCouponLogs: {
          include: {
            customerCoupon: { include: { coupon: true } },
          },
        },
        mileageLogs: true,
        payment: true,
        refunds: true,
        exports: { include: { items: true } },
        exchanges: { include: { exchangeItems: true, images: true } },
        returns: { include: { items: true, images: true } },
        orderCancellations: { include: { items: true } },
        shippings: { include: { items: true } },
      },
    });
  }

  /** 주문 1개 리턴, 없으면 400 에러 */
  async findOneOrder(where: Prisma.OrderWhereInput): Promise<Order> {
    const order = await this.prisma.order.findFirst({
      where,
    });
    if (!order) {
      let errorMessage = '해당 주문이 존재하지 않습니다. ';
      if (where.orderCode) errorMessage += `주문코드 : ${where.orderCode}`;
      if (where.id) errorMessage += `주문고유번호 : ${where.id}`;
      throw new BadRequestException(errorMessage);
    }

    return order;
  }

  /** 개별 주문 상세 조회 */
  async getOrderDetail(dto: GetOneOrderDetailDto): Promise<OrderDetailRes> {
    if (dto.orderId) {
      return this.findOneOrderDetail({ id: dto.orderId, deleteFlag: false });
    }
    return this.findOneOrderDetail({ orderCode: dto.orderCode, deleteFlag: false });
  }

  /** 비회원 주문 상세 조회 */
  async getNonMemberOrderDetail({
    orderCode,
    password,
  }: GetNonMemberOrderDetailDto): Promise<OrderDetailRes> {
    const order = await this.findOneOrderDetail({ orderCode, deleteFlag: false });

    // 비회원주문 비밀번호 확인
    const isPasswordCorrect = await this.userPwManager.validatePassword(
      password,
      order.nonMemberOrderPassword,
    );
    if (!isPasswordCorrect) {
      throw new BadRequestException(`주문 비밀번호가 일치하지 않습니다.`);
    }
    return order;
  }

  /** 주문수정 */
  async updateOrder(orderId: number, dto: UpdateOrderDto): Promise<boolean> {
    // 주문이 존재하는지 확인
    await this.findOneOrder({ id: orderId });

    const { customerId, nonMemberOrderPassword, ...rest } = dto;

    let updateInput: Prisma.OrderUpdateInput = { ...rest };

    // 연결된 소비자 수정하는경우
    if (customerId) {
      updateInput = {
        ...updateInput,
        customer: { connect: { id: customerId } },
      };
    }

    // 비회원 주문 비밀번호 바꾸는 경우
    if (nonMemberOrderPassword) {
      updateInput = {
        ...updateInput,
        nonMemberOrderPassword: await this.userPwManager.hashPassword(
          nonMemberOrderPassword,
        ),
      };
    }

    // 주문 업데이트
    await this.prisma.order.update({
      where: { id: orderId },
      data: updateInput,
    });

    // 주문 상태를 바꾸는 경우 주문상품옵션의 상태와 개수도 변경
    if (rest.step) {
      const orderItemOptions = await this.prisma.orderItemOption.findMany({
        where: { orderItem: { orderId } },
        select: { id: true, quantity: true },
      });
      // 주문상태를 결제확인으로 바꾸는경우(주문접수 -> 결제확인)
      // => 해당 주문에 포함된 주문상품옵션의 상태도 모두 결제확인으로 변경
      if (rest.step === 'paymentConfirmed') {
        await this.prisma.orderItemOption.updateMany({
          where: { orderItem: { orderId } },
          data: { step: rest.step },
        });
      }
      // 주문상태를 상품준비로 바꾸는 경우(결제완료 -> 상품준비)
      // => 해당 주문에 포함된 주문상품옵션 상태도 모두 상품준비로 변경 + 주문상품옵션의 상품준비상태 개수 업데이트
      if (rest.step === 'goodsReady') {
        await this.prisma.$transaction(
          orderItemOptions.map((opt) => {
            return this.prisma.orderItemOption.update({
              where: { id: opt.id },
              data: {
                step: rest.step,
                amountInGoodsReady: opt.quantity,
              },
            });
          }),
        );
      }
    }

    return true;
  }

  /** 주문 삭제(숨김처리) - 완료된 주문만 삭제 가능
   * 데이터 삭제x, deleteFlag를 true로 설정함) */
  async deleteOrder(orderId: number): Promise<boolean> {
    // 주문이 존재하는지 확인
    const order = await this.findOneOrder({ id: orderId, deleteFlag: false });

    // 완료된 주문이 아닌경우 403 에러
    if (order.step !== OrderProcessStep.shippingDone) {
      throw new ForbiddenException(`완료된 주문만 삭제 가능합니다`);
    }

    await this.updateOrder(orderId, { deleteFlag: true });

    return true;
  }

  /** 구매확정 - 모든 주문상품옵션이 배송완료 상태일때 구매확정이 가능
   */
  async purchaseConfirm(dto: OrderPurchaseConfirmationDto): Promise<boolean> {
    const { orderItemOptionId } = dto;
    const orderItemOption = await this.prisma.orderItemOption.findUnique({
      where: { id: orderItemOptionId },
    });

    if (!orderItemOption) {
      throw new BadRequestException(
        `해당 주문상품옵션이 존재하지 않습니다. 주문상품옵션 고유번호 : ${orderItemOptionId}`,
      );
    }

    // 주문상품옵션이 연결된 출고 조회
    const exportData = await this.prisma.export.findFirst({
      where: { items: { some: { orderItemOptionId } } },
      include: {
        items: { select: { orderItemOptionId: true } },
      },
    });
    // 해당 출고데이터에 구매확정일자 저장
    if (exportData && !exportData.buyConfirmDate) {
      await this.prisma.export.update({
        where: { id: exportData.id },
        data: {
          buyConfirmDate: new Date(),
          buyConfirmSubject: 'customer',
        },
      });
    }

    // 해당 출고에 대한 구매확정처리 == 해당 출고에 포함된 주문상품옵션은 모두 구매확정처리
    // 같이 구매확정 상태로 변경되어야 하는(동일한 출고에 포함된) 주문상품옵션id들
    const batchExportedOrderOptionIds = exportData
      ? exportData.items.map((i) => i.orderItemOptionId)
      : [];

    // 해당 주문상품옵션 & 연결된 출고에 포함된 모든 주문상품옵션을 구매확정으로 상태 변경
    await this.prisma.orderItemOption.updateMany({
      where: { id: { in: batchExportedOrderOptionIds.concat(orderItemOptionId) } },
      data: {
        step: 'purchaseConfirmed',
      },
    });

    // 해당 주문상품옵션이 포함된 주문 찾기
    const order = await this.prisma.order.findFirst({
      where: { orderItems: { some: { options: { some: { id: orderItemOptionId } } } } },
      select: {
        id: true,
        orderItems: { select: { options: true } },
      },
    });

    if (!order) {
      throw new BadRequestException(
        `해당 주문상품옵션이 포함된 주문이 존재하지 않습니다. 주문상품옵션 고유번호 : ${orderItemOptionId}`,
      );
    }

    // 주문에 포함된 모든 주문상품옵션이 구매확정 되었다면 주문의 상태도 구매확정으로 변경
    const everyOrderItemOptionsPurchaseConfirmed = order.orderItems
      .flatMap((item) => item.options)
      .every((opt) => opt.step === 'purchaseConfirmed');

    if (everyOrderItemOptionsPurchaseConfirmed) {
      await this.prisma.order.update({
        where: { id: order.id },
        data: { step: 'purchaseConfirmed' },
      });
    }

    return true;
  }

  /** 판매자센터 마이페이지 홈 오늘매출현황, 주문현황조회 */
  public async getOrderStats(sellerId: number): Promise<OrderStatsRes> {
    // * 판매자의 주문조회 1개월 내(판매자의 상품이 주문상품으로 포함된 주문)
    const sellerOrders = await this.prisma.order.findMany({
      where: {
        orderItems: { some: { goods: { sellerId } } },
        createDate: { gte: dayjs().subtract(1, 'month').toDate() },
      },
      include: {
        orderItems: { include: { options: true, goods: { select: { sellerId: true } } } },
      },
    });
    // 주문상품 중 판매자의 상품&상품옵션만 추려내기
    const ordersWithFilteredItems = sellerOrders.map((order) => {
      const { orderItems, ...orderData } = order;

      const sellerGoodsOrderItems = orderItems.filter((oi) => {
        return oi.goods.sellerId === sellerId;
      });
      return { ...orderData, orderItems: sellerGoodsOrderItems };
    });
    // 판매자 상품인 주문상품옵션의 상태에 기반한 주문상태 표시
    const ordersWithRealStep = ordersWithFilteredItems.map((order) => {
      const { orderItems, step, ...orderData } = order;
      const newStep = this.getOrderRealStep(
        step,
        orderItems.flatMap((item) => item.options),
      );
      return {
        ...orderData,
        step: newStep,
        orderItems,
      };
    });
    // 주문상태별 개수 카운트
    const orderStats = {
      shippingReady: 0, // 상품준비 + 부분출고준비 + 출고준비 + 부분출고완료 + 출고완료
      shipping: 0, // 부분배송중 + 배송중 + 부분배송완료
      shippingDone: 0, //  배송완료
    };
    ordersWithRealStep.forEach((order) => {
      if (sellerOrderSteps.shippingReady.includes(order.step)) {
        orderStats.shippingReady += 1;
      }
      if (sellerOrderSteps.shipping.includes(order.step)) {
        orderStats.shipping += 1;
      }
      if (sellerOrderSteps.shippingDone.includes(order.step)) {
        orderStats.shippingDone += 1;
      }
    });

    // * 판매자의 오늘매출현황 -> 1달치 조회했던 주문데이터 활용
    // 1달치 조회한 주문 중 오늘 생성된 주문 && 주문상태가 결제확인 단계 이상인 주문 필터링
    const sellerOrdersToday = ordersWithRealStep.filter((order) => {
      return (
        dayjs(order.createDate).isToday() &&
        ![
          'orderReceived',
          'paymentCanceled',
          'orderInvalidated',
          'paymentFailed',
        ].includes(order.step)
      );
    });

    // 추려낸 주문상품의 배송비 + 주문상품옵션가격
    const sellerOrderItemsToday = sellerOrdersToday.flatMap((order) => order.orderItems);
    const todaySalesTotal = sellerOrderItemsToday.reduce((total, item) => {
      return (
        total +
        Number(item.shippingCost) +
        item.options.reduce(
          (optPriceSum, opt) => optPriceSum + Number(opt.discountPrice),
          0,
        )
      );
    }, 0);

    // * 판매자의 오늘환불현황
    // 환불상품에 판매자 상품이 포함된 환불조회
    const sellerRefunds = await this.prisma.refund.findMany({
      where: {
        items: { some: { orderItem: { goods: { sellerId } } } },
        completeDate: { gte: new Date(dayjs().format('YYYY-MM-DD')) },
      },
      include: {
        items: {
          include: {
            orderItem: {
              select: { goods: { select: { sellerId: true } } },
            },
            orderItemOption: true,
          },
        },
      },
    });
    // 환불 상품에서 판매자 상품만 추려냄
    const sellerItemOnlyRefundItems = sellerRefunds
      .flatMap((refund) => refund.items)
      .filter((item) => item.orderItem.goods.sellerId === sellerId);
    // 환불된 판매자의 상품 가격 총합
    const todayRefundAmountTotal = sellerItemOnlyRefundItems.reduce((total, item) => {
      return total + Number(item.orderItemOption.discountPrice);
    }, 0);

    return {
      orders: {
        배송완료: orderStats.shippingDone,
        배송준비중: orderStats.shippingReady,
        배송중: orderStats.shipping,
      },
      sales: {
        주문: { count: sellerOrdersToday.length, sum: todaySalesTotal },
        환불: { count: sellerRefunds.length, sum: todayRefundAmountTotal },
      },
    };
  }

  /** 방송인 후원 주문 목록 조회  */
  public async findAllByBroadcaster(
    broadcasterId: number,
    dto: FindManyDto,
  ): Promise<FindAllOrderByBroadcasterRes> {
    const minTake = 5;
    const realTake = Math.min(minTake, dto.take ? Number(dto.take) : undefined) + 1;
    const orders = await this.prisma.order.findMany({
      skip: dto.skip ? Number(dto.skip) : undefined,
      take: realTake || undefined,
      where: {
        deleteFlag: false,
        orderItems: { every: { support: { broadcasterId } } },
      },
      orderBy: { createDate: 'desc' },
      select: {
        orderCode: true,
        step: true,
        orderPrice: true,
        paymentPrice: true,
        giftFlag: true,
        supportOrderIncludeFlag: true,
        createDate: true,
        orderItems: {
          select: {
            id: true,
            channel: true,
            review: true,
            support: true,
            goods: {
              select: {
                goods_name: true,
                image: true,
                seller: { select: { sellerShop: { select: { shopName: true } } } },
              },
            },
          },
        },
      },
    });
    // 주문에 포함된 상품 중 방송인에게 후원한 상품만 추리기
    const _result = orders.map((x) => ({
      ...x,
      orderItems: x.orderItems.filter((i) => i.support.broadcasterId === broadcasterId),
    }));
    const nextCursor = (dto.skip || 0) + (dto.take || minTake); // 다음 조회시 skip 값으로 사용

    if (_result.length === realTake) {
      return {
        orders: _result.slice(0, dto.take || minTake),
        nextCursor,
      };
    }
    return { nextCursor: undefined, orders: _result };
  }
}
