'use client'
import { useState } from 'react';
import { Badge, Button, Form, Table } from 'react-bootstrap';
import { toast } from 'react-toastify';
import useSWR from 'swr';
import ErpFormModal, { IField } from '@/components/erp/erp.form.modal';
import ErpEmpty from '@/components/erp/erp.empty';
import ErpPage from '@/components/erp/erp.page';
import { API_URL, sendRequest } from '@/utils/api';
import { formatMoney } from '@/utils/erp';
import { useErpList } from '@/utils/use.erp.list';

const ProductsPage = () => {
    const [search, setSearch] = useState<string>("");
    const [categoryId, setCategoryId] = useState<string>("");

    const list = useErpList<IProduct>("/products", { search, categoryId });

    //nạp nhóm hàng để đổ vào ô chọn; lấy 100 dòng là đủ cho danh mục
    const categories = useSWR<IPaginated<IProductCategory>>(
        `${API_URL}/products/categories?page=1&limit=100`,
        (url: string) => sendRequest<IPaginated<IProductCategory>>({ url, method: "GET" })
    );

    const [showModal, setShowModal] = useState<boolean>(false);
    const [editing, setEditing] = useState<IProduct | null>(null);
    const [values, setValues] = useState<Record<string, any>>({});

    const openCreate = () => {
        setEditing(null);
        setValues({ unit: "Cái", salePrice: 0, purchasePrice: 0 });
        setShowModal(true);
    }

    const openEdit = (product: IProduct) => {
        setEditing(product);
        setValues({
            code: product.code,
            name: product.name,
            unit: product.unit,
            description: product.description ?? "",
            salePrice: product.salePrice,
            purchasePrice: product.purchasePrice,
            categoryId: product.categoryId ?? "",
        });
        setShowModal(true);
    }

    const handleSubmit = async () => {
        //ép về số vì ô nhập luôn trả chuỗi, back-end từ chối chuỗi cho trường số
        const body: Record<string, any> = {
            code: values.code,
            name: values.name,
            unit: values.unit || "Cái",
            description: values.description || undefined,
            salePrice: Number(values.salePrice || 0),
            purchasePrice: Number(values.purchasePrice || 0),
            categoryId: values.categoryId ? Number(values.categoryId) : undefined,
        };

        if (editing) {
            await sendRequest({
                url: `${API_URL}/products/${editing.id}`,
                method: "PATCH",
                body,
            });
            toast.success("Cập nhật sản phẩm thành công");
        } else {
            await sendRequest({
                url: `${API_URL}/products`,
                method: "POST",
                body,
            });
            toast.success("Thêm sản phẩm thành công");
        }
        list.mutate();
    }

    //back-end không xoá cứng mà chỉ tắt cờ isActive, vì sản phẩm còn nằm trong chứng từ cũ
    const handleDeactivate = async (product: IProduct) => {
        if (!confirm(`Ngừng kinh doanh sản phẩm "${product.name}" ?`)) return;
        try {
            await sendRequest({
                url: `${API_URL}/products/${product.id}`,
                method: "DELETE",
            });
            toast.success("Đã ngừng kinh doanh sản phẩm");
            list.mutate();
        } catch (error: any) {
            toast.error(error.message);
        }
    }

    const fields: IField[] = [
        {
            name: "code", label: "Mã hàng", required: true, half: true,
            placeholder: "VD: SP001",
            hint: "Không được trùng với sản phẩm khác.",
        },
        { name: "name", label: "Tên hàng", required: true, half: true },
        {
            name: "unit", label: "Đơn vị tính", half: true,
            placeholder: "Cái, Hộp, Kg...",
            hint: "Bỏ trống thì mặc định là Cái.",
        },
        {
            name: "categoryId", label: "Nhóm hàng", type: "select", half: true,
            options: (categories.data?.items ?? []).map(c => ({ value: c.id, label: c.name })),
        },
        {
            name: "purchasePrice", label: "Giá mua", type: "number", half: true,
            hint: "Giá gợi ý khi tạo đơn mua.",
        },
        {
            name: "salePrice", label: "Giá bán", type: "number", half: true,
            hint: "Giá gợi ý khi tạo đơn bán.",
        },
        { name: "description", label: "Mô tả", type: "textarea" },
    ];

    return (
        <>
            <ErpPage
                title="Sản phẩm"
                description="Danh mục hàng hoá dùng cho đơn mua, đơn bán và quản lý tồn kho."
                actionLabel="Thêm sản phẩm"
                onAction={openCreate}
                search={search}
                onSearchChange={(value) => { setSearch(value); list.setPage(1); }}
                searchPlaceholder="Nhập mã hoặc tên hàng..."
                filters={
                    <div style={{ minWidth: 180 }}>
                        <Form.Label htmlFor="wc-filter-category" className="mb-1">
                            Nhóm hàng
                        </Form.Label>
                        <Form.Select
                            id="wc-filter-category"
                            size="sm"
                            value={categoryId}
                            onChange={(e) => { setCategoryId(e.target.value); list.setPage(1); }}
                        >
                            <option value="">Tất cả nhóm hàng</option>
                            {(categories.data?.items ?? []).map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </Form.Select>
                    </div>
                }
                isLoading={list.isLoading}
                error={list.error}
                total={list.meta?.total}
                page={list.page}
                totalPages={list.meta?.totalPages}
                onPageChange={list.setPage}
                skeletonColumns={8}
            >
                {/* wc-table-cards: dưới 768px mỗi dòng thành một thẻ dọc,
                    nhãn cột lấy từ data-label trên từng ô */}
                <Table hover className="wc-table-cards align-middle">
                    <caption className="wc-sr-only">
                        Danh sách sản phẩm, {list.meta?.total ?? 0} bản ghi
                    </caption>
                    <thead>
                        <tr>
                            <th scope="col">Mã hàng</th>
                            <th scope="col">Tên hàng</th>
                            <th scope="col">ĐVT</th>
                            <th scope="col">Nhóm hàng</th>
                            <th scope="col" className="text-end">Giá mua</th>
                            <th scope="col" className="text-end">Giá bán</th>
                            <th scope="col">Trạng thái</th>
                            <th scope="col" style={{ width: 150 }}>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {list.items.length === 0 &&
                            <ErpEmpty
                                colSpan={8}
                                filtered={!!search || !!categoryId}
                                onClearFilter={() => { setSearch(''); setCategoryId(''); }}
                                title="Chưa có sản phẩm nào"
                                hint="Thêm sản phẩm để bắt đầu tạo đơn mua và đơn bán."
                                actionLabel="Thêm sản phẩm đầu tiên"
                                onAction={openCreate}
                            />
                        }
                        {list.items.map(product => (
                            <tr key={product.id}>
                                <td data-label="Mã hàng" className="fw-medium">{product.code}</td>
                                <td data-label="Tên hàng">{product.name}</td>
                                <td data-label="ĐVT">{product.unit}</td>
                                <td data-label="Nhóm hàng">{product.category?.name ?? "—"}</td>
                                <td data-label="Giá mua" className="wc-num">{formatMoney(product.purchasePrice)}</td>
                                <td data-label="Giá bán" className="wc-num">{formatMoney(product.salePrice)}</td>
                                <td data-label="Trạng thái">
                                    {/* màu kèm chữ, không dựa riêng vào màu để truyền tin */}
                                    <Badge bg="" className={product.isActive ? "wc-badge-success" : "wc-badge-neutral"}>
                                        {product.isActive ? "Đang bán" : "Ngừng bán"}
                                    </Badge>
                                </td>
                                <td data-label="">
                                    <Button variant="outline-secondary" size="sm"
                                        onClick={() => openEdit(product)}
                                    >
                                        Sửa
                                        {/* tên riêng cho trình đọc màn hình, vì hàng chục
                                            nút "Sửa" giống nhau thì không phân biệt được */}
                                        <span className="wc-sr-only"> sản phẩm {product.name}</span>
                                    </Button>
                                    {product.isActive &&
                                        <Button variant="outline-danger" size="sm" className="ms-2"
                                            onClick={() => handleDeactivate(product)}
                                        >
                                            Ngừng
                                            <span className="wc-sr-only"> kinh doanh sản phẩm {product.name}</span>
                                        </Button>
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
                title={editing ? `Sửa sản phẩm: ${editing.name}` : "Thêm sản phẩm"}
                fields={fields}
                values={values}
                onChange={setValues}
                onSubmit={handleSubmit}
            />
        </>
    );
}

export default ProductsPage;
