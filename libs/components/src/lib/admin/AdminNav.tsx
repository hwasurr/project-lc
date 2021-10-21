import { Box, Button, Flex, Link, useColorModeValue } from '@chakra-ui/react';
import { useIsLoggedIn, useLogout } from '@project-lc/hooks';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import { adminNavItems } from '../..';

export default function AdminNav(): JSX.Element {
  const linkColor = useColorModeValue('gray.600', 'gray.200');
  const linkHoverColor = useColorModeValue('gray.800', 'white');
  const router = useRouter();
  const { isLoggedIn } = useIsLoggedIn();
  const { logout } = useLogout();

  function adminLogout(): void {
    logout();
    router.push('/');
  }

  return (
    <Box>
      <Flex
        bg={useColorModeValue('white', 'gray.800')}
        color={useColorModeValue('gray.600', 'white')}
        minH="60px"
        py={{ base: 2 }}
        px={{ base: 4 }}
        borderBottom={1}
        borderStyle="solid"
        borderColor={useColorModeValue('gray.200', 'gray.900')}
        align="center"
        justify="space-between"
      >
        <Flex display={{ base: 'none', md: 'flex' }} ml={4}>
          {adminNavItems.map((adminNav) => (
            <Box key={adminNav.label}>
              <NextLink href={adminNav.href ?? '#'} passHref>
                <Link
                  p={2}
                  fontSize="sm"
                  fontWeight={500}
                  color={linkColor}
                  _hover={{
                    textDecoration: 'none',
                    color: linkHoverColor,
                  }}
                >
                  {adminNav.label}
                </Link>
              </NextLink>
            </Box>
          ))}
        </Flex>
        <>
          {isLoggedIn && (
            <>
              <Button my={1} size="sm" onClick={adminLogout}>
                로그아웃
              </Button>
            </>
          )}
        </>
      </Flex>
    </Box>
  );
}
