'use client'
import Link from 'next/link';
import { usePathname } from 'next/navigation';

//Tên tiếng Việt cho từng đoạn đường dẫn, để breadcrumb đọc được
//thay vì hiện chữ "stock-movements" thô
const LABELS: Record<string, string> = {
    products: 'Sản phẩm',
    categories: 'Nhóm hàng',
    partners: 'Đối tác',
    warehouses: 'Danh sách kho',
    stocks: 'Tồn kho',
    'stock-movements': 'Sổ nhập xuất',
    'purchase-orders': 'Mua hàng',
    'sales-orders': 'Bán hàng',
    employees: 'Nhân viên',
    departments: 'Phòng ban & Chức danh',
    attendances: 'Chấm công',
};

//Đường dẫn phân cấp, cho người dùng biết mình đang ở đâu và quay lại được.
//Ở bảng điều khiển thì không hiện vì đó đã là gốc rồi.
const ErpBreadcrumb = () => {
    const pathname = usePathname();
    const segment = pathname.split('/')[2];

    if (!segment) return null;

    const label = LABELS[segment] ?? segment;

    return (
        <nav aria-label="Đường dẫn" className="mb-3">
            <ol className="breadcrumb mb-0 small">
                <li className="breadcrumb-item">
                    <Link href="/erp">Bảng điều khiển</Link>
                </li>
                <li className="breadcrumb-item active" aria-current="page">
                    {label}
                </li>
            </ol>
        </nav>
    );
}

export default ErpBreadcrumb;
