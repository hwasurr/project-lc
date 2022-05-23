import {
  FcMoneyTransfer,
  FcInspection,
  FcList,
  FcDislike,
  FcVideoCall,
  FcFaq,
  FcSms,
  FcAdvertising,
  FcCloseUpMode,
  FcBiohazard,
} from 'react-icons/fc';

import {
  AiOutlineShop,
  AiOutlineHome,
  AiOutlineSetting,
  AiOutlineContainer,
} from 'react-icons/ai';
import { BsBox } from 'react-icons/bs';
import { MdLiveTv, MdOutlineShoppingCart, MdPayment } from 'react-icons/md';
import { IconType } from 'react-icons/lib';

export interface NavItem {
  label: string;
  subLabel?: string;
  // children?: Array<NavItem>;
  href: string;
  needLogin?: boolean;
  isExternal?: boolean;
}

/** 방송인센터, 판매자센터 상단 네비바 링크 */
export const mainNavItems: Array<NavItem> = [
  {
    label: '마이페이지',
    href: '/mypage',
    needLogin: true,
  },
  {
    label: '크크마켓',
    href: 'https://k-kmarket.com/',
    isExternal: true,
  },
];

/** 크크쇼 상단 네비바 링크 */
export const kkshowNavLinks: Array<NavItem> = [
  {
    label: '쇼핑',
    href: '/shopping',
  },
  // {
  //   label: '방송인',
  //   href: '/broadcasters',
  // },
  // { label: '방송편성표', href: '/' },
  // { label: '방송인', href: '/' },
  // { label: 'SNS', href: '/' },
];

// ************************************************
// 마이페이지 네비
// ************************************************

export interface LinkItemProps {
  name: string;
  href: string;
  icon?: IconType;
}

export interface SidebarMenuLink extends LinkItemProps {
  children?: SidebarMenuLink[];
}

export interface MypageLink extends LinkItemProps {
  children?: Omit<MypageLink, 'icon'>[];
  checkIsActive: (pathname: string, linkHref: string) => boolean;
  isInvisible?: boolean;
}

const defaultIsActiveChecker = (pathname: string, linkHref: string): boolean =>
  pathname.includes(linkHref);

/** 판매자 마이페이지 링크 */
export const mypageNavLinks: MypageLink[] = [
  {
    icon: AiOutlineHome,
    name: '홈',
    href: '/mypage',
    checkIsActive: (pathname, linkHref) => pathname === linkHref,
  },
  {
    icon: BsBox,
    name: '상품',
    href: '/mypage/goods',
    checkIsActive: defaultIsActiveChecker,
    children: [
      {
        name: '상품 목록',
        href: '/mypage/goods',
        checkIsActive: (pathname, linkHref) => pathname === linkHref,
      },
      {
        name: '문의 관리',
        href: '/mypage/goods-inquiries',
        checkIsActive: (pathname, linkHref) => pathname === linkHref,
      },
    ],
  },
  {
    icon: MdLiveTv,
    name: '라이브쇼핑',
    href: '/mypage/live',
    checkIsActive: defaultIsActiveChecker,
    // children: [
    // {
    //   name: '내 라이브 쇼핑 관리',
    //   href: '/mypage/live',
    //   checkIsActive: (pathname, linkHref) => pathname === linkHref,
    // },
    // {
    //   name: 'VOD 관리',
    //   href: '/mypage/live/vod',
    //   checkIsActive: (pathname, linkHref) => pathname === linkHref,
    // },
    // ],
  },
  {
    icon: MdOutlineShoppingCart,
    name: '주문',
    href: '/mypage/orders',
    checkIsActive: defaultIsActiveChecker,
  },
  {
    icon: MdPayment,
    name: '정산',
    href: '/mypage/settlement',
    checkIsActive: defaultIsActiveChecker,
  },
  {
    icon: AiOutlineContainer,
    name: '이용안내',
    href: '/mypage/manual',
    checkIsActive: defaultIsActiveChecker,
  },
  {
    icon: AiOutlineShop,
    name: '상점설정',
    href: '/mypage/shopinfo',
    checkIsActive: defaultIsActiveChecker,
  },
  {
    icon: AiOutlineSetting,
    name: '계정설정',
    href: '/mypage/setting',
    checkIsActive: defaultIsActiveChecker,
  },
  {
    name: '등록',
    href: 'regist',
    isInvisible: true,
    checkIsActive: defaultIsActiveChecker,
  },
  {
    name: '수정',
    href: 'edit',
    isInvisible: true,
    checkIsActive: defaultIsActiveChecker,
  },
  {
    name: '출고',
    href: 'exports',
    isInvisible: true,
    checkIsActive: defaultIsActiveChecker,
  },
  {
    name: '알림',
    href: 'notifications',
    isInvisible: true,
    checkIsActive: defaultIsActiveChecker,
  },
];

export const broadcasterCenterMypageNavLinks: Array<MypageLink> = [
  {
    icon: AiOutlineHome,
    name: '홈',
    href: '/mypage',
    checkIsActive: (pathname, linkHref) => pathname === linkHref,
  },
  {
    icon: MdLiveTv,
    name: '라이브쇼핑',
    href: '/mypage/live',
    checkIsActive: defaultIsActiveChecker,
  },
  {
    icon: MdOutlineShoppingCart,
    name: '구입현황',
    href: '/mypage/purchase',
    checkIsActive: defaultIsActiveChecker,
  },
  {
    icon: MdPayment,
    name: '정산',
    href: '/mypage/settlement',
    checkIsActive: defaultIsActiveChecker,
  },
  {
    icon: AiOutlineContainer,
    name: '이용안내',
    href: '/mypage/manual',
    checkIsActive: defaultIsActiveChecker,
  },
  {
    icon: AiOutlineSetting,
    name: '계정설정',
    href: '/mypage/setting',
    checkIsActive: defaultIsActiveChecker,
  },
  {
    name: '알림',
    href: 'notifications',
    isInvisible: true,
    checkIsActive: defaultIsActiveChecker,
  },
];

/** 관리자 페이지 상단 네비바 링크 */
export const adminNavItems: Array<NavItem> = [
  {
    label: '크크마켓',
    href: 'https://k-kmarket.com/',
    isExternal: true,
  },
];

/** 관리자 페이지 사이드바 - 관리메뉴 링크 */
export const adminSidebarMenuList: SidebarMenuLink[] = [
  {
    name: '방송인',
    href: '/broadcaster',
    children: [
      { name: '정산정보 검수', href: '/broadcaster/settlement-info', icon: FcInspection },
      { name: '정산', href: '/broadcaster/settlement', icon: FcMoneyTransfer },
      {
        name: '상품 홍보 페이지',
        href: '/broadcaster/promotion-page',
        icon: FcList,
      },
    ],
  },
  {
    name: '판매자',
    href: '/seller',
    children: [
      { name: '계좌정보 목록', href: '/seller/account', icon: FcList },
      {
        name: '사업자 등록정보 검수',
        href: '/seller/business-registration',
        icon: FcInspection,
      },
      { name: '정산', href: '/seller/settlement', icon: FcMoneyTransfer },
    ],
  },
  {
    name: '상품',
    href: '/goods',
    children: [
      { name: '상품검수', href: '/goods/confirmation', icon: FcInspection },
      { name: '카테고리', href: '/goods/category', icon: FcList },
    ],
  },
  {
    name: '라이브쇼핑',
    href: '/live-shopping',
    children: [{ name: '라이브 쇼핑 목록', href: '/live-shopping', icon: FcVideoCall }],
  },
  {
    name: '주문',
    href: 'order',
    children: [{ name: '결제취소 요청', href: '/order/order-cancel', icon: FcDislike }],
  },
  {
    name: '일반관리',
    href: '/general',
    children: [
      { name: '문의하기', href: '/general/inquiry', icon: FcFaq },
      { name: '알림메시지', href: '/general/notification', icon: FcSms },
      { name: '공지사항', href: '/general/notice', icon: FcAdvertising },
      {
        name: '이용정책, 개인정보처리방침',
        href: '/general/policy',
        icon: FcList,
      },
      {
        name: '이용안내',
        href: '/general/manual',
        icon: FcCloseUpMode,
      },
    ],
  },
  {
    name: '관리자',
    href: '/admin-manage',
    children: [{ name: '계정 권한관리', href: '/admin-manage', icon: FcList }],
  },
  {
    name: '크크쇼 메인',
    href: '/kkshow-main',
    children: [
      { name: '크크쇼 메인페이지', href: '/kkshow-main', icon: FcList },
      {
        name: '크크쇼 쇼핑페이지',
        href: '/kkshow-main/kkshow-shopping',
        icon: FcBiohazard,
      },
    ],
  },
];

/** 크크쇼 소비자 마이페이지 사이드바 - "쇼핑" 하위 탭 */
const customerMypageShoppingChildrenNavLinks: Omit<MypageLink, 'icon'>[] = [
  {
    name: '장바구니',
    href: '/cart',
    checkIsActive: defaultIsActiveChecker,
  },
  {
    name: '주문/배송 내역',
    href: '/mypage/order-list',
    checkIsActive: (pathname: string, linkHref: string) => {
      return pathname.includes(linkHref) || pathname === '/mypage'; // 소비자 데스크탑 마이페이지 홈에서 주문/배송내역이 표시됨
    },
  },
  {
    name: '반품/교환/취소 내역',
    href: '/mypage/exchange-return-cancel',
    checkIsActive: defaultIsActiveChecker,
  },
  { name: '마일리지', href: '/mypage/마일리지', checkIsActive: defaultIsActiveChecker },
];
/** 크크쇼 소비자 마이페이지 사이드바 - "활동" 하위 탭 */
const customerMypageActivityChildrenNavLinks: Omit<MypageLink, 'icon'>[] = [
  { name: '후원내역', href: '/mypage/후원내역', checkIsActive: defaultIsActiveChecker },
  {
    name: '라이브 알림 내역',
    href: '/mypage/내역',
    checkIsActive: defaultIsActiveChecker,
  },
  { name: '후기 관리', href: '/mypage/review', checkIsActive: defaultIsActiveChecker },
];
/** 크크쇼 소비자 마이페이지 사이드바 - "정보" 하위 탭 */
const customerMypageInfoChildrenNavLinks: Omit<MypageLink, 'icon'>[] = [
  {
    name: '회원 정보 수정',
    href: '/mypage/회원 정보',
    checkIsActive: defaultIsActiveChecker,
  },
  {
    name: '배송지 관리',
    href: '/mypage/address',
    checkIsActive: defaultIsActiveChecker,
  },
];

/** 크크쇼 소비자 마이페이지 사이드바 메뉴 */
export const customerMypageNavLinks: MypageLink[] = [
  {
    name: '쇼핑',
    href: '',
    checkIsActive: (pathname: string, _: string) => {
      // 하위탭 링크 중 하나라도 active해당되면 active처리
      return customerMypageShoppingChildrenNavLinks.some((link) =>
        link.checkIsActive(pathname, link.href),
      );
    },
    children: customerMypageShoppingChildrenNavLinks,
  },
  {
    name: '활동',
    href: '',
    checkIsActive: (pathname: string, _: string) => {
      return customerMypageActivityChildrenNavLinks.some((link) =>
        link.checkIsActive(pathname, link.href),
      );
    },
    children: customerMypageActivityChildrenNavLinks,
  },
  {
    name: '정보',
    href: '',
    checkIsActive: (pathname: string, _: string) => {
      return customerMypageInfoChildrenNavLinks.some((link) =>
        link.checkIsActive(pathname, link.href),
      );
    },
    children: customerMypageInfoChildrenNavLinks,
  },
];
