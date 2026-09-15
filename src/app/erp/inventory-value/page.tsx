'use client'
import { useState } from 'react';
import { Form, Table } from 'react-bootstrap';
import useSWR from 'swr';
import ErpEmpty from '@/components/erp/erp.empty';
import ErpPage from '@/components/erp/erp.page';
import { API_URL, sendRequest } from '@/utils/api';
import { formatMoney, formatQuantity } from '@/utils/erp';

const InventoryValuePage = () => {
    const [warehouseId, setWarehouseId] = useState<string>("");
    const [search, setSearch] = useState<string>("");
    //mặc định ẩn hàng đã bán hết, bật lên khi cần đối chiếu đủ danh mục
    const [includeZero, setIncludeZero] = useState<boolean>(false);

    const fetcher = (url: string) => sendRequest<any>({ url, method: "GET" });

    const params = new URLSearchParams();
    if (warehouseId) params.set("warehouseId", warehouseId);
    if (search) params.set("search", search);
    if (includeZero) params.set("includeZero", "true");

    const { data, error, isLoading } = useSWR<IInventoryValueReport>(
        `${API_URL}/reports/inventory-value?${params.toString()}`, fetcher);

    const warehouses = useSWR<IPaginated<IWarehouse>>(
        `${API_URL}/warehouses?page=1&limit=100&isActive=true`, fetcher);

    const summary = data?.summary;

    const filters = (
        <>
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
            <Form.Group className="d-flex align-items-end">
                <Form.Check
                    type="checkbox"
                    id="wc-include-zero"
                    label="Hiện cả hàng đã hết"
                    checked={includeZero}
                    onChange={e => setIncludeZero(e.target.checked)}
                />
            </Form.Group>
        </>
    );

    return (
        <ErpPage
            title="Giá trị tồn kho"
            description="Số lượng và giá trị bằng tiền của hàng đang nằm trong kho. Đơn giá tính theo bình quân gia quyền, cập nhật sau mỗi lần nhập hàng."
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
                            <div className="small text-muted">Tổng giá trị tồn</div>
                            <div className="fs-5 fw-bold">{formatMoney(summary.totalValue)}</div>
                        </div>
                    </div>
                    <div className="col-6 col-lg-4">
                        <div className="border rounded p-3 h-100">
                            <div className="small text-muted">Số dòng tồn</div>
                            <div className="fs-5 fw-bold">{summary.lineCount}</div>
                            <div className="small text-muted">mỗi dòng là một mặt hàng tại một kho</div>
                        </div>
                    </div>
                    <div className="col-6 col-lg-4">
                        <div className="border rounded p-3 h-100">
                            <div className="small text-muted">Dòng tồn âm</div>
                            {/* Tồn âm là sai sót cần xử lý ngay, không phải chuyện bình thường,
                                nên tô đỏ để không bị nhìn lướt qua */}
                            <div className={`fs-5 fw-bold ${summary.negativeCount > 0 ? 'text-danger' : ''}`}>
                                {summary.negativeCount}
                            </div>
                            {summary.negativeCount > 0 &&
                                <div className="small text-danger">cần kiểm kê lại</div>
                            }
                        </div>
                    </div>
                </div>
            }

            {/* Giá trị tồn gom theo kho, để biết kho nào đang giữ nhiều vốn nhất */}
            {(data?.byWarehouse ?? []).length > 1 &&
                <div className="mb-4">
                    <div className="small text-muted mb-2">Giá trị tồn theo kho</div>
                    <div className="row g-2">
                        {(data?.byWarehouse ?? []).map(w => (
                            <div key={w.warehouseId} className="col-12 col-md-4">
                                <div className="border rounded px-3 py-2 d-flex justify-content-between">
                                    <span className="text-truncate me-2">{w.warehouseName}</span>
                                    <span className="fw-semibold">{formatMoney(w.value)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            }

            <Table hover responsive className="align-middle">
                <thead>
                    <tr>
                        <th scope="col">Mã hàng</th>
                        <th scope="col">Tên hàng</th>
                        <th scope="col">Kho</th>
                        <th scope="col" className="wc-num">Tồn</th>
                        <th scope="col" className="wc-num">Đơn giá vốn</th>
                        <th scope="col" className="wc-num">Giá trị</th>
                    </tr>
                </thead>
                <tbody>
                    {(data?.items ?? []).length === 0 &&
                        <ErpEmpty
                            colSpan={6}
                            filtered={!!search || !!warehouseId}
                            onClearFilter={() => { setSearch(""); setWarehouseId(""); }}
                            title="Chưa có hàng nào trong kho"
                            hint="Xác nhận một đơn mua để hàng được ghi vào kho."
                        />
                    }
                    {(data?.items ?? []).map(i => (
                        <tr key={`${i.productId}-${i.warehouseId}`}>
                            <td data-label="Mã hàng"><code>{i.code}</code></td>
                            <td data-label="Tên hàng">{i.name}</td>
                            <td data-label="Kho">{i.warehouseName}</td>
                            <td data-label="Tồn" className={`wc-num ${Number(i.quantity) < 0 ? 'text-danger fw-semibold' : ''}`}>
                                {formatQuantity(i.quantity)} {i.unit}
                            </td>
                            <td data-label="Đơn giá vốn" className="wc-num">{formatMoney(i.avgCost)}</td>
                            <td data-label="Giá trị" className="wc-num fw-semibold">{formatMoney(i.value)}</td>
                        </tr>
                    ))}
                </tbody>
            </Table>
        </ErpPage>
    );
}

export default InventoryValuePage;
