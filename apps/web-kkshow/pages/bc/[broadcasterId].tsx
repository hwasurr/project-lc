/* eslint-disable react/no-array-index-key */
import {
  Box,
  Button,
  Center,
  Spinner,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
} from '@chakra-ui/react';
import KkshowLayout from '@project-lc/components-web-kkshow/KkshowLayout';
import { PromotionPageGoodsList } from '@project-lc/components-web-kkshow/promotion-page/PromotionPageGoodsList';
import { PromotionPageProfile } from '@project-lc/components-web-kkshow/promotion-page/PromotionPageProfile';
import { useBroadcaster, usePromotionPage } from '@project-lc/hooks';
import { EventPopup } from '@project-lc/components-web-kkshow/EventPopup';
import { useRouter } from 'next/router';
import { useMemo } from 'react';

export function BroadcasterPromotionPage(): JSX.Element {
  const router = useRouter();
  const broadcasterId = router.query.broadcasterId as string;
  const bc = useBroadcaster({ id: broadcasterId });
  const promotionPage = usePromotionPage(broadcasterId);

  const tabInfo = useMemo(
    () => [
      {
        title: '상품',
        component: <PromotionPageGoodsList broadcasterId={broadcasterId} />,
      },
      { isDisabled: true, title: '라이브방송(준비중)', component: <p>방송목록</p> },
    ],
    [broadcasterId],
  );

  if (bc.isLoading) {
    return (
      <Box>
        <KkshowLayout navbarFirstLink="kkmarket">
          <Center minH="90vh">
            <Spinner />
          </Center>
        </KkshowLayout>
      </Box>
    );
  }

  if (!bc.data) return null;
  if ((bc.data && !bc.data.userNickname) || !promotionPage.data)
    return (
      <Box>
        <KkshowLayout navbarFirstLink="kkmarket">
          <Center minH="90vh">
            <Box textAlign="center">
              <Text>해당하는 방송인이 없거나, 아직 홍보중인 상품이 없습니다</Text>
              <Button mt={4} onClick={() => router.push('/shopping')}>
                쇼핑하러가기
              </Button>
            </Box>
          </Center>
        </KkshowLayout>
      </Box>
    );

  return (
    <Box>
      {/* 신규가입 이벤트 팝업 */}
      <EventPopup />

      <KkshowLayout navbarFirstLink="kkmarket">
        <Box m="auto" maxW="5xl" p={2} minH="80vh" mt={[5, 10, 20]}>
          <PromotionPageProfile broadcasterId={broadcasterId} />

          <Tabs variant="line" align="center" mt={30}>
            <TabList>
              {tabInfo.map((tab) => (
                <Tab isDisabled={tab.isDisabled} key={tab.title}>
                  {tab.title}
                </Tab>
              ))}
            </TabList>

            <TabPanels textAlign="left">
              {tabInfo.map((tab) => (
                <TabPanel key={tab.title}>{tab.component}</TabPanel>
              ))}
            </TabPanels>
          </Tabs>
        </Box>
      </KkshowLayout>
    </Box>
  );
}

export default BroadcasterPromotionPage;
