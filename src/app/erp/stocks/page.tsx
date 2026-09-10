'use client'
import { useState } from 'react';
import { Button, Form, Table } from 'react-bootstrap';
import { toast } from 'react-toastify';
import useSWR from 'swr';
import ErpFormModal, { IField } from '@/components/erp/erp.form.modal';
import ErpEmpty from '@/components/erp/erp.empty';
import ErpPage from '@/components/erp/erp.page';
import { API_URL, sendRequest } from '@/utils/api';
import { formatDate, formatQuantity } from '@/utils/erp';
import { useErpList } from '@/utils/use.erp.list';

const StocksPage = () => {
    const [warehouseId, setWarehouseId] = useState<string>("");
    const list = useErpList<IStock>("/warehouses/stocks", { warehouseId });

    const fetcher = (url: string) => sendRequest<any>({ url, method: "GET" });
    const warehouses = useSWR<IPaginated<IWarehouse>>(
        `${API_URL}/warehouses?page=1&limit=100&isActive=true`, fetcher);
    const products = useSWR<IPaginated<IProduct>>(
        `${API_URL}/products?page=1&limit=100&isActive=true`, fetcher);

    const [showModal, setShowModal] = useState<boolean>(false);
    const [values, setValues] = useState<Record<string, any>>({});

    //mở form kiểm kê, điền sẵn sản phẩm và kho của dòng được bấm
    const openAdjust = (stock?: IStock) => {
        setValues(stock
            ? {
                productId: stock.productId,
                warehouseId: stock.warehouseId,
                actualQuantity: stock.quantity,
            }
            : {}
        );
        setShowModal(true);
    }

    const handleSubmit = async () => {
        await sendRequest({
            url: `${API_URL}/warehouses/stocks/adjust`,
            method: "POST",
            body: {
                productId: Number(values.productId),
                warehouseId: Number(values.warehouseId),
                actualQuantity: Number(values.actualQuantity),
                note: values.note || undefined,
            },
        });
        toast.success("Điều chỉnh tồn kho thành công");
        list.mutate();
    }

    const fields: IField[] = [
        {
            name: "productId", label: "Sản phẩm", type: "select", required: true,
            options: (products.data?.items ?? []).map(p => ({
                value: p.id, label: `${p.code} - ${p.name}`,
            })),
        },
        {
            name: "warehouseId", label: "Kho", type: "select", required: true, half: true,
            options: (warehouses.data?.items ?? []).map(w => ({
                value: w.id, label: `${w.code} - ${w.name}`,
            })),
        },
        {
            name: "actualQuantity", label: "Số lượng đếm được", type: "number",
            required: true, half: true,
        },
        { name: "note", label: "Ghi chú", type: "textarea", placeholder: "VD: Kiểm kê cuối tháng 9" },
    ];

    return (
        <>
            <ErpPage
                title="Tồn kho"
                description="Số lượng hàng hiện có ở từng kho. Con số này chỉ thay đổi qua đơn mua, đơn bán và phiếu kiểm kê."
                actionLabel="Điều chỉnh kiểm kê"
                onAction={() => openAdjust()}
                filters={
                    <Form.Select
                        size="sm"
                        style={{ maxWidth: 220 }}
                        value={warehouseId}
                        onChange={(e) => { setWarehouseId(e.target.value); list.setPage(1); }}
                    >
                        <option value="">Tất cả kho</option>
                        {(warehouses.data?.items ?? []).map(w => (
                            <option key={w.id} value={w.id}>{w.name}</option>
                        ))}
                    </Form.Select>
                }
                isLoading={list.isLoading}
                error={list.error}
                total={list.meta?.total}
                page={list.page}
                totalPages={list.meta?.totalPages}
                onPageChange={list.setPage}
                skeletonColumns={7}
            >
                <Table hover className="wc-table-cards align-middle">
                    <thead>
                        <tr>
                            <th scope="col">Mã hàng</th>
                            <th scope="col">Tên hàng</th>
                            <th scope="col">Kho</th>
                            <th scope="col" className="wc-num">Số lượng</th>
                            <th scope="col">ĐVT</th>
                            <th scope="col">Cập nhật</th>
                            <th scope="col" style={{ width: 110 }}>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {list.items.length === 0 &&
                            <ErpEmpty
                                colSpan={7}
                                title="Chưa có hàng trong kho"
                                hint="Tồn kho xuất hiện sau khi bạn xác nhận một đơn mua hàng."
                            />
                        }
                        {list.items.map(stock => (
                            <tr key={stock.id}>
                                <td data-label="Mã hàng">{stock.product?.code}</td>
                                <td data-label="Tên hàng">{stock.product?.name}</td>
                                <td data-label="Kho">{stock.warehouse?.name}</td>
                                <td data-label="Số lượng" className={`text-end fw-semibold ${Number(stock.quantity) <= 0 ? "text-danger" : ""}`}>
                                    {formatQuantity(stock.quantity)}
                                </td>
                                <td data-label="ĐVT">{stock.product?.unit}</td>
                                <td data-label="Cập nhật">{formatDate(stock.updatedAt)}</td>
                                <td data-label="">
                                    <Button variant="outline-primary" size="sm"
                                        onClick={() => openAdjust(stock)}
                                    >Kiểm kê</Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            </ErpPage>

            <ErpFormModal
                show={showModal}
                onHide={() => setShowModal(false)}
                title="Điều chỉnh tồn kho sau kiểm kê"
                fields={fields}
                values={values}
                onChange={setValues}
                onSubmit={handleSubmit}
                submitLabel="Điều chỉnh"
                extra={
                    <div className="alert alert-info small mt-3 mb-0">
                        Nhập số lượng thực tế đếm được. Hệ thống tự tính phần chênh lệch
                        và ghi một dòng vào sổ nhập xuất.
                    </div>
                }
            />
        </>
    );
}

export default StocksPage;
