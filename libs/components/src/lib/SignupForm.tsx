/* eslint-disable react/jsx-props-no-spreading */
import { useRouter } from 'next/router';
import {
  Box,
  Button,
  Divider,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Heading,
  Input,
  Stack,
  Text,
  useColorModeValue,
  useToast,
} from '@chakra-ui/react';
import { SignUpSellerDto } from '@project-lc/shared-types';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  getEmailDupCheck,
  useMailVerificationMutation,
  useSellerSignupMutation,
} from '@project-lc/hooks';

export interface SignupFormProps {
  enableShadow?: boolean;
}
export function SignupForm({ enableShadow = false }: SignupFormProps) {
  const router = useRouter();
  const toast = useToast();

  const {
    handleSubmit,
    register,
    formState: { errors, isSubmitting },
    trigger,
    getValues,
    setError,
  } = useForm<SignUpSellerDto>();

  // * 인증코드 페이즈
  const [phase, setPhase] = useState(1);
  // 인증코드 메일 보내기 mutation 요청
  const mailVerification = useMailVerificationMutation();
  const checkValidation = async () => {
    const isValid = await trigger();
    if (isValid) {
      const email = getValues('email');
      // * 중복 확인
      const isOk = await getEmailDupCheck(email);
      if (!isOk) {
        setError('email', {
          type: 'validate',
          message: '이미 가입된 이메일 주소입니다.',
        });
      } else {
        // * 인증 코드 이메일 전송
        const isSuccess = await mailVerification.mutateAsync({ email });
        if (isSuccess) setPhase(2);
        else {
          toast({
            title: '회원가입 오류 알림',
            description:
              '이메일 확인을 위한 인증번호를 보내는 중, 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
            status: 'error',
          });
        }
      }
    }
  };

  // * 회원가입 핸들러
  const signup = useSellerSignupMutation();
  const onSubmit = async (data: SignUpSellerDto) => {
    const seller = await signup.mutateAsync(data).catch((err) => {
      // eslint-disable-next-line no-console
      console.error(err.response);
      setError('code', {
        type: 'validate',
        message: err?.response.data?.message || err.message,
      });
    });
    if (seller) {
      router.push('/');
    }
  };

  return (
    <Stack spacing={8} mx="auto" maxW="lg" w="100%">
      <Box
        rounded="lg"
        bg={useColorModeValue('white', 'gray.700')}
        boxShadow={enableShadow ? 'md' : ''}
        p={8}
      >
        <Stack>
          <Heading fontSize="4xl">[서비스명] 시작하기</Heading>
          <Text fontSize="sm" color={useColorModeValue('gray.600', 'gray.400')} mt={2}>
            캐치프레이즈 자리입니다.
          </Text>
        </Stack>

        <Stack mt={4} spacing={4} as="form" onSubmit={handleSubmit(onSubmit)}>
          <FormControl isInvalid={!!errors.name}>
            <FormLabel htmlFor="name">이름</FormLabel>
            <Input
              id="name"
              type="text"
              placeholder="김민수"
              autoComplete="off"
              {...register('name', {
                required: '이름을 작성해주세요.',
                minLength: { value: 2, message: '이름은 2글자 이상이어야 합니다.' },
              })}
            />
            <FormErrorMessage>{errors.name && errors.name.message}</FormErrorMessage>
          </FormControl>
          <FormControl isInvalid={!!errors.email}>
            <FormLabel htmlFor="email">이메일</FormLabel>
            <Input
              id="email"
              type="email"
              placeholder="minsu@example.com"
              autoComplete="off"
              {...register('email', {
                required: '이메일을 작성해주세요.',
              })}
            />
            <FormErrorMessage>{errors.email && errors.email.message}</FormErrorMessage>
          </FormControl>
          <FormControl isInvalid={!!errors.password}>
            <FormLabel htmlFor="password">
              암호
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
              {...register('password', {
                required: '암호를 작성해주세요.',
                minLength: { value: 8, message: '비밀번호는 8자 이상이어야 합니다.' },
                maxLength: { value: 20, message: '비밀번호는 20자 이하여야 합니다.' },
                pattern: {
                  value: /^(?=.*[a-zA-Z0-9])(?=.*[!@#$%^*+=-]).{8,20}$/,
                  message: '형식이 올바르지 않습니다.',
                },
              })}
            />
            <FormErrorMessage>
              {errors.password && errors.password.message}
            </FormErrorMessage>
          </FormControl>

          {phase === 2 && (
            <FormControl isInvalid={!!errors.code}>
              <FormLabel htmlFor="code">
                이메일 인증 코드
                <Text fontSize="sm" color="gray.500">
                  {`${getValues('email')}로 인증코드를 보냈습니다!`}
                </Text>
              </FormLabel>
              <Input
                autoComplete="off"
                id="code"
                type="code"
                placeholder="이메일 인증코드"
                {...register('code', {
                  required: '인증 코드를 입력해주세요.',
                  minLength: {
                    value: 6,
                    message: '인증코드는 6자의 무작위 글자로 이루어져 있습니다.',
                  },
                  maxLength: {
                    value: 6,
                    message: '인증코드는 6자의 무작위 글자로 이루어져 있습니다.',
                  },
                })}
              />
              <FormErrorMessage>{errors.code && errors.code.message}</FormErrorMessage>
              {(!getValues('code') || errors.code) && (
                <Box>
                  <Text fontSize="sm" color="gray.500">
                    인증번호가 올바르게 도착하지 않았나요?
                  </Text>
                  <Button size="sm">재전송</Button>
                </Box>
              )}
            </FormControl>
          )}
          <Divider />

          {phase === 1 && (
            <Button
              bg="blue.400"
              color="white"
              _hover={{ bg: 'blue.500' }}
              onClick={checkValidation}
              isLoading={mailVerification.isLoading}
            >
              가입하기
            </Button>
          )}
          {phase === 2 && (
            <Button
              bg="blue.400"
              color="white"
              _hover={{ bg: 'blue.500' }}
              type="submit"
              isLoading={isSubmitting}
            >
              인증완료
            </Button>
          )}
        </Stack>
      </Box>
    </Stack>
  );
}
