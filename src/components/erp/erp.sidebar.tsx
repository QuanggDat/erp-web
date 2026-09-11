'use client'
import Link from 'next/link';
import { usePathname } from 'next/navigation';

//Danh sách màn hình của ERP, gom theo nhóm cho dễ tìm.
//Năm nhóm là con số vừa phải: đủ để phân loại, chưa tới mức phải cuộn để đọc hết.
const MENU: { group: string; items: { href: string; label: string }[] }[] = [
    {
        group: "Tổng quan",
        items: [
            { href: "/erp", label: "Bảng điều khiển" },
            { href: "/erp/profit-report", label: "Báo cáo lãi lỗ" },
        ],
    },
    {
        group: "Danh mục",
        items: [
            { href: "/erp/products", label: "Sản phẩm" },
            { href: "/erp/categories", label: "Nhóm hàng" },
            { href: "/erp/partners", label: "Đối tác" },
        ],
    },
    {
        group: "Kho",
        items: [
            { href: "/erp/warehouses", label: "Danh sách kho" },
            { href: "/erp/stocks", label: "Tồn kho" },
            { href: "/erp/stock-movements", label: "Sổ nhập xuất" },
        ],
    },
    {
        group: "Chứng từ",
        items: [
            { href: "/erp/purchase-orders", label: "Mua hàng" },
            { href: "/erp/sales-orders", label: "Bán hàng" },
        ],
    },
    {
        group: "Nhân sự",
        items: [
            //Phân hệ nhân sự cố ý chỉ quản lý hồ sơ, tổ chức và chấm công.
            //Dữ liệu thu nhập là thông tin nhạy cảm, không nằm trong hệ thống này.
            { href: "/erp/employees", label: "Nhân viên" },
            { href: "/erp/departments", label: "Phòng ban & Chức danh" },
            { href: "/erp/attendances", label: "Chấm công" },
        ],
    },
];

const ErpSidebar = () => {
    const pathname = usePathname();

    //"/erp" chỉ khớp chính xác, các mục khác khớp cả đường dẫn con
    //nếu không thì "/erp" sẽ luôn sáng ở mọi màn hình ERP
    const isActive = (href: string) =>
        href === "/erp" ? pathname === href : pathname.startsWith(href);

    return (
        //nav với aria-label để trình đọc màn hình phân biệt với thanh trên
        <nav aria-label="Danh mục phân hệ">
            {MENU.map(section => {
                const titleId = `wc-menu-${section.group.replace(/\s+/g, '-')}`;
                return (
                    <div key={section.group} className="mb-3">
                        <h2 id={titleId} className="wc-group-title">
                            {section.group}
                        </h2>
                        {/* ul và li cho trình đọc màn hình biết đây là danh sách
                            và có bao nhiêu mục */}
                        <ul
                            className="list-unstyled mb-0 d-flex flex-column gap-1"
                            aria-labelledby={titleId}
                        >
                            {section.items.map(item => {
                                const active = isActive(item.href);
                                return (
                                    <li key={item.href}>
                                        <Link
                                            href={item.href}
                                            //màu và thanh chỉ báo nằm trong brand.css
                                            className={`nav-link ${active ? 'wc-active' : ''}`}
                                            //cho trình đọc màn hình biết đang ở trang nào
                                            aria-current={active ? 'page' : undefined}
                                        >
                                            {item.label}
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                );
            })}
        </nav>
    );
}

export default ErpSidebar;
