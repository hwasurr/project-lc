import { SearchIcon, ChevronLeftIcon, SmallCloseIcon } from '@chakra-ui/icons';
import {
  IconButton,
  Input,
  InputGroup,
  InputRightElement,
  Box,
  useColorModeValue,
  HStack,
} from '@chakra-ui/react';
import { useRef } from 'react';
import { useRouter } from 'next/router';
import { useKkshowSearchStore } from '@project-lc/stores';
import { SearchBox } from './SearchBox';

export function SearchPageSearcher(): JSX.Element {
  const initialRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  return (
    <>
      <InputGroup
        size="md"
        mt={3}
        display={{ base: 'flex', md: 'none' }}
        alignItems="center"
        ref={initialRef}
      >
        <Box
          as="button"
          color={useColorModeValue('gray.600', 'gray.200')}
          display={{ base: 'flex' }}
          onClick={() => router.back()}
        >
          <ChevronLeftIcon w="30px" h="35px" />
        </Box>
        <SearchBox />
      </InputGroup>
    </>
  );
}
export default SearchPageSearcher;
