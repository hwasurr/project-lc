import { Injectable } from '@nestjs/common';
import { Broadcaster } from '@prisma/client';
import { PrismaService } from '@project-lc/prisma-orm';
import { BroadcasterSettlementTargets, FindManyDto } from '@project-lc/shared-types';

@Injectable()
export class BroadcasterSettlementService {
  constructor(private readonly prisma: PrismaService) {}

  /** 현재 정산 예정 금액 조회 */
  public async getReceivableAmount(broadcasterId: Broadcaster['id']): Promise<number> {
    const targets = await this.prisma.exportItem.findMany({
      include: { export: true },
      where: {
        orderItem: {
          support: {
            broadcasterId,
            OR: [
              { liveShopping: { broadcasterId } },
              { productPromotion: { broadcasterId } },
            ],
          },
        },
      },
    });
    const amount = targets.reduce((prev, target) => prev + Number(target.amount), 0);
    return amount;
  }

  /**
   * 정산 대상 목록 조회
   * * 정산 대상이란: (방송인에게 support 처리된) 정산완료되지 않은 "구매 완료 상태의 출고 내역"
   *  */
  public async findSettlementTargets(
    broadcasterId?: Broadcaster['id'],
    paginationDto?: FindManyDto,
  ): Promise<BroadcasterSettlementTargets> {
    const alreadyExists = await this.prisma.broadcasterSettlementItems.findMany({
      select: { orderId: true },
      where: { settlements: { broadcasterId } },
    });

    const result = await this.prisma.export.findMany({
      include: {
        items: {
          include: {
            orderItem: {
              select: {
                order: {
                  select: {
                    id: true,
                    orderCode: true,
                    bundleFlag: true,
                    ordererName: true,
                    recipientName: true,
                  },
                },
                id: true,
                channel: true,
                support: {
                  include: {
                    broadcaster: {
                      select: { id: true, userNickname: true, avatar: true },
                    },
                    liveShopping: true,
                    productPromotion: true,
                  },
                },
                goods: {
                  select: {
                    id: true,
                    goods_name: true,
                    image: {
                      select: { image: true },
                      take: 1,
                      orderBy: { cut_number: 'asc' },
                    },
                  },
                },
              },
            },
            orderItemOption: true,
          },
        },
      },
      where: {
        buyConfirmSubject: { not: null },
        buyConfirmDate: { not: null },
        order: {
          id: { notIn: alreadyExists.map((ae) => Number(ae.orderId)) },
          deleteFlag: false,
          supportOrderIncludeFlag: true,
          orderItems: {
            some: {
              support: broadcasterId
                ? { broadcasterId }
                : { broadcasterId: { not: null } },
            },
          },
        },
      },
      skip: paginationDto?.skip || 0,
      take: paginationDto?.take || 5,
    });

    return result;
  }
}
