import { Customer, GoodsInquiry } from '@prisma/client';

export type FindGoodsInquiryItem = GoodsInquiry & {
  writer: Pick<Customer, 'id' | 'name' | 'nickname' | 'email'>;
};
export type FindGoodsInquiryRes = Array<FindGoodsInquiryItem>;
export type PaginatedGoodsInquiryRes = {
  goodsInquiries: Array<FindGoodsInquiryItem>;
  nextCursor?: number;
};
