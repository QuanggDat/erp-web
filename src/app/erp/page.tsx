'use client'
import { Alert, Badge, Card, Table } from 'react-bootstrap';
import Link from 'next/link';
import useSWR from 'swr';
import { API_URL, sendRequest } from '@/utils/api';
import {
    formatMoney, formatQuantity, formatDate,
    ORDER_STATUS_LABEL, ORDER_STATUS_VARIANT,
} from '@/utils/erp';

//Một ô số liệu tổng quan.
//Bốn ô dùng chung một màu chữ thay vì mỗi ô một màu: màu ở đây không mang
//ý nghĩa gì (không phải tốt hay xấu), tô khác nhau chỉ làm rối mắt.
//Dải màu bên trái mới là thứ phân biệt các ô.
const StatCard = (props: {
    label: string;
    value: string;
    href: string;
    accent: string;
    loading?: boolean;
}) => (
    <div className="col-6 col-lg-3">
        <Link href={props.href} className="text-decoration-none d-block h-100">
            <Card className="h-100">
                <Card.Body style={{ borderLeft: `4px solid ${props.accent}` }}>
                    <div className="text-muted" style={{ fontSize: 'var(--wc-text-sm)' }}>
                        {props.label}
                    </div>
                    {props.loading
                        ? <div className="wc-skeleton mt-2" style={{ height: 28, width: '60%' }} />
                        : <div
                            className="fw-bold mt-1"
                            style={{
                                fontSize: 'var(--wc-text-xl)',
                                color: 'var(--wc-primary-deep)',
                                fontVariantNumeric: 'tabular-nums',
                            }}
                        >
                            {props.value}
                        </div>
                    }
                </Card.Body>
            </Card>
        </Link>
    </div>
);

//Khung xương cho hai bảng ở dưới, giữ đúng chiều cao để bố cục không nhảy
const RowsSkeleton = ({ rows = 4 }: { rows?: number }) => (
    <div className="p-3" aria-hidden="true">
        {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="d-flex gap-3 py-2">
                <div className="wc-skeleton flex-grow-1" style={{ height: 14 }} />
                <div className="wc-skeleton" style={{ height: 14, width: 80 }} />
            </div>
        ))}
    </div>
);

const ErpDashboard = () => {
    //gọi song song các danh sách cần cho trang tổng quan
    //limit nhỏ vì chỉ cần con số tổng ở meta, trừ hai bảng hiển thị chi tiết
    const fetcher = (url: string) => sendRequest<any>({ url, method: "GET" });

    const products = useSWR(`${API_URL}/products?page=1&limit=1&isActive=true`, fetcher);
    const partners = useSWR(`${API_URL}/partners?page=1&limit=1&isActive=true`, fetcher);
    const employees = useSWR(`${API_URL}/hr/employees?page=1&limit=1&isActive=true`, fetcher);
    const stocks = useSWR(`${API_URL}/warehouses/stocks?page=1&limit=100`, fetcher);
    const purchaseOrders = useSWR(`${API_URL}/purchase-orders?page=1&limit=5`, fetcher);
    const salesOrders = useSWR(`${API_URL}/sales-orders?page=1&limit=5`, fetcher);

    //nhân sự chỉ dành cho vai trò HR, người dùng khác nhận 403
    //nên lỗi ở riêng khối đó không được làm hỏng cả trang
    const blockingError =
        products.error || partners.error || stocks.error ||
        purchaseOrders.error || salesOrders.error;

    if (blockingError) {
        const expired = blockingError.message === 'Unauthorized';
        return (
            <Alert variant={expired ? 'warning' : 'danger'} role="alert">
                <h1 className="h6 mb-1">
                    {expired ? 'Phiên đăng nhập đã hết hạn' : 'Không tải được dữ liệu'}
                </h1>
                <p className="small mb-2">
                    {expired
                        ? 'Vui lòng đăng nhập lại để tiếp tục.'
                        : (blockingError.message ?? 'Vui lòng thử lại sau ít phút.')}
                </p>
                <Link href="/auth/login" className="btn btn-sm btn-primary">
                    {expired ? 'Đăng nhập lại' : 'Về trang đăng nhập'}
                </Link>
            </Alert>
        );
    }

    //tổng số mặt hàng đang còn tồn, tính từ trang đầu của danh sách tồn kho
    const stockItems: IStock[] = stocks.data?.items ?? [];
    const positiveStocks = stockItems.filter(s => Number(s.quantity) > 0);

    const statsLoading = products.isLoading || partners.isLoading || stocks.isLoading;

    return (
        <>
            <header className="mb-4">
                <h1 className="mb-1">Bảng điều khiển</h1>
                <p className="text-muted mb-0 wc-prose">
                    Tổng quan hoạt động mua bán và tồn kho. Bấm vào từng ô để xem chi tiết.
                </p>
            </header>

            {/* ---------- BỐN Ô SỐ LIỆU ---------- */}
            <section aria-labelledby="wc-stats-title" className="mb-4">
                <h2 id="wc-stats-title" className="wc-sr-only">Số liệu tổng quan</h2>
                <div className="row g-3">
                    {/* dải màu đi từ đậm tới nhạt trong cùng một hệ màu thương hiệu */}
                    <StatCard
                        label="Sản phẩm đang kinh doanh"
                        value={String(products.data?.meta?.total ?? 0)}
                        href="/erp/products"
                        accent="var(--wc-primary-deep)"
                        loading={statsLoading}
                    />
                    <StatCard
                        label="Đối tác đang giao dịch"
                        value={String(partners.data?.meta?.total ?? 0)}
                        href="/erp/partners"
                        accent="var(--wc-primary-dark)"
                        loading={statsLoading}
                    />
                    <StatCard
                        label="Mặt hàng còn tồn"
                        value={String(positiveStocks.length)}
                        href="/erp/stocks"
                        accent="var(--wc-primary)"
                        loading={statsLoading}
                    />
                    <StatCard
                        label="Nhân viên đang làm việc"
                        //403 khi không phải vai trò HR, khi đó hiện dấu gạch thay vì số
                        value={employees.error ? '—' : String(employees.data?.meta?.total ?? 0)}
                        href="/erp/employees"
                        accent="var(--wc-primary-light)"
                        loading={employees.isLoading && !employees.error}
                    />
                </div>
            </section>

            <div className="row g-3">
                {/* ---------- ĐƠN MUA GẦN ĐÂY ---------- */}
                <section className="col-12 col-xl-6" aria-labelledby="wc-po-title">
                    <Card className="h-100">
                        <Card.Header className="wc-card-header d-flex justify-content-between align-items-center py-3">
                            <h2 id="wc-po-title" className="h6 mb-0">Đơn mua gần đây</h2>
                            <Link href="/erp/purchase-orders" className="small">
                                Xem tất cả
                                <span className="wc-sr-only"> đơn mua hàng</span>
                            </Link>
                        </Card.Header>
                        <Card.Body className="p-0">
                            {purchaseOrders.isLoading
                                ? <RowsSkeleton />
                                : <Table hover className="wc-table-cards align-middle mb-0">
                                    <thead>
                                        <tr>
                                            <th scope="col">Số phiếu</th>
                                            <th scope="col">Nhà cung cấp</th>
                                            <th scope="col" className="text-end">Tổng tiền</th>
                                            <th scope="col">Trạng thái</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(purchaseOrders.data?.items ?? []).length === 0 &&
                                            <tr>
                                                <td colSpan={4} className="wc-empty" data-label="">
                                                    <p className="wc-empty-title">Chưa có đơn mua nào</p>
                                                    <Link href="/erp/purchase-orders" className="btn btn-sm btn-primary mt-2">
                                                        Tạo đơn mua
                                                    </Link>
                                                </td>
                                            </tr>
                                        }
                                        {(purchaseOrders.data?.items ?? []).map((order: IPurchaseOrder) => (
                                            <tr key={order.id}>
                                                <td data-label="Số phiếu" className="fw-medium">{order.code}</td>
                                                <td data-label="Nhà cung cấp">{order.supplier?.name}</td>
                                                <td data-label="Tổng tiền" className="wc-num">
                                                    {formatMoney(order.totalAmount)}
                                                </td>
                                                <td data-label="Trạng thái">
                                                    <Badge bg="" className={`wc-badge-${ORDER_STATUS_VARIANT[order.status]}`}>
                                                        {ORDER_STATUS_LABEL[order.status]}
                                                    </Badge>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            }
                        </Card.Body>
                    </Card>
                </section>

                {/* ---------- ĐƠN BÁN GẦN ĐÂY ---------- */}
                <section className="col-12 col-xl-6" aria-labelledby="wc-so-title">
                    <Card className="h-100">
                        <Card.Header className="wc-card-header d-flex justify-content-between align-items-center py-3">
                            <h2 id="wc-so-title" className="h6 mb-0">Đơn bán gần đây</h2>
                            <Link href="/erp/sales-orders" className="small">
                                Xem tất cả
                                <span className="wc-sr-only"> đơn bán hàng</span>
                            </Link>
                        </Card.Header>
                        <Card.Body className="p-0">
                            {salesOrders.isLoading
                                ? <RowsSkeleton />
                                : <Table hover className="wc-table-cards align-middle mb-0">
                                    <thead>
                                        <tr>
                                            <th scope="col">Số phiếu</th>
                                            <th scope="col">Khách hàng</th>
                                            <th scope="col" className="text-end">Tổng tiền</th>
                                            <th scope="col">Trạng thái</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(salesOrders.data?.items ?? []).length === 0 &&
                                            <tr>
                                                <td colSpan={4} className="wc-empty" data-label="">
                                                    <p className="wc-empty-title">Chưa có đơn bán nào</p>
                                                    <Link href="/erp/sales-orders" className="btn btn-sm btn-primary mt-2">
                                                        Tạo đơn bán
                                                    </Link>
                                                </td>
                                            </tr>
                                        }
                                        {(salesOrders.data?.items ?? []).map((order: ISalesOrder) => (
                                            <tr key={order.id}>
                                                <td data-label="Số phiếu" className="fw-medium">{order.code}</td>
                                                <td data-label="Khách hàng">{order.customer?.name}</td>
                                                <td data-label="Tổng tiền" className="wc-num">
                                                    {formatMoney(order.totalAmount)}
                                                </td>
                                                <td data-label="Trạng thái">
                                                    <Badge bg="" className={`wc-badge-${ORDER_STATUS_VARIANT[order.status]}`}>
                                                        {ORDER_STATUS_LABEL[order.status]}
                                                    </Badge>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            }
                        </Card.Body>
                    </Card>
                </section>

                {/* ---------- TỒN KHO ---------- */}
                <section className="col-12" aria-labelledby="wc-stock-title">
                    <Card>
                        <Card.Header className="wc-card-header d-flex justify-content-between align-items-center py-3">
                            <h2 id="wc-stock-title" className="h6 mb-0">Tồn kho hiện tại</h2>
                            <Link href="/erp/stocks" className="small">
                                Xem tất cả
                                <span className="wc-sr-only"> tồn kho</span>
                            </Link>
                        </Card.Header>
                        <Card.Body className="p-0">
                            {stocks.isLoading
                                ? <RowsSkeleton rows={5} />
                                : <Table hover className="wc-table-cards align-middle mb-0">
                                    <thead>
                                        <tr>
                                            <th scope="col">Mã hàng</th>
                                            <th scope="col">Tên hàng</th>
                                            <th scope="col">Kho</th>
                                            <th scope="col" className="text-end">Số lượng</th>
                                            <th scope="col">Cập nhật</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {positiveStocks.length === 0 &&
                                            <tr>
                                                <td colSpan={5} className="wc-empty" data-label="">
                                                    <p className="wc-empty-title">Chưa có hàng trong kho</p>
                                                    <p className="small mb-0">
                                                        Tồn kho xuất hiện sau khi bạn xác nhận một đơn mua hàng.
                                                    </p>
                                                </td>
                                            </tr>
                                        }
                                        {positiveStocks.slice(0, 8).map(stock => (
                                            <tr key={stock.id}>
                                                <td data-label="Mã hàng" className="fw-medium">{stock.product?.code}</td>
                                                <td data-label="Tên hàng">{stock.product?.name}</td>
                                                <td data-label="Kho">{stock.warehouse?.name}</td>
                                                <td data-label="Số lượng" className="wc-num fw-semibold">
                                                    {formatQuantity(stock.quantity)} {stock.product?.unit}
                                                </td>
                                                <td data-label="Cập nhật">{formatDate(stock.updatedAt)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            }
                        </Card.Body>
                    </Card>
                </section>
            </div>
        </>
    );
}

export default ErpDashboard;
