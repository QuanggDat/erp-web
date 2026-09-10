'use client'
import { useState } from 'react';
import { Badge, Button, Form, Table } from 'react-bootstrap';
import { toast } from 'react-toastify';
import ErpFormModal, { IField } from '@/components/erp/erp.form.modal';
import ErpEmpty from '@/components/erp/erp.empty';
import ErpPage from '@/components/erp/erp.page';
import { API_URL, sendRequest } from '@/utils/api';
import { PARTNER_TYPE_LABEL } from '@/utils/erp';
import { useErpList } from '@/utils/use.erp.list';

const PartnersPage = () => {
    const [search, setSearch] = useState<string>("");
    const [type, setType] = useState<string>("");

    const list = useErpList<IPartner>("/partners", { search, type });

    const [showModal, setShowModal] = useState<boolean>(false);
    const [editing, setEditing] = useState<IPartner | null>(null);
    const [values, setValues] = useState<Record<string, any>>({});

    const openCreate = () => {
        setEditing(null);
        setValues({ type: "CUSTOMER" });
        setShowModal(true);
    }

    const openEdit = (partner: IPartner) => {
        setEditing(partner);
        setValues({
            code: partner.code,
            name: partner.name,
            type: partner.type,
            taxCode: partner.taxCode ?? "",
            phone: partner.phone ?? "",
            email: partner.email ?? "",
            address: partner.address ?? "",
        });
        setShowModal(true);
    }

    const handleSubmit = async () => {
        //bỏ hẳn các ô để trống thay vì gửi chuỗi rỗng,
        //vì back-end kiểm tra định dạng email và sẽ từ chối chuỗi rỗng
        const body: Record<string, any> = {
            code: values.code,
            name: values.name,
            type: values.type,
            taxCode: values.taxCode || undefined,
            phone: values.phone || undefined,
            email: values.email || undefined,
            address: values.address || undefined,
        };

        if (editing) {
            await sendRequest({
                url: `${API_URL}/partners/${editing.id}`,
                method: "PATCH",
                body,
            });
            toast.success("Cập nhật đối tác thành công");
        } else {
            await sendRequest({
                url: `${API_URL}/partners`,
                method: "POST",
                body,
            });
            toast.success("Thêm đối tác thành công");
        }
        list.mutate();
    }

    const handleDeactivate = async (partner: IPartner) => {
        if (!confirm(`Ngừng giao dịch với "${partner.name}" ?`)) return;
        try {
            await sendRequest({
                url: `${API_URL}/partners/${partner.id}`,
                method: "DELETE",
            });
            toast.success("Đã ngừng giao dịch");
            list.mutate();
        } catch (error: any) {
            toast.error(error.message);
        }
    }

    const fields: IField[] = [
        { name: "code", label: "Mã đối tác", required: true, half: true, placeholder: "VD: KH001" },
        { name: "name", label: "Tên đối tác", required: true, half: true },
        {
            name: "type", label: "Loại", type: "select", required: true, half: true,
            options: [
                { value: "CUSTOMER", label: "Khách hàng" },
                { value: "SUPPLIER", label: "Nhà cung cấp" },
                { value: "BOTH", label: "Cả hai" },
            ],
        },
        { name: "taxCode", label: "Mã số thuế", half: true },
        { name: "phone", label: "Điện thoại", half: true },
        { name: "email", label: "Email", type: "email", half: true },
        { name: "address", label: "Địa chỉ", type: "textarea" },
    ];

    return (
        <>
            <ErpPage
                title="Đối tác"
                description="Khách hàng và nhà cung cấp lưu chung một danh sách. Một công ty vừa mua vừa bán chỉ cần một bản ghi."
                actionLabel="Thêm đối tác"
                onAction={openCreate}
                search={search}
                onSearchChange={(value) => { setSearch(value); list.setPage(1); }}
                searchPlaceholder="Tìm theo mã, tên hoặc mã số thuế..."
                filters={
                    <Form.Select
                        size="sm"
                        style={{ maxWidth: 180 }}
                        value={type}
                        onChange={(e) => { setType(e.target.value); list.setPage(1); }}
                    >
                        <option value="">Tất cả loại</option>
                        <option value="CUSTOMER">Khách hàng</option>
                        <option value="SUPPLIER">Nhà cung cấp</option>
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
                            <th scope="col">Mã</th>
                            <th scope="col">Tên đối tác</th>
                            <th scope="col">Loại</th>
                            <th scope="col">Mã số thuế</th>
                            <th scope="col">Điện thoại</th>
                            <th scope="col">Trạng thái</th>
                            <th scope="col" style={{ width: 140 }}>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {list.items.length === 0 &&
                            <ErpEmpty
                                colSpan={7}
                                title="Chưa có đối tác nào"
                                hint="Thêm đối tác trước khi tạo đơn mua hoặc đơn bán."
                                actionLabel="Thêm đối tác đầu tiên"
                                onAction={openCreate}
                            />
                        }
                        {list.items.map(partner => (
                            <tr key={partner.id}>
                                <td data-label="Mã">{partner.code}</td>
                                <td data-label="Tên đối tác">{partner.name}</td>
                                <td data-label="Loại">{PARTNER_TYPE_LABEL[partner.type]}</td>
                                <td data-label="Mã số thuế">{partner.taxCode ?? "—"}</td>
                                <td data-label="Điện thoại">{partner.phone ?? "—"}</td>
                                <td data-label="Trạng thái">
                                    <Badge bg="" className={partner.isActive ? "wc-badge-success" : "wc-badge-neutral"}>
                                        {partner.isActive ? "Đang giao dịch" : "Ngừng"}
                                    </Badge>
                                </td>
                                <td data-label="">
                                    <Button variant="outline-secondary" size="sm"
                                        onClick={() => openEdit(partner)}
                                    >Sửa</Button>
                                    {partner.isActive &&
                                        <Button variant="outline-danger" size="sm" className="ms-2"
                                            onClick={() => handleDeactivate(partner)}
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
                title={editing ? `Sửa đối tác: ${editing.name}` : "Thêm đối tác"}
                fields={fields}
                values={values}
                onChange={setValues}
                onSubmit={handleSubmit}
            />
        </>
    );
}

export default PartnersPage;
