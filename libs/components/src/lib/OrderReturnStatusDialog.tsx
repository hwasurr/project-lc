import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Button,
  FormControl,
  FormErrorMessage,
  FormLabel,
  List,
  ListIcon,
  ListItem,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
  Stack,
  Text,
  useToast,
} from '@chakra-ui/react';
import { useUpdateReturnStatusMutation } from '@project-lc/hooks';
import { FmOrderReturnBase } from '@project-lc/shared-types';
import { useForm } from 'react-hook-form';
import { AiFillWarning } from 'react-icons/ai';
import { RiErrorWarningFill } from 'react-icons/ri';
import { FmReturnStatusBadge } from './FmReturnStatusBadge';

interface OrderRetusnStatusForm {
  status: FmOrderReturnBase['status'];
}

export interface OrderReturnStatusDialogProps {
  isOpen: boolean;
  onClose: () => void;
  data: FmOrderReturnBase;
}

export function OrderReturnStatusDialog({
  isOpen,
  onClose,
  data,
}: OrderReturnStatusDialogProps): JSX.Element {
  const {
    watch,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OrderRetusnStatusForm>();
  const { mutateAsync } = useUpdateReturnStatusMutation();
  const toast = useToast();
  const onSuccess = (): void => {
    toast({
      title: '반품 상태를 변경하였습니다',
      status: 'success',
    });
  };

  const onFail = (): void => {
    toast({
      title: '반품 상태 변경 중 오류가 발생하였습니다',
      status: 'error',
    });
  };

  async function onSubmit(formData: OrderRetusnStatusForm): Promise<void> {
    const dto = { status: formData.status, return_code: data.return_code };

    await mutateAsync(dto).then(onSuccess).catch(onFail);
    onClose();
  }

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent as="form" onSubmit={handleSubmit(onSubmit)}>
          <ModalHeader>반품 상태 관리</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Text size="lg" mb={4}>
              현재 반품 상태 : <FmReturnStatusBadge returnStatus={data.status} />
            </Text>
            {watch('status') === 'complete' && (
              <Alert mb={2} status="warning">
                <List spacing={3}>
                  <ListItem>
                    <ListIcon as={RiErrorWarningFill} color="orange.500" />
                    반품완료 선택시, 환불이 진행되므로 반드시 물품 수령 및 확인 후,
                    반품완료를 선택하세요.
                  </ListItem>
                  <ListItem>
                    <ListIcon as={AiFillWarning} color="red.500" />
                    반품 완료 등록 후,{' '}
                    <Text as="span" color="red.500" fontWeight="bold">
                      이전 단계로의 변경은 불가
                    </Text>
                    합니다.
                  </ListItem>
                </List>
              </Alert>
            )}
            <FormControl isInvalid={!!errors.status}>
              <FormLabel>변경할 반품 상태</FormLabel>
              <Select
                placeholder="변경할 반품 상태를 선택하세요."
                {...register('status', {
                  required: {
                    value: true,
                    message: '변경할 반품 상태를 선택해주세요.',
                  },
                })}
                isDisabled={data.status === 'complete'}
              >
                <option value="request">반품요청</option>
                <option value="ing">반품진행중</option>
                <option value="complete">반품완료</option>
              </Select>
              {errors.status && (
                <FormErrorMessage>{errors.status.message}</FormErrorMessage>
              )}
            </FormControl>

            {data.status === 'complete' && (
              <Alert mt={6} mb={2} status="info">
                <Stack alignItems="center" justify="center" w="100%">
                  <AlertIcon />
                  <AlertTitle>이 반품은 반품완료 처리되었습니다.</AlertTitle>
                  <AlertDescription>
                    환불 진행 정보는 환불정보에서 확인해주세요.
                  </AlertDescription>
                </Stack>
              </Alert>
            )}
          </ModalBody>

          <ModalFooter>
            <Button mr={3} onClick={onClose}>
              취소
            </Button>
            <Button
              colorScheme="blue"
              type="submit"
              isDisabled={data.status === 'complete'}
            >
              확인
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}

export default OrderReturnStatusDialog;
