'use client'
import { useState } from 'react';
import { Button, Form, Table } from 'react-bootstrap';
import { toast } from 'react-toastify';
import useSWR from 'swr';
import ErpFormModal, { IField } from '@/components/erp/erp.form.modal';
import ErpEmpty from '@/components/erp/erp.empty';
import ErpPage from '@/components/erp/erp.page';
import { API_URL, sendRequest } from '@/utils/api';
import { formatDate, toDateInput } from '@/utils/erp';
import { useErpList } from '@/utils/use.erp.list';

const AttendancesPage = () => {
    const [employeeId, setEmployeeId] = useState<string>("");
    const [fromDate, setFromDate] = useState<string>("");
    const [toDate, setToDate] = useState<string>("");

    //back-end nhận fromDate và toDate ở dạng chuỗi ngày, ô input đã cho đúng dạng đó
    const list = useErpList<IAttendance>(
        "/hr/attendances", { employeeId, fromDate, toDate }, 20);

    const employees = useSWR<IPaginated<IEmployee>>(
        `${API_URL}/hr/employees?page=1&limit=100&isActive=true`,
        (url: string) => sendRequest<IPaginated<IEmployee>>({ url, method: "GET" })
    );

    const [showModal, setShowModal] = useState<boolean>(false);
    const [values, setValues] = useState<Record<string, any>>({});

    const openCreate = () => {
        setValues({
            workDate: toDateInput(new Date().toISOString()),
            workHours: 8,
        });
        setShowModal(true);
    }

    const handleSubmit = async () => {
        await sendRequest({
            url: `${API_URL}/hr/attendances`,
            method: "POST",
            body: {
                employeeId: Number(values.employeeId),
                workDate: new Date(values.workDate).toISOString(),
                workHours: Number(values.workHours || 0),
                note: values.note || undefined,
            },
        });
        toast.success("Chấm công thành công");
        list.mutate();
    }

    const handleDelete = async (attendance: IAttendance) => {
        if (!confirm(`Xoá bản chấm công ngày ${formatDate(attendance.workDate)} ?`)) return;
        try {
            await sendRequest({
                url: `${API_URL}/hr/attendances/${attendance.id}`,
                method: "DELETE",
            });
            toast.success("Xoá bản chấm công thành công");
            list.refreshAfterDelete();
        } catch (error: any) {
            toast.error(error.message);
        }
    }

    const fields: IField[] = [
        {
            name: "employeeId", label: "Nhân viên", type: "select", required: true,
            options: (employees.data?.items ?? []).map(e => ({
                value: e.id, label: `${e.code} - ${e.lastName} ${e.firstName}`,
            })),
        },
        { name: "workDate", label: "Ngày làm việc", type: "date", required: true, half: true },
        { name: "workHours", label: "Số giờ làm", type: "number", half: true },
        { name: "note", label: "Ghi chú", type: "textarea" },
    ];

    return (
        <>
            <ErpPage
                title="Chấm công"
                description="Ghi nhận số giờ làm việc theo ngày. Mỗi nhân viên chỉ có một bản ghi cho mỗi ngày."
                actionLabel="Chấm công"
                onAction={openCreate}
                filters={
                    <>
                        <Form.Select
                            size="sm"
                            style={{ maxWidth: 240 }}
                            value={employeeId}
                            onChange={(e) => { setEmployeeId(e.target.value); list.setPage(1); }}
                        >
                            <option value="">Tất cả nhân viên</option>
                            {(employees.data?.items ?? []).map(e => (
                                <option key={e.id} value={e.id}>
                                    {e.code} - {e.lastName} {e.firstName}
                                </option>
                            ))}
                        </Form.Select>
                        <Form.Control
                            size="sm"
                            type="date"
                            style={{ maxWidth: 160 }}
                            value={fromDate}
                            onChange={(e) => { setFromDate(e.target.value); list.setPage(1); }}
                        />
                        <span className="small text-muted">đến</span>
                        <Form.Control
                            size="sm"
                            type="date"
                            style={{ maxWidth: 160 }}
                            value={toDate}
                            onChange={(e) => { setToDate(e.target.value); list.setPage(1); }}
                        />
                    </>
                }
                isLoading={list.isLoading}
                error={list.error}
                total={list.meta?.total}
                page={list.page}
                totalPages={list.meta?.totalPages}
                onPageChange={list.setPage}
                skeletonColumns={6}
            >
                <Table hover className="wc-table-cards align-middle">
                    <thead>
                        <tr>
                            <th scope="col">Ngày</th>
                            <th scope="col">Mã NV</th>
                            <th scope="col">Họ và tên</th>
                            <th scope="col" className="wc-num">Số giờ</th>
                            <th scope="col">Ghi chú</th>
                            <th scope="col" style={{ width: 90 }}>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {list.items.length === 0 &&
                            <ErpEmpty
                                colSpan={6}
                                title="Chưa có dữ liệu chấm công"
                                hint="Chọn nhân viên và ngày để ghi nhận giờ làm."
                                actionLabel="Chấm công lần đầu"
                                onAction={openCreate}
                            />
                        }
                        {list.items.map(attendance => (
                            <tr key={attendance.id}>
                                <td data-label="Ngày">{formatDate(attendance.workDate)}</td>
                                <td data-label="Mã NV">{attendance.employee?.code}</td>
                                <td data-label="Họ và tên">{attendance.employee?.lastName} {attendance.employee?.firstName}</td>
                                <td data-label="Số giờ" className="wc-num">{Number(attendance.workHours)}</td>
                                <td data-label="Ghi chú" className="small text-muted">{attendance.note ?? "—"}</td>
                                <td data-label="">
                                    <Button variant="outline-danger" size="sm"
                                        onClick={() => handleDelete(attendance)}
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
                title="Chấm công"
                fields={fields}
                values={values}
                onChange={setValues}
                onSubmit={handleSubmit}
                extra={
                    <div className="alert alert-info small mt-3 mb-0">
                        Mỗi nhân viên chỉ có một bản chấm công cho mỗi ngày.
                    </div>
                }
            />
        </>
    );
}

export default AttendancesPage;
