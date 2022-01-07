import { Injectable } from '@nestjs/common';
import { UserPayload } from '@project-lc/nest-core';
import { PrismaService } from '@project-lc/prisma-orm';
import {
  LiveShoppingParamsDto,
  LiveShoppingRegistDTO,
  LiveShoppingsWithBroadcasterAndGoodsName,
  LiveShoppingFmGoodsSeq,
} from '@project-lc/shared-types';
import { throwError } from 'rxjs';
import { LiveShopping } from '@prisma/client';
@Injectable()
export class LiveShoppingService {
  constructor(private readonly prisma: PrismaService) {}

  async createLiveShopping(
    email: UserPayload['sub'],
    dto: LiveShoppingRegistDTO,
  ): Promise<{ liveShoppingId: number }> {
    const userId = await this.prisma.seller.findFirst({
      where: { email },
      select: { id: true },
    });
    const liveShopping = await this.prisma.liveShopping.create({
      data: {
        seller: { connect: { id: userId.id } },
        requests: dto.requests,
        desiredPeriod: dto.desiredPeriod,
        desiredCommission: dto.desiredCommission || '0.00',
        goods: { connect: { id: dto.goods_id } },
        sellerContacts: { connect: { id: dto.contactId } },
      },
    });
    return { liveShoppingId: liveShopping.id };
  }

  async deleteLiveShopping(liveShoppingId: { liveShoppingId: number }): Promise<boolean> {
    const doDelete = await this.prisma.liveShopping.delete({
      where: {
        id: liveShoppingId.liveShoppingId,
      },
    });

    if (!doDelete) {
      throwError('라이브 쇼핑 삭제 실패');
    }
    return true;
  }

  async getRegisteredLiveShoppings(
    email: UserPayload['sub'],
    dto: LiveShoppingParamsDto,
  ): Promise<LiveShopping[]> {
    // 자신의 id를 반환하는 쿼리 수행하기
    const { id, goodsIds } = dto;
    return this.prisma.liveShopping.findMany({
      where: {
        id: id ? Number(id) : undefined,
        goodsId:
          goodsIds?.length >= 1
            ? { in: goodsIds.map((goodsid) => Number(goodsid)) }
            : undefined,
        seller: {
          email,
        },
      },
      include: {
        goods: {
          select: {
            goods_name: true,
            summary: true,
          },
        },
        seller: {
          select: {
            sellerShop: true,
          },
        },
        broadcaster: {
          select: {
            userNickname: true,
            channels: true,
          },
        },
        liveShoppingVideo: {
          select: { youtubeUrl: true },
        },
      },
    });
  }

  /**
   *
   * @author m'baku
   * @description 해당 방송인에게 매칭된 모든 라이브 쇼핑에 연결된 상품들의 fmGoodsSeq 반환받는다
   * @param broadcasterId
   * @returns fmGoodsSeq
   */
  async getFmGoodsConnectionIdLinkedToLiveShoppings(
    broadcasterId: number,
  ): Promise<LiveShoppingFmGoodsSeq[]> {
    const fmGoodsSeqs = await this.prisma.liveShopping.findMany({
      where: {
        broadcasterId: broadcasterId ? Number(broadcasterId) : undefined,
      },
      select: {
        fmGoodsSeq: true,
      },
    });

    return fmGoodsSeqs;
  }

  async getBroadcasterRegisteredLiveShoppings(
    broadcasterId: number,
  ): Promise<LiveShopping[]> {
    // 자신의 id를 반환하는 쿼리 수행하기
    return this.prisma.liveShopping.findMany({
      where: {
        broadcasterId: Number(broadcasterId),
      },
      include: {
        goods: {
          select: {
            goods_name: true,
            summary: true,
          },
        },
        seller: {
          select: {
            sellerShop: true,
          },
        },
        broadcaster: {
          select: {
            userNickname: true,
            channels: true,
          },
        },
        liveShoppingVideo: {
          select: { youtubeUrl: true },
        },
      },
      orderBy: [
        {
          sellStartDate: 'desc',
        },
        {
          id: 'desc',
        },
      ],
    });
  }

  async getLiveShoppingsForOverlayController(): Promise<
    LiveShoppingsWithBroadcasterAndGoodsName[]
  > {
    // 현재 시간에 3시간 뺀 시간보다 방송종료 시간이 더 이후인 라이브쇼핑들 다 불러옴
    const now = new Date();
    now.setHours(now.getHours() - 3);

    return this.prisma.liveShopping.findMany({
      where: {
        progress: 'confirmed',
        broadcastEndDate: { gte: now },
      },
      select: {
        id: true,
        broadcaster: {
          select: {
            email: true,
            userNickname: true,
            overlayUrl: true,
          },
        },
        goods: {
          select: {
            goods_name: true,
          },
        },
        broadcastStartDate: true,
        broadcastEndDate: true,
      },
    });
  }
}
