'use client'
import { useState } from 'react';
import { Form, Table } from 'react-bootstrap';
import useSWR from 'swr';
import ErpEmpty from '@/components/erp/erp.empty';
import ErpPage from '@/components/erp/erp.page';
import { API_URL, sendRequest } from '@/utils/api';
import { formatMoney, formatQuantity } from '@/utils/erp';

//"2026-09" hiện thành "Tháng 09/2026" cho dễ đọc
const nhanThang = (m: string) => {
    const [y, mm] = m.split("-");
    return `Tháng ${mm}/${y}`;
}

const CogsMonthlyPage = () => {
    //Rỗng nghĩa là xem mọi tháng, mỗi sản phẩm một dòng cho từng tháng
    const [month, setMonth] = useState<string>("");
    const [productId, setProductId] = useState<string>("");
    const [warehouseId, setWarehouseId] = useState<string>("");
    const [search, setSearch] = useState<string>("");

    const fetcher = (url: string) => sendRequest<any>({ url, method: "GET" });

    const params = new URLSearchParams();
    if (month) params.set("month", month);
    if (productId) params.set("productId", productId);
    //chọn sản phẩm cụ thể rồi thì từ khoá không còn tác dụng, back-end cũng bỏ qua
    else if (search) params.set("search", search);
    if (warehouseId) params.set("warehouseId", warehouseId);

    const { data, error, isLoading } = useSWR<ICogsMonthlyReport>(
        `${API_URL}/reports/cogs-monthly?${params.toString()}`, fetcher);

    const products = useSWR<IPaginated<IProduct>>(
        `${API_URL}/products?page=1&limit=200&isActive=true`, fetcher);
    const warehouses = useSWR<IPaginated<IWarehouse>>(
        `${API_URL}/warehouses?page=1&limit=100&isActive=true`, fetcher);

    const summary = data?.summary;

    //Danh sách tháng do back-end trả về, chỉ gồm tháng thật sự có đơn
    const dsThang = [...(data?.months ?? [])];
    if (month && !dsThang.includes(month)) dsThang.unshift(month);

    const filters = (
        <>
            <Form.Group>
                <Form.Label className="small text-muted mb-1">Tháng</Form.Label>
                <Form.Select value={month} onChange={e => setMonth(e.target.value)}>
                    <option value="">Tất cả các tháng</option>
                    {dsThang.map(m => (
                        <option key={m} value={m}>{nhanThang(m)}</option>
                    ))}
                </Form.Select>
            </Form.Group>
            <Form.Group>
                <Form.Label className="small text-muted mb-1">Sản phẩm</Form.Label>
                <Form.Select
                    value={productId}
                    onChange={e => setProductId(e.target.value)}
                >
                    <option value="">Tất cả sản phẩm</option>
                    {(products.data?.items ?? []).map(p => (
                        <option key={p.id} value={p.id}>{p.code} - {p.name}</option>
                    ))}
                </Form.Select>
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
        </>
    );

    const coLoc = !!month || !!productId || !!warehouseId || !!search;
    const xoaLoc = () => {
        setMonth(""); setProductId(""); setWarehouseId(""); setSearch("");
    };

    return (
        <ErpPage
            title="Giá vốn theo tháng"
            description="Giá vốn hàng bán của từng sản phẩm trong từng tháng, lấy từ các đơn bán đã xác nhận. Giá vốn được chốt tại thời điểm xuất kho nên số liệu tháng cũ không thay đổi."
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Tìm theo mã hoặc tên hàng"
            filters={filters}
            isLoading={isLoading}
            error={error}
            skeletonColumns={6}
        >
            {summary &&
                <div className="row g-3 mb-4">
                    <div className="col-6 col-lg-4">
                        <div className="border rounded p-3 h-100">
                            <div className="small text-muted">Tổng giá vốn</div>
                            <div className="fs-5 fw-bold">{formatMoney(summary.cost)}</div>
                            <div className="small text-muted">
                                {month ? nhanThang(month) : "Tất cả các tháng"}
                            </div>
                        </div>
                    </div>
                    <div className="col-6 col-lg-4">
                        <div className="border rounded p-3 h-100">
                            <div className="small text-muted">Số lượng đã bán</div>
                            <div className="fs-5 fw-bold">{formatQuantity(summary.quantity)}</div>
                        </div>
                    </div>
                    <div className="col-6 col-lg-4">
                        <div className="border rounded p-3 h-100">
                            <div className="small text-muted">Số dòng</div>
                            <div className="fs-5 fw-bold">{summary.rowCount}</div>
                            <div className="small text-muted">mỗi dòng là một mặt hàng trong một tháng</div>
                        </div>
                    </div>
                </div>
            }

            {/* Tổng giá vốn từng tháng, chỉ hiện khi đang xem nhiều tháng */}
            {(data?.byMonth ?? []).length > 1 &&
                <div className="mb-4">
                    <div className="small text-muted mb-2">Giá vốn theo tháng</div>
                    <div className="row g-2">
                        {(data?.byMonth ?? []).map(m => (
                            <div key={m.month} className="col-12 col-md-4">
                                <div className="border rounded px-3 py-2 d-flex justify-content-between">
                                    <span>{nhanThang(m.month)}</span>
                                    <span className="fw-semibold">{formatMoney(m.cost)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            }

            <Table hover responsive className="align-middle">
                <thead>
                    <tr>
                        <th scope="col">Tháng</th>
                        <th scope="col">Mã hàng</th>
                        <th scope="col">Tên hàng</th>
                        <th scope="col" className="wc-num">SL bán</th>
                        <th scope="col" className="wc-num">Đơn giá vốn</th>
                        <th scope="col" className="wc-num">Giá vốn</th>
                    </tr>
                </thead>
                <tbody>
                    {(data?.rows ?? []).length === 0 &&
                        <ErpEmpty
                            colSpan={6}
                            filtered={coLoc}
                            onClearFilter={xoaLoc}
                            title="Chưa có đơn bán nào được xác nhận"
                            hint="Báo cáo chỉ tính đơn bán đã xác nhận, khi hàng thật sự rời kho."
                        />
                    }
                    {(data?.rows ?? []).map(r => (
                        <tr key={`${r.month}-${r.productId}`}>
                            <td data-label="Tháng">{nhanThang(r.month)}</td>
                            <td data-label="Mã hàng"><code>{r.code}</code></td>
                            <td data-label="Tên hàng">{r.name}</td>
                            <td data-label="SL bán" className="wc-num">
                                {formatQuantity(r.quantity)} {r.unit}
                            </td>
                            <td data-label="Đơn giá vốn" className="wc-num">{formatMoney(r.unitCost)}</td>
                            <td data-label="Giá vốn" className="wc-num fw-semibold">{formatMoney(r.cost)}</td>
                        </tr>
                    ))}
                </tbody>
            </Table>
        </ErpPage>
    );
}

export default CogsMonthlyPage;
