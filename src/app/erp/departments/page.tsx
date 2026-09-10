'use client'
import { useState } from 'react';
import { Button, Table } from 'react-bootstrap';
import { toast } from 'react-toastify';
import ErpFormModal, { IField } from '@/components/erp/erp.form.modal';
import ErpPage from '@/components/erp/erp.page';
import { API_URL, sendRequest } from '@/utils/api';
import { useErpList } from '@/utils/use.erp.list';

//Phòng ban và chức danh có cùng cấu trúc, back-end cũng dùng chung một service
//Nên ở đây chỉ cần một thành phần, truyền vào đường dẫn và nhãn khác nhau
const OrgUnitSection = (props: { path: string; label: string; prefix: string }) => {
    const { path, label, prefix } = props;

    const [search, setSearch] = useState<string>("");
    const list = useErpList<IOrgUnit>(path, { search });

    const [showModal, setShowModal] = useState<boolean>(false);
    const [editing, setEditing] = useState<IOrgUnit | null>(null);
    const [values, setValues] = useState<Record<string, any>>({});

    const openCreate = () => {
        setEditing(null);
        setValues({});
        setShowModal(true);
    }

    const openEdit = (unit: IOrgUnit) => {
        setEditing(unit);
        setValues({ code: unit.code, name: unit.name });
        setShowModal(true);
    }

    const handleSubmit = async () => {
        const body = { code: values.code, name: values.name };
        if (editing) {
            await sendRequest({
                url: `${API_URL}${path}/${editing.id}`,
                method: "PATCH",
                body,
            });
            toast.success(`Cập nhật ${label} thành công`);
        } else {
            await sendRequest({
                url: `${API_URL}${path}`,
                method: "POST",
                body,
            });
            toast.success(`Thêm ${label} thành công`);
        }
        list.mutate();
    }

    //back-end chặn xoá khi còn nhân viên, trả về 409
    const handleDelete = async (unit: IOrgUnit) => {
        if (!confirm(`Xoá ${label} "${unit.name}" ?`)) return;
        try {
            await sendRequest({
                url: `${API_URL}${path}/${unit.id}`,
                method: "DELETE",
            });
            toast.success(`Xoá ${label} thành công`);
            list.refreshAfterDelete();
        } catch (error: any) {
            toast.error(error.message);
        }
    }

    const fields: IField[] = [
        { name: "code", label: "Mã", required: true, half: true, placeholder: `VD: ${prefix}001` },
        { name: "name", label: "Tên", required: true, half: true },
    ];

    //viết hoa chữ đầu cho tiêu đề, ví dụ "phòng ban" thành "Phòng ban"
    const title = label.charAt(0).toUpperCase() + label.slice(1);

    return (
        <>
            <ErpPage
                title={title}
                actionLabel={`Thêm ${label}`}
                onAction={openCreate}
                search={search}
                onSearchChange={(value) => { setSearch(value); list.setPage(1); }}
                isLoading={list.isLoading}
                error={list.error}
                total={list.meta?.total}
                page={list.page}
                totalPages={list.meta?.totalPages}
                onPageChange={list.setPage}
            >
                <Table hover className="wc-table-cards align-middle">
                    <thead>
                        <tr>
                            <th scope="col">Mã</th>
                            <th scope="col">Tên</th>
                            <th scope="col" className="wc-num">Số nhân viên</th>
                            <th scope="col" style={{ width: 140 }}>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {list.items.length === 0 &&
                            <tr><td colSpan={4} className="text-center text-muted py-3">
                                Không có dữ liệu
                            </td></tr>
                        }
                        {list.items.map(unit => (
                            <tr key={unit.id}>
                                <td data-label="Mã">{unit.code}</td>
                                <td data-label="Tên">{unit.name}</td>
                                <td data-label="Số nhân viên" className="wc-num">{unit._count?.employees ?? 0}</td>
                                <td data-label="">
                                    <Button variant="outline-secondary" size="sm"
                                        onClick={() => openEdit(unit)}
                                    >Sửa</Button>
                                    <Button variant="outline-danger" size="sm" className="ms-2"
                                        onClick={() => handleDelete(unit)}
                                    >Xoá</Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            </ErpPage>

            <ErpFormModal
                show={showModal}
                onHide={() => setShowModal(false)}
                title={editing ? `Sửa ${label}: ${editing.name}` : `Thêm ${label}`}
                fields={fields}
                values={values}
                onChange={setValues}
                onSubmit={handleSubmit}
                size="sm"
            />
        </>
    );
}

const DepartmentsPage = () => {
    return (
        <div className="d-flex flex-column gap-3">
            <OrgUnitSection path="/hr/departments" label="phòng ban" prefix="PB" />
            <OrgUnitSection path="/hr/positions" label="chức danh" prefix="CD" />
        </div>
    );
}

export default DepartmentsPage;
