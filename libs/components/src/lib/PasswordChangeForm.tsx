/* eslint-disable react/jsx-props-no-spreading */
import {
  Box,
  Button,
  ButtonGroup,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
  Text,
  useColorModeValue,
  useToast,
} from '@chakra-ui/react';
import { useChangePasswordMutation, useProfile } from '@project-lc/hooks';
import { useForm } from 'react-hook-form';
import { PasswordCheckFormProps } from './PasswordCheckForm';
import SettingSectionLayout from './SettingSectionLayout';
import { passwordRegisterOptions } from './SignupForm';

export interface PasswordCheckFormData {
  password: string;
  repassword: string;
}
export function PasswordChangeForm(props: PasswordCheckFormProps): JSX.Element {
  const { onCancel, onConfirm } = props;
  const toast = useToast();
  const { data: profileData } = useProfile();
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<PasswordCheckFormData>();

  const { mutateAsync } = useChangePasswordMutation();

  const changePassword = (data: PasswordCheckFormData) => {
    const email = profileData?.email;
    if (!email) return;

    const { password } = data;
    mutateAsync({ email, password })
      .then((res) => {
        toast({
          title: `새 비밀번호 등록 성공`,
          status: 'success',
        });
        onConfirm();
      })
      .catch((error) => {
        console.error(error);
        toast({
          title: `새 비밀번호 등록 실패`,
          status: 'error',
        });
        onCancel();
      })
      .finally(() => {
        reset();
      });
  };

  return (
    <SettingSectionLayout title="새 비밀번호">
      <Text>새로운 비밀번호를 입력해주세요</Text>
      <Box as="form" onSubmit={handleSubmit(changePassword)}>
        {/* SignupForm 참고 */}
        <FormControl isInvalid={!!errors.password} mb={2}>
          <FormLabel htmlFor="password">
            비밀번호
            <Text
              fontSize="xs"
              color={useColorModeValue('gray.500', 'gray.400')}
              as="span"
            >
              (문자,숫자,특수문자 포함 8자 이상)
            </Text>
          </FormLabel>
          <Input
            id="password"
            type="password"
            placeholder="********"
            {...register('password', { ...passwordRegisterOptions })}
          />
          <FormErrorMessage>
            {errors.password && errors.password.message}
          </FormErrorMessage>
        </FormControl>

        <FormControl isInvalid={!!errors.repassword} mb={4}>
          <FormLabel htmlFor="password">
            비밀번호 확인
            <Text
              fontSize="xs"
              color={useColorModeValue('gray.500', 'gray.400')}
              as="span"
            >
              (동일한 비밀번호를 입력하세요.)
            </Text>
          </FormLabel>

          <Input
            id="repassword"
            type="password"
            placeholder="********"
            {...register('repassword', {
              required: '비밀번호 확인을 작성해주세요.',
              validate: (value) =>
                value === watch('password') || '비밀번호가 동일하지 않습니다.',
            })}
          />
          <FormErrorMessage>
            {errors.repassword && errors.repassword.message}
          </FormErrorMessage>
        </FormControl>

        <ButtonGroup>
          <Button onClick={onCancel}>취소</Button>
          <Button type="submit" disabled={!watch('password')}>
            비밀번호 변경
          </Button>
        </ButtonGroup>
      </Box>
    </SettingSectionLayout>
  );
}

export default PasswordChangeForm;
