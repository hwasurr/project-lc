import { Box, Button, Heading, Tooltip, Text, Link } from '@chakra-ui/react';
import { ExternalLinkIcon } from '@chakra-ui/icons';
import { GridColumns, GridRowData } from '@material-ui/data-grid';
import { ChakraDataGrid } from '@project-lc/components-core/ChakraDataGrid';
import { LiveShoppingProgressBadge } from '@project-lc/components-shared/LiveShoppingProgressBadge';
import { useAdminLiveShoppingList, useProfile } from '@project-lc/hooks';
import { getLiveShoppingProgress, LiveShoppingWithGoods } from '@project-lc/shared-types';
import dayjs from 'dayjs';

export function AdminLiveShoppingList({
  onRowClick,
}: {
  onRowClick: (liveShoppingId: number) => void;
}): JSX.Element {
  const { data: profileData } = useProfile();

  const { data, isLoading } = useAdminLiveShoppingList(
    {},
    { enabled: !!profileData?.id },
  );

  function handleClick(row: LiveShoppingWithGoods): void {
    onRowClick(row.id);
  }
  const columns: GridColumns = [
    { field: 'id', width: 50 },
    {
      field: 'liveShoppingName',
      headerName: '라이브 쇼핑명',
      minWidth: 350,
      flex: 1,
      renderCell: ({ row }) => (
        <Tooltip label="상세페이지로 이동">
          <Link href={`/live-shopping/${row.id}`} color="blue">
            {row.liveShoppingName ||
              '라이브 쇼핑명은 라이브 쇼핑 확정 후, 등록하면 됩니다.'}
          </Link>
        </Tooltip>
      ),
    },
    {
      field: 'createDate',
      headerName: '등록일자',
      minWidth: 150,
      valueFormatter: ({ row }) => dayjs(row.createDate).format('YYYY/MM/DD HH:mm'),
    },
    {
      field: 'fmGoodsSeq',
      headerName: '상품명',
      minWidth: 350,
      renderCell: ({ row }) =>
        new Date(row.sellEndDate) > new Date() && row.fmGoodsSeq ? (
          <Tooltip label="상품페이지로 이동">
            <Link
              href={`http://whiletrue.firstmall.kr/goods/view?no=${row.fmGoodsSeq}`}
              isExternal
            >
              {row.goods.goods_name} <ExternalLinkIcon mx="2px" />
            </Link>
          </Tooltip>
        ) : (
          <Text>{row.goods.goods_name}</Text>
        ),
    },
    {
      field: 'fmGoodSeq',
      headerName: '퍼스트몰 상품ID',
      valueFormatter: ({ row }) => (row.fmGoodsSeq ? row.fmGoodsSeq || '미입력' : '미정'),
    },
    {
      field: 'progress',
      headerName: '상태',
      renderCell: ({ row }: GridRowData) => (
        <Box lineHeight={2}>
          <LiveShoppingProgressBadge
            progress={row.progress}
            broadcastStartDate={row.broadcastStartDate}
            broadcastEndDate={row.broadcastEndDate}
            sellEndDate={row.sellEndDate}
          />
        </Box>
      ),
    },
    {
      field: 'seller.sellerShop.shopName',
      headerName: '판매자',
      minWidth: 200,
      valueFormatter: (params) => params.row?.seller.sellerShop.shopName,
    },
    {
      headerName: '방송시간',
      field: '방송시간',
      minWidth: 300,
      renderCell: ({ row }: GridRowData) =>
        `${
          row.broadcastStartDate
            ? dayjs(row.broadcastStartDate).format('YYYY/MM/DD HH:mm')
            : '미정'
        } - ${
          row.broadcastEndDate
            ? dayjs(row.broadcastEndDate).format('YYYY/MM/DD HH:mm')
            : '미정'
        }`,
    },
    {
      headerName: '판매시간',
      field: '판매시간',
      minWidth: 300,
      renderCell: ({ row }: GridRowData) =>
        `${
          row.sellStartDate ? dayjs(row.sellStartDate).format('YYYY/MM/DD HH:mm') : '미정'
        } - ${
          row.sellEndDate ? dayjs(row.sellEndDate).format('YYYY/MM/DD HH:mm') : '미정'
        }`,
    },
    {
      headerName: '선물 목록 조회',
      field: '',
      renderCell: ({ row }: GridRowData) => (
        <Button
          size="xs"
          onClick={() => {
            handleClick(row);
          }}
          isDisabled={!checkGiftList(row)}
        >
          선물 목록 조회
        </Button>
      ),
    },
  ];
  // 선물 목록을 조회할 수 있는 라이브커머스의 조건
  function checkGiftList(row: LiveShoppingWithGoods): boolean {
    const progress = getLiveShoppingProgress({
      progress: row.progress,
      broadcastStartDate: row.broadcastStartDate,
      broadcastEndDate: row.broadcastEndDate,
      sellEndDate: row.sellEndDate,
    });
    return ['판매종료', '방송진행중', '방송종료', '확정됨'].includes(progress);
  }

  return (
    <Box p={5}>
      <Heading size="md">라이브 쇼핑 리스트</Heading>
      {data && (
        <>
          <ChakraDataGrid
            disableExtendRowFullWidth
            autoHeight
            pagination
            autoPageSize
            disableSelectionOnClick
            disableColumnMenu
            disableColumnSelector
            loading={isLoading}
            columns={columns}
            rows={data}
          />
        </>
      )}
    </Box>
  );
}
