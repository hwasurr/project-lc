import { ColorMode, useColorMode } from '@chakra-ui/color-mode';
import { ChakraNextImage } from '@project-lc/components-core/ChakraNextImage';
import { UserType } from '@project-lc/shared-types';
import { useMemo } from 'react';

export const LOGO_S3_PREFIX =
  'https://lc-project.s3.ap-northeast-2.amazonaws.com/kksLogo/';
export const darkLogo = 'kksMainLogoDarkMode.png';
export const darkBigLogo = 'kksMainLogoDarkModeBig.png';
export const lightLogo = 'kksMainLogoLightMode.png';
export const lightBigLogo = 'kksMainLogoLightModeBig.png';
export const sellerLogo = 'kkshow-seller-lightmode.png';
export const broadcasterLogo = 'kkshow-broadcaster-lightmode.png';

export interface KksLogoProps {
  appType?: UserType;
  size: 'small' | 'mid' | 'big' | 'manual';
  width?: number;
  height?: number;
}

interface GetCorrectLogoOption {
  appType: KksLogoProps['appType'];
  colorMode: ColorMode;
}
function getCorrectLogoInfo({ appType, colorMode }: GetCorrectLogoOption): string {
  switch (appType) {
    case 'broadcaster':
      return LOGO_S3_PREFIX + broadcasterLogo;
    case 'seller':
      return LOGO_S3_PREFIX + sellerLogo;
    default: {
      if (colorMode === 'dark') return LOGO_S3_PREFIX + darkLogo;
      return LOGO_S3_PREFIX + lightLogo;
    }
  }
}

/**
 * @author M'baku, Dan
 * @description 이미지 크기가 400x150보다 클 경우 manual 옵션을 사용하세요
 */
export function KksLogo(props: KksLogoProps): JSX.Element | null {
  const { size, width, height, appType } = props;
  const { colorMode } = useColorMode();

  const logoSrc = useMemo(
    () => getCorrectLogoInfo({ colorMode, appType }),
    [colorMode, appType],
  );

  if (size === 'small') {
    return <ChakraNextImage src={logoSrc} width="100" height="40" />;
  }
  if (size === 'mid') {
    return <ChakraNextImage src={logoSrc} width="260" height="82" />;
  }
  if (size === 'big') {
    return <ChakraNextImage src={logoSrc} width="400" height="150" />;
  }
  if (size === 'manual') {
    return <ChakraNextImage src={logoSrc} width={width} height={height} />;
  }

  return null;
}

export default KksLogo;
