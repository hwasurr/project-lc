import { DownloadIcon, Icon } from '@chakra-ui/icons';
import {
  Box,
  Button,
  Link,
  Stack,
  Text,
  Tooltip,
  useBreakpoint,
  useDisclosure,
} from '@chakra-ui/react';
import { GridColumns, GridRowId, GridToolbarContainer } from '@material-ui/data-grid';
import { useDisplaySize, useFmOrders } from '@project-lc/hooks';
import {
  convertFmOrderStatusToString,
  convertOrderSitetypeToString,
  FmOrderStatusNumString,
  isOrderExportable,
} from '@project-lc/shared-types';
import { useFmOrderStore } from '@project-lc/stores';
import dayjs from 'dayjs';
import NextLink from 'next/link';
import { useMemo } from 'react';
import { FaTruck } from 'react-icons/fa';
import { ChakraDataGrid } from './ChakraDataGrid';
import ExportManyDialog from './ExportManyDialog';
import FmOrderStatusBadge from './FmOrderStatusBadge';
import OrderListDownloadDialog from './OrderListDownloadDialog';
import TooltipedText from './TooltipedText';

const columns: GridColumns = [
  {
    field: 'id',
    headerName: '주문번호',
    width: 140,
    renderCell: (params) => {
      return (
        <NextLink href={`/mypage/orders/${params.row.id}`} passHref>
          <Link color="blue.500" textDecoration="underline" isTruncated>
            {params.row.id}
          </Link>
        </NextLink>
      );
    },
  },
  {
    field: 'regist_date',
    headerName: '주문일시',
    width: 170,
    valueFormatter: ({ row }) =>
      dayjs(row.regist_date as any).format('YYYY/MM/DD HH:mm:ss'),
    renderCell: (params) => {
      const date = dayjs(params.row.regist_date).format('YYYY/MM/DD HH:mm:ss');
      return <TooltipedText text={date} />;
    },
  },
  {
    field: 'goods_name',
    headerName: '상품',
    width: 220,
  },
  {
    field: 'sitetype',
    headerName: '환경',
    disableColumnMenu: true,
    disableReorder: true,
    hideSortIcons: true,
    sortable: false,
    width: 120,
    valueFormatter: ({ value }) => convertOrderSitetypeToString(value as any) || '-',
    renderCell: (params) => (
      <Text>{convertOrderSitetypeToString(params.row.sitetype)}</Text>
    ),
  },
  {
    field: 'totalEa',
    headerName: '수량(종류)',
    disableColumnMenu: true,
    disableReorder: true,
    hideSortIcons: true,
    sortable: false,
    width: 120,
    valueFormatter: ({ row }) => {
      return row.totalEa + (row.totalType ? `/${row.totalType}` : '');
    },
    renderCell: (params) => (
      <Text>
        {params.row.totalEa}
        {params.row.totalType ? ` (${params.row.totalType})` : ''}
      </Text>
    ),
  },
  {
    field: 'only-web_recipient_user_name',
    headerName: '주문자/받는분',
    width: 120,
    disableColumnMenu: true,
    disableReorder: true,
    hideSortIcons: true,
    sortable: false,
    disableExport: true,
    valueFormatter: ({ row }) => row.recipient_user_name,
    renderCell: (params) => (
      <Text>
        {params.row.recipient_user_name}
        {params.row.order_user_name ? `/${params.row.order_user_name}` : ''}
      </Text>
    ),
  },
  {
    field: 'totalPrice',
    headerName: '주문금액',
    disableColumnMenu: true,
    disableReorder: true,
    hideSortIcons: true,
    sortable: false,
    width: 120,
    valueFormatter: ({ value }) => {
      let howmuch = '';
      if (!Number.isNaN(Number(value))) {
        howmuch = `${Math.floor(Number(value)).toLocaleString()}원`;
      }
      return howmuch;
    },
    renderCell: (params) => {
      let text = '';
      if (params.row.totalPrice) {
        const totalPrice = Math.floor(Number(params.row.totalPrice));
        const shppingCost = Math.floor(Number(params.row.totalShippingCost));
        let howMuch: number;
        if (!Number.isNaN(shppingCost)) {
          howMuch = totalPrice + shppingCost;
        } else {
          howMuch = totalPrice;
        }
        text = `${howMuch.toLocaleString()}원`;
      }
      return <TooltipedText text={text} />;
    },
  },
  {
    field: 'step',
    headerName: '주문상태',
    disableColumnMenu: true,
    disableReorder: true,
    width: 120,
    valueFormatter: ({ value }) => convertFmOrderStatusToString(value as any) || '-',
    renderCell: ({ value }) => (
      <Box lineHeight={2}>
        <FmOrderStatusBadge orderStatus={value as FmOrderStatusNumString} />
      </Box>
    ),
  },
  // ...hiddenColumns,
];

export function OrderList(): JSX.Element {
  const exportManyDialog = useDisclosure();
  const fmOrderStates = useFmOrderStore();
  const orders = useFmOrders(fmOrderStates);
  const { isDesktopSize } = useDisplaySize();

  const isExportable = useMemo(() => {
    if (!orders.data) return false;
    const _so = orders.data.filter((o) => fmOrderStates.selectedOrders.includes(o.id));
    return _so.filter((so) => isOrderExportable(so.step)).length > 0;
  }, [fmOrderStates.selectedOrders, orders.data]);

  const filteredOrders = useMemo(() => {
    if (!orders.data) return [];
    return orders.data.filter((d) => {
      return !d.giftFlag;
    });
  }, [orders.data]);

  return (
    <Box minHeight={{ base: 300, md: 600 }} mb={24}>
      <ChakraDataGrid
        autoHeight
        rowsPerPageOptions={[10, 20, 50, 100]}
        disableSelectionOnClick
        disableColumnMenu
        loading={orders.isLoading}
        columns={columns.map((col) => {
          if (col.headerName === '상품') {
            const flex = isDesktopSize ? 1 : undefined;
            return { ...col, flex };
          }
          return col;
        })}
        rows={filteredOrders}
        checkboxSelection
        selectionModel={fmOrderStates.selectedOrders}
        onSelectionModelChange={fmOrderStates.handleOrderSelected}
        components={{
          Toolbar: () => (
            <OrderToolbar
              options={[
                {
                  name: '출고 처리',
                  onClick: () => exportManyDialog.onOpen(),
                  icon: <Icon as={FaTruck} />,
                  emphasize: true,
                  isDisabled: !isExportable,
                  disableMessage: '출고가능한 주문이 없습니다.',
                },
              ]}
            />
          ),
          ExportIcon: DownloadIcon,
        }}
      />

      {exportManyDialog.isOpen && orders.data && (
        <ExportManyDialog
          isOpen={exportManyDialog.isOpen}
          onClose={exportManyDialog.onClose}
          orders={orders.data}
        />
      )}
    </Box>
  );
}

export default OrderList;

interface OrderToolbarProps {
  options: {
    name: string;
    onClick: (items: GridRowId[]) => void;
    icon: React.ReactElement;
    emphasize?: boolean;
    isDisabled?: boolean;
    disableMessage?: string;
  }[];
}
export function OrderToolbar({ options }: OrderToolbarProps): JSX.Element {
  const orderDownloadDialog = useDisclosure();
  const xSize = useBreakpoint();
  const isMobile = useMemo(() => xSize && ['base', 'sm'].includes(xSize), [xSize]);

  const selectedOrders = useFmOrderStore((state) => state.selectedOrders);

  return (
    <GridToolbarContainer>
      <Stack spacing={2} direction="row" pb={2}>
        {isMobile ? null : (
          <>
            {options.map((opt) => (
              <Tooltip
                key={opt.name}
                label={opt.disableMessage}
                placement="top-start"
                isDisabled={!opt.isDisabled}
              >
                <Box>
                  <Button
                    key={opt.name}
                    size="sm"
                    rightIcon={opt.icon}
                    colorScheme={opt.emphasize ? 'pink' : undefined}
                    isDisabled={selectedOrders.length === 0 || opt.isDisabled}
                    onClick={() => opt.onClick(selectedOrders)}
                  >
                    {opt.name}
                  </Button>
                </Box>
              </Tooltip>
            ))}
            <Button
              size="sm"
              isDisabled={selectedOrders.length === 0}
              rightIcon={<DownloadIcon />}
              onClick={orderDownloadDialog.onOpen}
            >
              내보내기
            </Button>

            {orderDownloadDialog.isOpen && (
              <OrderListDownloadDialog
                isOpen={orderDownloadDialog.isOpen}
                onClose={orderDownloadDialog.onClose}
              />
            )}
          </>
        )}
      </Stack>
    </GridToolbarContainer>
  );
}
