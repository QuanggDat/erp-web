'use client'
import { useState } from 'react';
import { Badge, Button, Form, Modal, Table } from 'react-bootstrap';
import { toast } from 'react-toastify';
import useSWR from 'swr';
import ErpFormModal, { IField } from '@/components/erp/erp.form.modal';
import ErpEmpty from '@/components/erp/erp.empty';
import ErpPage from '@/components/erp/erp.page';
import OrderItemsEditor, { IEditorLine } from '@/components/erp/order.items.editor';
import { API_URL, sendRequest } from '@/utils/api';
import {
    formatDate, formatMoney, formatQuantity, suggestCode, toDateInput,
    ORDER_STATUS_LABEL, ORDER_STATUS_VARIANT,
} from '@/utils/erp';
import { useErpList } from '@/utils/use.erp.list';

const PurchaseOrdersPage = () => {
    const [search, setSearch] = useState<string>("");
    const [status, setStatus] = useState<string>("");

    const list = useErpList<IPurchaseOrder>("/purchase-orders", { search, status });

    const fetcher = (url: string) => sendRequest<any>({ url, method: "GET" });
    //lọc SUPPLIER ở back-end đã bao gồm cả đối tác loại BOTH
    const suppliers = useSWR<IPaginated<IPartner>>(
        `${API_URL}/partners?page=1&limit=100&type=SUPPLIER&isActive=true`, fetcher);
    const warehouses = useSWR<IPaginated<IWarehouse>>(
        `${API_URL}/warehouses?page=1&limit=100&isActive=true`, fetcher);
    const products = useSWR<IPaginated<IProduct>>(
        `${API_URL}/products?page=1&limit=100&isActive=true`, fetcher);

    const [showModal, setShowModal] = useState<boolean>(false);
    const [editing, setEditing] = useState<IPurchaseOrder | null>(null);
    const [values, setValues] = useState<Record<string, any>>({});
    const [lines, setLines] = useState<IEditorLine[]>([]);

    //modal xem chi tiết, chỉ đọc
    const [detail, setDetail] = useState<IPurchaseOrder | null>(null);

    const openCreate = () => {
        setEditing(null);
        setValues({
            code: suggestCode("PO"),
            orderDate: toDateInput(new Date().toISOString()),
        });
        setLines([]);
        setShowModal(true);
    }

    //chỉ đơn nháp mới sửa được, back-end cũng chặn tương tự
    const openEdit = async (order: IPurchaseOrder) => {
        //danh sách không kèm items nên phải gọi chi tiết để lấy các dòng hàng
        const full = await sendRequest<IPurchaseOrder>({
            url: `${API_URL}/purchase-orders/${order.id}`,
            method: "GET",
        });
        setEditing(full);
        setValues({
            code: full.code,
            supplierId: full.supplierId,
            warehouseId: full.warehouseId,
            orderDate: toDateInput(full.orderDate),
            note: full.note ?? "",
        });
        setLines((full.items ?? []).map(item => ({
            productId: String(item.productId),
            quantity: String(Number(item.quantity)),
            unitPrice: String(Number(item.unitPrice)),
        })));
        setShowModal(true);
    }

    const openDetail = async (order: IPurchaseOrder) => {
        try {
            const full = await sendRequest<IPurchaseOrder>({
                url: `${API_URL}/purchase-orders/${order.id}`,
                method: "GET",
            });
            setDetail(full);
        } catch (error: any) {
            toast.error(error.message);
        }
    }

    const handleSubmit = async () => {
        const items = lines
            .filter(line => line.productId)
            .map(line => ({
                productId: Number(line.productId),
                quantity: Number(line.quantity || 0),
                unitPrice: Number(line.unitPrice || 0),
            }));

        if (items.length === 0) {
            throw new Error("Đơn mua phải có ít nhất một dòng hàng");
        }

        const body: Record<string, any> = {
            supplierId: Number(values.supplierId),
            warehouseId: Number(values.warehouseId),
            orderDate: values.orderDate ? new Date(values.orderDate).toISOString() : undefined,
            note: values.note || undefined,
            items,
        };

        if (editing) {
            await sendRequest({
                url: `${API_URL}/purchase-orders/${editing.id}`,
                method: "PATCH",
                body,
            });
            toast.success("Cập nhật đơn mua thành công");
        } else {
            await sendRequest({
                url: `${API_URL}/purchase-orders`,
                method: "POST",
                body: { ...body, code: values.code },
            });
            toast.success("Tạo đơn mua thành công");
        }
        list.mutate();
    }

    //xác nhận là lúc hàng thực sự vào kho, không hoàn tác được bằng cách sửa
    const handleConfirm = async (order: IPurchaseOrder) => {
        if (!confirm(`Xác nhận đơn mua ${order.code} ? Hàng sẽ được nhập vào kho.`)) return;
        try {
            await sendRequest({
                url: `${API_URL}/purchase-orders/${order.id}/confirm`,
                method: "PATCH",
            });
            toast.success("Đã xác nhận đơn và nhập kho");
            list.mutate();
        } catch (error: any) {
            toast.error(error.message);
        }
    }

    const handleCancel = async (order: IPurchaseOrder) => {
        const warning = order.status === "CONFIRMED"
            ? " Hàng đã nhập sẽ bị trừ khỏi kho."
            : "";
        if (!confirm(`Huỷ đơn mua ${order.code} ?${warning}`)) return;
        try {
            await sendRequest({
                url: `${API_URL}/purchase-orders/${order.id}/cancel`,
                method: "PATCH",
            });
            toast.success("Đã huỷ đơn mua");
            list.mutate();
        } catch (error: any) {
            toast.error(error.message);
        }
    }

    const fields: IField[] = [
        {
            name: "code", label: "Số phiếu", required: true, half: true,
            //mã là khoá duy nhất, back-end không cho sửa nên khoá luôn ở đây
            disabled: !!editing,
        },
        { name: "orderDate", label: "Ngày chứng từ", type: "date", half: true },
        {
            name: "supplierId", label: "Nhà cung cấp", type: "select", required: true, half: true,
            options: (suppliers.data?.items ?? []).map(p => ({
                value: p.id, label: `${p.code} - ${p.name}`,
            })),
        },
        {
            name: "warehouseId", label: "Nhập về kho", type: "select", required: true, half: true,
            options: (warehouses.data?.items ?? []).map(w => ({
                value: w.id, label: `${w.code} - ${w.name}`,
            })),
        },
        { name: "note", label: "Ghi chú", type: "textarea" },
    ];

    return (
        <>
            <ErpPage
                title="Đơn mua hàng"
                description="Đơn mua hàng từ nhà cung cấp. Đơn ở trạng thái nháp còn sửa được; xác nhận đơn là lúc hàng vào kho."
                actionLabel="Tạo đơn mua"
                onAction={openCreate}
                search={search}
                onSearchChange={(value) => { setSearch(value); list.setPage(1); }}
                searchPlaceholder="Tìm theo số phiếu hoặc nhà cung cấp..."
                filters={
                    <Form.Select
                        size="sm"
                        style={{ maxWidth: 180 }}
                        value={status}
                        onChange={(e) => { setStatus(e.target.value); list.setPage(1); }}
                    >
                        <option value="">Tất cả trạng thái</option>
                        <option value="DRAFT">Nháp</option>
                        <option value="CONFIRMED">Đã xác nhận</option>
                        <option value="CANCELLED">Đã huỷ</option>
                    </Form.Select>
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
                            <th scope="col">Số phiếu</th>
                            <th scope="col">Ngày</th>
                            <th scope="col">Nhà cung cấp</th>
                            <th scope="col">Kho nhập</th>
                            <th scope="col" className="wc-num">Số dòng</th>
                            <th scope="col" className="wc-num">Tổng tiền</th>
                            <th scope="col">Trạng thái</th>
                            <th scope="col" style={{ width: 200 }}>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {list.items.length === 0 &&
                            <ErpEmpty
                                colSpan={8}
                                title="Chưa có đơn mua nào"
                                hint="Tạo đơn mua để nhập hàng vào kho."
                                actionLabel="Tạo đơn mua đầu tiên"
                                onAction={openCreate}
                            />
                        }
                        {list.items.map(order => (
                            <tr key={order.id}>
                                <td data-label="Số phiếu">{order.code}</td>
                                <td data-label="Ngày">{formatDate(order.orderDate)}</td>
                                <td data-label="Nhà cung cấp">{order.supplier?.name}</td>
                                <td data-label="Kho nhập">{order.warehouse?.name}</td>
                                <td data-label="Số dòng" className="wc-num">{order._count?.items ?? 0}</td>
                                <td data-label="Tổng tiền" className="wc-num fw-semibold">{formatMoney(order.totalAmount)}</td>
                                <td data-label="Trạng thái">
                                    <Badge bg="" className={`wc-badge-${ORDER_STATUS_VARIANT[order.status]}`}>
                                        {ORDER_STATUS_LABEL[order.status]}
                                    </Badge>
                                </td>
                                <td data-label="">
                                    <Button variant="outline-secondary" size="sm"
                                        onClick={() => openDetail(order)}
                                    >Xem</Button>
                                    {order.status === "DRAFT" &&
                                        <>
                                            <Button variant="outline-secondary" size="sm" className="ms-2"
                                                onClick={() => openEdit(order)}
                                            >Sửa</Button>
                                            <Button variant="outline-success" size="sm" className="ms-2"
                                                onClick={() => handleConfirm(order)}
                                            >Xác nhận</Button>
                                        </>
                                    }
                                    {order.status !== "CANCELLED" &&
                                        <Button variant="outline-danger" size="sm" className="ms-2"
                                            onClick={() => handleCancel(order)}
                                        >Huỷ</Button>
                                    }
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            </ErpPage>

            <ErpFormModal
                show={showModal}
                onHide={() => setShowModal(false)}
                title={editing ? `Sửa đơn mua: ${editing.code}` : "Tạo đơn mua"}
                fields={fields}
                values={values}
                onChange={setValues}
                onSubmit={handleSubmit}
                size="xl"
                extra={
                    <OrderItemsEditor
                        lines={lines}
                        onChange={setLines}
                        products={products.data?.items ?? []}
                        priceField="purchasePrice"
                    />
                }
            />

            {/* modal xem chi tiết, chỉ đọc */}
            <Modal show={!!detail} onHide={() => setDetail(null)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Đơn mua {detail?.code}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {detail &&
                        <>
                            <div className="row small mb-3">
                                <div className="col-6">
                                    <div><span className="text-muted">Nhà cung cấp:</span> <b>{detail.supplier?.name}</b></div>
                                    <div><span className="text-muted">Kho nhập:</span> {detail.warehouse?.name}</div>
                                </div>
                                <div className="col-6">
                                    <div><span className="text-muted">Ngày:</span> {formatDate(detail.orderDate)}</div>
                                    <div>
                                        <span className="text-muted">Trạng thái:</span>{" "}
                                        <Badge bg="" className={`wc-badge-${ORDER_STATUS_VARIANT[detail.status]}`}>
                                            {ORDER_STATUS_LABEL[detail.status]}
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                            <Table bordered size="sm">
                                <thead>
                                    <tr>
                                        <th scope="col">Mã hàng</th>
                                        <th scope="col">Tên hàng</th>
                                        <th scope="col" className="wc-num">SL</th>
                                        <th scope="col" className="wc-num">Đơn giá</th>
                                        <th scope="col" className="wc-num">Thành tiền</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(detail.items ?? []).map(item => (
                                        <tr key={item.id}>
                                            <td>{item.product?.code}</td>
                                            <td>{item.product?.name}</td>
                                            <td className="wc-num">{formatQuantity(item.quantity)}</td>
                                            <td className="wc-num">{formatMoney(item.unitPrice)}</td>
                                            <td className="wc-num">{formatMoney(item.amount)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr>
                                        <td colSpan={4} className="wc-num fw-semibold">Tổng cộng</td>
                                        <td className="wc-num fw-bold">{formatMoney(detail.totalAmount)}</td>
                                    </tr>
                                </tfoot>
                            </Table>
                            {detail.note &&
                                <div className="small text-muted">Ghi chú: {detail.note}</div>
                            }
                        </>
                    }
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setDetail(null)}>Đóng</Button>
                </Modal.Footer>
            </Modal>
        </>
    );
}

export default PurchaseOrdersPage;
