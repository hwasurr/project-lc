import {
  convertOrderSitetypeToString,
  FindFmOrderDetailRes,
} from '@project-lc/shared-types';
import dayjs from 'dayjs';
import { AiTwotoneEnvironment } from 'react-icons/ai';
import { IoMdPerson } from 'react-icons/io';
import { FaBoxOpen, FaShippingFast } from 'react-icons/fa';
import { MdDateRange } from 'react-icons/md';
import { SummaryList } from './SummaryList';

export interface OrderDetailSummaryProps {
  order: FindFmOrderDetailRes;
}
export function OrderDetailSummary({ order }: OrderDetailSummaryProps): JSX.Element {
  return (
    <SummaryList
      spacing={2}
      listItems={[
        {
          id: '주문일시',
          icon: MdDateRange,
          value: `주문일시 ${dayjs(order.regist_date).format(
            'YYYY년 MM월 DD일 HH:mm:ss',
          )}`,
        },
        {
          id: '주문자',
          icon: IoMdPerson,
          value: `주문자 ${order.order_user_name}`,
        },
        {
          id: '수령자',
          icon: FaBoxOpen,
          value: `수령자 ${order.recipient_user_name}`,
        },
        {
          id: '주문환경',
          icon: AiTwotoneEnvironment,
          value: `${convertOrderSitetypeToString(order.sitetype)}에서 주문`,
        },
        {
          id: '배송비',
          icon: FaShippingFast,
          value: (() => {
            const cost = Number(order.shipping_cost);
            if (Number.isNaN(cost) || cost === 0) return '무료배송';
            return `배송비 ${Number(order.shipping_cost).toLocaleString()}원`;
          })(),
        },
      ]}
    />
  );
}
