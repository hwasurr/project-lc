import {
  useToast,
  Text,
  Flex,
  IconButton,
  Box,
  useColorModeValue,
  Button,
} from '@chakra-ui/react';
import { useKkshowSearchStore, useSearchPopoverStore } from '@project-lc/stores';
import { SmallCloseIcon } from '@chakra-ui/icons';
import { useForm, SubmitHandler } from 'react-hook-form';
import { useEffect, useRef, MouseEvent } from 'react';
import { useQueryClient } from 'react-query';
import { useRouter } from 'next/router';
import { SearchInput } from './SearchBox';

export function deleteLocalStorageSearchKeyword(
  toDeleteKeyword: string,
  setLocalStorage: (value: string[]) => void,
): void {
  const localDataArray: string[] = JSON.parse(
    window.localStorage.getItem('searchKeyword') || '[]',
  );

  const index = localDataArray.indexOf(toDeleteKeyword);
  if (index !== -1) {
    localDataArray.splice(index, 1);
    window.localStorage.setItem('searchKeyword', JSON.stringify(localDataArray));
    setLocalStorage(JSON.parse(window.localStorage.getItem('searchKeyword') || '[]'));
  }
}

export function SearchPopover(): JSX.Element {
  const toast = useToast();
  const router = useRouter();
  const queryClient = useQueryClient();

  const initialRef = useRef<any>(null);

  const { keyword, localStorage, setLocalStorage } = useKkshowSearchStore();
  const { isOpen, handlePopover } = useSearchPopoverStore();
  const setKeyword = useKkshowSearchStore((s) => s.setKeyword);

  const { handleSubmit } = useForm<SearchInput>();

  const hoverColor = useColorModeValue('gray.50', 'gray.700');
  const deleteButtonhoverColor = useColorModeValue('gray.200', 'gray.800');

  const onSubmit: SubmitHandler<SearchInput> = () => {
    if (keyword) {
      let localDataArray: string[] = JSON.parse(
        window.localStorage.getItem('searchKeyword') || '[]',
      );
      localDataArray.unshift(keyword);
      localDataArray = [...new Set(localDataArray)];

      if (localDataArray.length > 3) {
        localDataArray = localDataArray.splice(0, 3);
      }

      window.localStorage.setItem('searchKeyword', JSON.stringify(localDataArray));
      router.push({ pathname: '/search', query: { keyword } });
      queryClient.invalidateQueries('getSearchResults');
      handlePopover(false);
    } else {
      toast({
        title: '검색어를 입력해주세요',
        status: 'error',
      });
    }
  };

  useEffect(() => {
    setLocalStorage(JSON.parse(window.localStorage.getItem('searchKeyword') || '[]'));
  }, [setLocalStorage, router]);

  return (
    <Box
      display={isOpen ? 'block' : 'none'}
      position="absolute"
      width="100%"
      height="fit-content"
      insetY="42px"
      as="form"
      flex={1}
      onSubmit={handleSubmit(onSubmit)}
      bgColor={useColorModeValue('white', 'gray.600')}
      color={useColorModeValue('black', 'white')}
      zIndex="docked"
      borderRadius={10}
      boxShadow="md"
      pt={3}
      pb={3}
    >
      <Text mt={2} ml={2} as="sup" color="gray.400">
        최근 검색어
      </Text>
      {localStorage?.length === 0 && <Text ml={3}>최근 검색어가 없습니다</Text>}
      {localStorage?.map((item: string) => (
        <Flex key={item} _hover={{ backgroundColor: hoverColor }}>
          <Flex
            width="100%"
            justifyContent="space-between"
            alignItems="center"
            flex={1}
            pl={3}
            as="button"
            type="submit"
            cursor="pointer"
            onMouseDown={(e: MouseEvent<HTMLElement>) => e.preventDefault()}
            onClick={() => {
              setKeyword(item);
              handlePopover(false);
            }}
          >
            <Text ref={initialRef}>{item}</Text>
          </Flex>
          <IconButton
            _hover={{ backgroundColor: deleteButtonhoverColor }}
            m={1}
            variant="fill"
            aria-label="search-button-icon"
            icon={<SmallCloseIcon />}
            color="gray"
            onMouseDown={(e) => {
              e.preventDefault();
            }}
            onClick={() => {
              deleteLocalStorageSearchKeyword(item, setLocalStorage);
            }}
          />
        </Flex>
      ))}
    </Box>
  );
}

export default SearchPopover;
