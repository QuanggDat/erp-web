'use client'
import { useState } from 'react';
import { Form, Table } from 'react-bootstrap';
import useSWR from 'swr';
import ErpEmpty from '@/components/erp/erp.empty';
import ErpPage from '@/components/erp/erp.page';
import { API_URL, sendRequest } from '@/utils/api';
import { formatMoney, formatQuantity } from '@/utils/erp';

//Tháng hiện tại, dạng YYYY-MM để khớp tham số month của back-end
const thangHienTai = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

//"2026-09" hiện thành "Tháng 09/2026" cho dễ đọc
const nhanThang = (m: string) => {
    const [y, mm] = m.split("-");
    return `Tháng ${mm}/${y}`;
}

const CogsReportPage = () => {
    //Rỗng nghĩa là xem toàn bộ, không giới hạn tháng nào
    const [month, setMonth] = useState<string>(thangHienTai());
    const [warehouseId, setWarehouseId] = useState<string>("");

    const fetcher = (url: string) => sendRequest<any>({ url, method: "GET" });

    const params = new URLSearchParams();
    if (month) params.set("month", month);
    if (warehouseId) params.set("warehouseId", warehouseId);

    const { data, error, isLoading } = useSWR<ICogsReport>(
        `${API_URL}/reports/cogs?${params.toString()}`, fetcher);

    const warehouses = useSWR<IPaginated<IWarehouse>>(
        `${API_URL}/warehouses?page=1&limit=100&isActive=true`, fetcher);

    const summary = data?.summary;

    //Danh sách tháng do back-end trả về, chỉ gồm tháng thật sự có đơn.
    //Thêm tháng đang chọn vào nếu chưa có, để ô select không nhảy về rỗng
    //khi người dùng chọn tháng không phát sinh đơn nào.
    const dsThang = [...(data?.months ?? [])];
    if (month && !dsThang.includes(month)) dsThang.unshift(month);

    const filters = (
        <>
            <Form.Group>
                <Form.Label className="small text-muted mb-1">Tháng</Form.Label>
                <Form.Select
                    value={month}
                    onChange={e => setMonth(e.target.value)}
                >
                    <option value="">Tất cả các tháng</option>
                    {dsThang.map(m => (
                        <option key={m} value={m}>{nhanThang(m)}</option>
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

    return (
        <ErpPage
            title="Báo cáo giá vốn"
            description="Giá vốn hàng bán theo từng sản phẩm, lấy từ các đơn bán đã xác nhận. Giá vốn tính theo bình quân gia quyền tại thời điểm xuất kho."
            filters={filters}
            isLoading={isLoading}
            error={error}
            skeletonColumns={5}
        >
            {summary &&
                <div className="row g-3 mb-4">
                    <div className="col-6 col-lg-4">
                        <div className="border rounded p-3 h-100">
                            <div className="small text-muted">Tổng giá vốn</div>
                            <div className="fs-5 fw-bold">{formatMoney(summary.cost)}</div>
                            <div className="small text-muted">
                                {month ? nhanThang(month) : "Toàn bộ"}
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
                            <div className="small text-muted">Số mặt hàng</div>
                            <div className="fs-5 fw-bold">{summary.productCount}</div>
                        </div>
                    </div>
                </div>
            }

            <Table hover responsive className="align-middle">
                <thead>
                    <tr>
                        <th scope="col">Mã hàng</th>
                        <th scope="col">Tên hàng</th>
                        <th scope="col" className="wc-num">SL bán</th>
                        <th scope="col" className="wc-num">Đơn giá vốn</th>
                        <th scope="col" className="wc-num">Giá vốn</th>
                    </tr>
                </thead>
                <tbody>
                    {(data?.products ?? []).length === 0 &&
                        <ErpEmpty
                            colSpan={5}
                            title={month
                                ? `Không có đơn bán nào trong ${nhanThang(month).toLowerCase()}`
                                : "Chưa có đơn bán nào được xác nhận"}
                            hint="Báo cáo chỉ tính đơn bán đã xác nhận. Thử chọn tháng khác hoặc bỏ lọc kho."
                        />
                    }
                    {(data?.products ?? []).map(p => (
                        <tr key={p.productId}>
                            <td data-label="Mã hàng"><code>{p.code}</code></td>
                            <td data-label="Tên hàng">{p.name}</td>
                            <td data-label="SL bán" className="wc-num">
                                {formatQuantity(p.quantity)} {p.unit}
                            </td>
                            <td data-label="Đơn giá vốn" className="wc-num">{formatMoney(p.unitCost)}</td>
                            <td data-label="Giá vốn" className="wc-num fw-semibold">{formatMoney(p.cost)}</td>
                        </tr>
                    ))}
                </tbody>
            </Table>
        </ErpPage>
    );
}

export default CogsReportPage;
