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

const SalesOrdersPage = () => {
    const [search, setSearch] = useState<string>("");
    const [status, setStatus] = useState<string>("");

    const list = useErpList<ISalesOrder>("/sales-orders", { search, status });

    const fetcher = (url: string) => sendRequest<any>({ url, method: "GET" });
    const customers = useSWR<IPaginated<IPartner>>(
        `${API_URL}/partners?page=1&limit=100&type=CUSTOMER&isActive=true`, fetcher);
    const warehouses = useSWR<IPaginated<IWarehouse>>(
        `${API_URL}/warehouses?page=1&limit=100&isActive=true`, fetcher);
    const products = useSWR<IPaginated<IProduct>>(
        `${API_URL}/products?page=1&limit=100&isActive=true`, fetcher);

    const [showModal, setShowModal] = useState<boolean>(false);
    const [editing, setEditing] = useState<ISalesOrder | null>(null);
    const [values, setValues] = useState<Record<string, any>>({});
    const [lines, setLines] = useState<IEditorLine[]>([]);
    const [detail, setDetail] = useState<ISalesOrder | null>(null);

    //Giá vốn chỉ được ghi khi đơn được xác nhận, lúc hàng thật sự rời kho.
    //Đơn nháp hoặc đơn huỷ không có số liệu nên ẩn hẳn hai cột, hiện số 0
    //sẽ khiến người đọc tưởng bán hàng không tốn vốn.
    const hasCost = detail?.status === "CONFIRMED";
    const grossProfit = Number(detail?.totalAmount ?? 0) - Number(detail?.totalCost ?? 0);
    const marginPercent = Number(detail?.totalAmount ?? 0) > 0
        ? (grossProfit / Number(detail?.totalAmount)) * 100
        : 0;

    const openCreate = () => {
        setEditing(null);
        setValues({
            code: suggestCode("SO"),
            orderDate: toDateInput(new Date().toISOString()),
        });
        setLines([]);
        setShowModal(true);
    }

    const openEdit = async (order: ISalesOrder) => {
        const full = await sendRequest<ISalesOrder>({
            url: `${API_URL}/sales-orders/${order.id}`,
            method: "GET",
        });
        setEditing(full);
        setValues({
            code: full.code,
            customerId: full.customerId,
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

    const openDetail = async (order: ISalesOrder) => {
        try {
            const full = await sendRequest<ISalesOrder>({
                url: `${API_URL}/sales-orders/${order.id}`,
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
            throw new Error("Đơn bán phải có ít nhất một dòng hàng");
        }

        const body: Record<string, any> = {
            customerId: Number(values.customerId),
            warehouseId: Number(values.warehouseId),
            orderDate: values.orderDate ? new Date(values.orderDate).toISOString() : undefined,
            note: values.note || undefined,
            items,
        };

        if (editing) {
            await sendRequest({
                url: `${API_URL}/sales-orders/${editing.id}`,
                method: "PATCH",
                body,
            });
            toast.success("Cập nhật đơn bán thành công");
        } else {
            await sendRequest({
                url: `${API_URL}/sales-orders`,
                method: "POST",
                body: { ...body, code: values.code },
            });
            toast.success("Tạo đơn bán thành công");
        }
        list.mutate();
    }

    //xác nhận đơn bán sẽ trừ kho, không đủ tồn thì back-end trả 409 và đơn giữ nguyên
    const handleConfirm = async (order: ISalesOrder) => {
        if (!confirm(`Xác nhận đơn bán ${order.code} ? Hàng sẽ được xuất khỏi kho.`)) return;
        try {
            await sendRequest({
                url: `${API_URL}/sales-orders/${order.id}/confirm`,
                method: "PATCH",
            });
            toast.success("Đã xác nhận đơn và xuất kho");
            list.mutate();
        } catch (error: any) {
            toast.error(error.message);
        }
    }

    const handleCancel = async (order: ISalesOrder) => {
        const warning = order.status === "CONFIRMED"
            ? " Hàng đã xuất sẽ quay lại kho."
            : "";
        if (!confirm(`Huỷ đơn bán ${order.code} ?${warning}`)) return;
        try {
            await sendRequest({
                url: `${API_URL}/sales-orders/${order.id}/cancel`,
                method: "PATCH",
            });
            toast.success("Đã huỷ đơn bán");
            list.mutate();
        } catch (error: any) {
            toast.error(error.message);
        }
    }

    const fields: IField[] = [
        { name: "code", label: "Số phiếu", required: true, half: true, disabled: !!editing },
        { name: "orderDate", label: "Ngày chứng từ", type: "date", half: true },
        {
            name: "customerId", label: "Khách hàng", type: "select", required: true, half: true,
            options: (customers.data?.items ?? []).map(p => ({
                value: p.id, label: `${p.code} - ${p.name}`,
            })),
        },
        {
            name: "warehouseId", label: "Xuất từ kho", type: "select", required: true, half: true,
            options: (warehouses.data?.items ?? []).map(w => ({
                value: w.id, label: `${w.code} - ${w.name}`,
            })),
        },
        { name: "note", label: "Ghi chú", type: "textarea" },
    ];

    return (
        <>
            <ErpPage
                title="Đơn bán hàng"
                description="Đơn bán hàng cho khách. Xác nhận đơn là lúc hàng rời kho, nên hệ thống sẽ chặn nếu không đủ tồn."
                actionLabel="Tạo đơn bán"
                onAction={openCreate}
                search={search}
                onSearchChange={(value) => { setSearch(value); list.setPage(1); }}
                searchPlaceholder="Tìm theo số phiếu hoặc khách hàng..."
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
                            <th scope="col">Khách hàng</th>
                            <th scope="col">Kho xuất</th>
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
                                title="Chưa có đơn bán nào"
                                hint="Tạo đơn bán để xuất hàng cho khách."
                                actionLabel="Tạo đơn bán đầu tiên"
                                onAction={openCreate}
                            />
                        }
                        {list.items.map(order => (
                            <tr key={order.id}>
                                <td data-label="Số phiếu">{order.code}</td>
                                <td data-label="Ngày">{formatDate(order.orderDate)}</td>
                                <td data-label="Khách hàng">{order.customer?.name}</td>
                                <td data-label="Kho xuất">{order.warehouse?.name}</td>
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
                title={editing ? `Sửa đơn bán: ${editing.code}` : "Tạo đơn bán"}
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
                        priceField="salePrice"
                    />
                }
            />

            <Modal show={!!detail} onHide={() => setDetail(null)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Đơn bán {detail?.code}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {detail &&
                        <>
                            <div className="row small mb-3">
                                <div className="col-6">
                                    <div><span className="text-muted">Khách hàng:</span> <b>{detail.customer?.name}</b></div>
                                    <div><span className="text-muted">Kho xuất:</span> {detail.warehouse?.name}</div>
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
                            <Table bordered size="sm" responsive>
                                <thead>
                                    <tr>
                                        <th scope="col">Mã hàng</th>
                                        <th scope="col">Tên hàng</th>
                                        <th scope="col" className="wc-num">SL</th>
                                        <th scope="col" className="wc-num">Đơn giá</th>
                                        <th scope="col" className="wc-num">Thành tiền</th>
                                        {/* Giá vốn chỉ có sau khi xác nhận đơn, lúc hàng thật sự rời kho.
                                            Đơn nháp mà hiện cột 0 thì gây hiểu nhầm là bán không có vốn. */}
                                        {hasCost && <th scope="col" className="wc-num">Giá vốn</th>}
                                        {hasCost && <th scope="col" className="wc-num">Lãi gộp</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {(detail.items ?? []).map(item => {
                                        const lineProfit = Number(item.amount) - Number(item.costAmount ?? 0);
                                        return (
                                            <tr key={item.id}>
                                                <td>{item.product?.code}</td>
                                                <td>{item.product?.name}</td>
                                                <td className="wc-num">{formatQuantity(item.quantity)}</td>
                                                <td className="wc-num">{formatMoney(item.unitPrice)}</td>
                                                <td className="wc-num">{formatMoney(item.amount)}</td>
                                                {hasCost && <td className="wc-num">{formatMoney(item.costAmount ?? 0)}</td>}
                                                {hasCost &&
                                                    <td className={`wc-num ${lineProfit < 0 ? 'text-danger' : ''}`}>
                                                        {formatMoney(lineProfit)}
                                                    </td>
                                                }
                                            </tr>
                                        );
                                    })}
                                </tbody>
                                <tfoot>
                                    <tr>
                                        <td colSpan={4} className="wc-num fw-semibold">Tổng cộng</td>
                                        <td className="wc-num fw-bold">{formatMoney(detail.totalAmount)}</td>
                                        {hasCost && <td className="wc-num fw-bold">{formatMoney(detail.totalCost)}</td>}
                                        {hasCost &&
                                            <td className={`wc-num fw-bold ${grossProfit < 0 ? 'text-danger' : 'text-success'}`}>
                                                {formatMoney(grossProfit)}
                                            </td>
                                        }
                                    </tr>
                                </tfoot>
                            </Table>
                            {hasCost &&
                                <div className="small text-muted mb-2">
                                    Tỷ suất lãi gộp: <b>{marginPercent.toFixed(1)}%</b> doanh thu.
                                    Giá vốn tính theo bình quân gia quyền tại thời điểm xuất kho.
                                </div>
                            }
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

export default SalesOrdersPage;
