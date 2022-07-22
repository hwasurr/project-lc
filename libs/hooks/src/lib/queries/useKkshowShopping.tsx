import {
  GoodsCategoryWithFamily,
  KkshowShoppingTabResData,
} from '@project-lc/shared-types';
import { AxiosError } from 'axios';
import { useQuery, UseQueryResult } from 'react-query';
import axios from '../../axios';

export const kkshowShoppingQueryKey = 'KkshowShopping';
export const getKkshowShopping = async (): Promise<KkshowShoppingTabResData> => {
  const url =
    process.env.NEXT_PUBLIC_APP_TYPE === 'admin'
      ? '/admin/kkshow-shopping'
      : 'kkshow-shopping';
  return axios.get<KkshowShoppingTabResData>(url).then((res) => res.data);
};

export const useKkshowShopping = (): UseQueryResult<
  KkshowShoppingTabResData,
  AxiosError
> => {
  return useQuery<KkshowShoppingTabResData, AxiosError>(
    kkshowShoppingQueryKey,
    getKkshowShopping,
  );
};

// 크크마켓 전시 카테고리 목록 조회
export const kkshowShoppingCategoriesKey = 'KkshowShoppingCategories';
export const getKkshowShoppingCategories = async (): Promise<
  GoodsCategoryWithFamily[]
> => {
  return axios
    .get<GoodsCategoryWithFamily[]>('/kkshow-shopping/categories')
    .then((res) => res.data);
};
export const useKkshowShoppingCategories = (): UseQueryResult<
  GoodsCategoryWithFamily[],
  AxiosError
> => {
  return useQuery<GoodsCategoryWithFamily[], AxiosError>(
    kkshowShoppingCategoriesKey,
    getKkshowShoppingCategories,
  );
};
