'use client'
import { useState } from 'react';
import { Badge, Button, Table } from 'react-bootstrap';
import { toast } from 'react-toastify';
import ErpFormModal, { IField } from '@/components/erp/erp.form.modal';
import ErpEmpty from '@/components/erp/erp.empty';
import ErpPage from '@/components/erp/erp.page';
import { API_URL, sendRequest } from '@/utils/api';
import { useErpList } from '@/utils/use.erp.list';

const WarehousesPage = () => {
    const [search, setSearch] = useState<string>("");
    const list = useErpList<IWarehouse>("/warehouses", { search });

    const [showModal, setShowModal] = useState<boolean>(false);
    const [editing, setEditing] = useState<IWarehouse | null>(null);
    const [values, setValues] = useState<Record<string, any>>({});

    const openCreate = () => {
        setEditing(null);
        setValues({});
        setShowModal(true);
    }

    const openEdit = (warehouse: IWarehouse) => {
        setEditing(warehouse);
        setValues({
            code: warehouse.code,
            name: warehouse.name,
            address: warehouse.address ?? "",
        });
        setShowModal(true);
    }

    const handleSubmit = async () => {
        const body = {
            code: values.code,
            name: values.name,
            address: values.address || undefined,
        };
        if (editing) {
            await sendRequest({
                url: `${API_URL}/warehouses/${editing.id}`,
                method: "PATCH",
                body,
            });
            toast.success("Cập nhật kho thành công");
        } else {
            await sendRequest({
                url: `${API_URL}/warehouses`,
                method: "POST",
                body,
            });
            toast.success("Thêm kho thành công");
        }
        list.mutate();
    }

    //back-end chặn ngừng sử dụng khi kho còn hàng, trả về 409
    const handleDeactivate = async (warehouse: IWarehouse) => {
        if (!confirm(`Ngừng sử dụng kho "${warehouse.name}" ?`)) return;
        try {
            await sendRequest({
                url: `${API_URL}/warehouses/${warehouse.id}`,
                method: "DELETE",
            });
            toast.success("Đã ngừng sử dụng kho");
            list.mutate();
        } catch (error: any) {
            toast.error(error.message);
        }
    }

    const fields: IField[] = [
        { name: "code", label: "Mã kho", required: true, half: true, placeholder: "VD: KHO01" },
        { name: "name", label: "Tên kho", required: true, half: true },
        { name: "address", label: "Địa chỉ", type: "textarea" },
    ];

    return (
        <>
            <ErpPage
                title="Danh sách kho"
                description="Danh sách kho hàng. Mỗi đơn mua và đơn bán đều phải chọn một kho."
                actionLabel="Thêm kho"
                onAction={openCreate}
                search={search}
                onSearchChange={(value) => { setSearch(value); list.setPage(1); }}
                isLoading={list.isLoading}
                error={list.error}
                total={list.meta?.total}
                page={list.page}
                totalPages={list.meta?.totalPages}
                onPageChange={list.setPage}
                skeletonColumns={5}
            >
                <Table hover className="wc-table-cards align-middle">
                    <thead>
                        <tr>
                            <th scope="col">Mã kho</th>
                            <th scope="col">Tên kho</th>
                            <th scope="col">Địa chỉ</th>
                            <th scope="col">Trạng thái</th>
                            <th scope="col" style={{ width: 140 }}>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {list.items.length === 0 &&
                            <ErpEmpty
                                colSpan={5}
                                title="Chưa có kho nào"
                                hint="Tạo kho trước khi nhập hoặc xuất hàng."
                                actionLabel="Thêm kho đầu tiên"
                                onAction={openCreate}
                            />
                        }
                        {list.items.map(warehouse => (
                            <tr key={warehouse.id}>
                                <td data-label="Mã kho">{warehouse.code}</td>
                                <td data-label="Tên kho">{warehouse.name}</td>
                                <td data-label="Địa chỉ">{warehouse.address ?? "—"}</td>
                                <td data-label="Trạng thái">
                                    <Badge bg="" className={warehouse.isActive ? "wc-badge-success" : "wc-badge-neutral"}>
                                        {warehouse.isActive ? "Đang dùng" : "Ngừng"}
                                    </Badge>
                                </td>
                                <td data-label="">
                                    <Button variant="outline-secondary" size="sm"
                                        onClick={() => openEdit(warehouse)}
                                    >Sửa</Button>
                                    {warehouse.isActive &&
                                        <Button variant="outline-danger" size="sm" className="ms-2"
                                            onClick={() => handleDeactivate(warehouse)}
                                        >Ngừng</Button>
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
                title={editing ? `Sửa kho: ${editing.name}` : "Thêm kho"}
                fields={fields}
                values={values}
                onChange={setValues}
                onSubmit={handleSubmit}
            />
        </>
    );
}

export default WarehousesPage;
