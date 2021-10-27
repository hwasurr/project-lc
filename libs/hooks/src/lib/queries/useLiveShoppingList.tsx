import { LiveShopping } from '@prisma/client';
import { AxiosError } from 'axios';
import { useQuery, UseQueryResult } from 'react-query';
import { BroadcasterDTO } from '@project-lc/shared-types';
import axios from '../../axios';

interface LiveShoppingWithGoods extends LiveShopping {
  goods: {
    goods_name: string;
    summary: string;
  };
  seller: {
    sellerShop: {
      sellerEmail: string;
      shopName: string;
    };
  };
  broadcaster: BroadcasterDTO;
  liveShoppingVideo: { youtubeUrl: string };
}

export const getLiveShoppingList = async (
  liveShoppingId?: string | null,
): Promise<LiveShoppingWithGoods[]> => {
  return axios
    .get<LiveShoppingWithGoods[]>('/live-shoppings', {
      params: { liveShoppingId },
    })
    .then((res) => res.data);
};

export const useLiveShoppingList = (dto: {
  enabled: boolean;
  id?: string;
}): UseQueryResult<LiveShoppingWithGoods[], AxiosError> => {
  const queryKey = ['LiveShoppingList', dto];
  return useQuery<LiveShoppingWithGoods[], AxiosError>(queryKey, () =>
    getLiveShoppingList(dto.id || null),
  );
};
