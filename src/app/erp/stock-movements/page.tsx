'use client'
import { useState } from 'react';
import { Badge, Form, Table } from 'react-bootstrap';
import useSWR from 'swr';
import ErpEmpty from '@/components/erp/erp.empty';
import ErpPage from '@/components/erp/erp.page';
import { API_URL, sendRequest } from '@/utils/api';
import {
    formatDate, formatQuantity,
    MOVEMENT_TYPE_LABEL, MOVEMENT_TYPE_VARIANT,
} from '@/utils/erp';
import { useErpList } from '@/utils/use.erp.list';

//Nhãn tiếng Việt cho chứng từ gốc đã sinh ra dòng nhập xuất
const REF_LABEL: Record<string, string> = {
    PURCHASE_ORDER: "Đơn mua",
    SALES_ORDER: "Đơn bán",
    PURCHASE_ORDER_CANCEL: "Huỷ đơn mua",
    SALES_ORDER_CANCEL: "Huỷ đơn bán",
    ADJUSTMENT: "Kiểm kê",
};

const StockMovementsPage = () => {
    const [warehouseId, setWarehouseId] = useState<string>("");
    const [productId, setProductId] = useState<string>("");

    const list = useErpList<IStockMovement>(
        "/warehouses/stock-movements", { warehouseId, productId }, 20);

    const fetcher = (url: string) => sendRequest<any>({ url, method: "GET" });
    const warehouses = useSWR<IPaginated<IWarehouse>>(
        `${API_URL}/warehouses?page=1&limit=100`, fetcher);
    const products = useSWR<IPaginated<IProduct>>(
        `${API_URL}/products?page=1&limit=100`, fetcher);

    return (
        <ErpPage
            title="Sổ nhập xuất kho"
                description="Nhật ký mọi lần nhập, xuất và điều chỉnh kho. Sổ này không bao giờ bị xoá, dùng để truy vết khi số liệu bất thường."
            filters={
                <>
                    <Form.Select
                        size="sm"
                        style={{ maxWidth: 200 }}
                        value={warehouseId}
                        onChange={(e) => { setWarehouseId(e.target.value); list.setPage(1); }}
                    >
                        <option value="">Tất cả kho</option>
                        {(warehouses.data?.items ?? []).map(w => (
                            <option key={w.id} value={w.id}>{w.name}</option>
                        ))}
                    </Form.Select>
                    <Form.Select
                        size="sm"
                        style={{ maxWidth: 260 }}
                        value={productId}
                        onChange={(e) => { setProductId(e.target.value); list.setPage(1); }}
                    >
                        <option value="">Tất cả sản phẩm</option>
                        {(products.data?.items ?? []).map(p => (
                            <option key={p.id} value={p.id}>{p.code} - {p.name}</option>
                        ))}
                    </Form.Select>
                </>
            }
            isLoading={list.isLoading}
            error={list.error}
            total={list.meta?.total}
            page={list.page}
            totalPages={list.meta?.totalPages}
            onPageChange={list.setPage}
                skeletonColumns={8}
        >
            <Table hover className="wc-table-cards align-middle">
                <thead>
                    <tr>
                        <th scope="col">Ngày</th>
                        <th scope="col">Loại</th>
                        <th scope="col">Mã hàng</th>
                        <th scope="col">Tên hàng</th>
                        <th scope="col">Kho</th>
                        <th scope="col" className="wc-num">Số lượng</th>
                        <th scope="col">Chứng từ gốc</th>
                        <th scope="col">Ghi chú</th>
                    </tr>
                </thead>
                <tbody>
                    {list.items.length === 0 &&
                        <ErpEmpty
                                colSpan={8}
                                title="Chưa có biến động kho nào"
                                hint="Mỗi lần xác nhận đơn mua hoặc đơn bán sẽ tạo một dòng ở đây."
                            />
                    }
                    {list.items.map(move => (
                        <tr key={move.id}>
                            <td data-label="Ngày">{formatDate(move.createdAt)}</td>
                            <td data-label="Loại">
                                <Badge bg="" className={`wc-badge-${MOVEMENT_TYPE_VARIANT[move.type]}`}>
                                    {MOVEMENT_TYPE_LABEL[move.type]}
                                </Badge>
                            </td>
                            <td data-label="Mã hàng">{move.product?.code}</td>
                            <td data-label="Tên hàng">{move.product?.name}</td>
                            <td data-label="Kho">{move.warehouse?.name}</td>
                            <td data-label="Số lượng" className="wc-num fw-semibold">
                                {/* dấu cho biết hướng, số lượng trong database luôn dương */}
                                {move.type === "OUT" ? "-" : "+"}
                                {formatQuantity(move.quantity)}
                            </td>
                            <td data-label="Chứng từ gốc" className="small">
                                {move.refType
                                    ? `${REF_LABEL[move.refType] ?? move.refType}${move.refId ? ` #${move.refId}` : ""}`
                                    : "—"}
                            </td>
                            <td data-label="Ghi chú" className="small text-muted">{move.note ?? "—"}</td>
                        </tr>
                    ))}
                </tbody>
            </Table>
        </ErpPage>
    );
}

export default StockMovementsPage;
