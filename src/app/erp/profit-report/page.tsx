'use client'
import { useState } from 'react';
import { Form, Table } from 'react-bootstrap';
import useSWR from 'swr';
import ErpEmpty from '@/components/erp/erp.empty';
import ErpPage from '@/components/erp/erp.page';
import { API_URL, sendRequest } from '@/utils/api';
import { formatDate, formatMoney, formatQuantity } from '@/utils/erp';

//Mặc định lấy 30 ngày gần nhất: khoảng vừa đủ để thấy xu hướng mà không
//phải chờ lâu, và người dùng vẫn đổi được ngày ngay trên màn hình.
const today = new Date();
const monthAgo = new Date();
monthAgo.setDate(monthAgo.getDate() - 30);
const toInput = (d: Date) => d.toISOString().slice(0, 10);

//Lãi thì xanh, lỗ thì đỏ. Dùng chung cho cả số tiền lẫn tỷ suất.
const profitClass = (value: number) =>
    value < 0 ? 'text-danger' : 'text-success';

const ProfitReportPage = () => {
    const [fromDate, setFromDate] = useState<string>(toInput(monthAgo));
    const [toDate, setToDate] = useState<string>(toInput(today));
    const [warehouseId, setWarehouseId] = useState<string>("");
    //hai cách nhìn cùng một số liệu: theo mặt hàng, hoặc theo từng đơn
    const [view, setView] = useState<"product" | "order">("product");

    const fetcher = (url: string) => sendRequest<any>({ url, method: "GET" });

    const params = new URLSearchParams();
    if (fromDate) params.set("fromDate", fromDate);
    if (toDate) params.set("toDate", toDate);
    if (warehouseId) params.set("warehouseId", warehouseId);

    const { data, error, isLoading } = useSWR<IProfitReport>(
        `${API_URL}/reports/profit?${params.toString()}`, fetcher);

    const warehouses = useSWR<IPaginated<IWarehouse>>(
        `${API_URL}/warehouses?page=1&limit=100&isActive=true`, fetcher);

    const summary = data?.summary;
    const profit = Number(summary?.profit ?? 0);

    const filters = (
        <>
            <Form.Group>
                <Form.Label className="small text-muted mb-1">Từ ngày</Form.Label>
                <Form.Control
                    type="date"
                    value={fromDate}
                    onChange={e => setFromDate(e.target.value)}
                />
            </Form.Group>
            <Form.Group>
                <Form.Label className="small text-muted mb-1">Đến ngày</Form.Label>
                <Form.Control
                    type="date"
                    value={toDate}
                    onChange={e => setToDate(e.target.value)}
                />
            </Form.Group>
            <Form.Group>
                <Form.Label className="small text-muted mb-1">Kho</Form.Label>
                <Form.Select
                    value={warehouseId}
                    onChange={e => setWarehouseId(e.target.value)}
                >
                    <option value="">Tất cả kho</option>
                    {(warehouses.data?.items ?? []).map(w => (
                        <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                </Form.Select>
            </Form.Group>
            <Form.Group>
                <Form.Label className="small text-muted mb-1">Xem theo</Form.Label>
                <Form.Select
                    value={view}
                    onChange={e => setView(e.target.value as "product" | "order")}
                >
                    <option value="product">Mặt hàng</option>
                    <option value="order">Đơn bán</option>
                </Form.Select>
            </Form.Group>
        </>
    );

    return (
        <ErpPage
            title="Báo cáo lãi lỗ"
            description="Doanh thu, giá vốn và lãi gộp của các đơn bán đã xác nhận. Giá vốn tính theo bình quân gia quyền tại thời điểm xuất kho."
            filters={filters}
            isLoading={isLoading}
            error={error}
            skeletonColumns={6}
        >
            {summary &&
                <div className="row g-3 mb-4">
                    <div className="col-6 col-lg-3">
                        <div className="border rounded p-3 h-100">
                            <div className="small text-muted">Doanh thu</div>
                            <div className="fs-5 fw-bold">{formatMoney(summary.revenue)}</div>
                        </div>
                    </div>
                    <div className="col-6 col-lg-3">
                        <div className="border rounded p-3 h-100">
                            <div className="small text-muted">Giá vốn hàng bán</div>
                            <div className="fs-5 fw-bold">{formatMoney(summary.cost)}</div>
                        </div>
                    </div>
                    <div className="col-6 col-lg-3">
                        <div className="border rounded p-3 h-100">
                            <div className="small text-muted">Lãi gộp</div>
                            <div className={`fs-5 fw-bold ${profitClass(profit)}`}>
                                {formatMoney(summary.profit)}
                            </div>
                        </div>
                    </div>
                    <div className="col-6 col-lg-3">
                        <div className="border rounded p-3 h-100">
                            <div className="small text-muted">Tỷ suất lãi gộp</div>
                            <div className={`fs-5 fw-bold ${profitClass(profit)}`}>
                                {summary.marginPercent}%
                            </div>
                            <div className="small text-muted">
                                {summary.orderCount} đơn đã xác nhận
                            </div>
                        </div>
                    </div>
                </div>
            }

            {view === "product" &&
                <Table hover responsive className="align-middle">
                    <thead>
                        <tr>
                            <th scope="col">Mã hàng</th>
                            <th scope="col">Tên hàng</th>
                            <th scope="col" className="wc-num">SL bán</th>
                            <th scope="col" className="wc-num">Doanh thu</th>
                            <th scope="col" className="wc-num">Giá vốn</th>
                            <th scope="col" className="wc-num">Lãi gộp</th>
                            <th scope="col" className="wc-num">Tỷ suất</th>
                        </tr>
                    </thead>
                    <tbody>
                        {(data?.products ?? []).length === 0 &&
                            <ErpEmpty
                                colSpan={7}
                                title="Chưa có số liệu trong khoảng thời gian này"
                                hint="Báo cáo chỉ tính đơn bán đã xác nhận. Thử nới rộng khoảng ngày hoặc bỏ lọc kho."
                            />
                        }
                        {(data?.products ?? []).map(p => (
                            <tr key={p.productId}>
                                <td data-label="Mã hàng"><code>{p.code}</code></td>
                                <td data-label="Tên hàng">{p.name}</td>
                                <td data-label="SL bán" className="wc-num">
                                    {formatQuantity(p.quantity)} {p.unit}
                                </td>
                                <td data-label="Doanh thu" className="wc-num">{formatMoney(p.revenue)}</td>
                                <td data-label="Giá vốn" className="wc-num">{formatMoney(p.cost)}</td>
                                <td data-label="Lãi gộp" className={`wc-num fw-semibold ${profitClass(Number(p.profit))}`}>
                                    {formatMoney(p.profit)}
                                </td>
                                <td data-label="Tỷ suất" className={`wc-num ${profitClass(Number(p.profit))}`}>
                                    {p.marginPercent}%
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            }

            {view === "order" &&
                <Table hover responsive className="align-middle">
                    <thead>
                        <tr>
                            <th scope="col">Số phiếu</th>
                            <th scope="col">Ngày</th>
                            <th scope="col">Khách hàng</th>
                            <th scope="col" className="wc-num">Doanh thu</th>
                            <th scope="col" className="wc-num">Giá vốn</th>
                            <th scope="col" className="wc-num">Lãi gộp</th>
                            <th scope="col" className="wc-num">Tỷ suất</th>
                        </tr>
                    </thead>
                    <tbody>
                        {(data?.orders ?? []).length === 0 &&
                            <ErpEmpty
                                colSpan={7}
                                title="Chưa có số liệu trong khoảng thời gian này"
                                hint="Báo cáo chỉ tính đơn bán đã xác nhận. Thử nới rộng khoảng ngày hoặc bỏ lọc kho."
                            />
                        }
                        {(data?.orders ?? []).map(o => (
                            <tr key={o.id}>
                                <td data-label="Số phiếu"><code>{o.code}</code></td>
                                <td data-label="Ngày">{formatDate(o.orderDate)}</td>
                                <td data-label="Khách hàng">{o.customer?.name}</td>
                                <td data-label="Doanh thu" className="wc-num">{formatMoney(o.revenue)}</td>
                                <td data-label="Giá vốn" className="wc-num">{formatMoney(o.cost)}</td>
                                <td data-label="Lãi gộp" className={`wc-num fw-semibold ${profitClass(Number(o.profit))}`}>
                                    {formatMoney(o.profit)}
                                </td>
                                <td data-label="Tỷ suất" className={`wc-num ${profitClass(Number(o.profit))}`}>
                                    {o.marginPercent}%
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            }
        </ErpPage>
    );
}

export default ProfitReportPage;
