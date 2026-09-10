'use client'
import { useState } from 'react';
import { Badge, Button, Form, Table } from 'react-bootstrap';
import { toast } from 'react-toastify';
import useSWR from 'swr';
import ErpFormModal, { IField } from '@/components/erp/erp.form.modal';
import ErpEmpty from '@/components/erp/erp.empty';
import ErpPage from '@/components/erp/erp.page';
import { API_URL, sendRequest } from '@/utils/api';
import { formatDate, toDateInput } from '@/utils/erp';
import { useErpList } from '@/utils/use.erp.list';

const EmployeesPage = () => {
    const [search, setSearch] = useState<string>("");
    const [departmentId, setDepartmentId] = useState<string>("");

    const list = useErpList<IEmployee>("/hr/employees", { search, departmentId });

    const fetcher = (url: string) => sendRequest<any>({ url, method: "GET" });
    const departments = useSWR<IPaginated<IOrgUnit>>(
        `${API_URL}/hr/departments?page=1&limit=100`, fetcher);
    const positions = useSWR<IPaginated<IOrgUnit>>(
        `${API_URL}/hr/positions?page=1&limit=100`, fetcher);

    const [showModal, setShowModal] = useState<boolean>(false);
    const [editing, setEditing] = useState<IEmployee | null>(null);
    const [values, setValues] = useState<Record<string, any>>({});

    const openCreate = () => {
        setEditing(null);
        setValues({
            hireDate: toDateInput(new Date().toISOString()),
        });
        setShowModal(true);
    }

    const openEdit = (employee: IEmployee) => {
        setEditing(employee);
        setValues({
            code: employee.code,
            firstName: employee.firstName,
            lastName: employee.lastName,
            email: employee.email ?? "",
            phone: employee.phone ?? "",
            dateOfBirth: toDateInput(employee.dateOfBirth),
            hireDate: toDateInput(employee.hireDate),
            departmentId: employee.departmentId ?? "",
            positionId: employee.positionId ?? "",
        });
        setShowModal(true);
    }

    const handleSubmit = async () => {
        const body: Record<string, any> = {
            code: values.code,
            firstName: values.firstName,
            lastName: values.lastName,
            email: values.email || undefined,
            phone: values.phone || undefined,
            //ô ngày để trống trả về chuỗi rỗng, back-end từ chối nên phải bỏ hẳn
            dateOfBirth: values.dateOfBirth ? new Date(values.dateOfBirth).toISOString() : undefined,
            hireDate: values.hireDate ? new Date(values.hireDate).toISOString() : undefined,
            departmentId: values.departmentId ? Number(values.departmentId) : undefined,
            positionId: values.positionId ? Number(values.positionId) : undefined,
        };

        if (editing) {
            await sendRequest({
                url: `${API_URL}/hr/employees/${editing.id}`,
                method: "PATCH",
                body,
            });
            toast.success("Cập nhật nhân viên thành công");
        } else {
            await sendRequest({
                url: `${API_URL}/hr/employees`,
                method: "POST",
                body,
            });
            toast.success("Thêm nhân viên thành công");
        }
        list.mutate();
    }

    //nghỉ việc thì tắt cờ, hồ sơ và dữ liệu chấm công cũ vẫn giữ lại
    const handleDeactivate = async (employee: IEmployee) => {
        if (!confirm(`Ghi nhận nhân viên "${employee.lastName} ${employee.firstName}" đã nghỉ việc ?`)) return;
        try {
            await sendRequest({
                url: `${API_URL}/hr/employees/${employee.id}`,
                method: "DELETE",
            });
            toast.success("Đã ghi nhận nghỉ việc");
            list.mutate();
        } catch (error: any) {
            toast.error(error.message);
        }
    }

    const fields: IField[] = [
        { name: "code", label: "Mã nhân viên", required: true, half: true, placeholder: "VD: NV001" },
        { name: "lastName", label: "Họ và tên đệm", required: true, half: true },
        { name: "firstName", label: "Tên", required: true, half: true },
        { name: "email", label: "Email", type: "email", half: true },
        { name: "phone", label: "Điện thoại", half: true },
        { name: "dateOfBirth", label: "Ngày sinh", type: "date", half: true },
        { name: "hireDate", label: "Ngày vào làm", type: "date", half: true },
        //cố ý không có ô thu nhập: hệ thống không lưu thông tin đó
        {
            name: "departmentId", label: "Phòng ban", type: "select", half: true,
            options: (departments.data?.items ?? []).map(d => ({ value: d.id, label: d.name })),
        },
        {
            name: "positionId", label: "Chức danh", type: "select", half: true,
            options: (positions.data?.items ?? []).map(p => ({ value: p.id, label: p.name })),
        },
    ];

    return (
        <>
            <ErpPage
                title="Nhân viên"
                description="Hồ sơ nhân viên, phòng ban và chức danh. Hệ thống không lưu thông tin thu nhập."
                actionLabel="Thêm nhân viên"
                onAction={openCreate}
                search={search}
                onSearchChange={(value) => { setSearch(value); list.setPage(1); }}
                searchPlaceholder="Tìm theo mã, tên hoặc email..."
                filters={
                    <Form.Select
                        size="sm"
                        style={{ maxWidth: 200 }}
                        value={departmentId}
                        onChange={(e) => { setDepartmentId(e.target.value); list.setPage(1); }}
                    >
                        <option value="">Tất cả phòng ban</option>
                        {(departments.data?.items ?? []).map(d => (
                            <option key={d.id} value={d.id}>{d.name}</option>
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
                            <th scope="col">Mã NV</th>
                            <th scope="col">Họ và tên</th>
                            <th scope="col">Phòng ban</th>
                            <th scope="col">Chức danh</th>
                            <th scope="col">Ngày vào làm</th>
                            <th scope="col">Trạng thái</th>
                            <th scope="col" style={{ width: 140 }}>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {list.items.length === 0 &&
                            <ErpEmpty
                                colSpan={7}
                                title="Chưa có nhân viên nào"
                                hint="Thêm nhân viên để bắt đầu chấm công."
                                actionLabel="Thêm nhân viên đầu tiên"
                                onAction={openCreate}
                            />
                        }
                        {list.items.map(employee => (
                            <tr key={employee.id}>
                                <td data-label="Mã NV">{employee.code}</td>
                                <td data-label="Họ và tên">{employee.lastName} {employee.firstName}</td>
                                <td data-label="Phòng ban">{employee.department?.name ?? "—"}</td>
                                <td data-label="Chức danh">{employee.position?.name ?? "—"}</td>
                                <td data-label="Ngày vào làm">{formatDate(employee.hireDate)}</td>
                                <td data-label="Trạng thái">
                                    <Badge bg="" className={employee.isActive ? "wc-badge-success" : "wc-badge-neutral"}>
                                        {employee.isActive ? "Đang làm" : "Đã nghỉ"}
                                    </Badge>
                                </td>
                                <td data-label="">
                                    <Button variant="outline-secondary" size="sm"
                                        onClick={() => openEdit(employee)}
                                    >Sửa</Button>
                                    {employee.isActive &&
                                        <Button variant="outline-danger" size="sm" className="ms-2"
                                            onClick={() => handleDeactivate(employee)}
                                        >Nghỉ</Button>
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
                title={editing ? `Sửa nhân viên: ${editing.lastName} ${editing.firstName}` : "Thêm nhân viên"}
                fields={fields}
                values={values}
                onChange={setValues}
                onSubmit={handleSubmit}
            />
        </>
    );
}

export default EmployeesPage;
