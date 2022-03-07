import { Box, BoxProps, Heading } from '@chakra-ui/layout';
import { KkshowMainCarousel as TKkshowMainCarousel } from '@project-lc/shared-types';

export interface KkshowMainCarouselHeaderProps {
  type: TKkshowMainCarousel['type'];
}
export function KkshowMainCarouselHeader({
  type,
}: KkshowMainCarouselHeaderProps): JSX.Element | null {
  const KkshowMainCarouselHeaderContainer = (props: BoxProps): JSX.Element => (
    <Box
      h={50}
      textAlign="center"
      color="whiteAlpha.900"
      visibility="visible"
      {...props}
    />
  );

  if (type === 'upcoming')
    return (
      <KkshowMainCarouselHeaderContainer>
        <Heading fontSize={{ base: 'lg', md: '3xl' }}>UPCOMMING</Heading>
      </KkshowMainCarouselHeaderContainer>
    );

  if (type === 'nowPlaying') {
    return (
      <KkshowMainCarouselHeaderContainer>
        <Heading fontSize={{ base: 'lg', md: '3xl' }}>
          NOW{' '}
          <Heading fontSize={{ base: 'lg', md: '3xl' }} as="span" fontWeight="medium">
            PLAYING
          </Heading>
        </Heading>
      </KkshowMainCarouselHeaderContainer>
    );
  }

  if (type === 'previous') {
    return (
      <KkshowMainCarouselHeaderContainer>
        <Heading fontSize={{ base: 'lg', md: '3xl' }}>VOD</Heading>
      </KkshowMainCarouselHeaderContainer>
    );
  }

  return <KkshowMainCarouselHeaderContainer> </KkshowMainCarouselHeaderContainer>;
}

export default KkshowMainCarouselHeader;
