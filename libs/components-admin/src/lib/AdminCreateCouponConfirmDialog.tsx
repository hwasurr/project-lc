import { Flex, Text, Box } from '@chakra-ui/react';
import { useFormContext } from 'react-hook-form';
import {
  ConfirmDialog,
  ConfirmDialogProps,
} from '@project-lc/components-core/ConfirmDialog';
import dayjs from 'dayjs';
import {
  DiscountUnitTransformer,
  DiscountApplyFieldTransformer,
  DiscountApplyTypeTransformer,
} from '@project-lc/utils-frontend';
import { CreateCouponData } from './AdminCreateCouponDialog';

export function AdminCreateCouponConfirmDialog(
  props: Pick<ConfirmDialogProps, 'isOpen' | 'onClose' | 'onConfirm'>,
): JSX.Element {
  const { isOpen, onClose, onConfirm } = props;

  const { getValues } = useFormContext<CreateCouponData>();

  return (
    <ConfirmDialog
      title="다음과 같이 쿠폰을 생성하시겠습니까?"
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
    >
      <Flex direction="column" gap={3} minHeight={500}>
        <Flex direction="column">
          <Text>쿠폰이름</Text>
          <Text bgColor="yellow.100">{getValues('name')}</Text>
        </Flex>
        <Flex direction="column">
          <Text>할인방법</Text>
          <Text bgColor="yellow.100">{DiscountUnitTransformer(getValues('unit'))}</Text>
        </Flex>
        <Flex direction="column">
          <Text>할인액(할인율)</Text>
          <Text bgColor="yellow.100">{getValues('amount')}</Text>
        </Flex>
        <Flex direction="column">
          <Text>쿠폰 할인 영역</Text>
          <Text bgColor="yellow.100">
            {DiscountApplyFieldTransformer(getValues('applyField'))}
          </Text>
        </Flex>
        <Flex direction="column">
          <Text>할인 상품 범주</Text>
          <Text bgColor="yellow.100">
            {DiscountApplyTypeTransformer(getValues('applyType'))}
          </Text>
        </Flex>
        <Flex direction="column">
          <Text>시작날짜</Text>
          <Text bgColor="yellow.100">
            {getValues('startDate')
              ? dayjs(getValues('startDate')).format('YYYY-MM-DD HH:mm:ss')
              : '시작날짜를 입력하세요'}
          </Text>
        </Flex>
        <Flex direction="column">
          <Text>종료날짜</Text>
          <Text bgColor="yellow.100">
            {getValues('endDate')
              ? dayjs(getValues('endDate')).format('YYYY-MM-DD HH:mm:ss')
              : ''}
          </Text>
        </Flex>
        <Flex direction="column">
          <Text>최대할인금액</Text>
          <Text bgColor="yellow.100">{getValues('maxDiscountAmountWon')}</Text>
        </Flex>
        <Flex direction="column">
          <Text>최소주문액</Text>
          <Text bgColor="yellow.100">{getValues('minOrderAmountWon')}</Text>
        </Flex>
        <Flex direction="column">
          <Text>메모</Text>
          <Text bgColor="yellow.100">{getValues('memo')}</Text>
        </Flex>
      </Flex>
    </ConfirmDialog>
  );
}

export default AdminCreateCouponConfirmDialog;
