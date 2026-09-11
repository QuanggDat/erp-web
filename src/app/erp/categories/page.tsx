'use client'
import { useState } from 'react';
import { Button, Table } from 'react-bootstrap';
import { toast } from 'react-toastify';
import ErpFormModal, { IField } from '@/components/erp/erp.form.modal';
import ErpEmpty from '@/components/erp/erp.empty';
import ErpPage from '@/components/erp/erp.page';
import { API_URL, sendRequest } from '@/utils/api';
import { useErpList } from '@/utils/use.erp.list';

const CategoriesPage = () => {
    const [search, setSearch] = useState<string>("");
    const list = useErpList<IProductCategory>("/products/categories", { search });

    const [showModal, setShowModal] = useState<boolean>(false);
    const [editing, setEditing] = useState<IProductCategory | null>(null);
    const [values, setValues] = useState<Record<string, any>>({});

    const openCreate = () => {
        setEditing(null);
        setValues({});
        setShowModal(true);
    }

    const openEdit = (category: IProductCategory) => {
        setEditing(category);
        setValues({ code: category.code, name: category.name });
        setShowModal(true);
    }

    const handleSubmit = async () => {
        const body = { code: values.code, name: values.name };
        if (editing) {
            await sendRequest({
                url: `${API_URL}/products/categories/${editing.id}`,
                method: "PATCH",
                body,
            });
            toast.success("Cập nhật nhóm hàng thành công");
        } else {
            await sendRequest({
                url: `${API_URL}/products/categories`,
                method: "POST",
                body,
            });
            toast.success("Thêm nhóm hàng thành công");
        }
        list.mutate();
    }

    //back-end chặn xoá khi nhóm còn sản phẩm, lỗi 409 sẽ hiện lên toast
    const handleDelete = async (category: IProductCategory) => {
        if (!confirm(`Xoá nhóm hàng "${category.name}" ?`)) return;
        try {
            await sendRequest({
                url: `${API_URL}/products/categories/${category.id}`,
                method: "DELETE",
            });
            toast.success("Xoá nhóm hàng thành công");
            list.refreshAfterDelete();
        } catch (error: any) {
            toast.error(error.message);
        }
    }

    const fields: IField[] = [
        { name: "code", label: "Mã nhóm", required: true, half: true, placeholder: "VD: NH001" },
        { name: "name", label: "Tên nhóm", required: true, half: true },
    ];

    return (
        <>
            <ErpPage
                title="Nhóm hàng"
                description="Nhóm hàng giúp phân loại sản phẩm để tìm và lọc nhanh hơn."
                actionLabel="Thêm nhóm hàng"
                onAction={openCreate}
                search={search}
                onSearchChange={(value) => { setSearch(value); list.setPage(1); }}
                isLoading={list.isLoading}
                error={list.error}
                total={list.meta?.total}
                page={list.page}
                totalPages={list.meta?.totalPages}
                onPageChange={list.setPage}
                skeletonColumns={4}
            >
                <Table hover className="wc-table-cards align-middle">
                    <thead>
                        <tr>
                            <th scope="col">Mã nhóm</th>
                            <th scope="col">Tên nhóm</th>
                            <th scope="col" className="wc-num">Số sản phẩm</th>
                            <th scope="col" style={{ width: 140 }}>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {list.items.length === 0 &&
                            <ErpEmpty
                                colSpan={4}
                                title="Chưa có nhóm hàng nào"
                                hint="Tạo nhóm hàng để phân loại sản phẩm theo chủng loại."
                                actionLabel="Thêm nhóm hàng đầu tiên"
                                onAction={openCreate}
                            />
                        }
                        {list.items.map(category => (
                            <tr key={category.id}>
                                <td data-label="Mã nhóm">{category.code}</td>
                                <td data-label="Tên nhóm">{category.name}</td>
                                <td data-label="Số sản phẩm" className="wc-num">{category._count?.products ?? 0}</td>
                                <td data-label="">
                                    <Button variant="outline-secondary" size="sm"
                                        onClick={() => openEdit(category)}
                                    >Sửa</Button>
                                    <Button variant="outline-danger" size="sm" className="ms-2"
                                        onClick={() => handleDelete(category)}
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
                title={editing ? `Sửa nhóm hàng: ${editing.name}` : "Thêm nhóm hàng"}
                fields={fields}
                values={values}
                onChange={setValues}
                onSubmit={handleSubmit}
                size="sm"
            />
        </>
    );
}

export default CategoriesPage;
