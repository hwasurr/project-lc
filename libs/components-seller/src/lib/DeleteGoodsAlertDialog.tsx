import { Icon, WarningTwoIcon } from '@chakra-ui/icons';
import {
  Alert,
  AlertDescription,
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  AlertIcon,
  Button,
  Center,
  Spinner,
  Stack,
  Text,
  useToast,
} from '@chakra-ui/react';
import { GridSelectionModel } from '@material-ui/data-grid';
import PasswordCheckForm from '@project-lc/components-shared/PasswordCheckForm';
import {
  useDeleteFmGoods,
  useDeleteLcGoods,
  useFmOrdersByGoods,
  useLiveShoppingList,
  useProfile,
} from '@project-lc/hooks';
import {
  getFmOrderStatusByNames,
  getLiveShoppingProgress,
  SellerGoodsListItem,
} from '@project-lc/shared-types';
import { useMemo, useRef, useState } from 'react';
import { useQueryClient } from 'react-query';

export function DeleteGoodsAlertDialog({
  onClose,
  isOpen,
  items,
  selectedGoodsIds,
}: {
  onClose: () => void;
  isOpen: boolean;
  items?: SellerGoodsListItem[];
  selectedGoodsIds: GridSelectionModel;
}): JSX.Element {
  const [step, setStep] = useState<'alert' | 'checkPassword'>('alert');
  const { data: profileData } = useProfile();
  const handleClose = (): void => {
    setStep('alert');
    onClose();
  };
  const queryClient = useQueryClient();
  const toast = useToast();
  const cancelRef = useRef<HTMLButtonElement>(null);
  // Goods테이블에서 삭제요청
  const deleteLcGoods = useDeleteLcGoods();
  // fm-goods 테이블에서 삭제요청
  const deleteFmGoods = useDeleteFmGoods();

  // 해당 상품 주문 조회
  // [결제취소, 결제실패, 배송완료, 주문무효]를 제외한 상태의 주문이 있는지 체크하여
  // 상품 삭제 불가 처리를 진행할 것이므로 해당 상태를 제외한 상태만 조회
  const orders = useFmOrdersByGoods(
    {
      searchStatuses: getFmOrderStatusByNames([
        '결제확인',
        '배송완료',
        '배송중',
        '부분배송완료',
        '부분배송중',
        '부분출고완료',
        '부분출고준비',
        '상품준비',
        '주문접수',
        '출고완료',
        '출고준비',
      ]),
      goodsIds: selectedGoodsIds as number[],
    },
    { enabled: isOpen },
  );

  const liveShoppings = useLiveShoppingList(
    {
      goodsIds: selectedGoodsIds as number[],
    },
    { enabled: isOpen },
  );

  // 선택된 상품목록 중, 라이브쇼핑이 존재하는 상품명
  const hasliveShoppingList = useMemo(() => {
    if (!liveShoppings.data) return [];
    return liveShoppings.data.reduce((arr: string[], liveShopping) => {
      const liveShoppingProgress = getLiveShoppingProgress(liveShopping);
      if (['판매종료', '취소됨'].includes(liveShoppingProgress)) {
        return arr;
      }
      arr.push(liveShopping.goods.goods_name);
      return arr;
    }, []);
  }, [liveShoppings.data]);

  // 선택된 상품목록이 삭제가능한 지 여부
  const isDeletable = useMemo(() => {
    if (!orders.data) return false;
    return orders.data.length === 0;
  }, [orders.data]);

  // 삭제 다이얼로그에서 확인 눌렀을 때 상품삭제 핸들러
  const handleDelete = async (): Promise<void> => {
    if (!items) return;
    if (!isDeletable) {
      toast({
        status: 'error',
        title: '선택된 상품 중, 아직 주문 처리가 완료되지 않은 상품이 포함되어 있습니다.',
        isClosable: true,
      });
      return;
    }

    if (!(hasliveShoppingList.length === 0)) {
      toast({
        status: 'error',
        title: '선택된 상품 중, 라이브 쇼핑에 등록된 상품이 포함되어 있습니다.',
        isClosable: true,
      });
      return;
    }

    // 검수된 상품
    const confirmedGoods = items.filter(
      (item) =>
        selectedGoodsIds.includes(item.id) &&
        item.confirmation &&
        item.confirmation.status === 'confirmed' &&
        item.confirmation.firstmallGoodsConnectionId !== null,
    );
    try {
      // 전체 선택된 상품 Goods테이블에서 삭제요청
      const deleteGoodsFromLcDb = deleteLcGoods.mutateAsync({
        ids: selectedGoodsIds.map((id) => Number(id)),
      });

      const promises = [deleteGoodsFromLcDb];

      if (confirmedGoods.length > 0) {
        // 선택된 상품 중 검수된 상품이 있다면 fm-goods 테이블에서도 삭제요청
        const deleteGoodsFromFmDb = deleteFmGoods.mutateAsync({
          ids: confirmedGoods.map((item) => Number(item.id)),
        });
        promises.push(deleteGoodsFromFmDb);
      }

      await Promise.all(promises);
      queryClient.invalidateQueries('SellerGoodsList');
      toast({
        title: '상품이 삭제되었습니다',
        status: 'success',
        isClosable: true,
      });
    } catch (error) {
      console.error(error);
      toast({
        title: '상품 삭제 중 오류가 발생하였습니다',
        status: 'error',
        isClosable: true,
      });
    } finally {
      handleClose();
    }
  };

  return (
    <AlertDialog
      isCentered
      isOpen={isOpen}
      leastDestructiveRef={cancelRef}
      onClose={handleClose}
    >
      <AlertDialogOverlay>
        <AlertDialogContent>
          <AlertDialogHeader fontSize="lg" fontWeight="bold">
            <Text>
              <Icon as={WarningTwoIcon} color="red.500" mr={2} />
              상품 삭제
            </Text>
          </AlertDialogHeader>

          {/* 상품삭제 다이얼로그 초기 화면(step === 'alert') */}
          {step === 'alert' && (
            <>
              <AlertDialogBody>
                상품 삭제시 복구가 불가합니다. 선택한 상품을 삭제하시겠습니까?
                {orders.isLoading && (
                  <Center>
                    <Spinner />
                  </Center>
                )}
                {!orders.isLoading && !isDeletable && (
                  <Alert status="error" mt={4}>
                    <AlertIcon />
                    <AlertDescription>
                      <Stack>
                        <Text>
                          선택된 상품 목록에 주문 처리가 완료되지 않은 상품이 포함되어
                          있어 상품 삭제가 불가능합니다.
                        </Text>
                        <Text>
                          상품을 삭제하지 않고 미노출처리를 통해 상품이 전시되지 않도록
                          변경할 수 있습니다.
                        </Text>
                      </Stack>
                    </AlertDescription>
                  </Alert>
                )}
                {!liveShoppings.isLoading && hasliveShoppingList.length > 0 && (
                  <Alert status="error" mt={4}>
                    <AlertIcon />
                    <AlertDescription>
                      <Stack spacing={1}>
                        <Text>
                          선택된 상품 목록에 라이브 쇼핑에 등록된 상품이 포함되어 있어
                          상품 삭제가 불가능합니다.
                        </Text>
                        <Text as="u">등록된 상품 : {hasliveShoppingList.join(', ')}</Text>
                      </Stack>
                    </AlertDescription>
                  </Alert>
                )}
              </AlertDialogBody>

              <AlertDialogFooter>
                <Button onClick={handleClose}>취소</Button>
                <Button
                  onClick={() => setStep('checkPassword')}
                  ml={3}
                  colorScheme="red"
                  isDisabled={!isDeletable || !(hasliveShoppingList.length === 0)}
                  isLoading={
                    deleteLcGoods.isLoading || deleteFmGoods.isLoading || orders.isLoading
                  }
                >
                  확인
                </Button>
              </AlertDialogFooter>
            </>
          )}

          {/* 상품삭제 다이얼로그 비밀번호 확인 화면(step === 'checkPassword') */}
          {step === 'checkPassword' && (
            <AlertDialogBody>
              <Stack>
                <Text>상품 삭제 전 본인 확인을 위하여 비밀번호를 입력해주세요.</Text>
                <PasswordCheckForm
                  email={profileData?.email}
                  onCancel={handleClose}
                  onConfirm={handleDelete}
                />
              </Stack>
            </AlertDialogBody>
          )}
        </AlertDialogContent>
      </AlertDialogOverlay>
    </AlertDialog>
  );
}

export default DeleteGoodsAlertDialog;
