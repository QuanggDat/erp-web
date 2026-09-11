import ErpAuthGuard from '@/components/erp/erp.auth.guard';
import ErpBreadcrumb from '@/components/erp/erp.breadcrumb';
import ErpSidebar from '@/components/erp/erp.sidebar';

//Layout riêng cho khu vực ERP.
//Trên điện thoại menu nằm trong khối gập lại được, nội dung lên trước;
//từ tablet trở lên menu cố định bên trái.
//Phần blog không dùng layout này nên vẫn giữ nguyên giao diện cũ.
export default function ErpLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        //đặt canh cửa ở layout để mọi màn hình ERP được bảo vệ một lần,
        //và để menu bên trái cũng không hiện khi chưa đăng nhập
        <ErpAuthGuard>
            <div className="row g-3">
                <aside className="col-12 col-md-4 col-lg-3 col-xl-2">
                    {/* Trên điện thoại: khối gập, mặc định đóng để nội dung
                        chính lên trước. details/summary là HTML thuần,
                        chạy được cả khi JavaScript chưa tải xong. */}
                    <details className="d-md-none wc-sidebar mb-2">
                        <summary
                            className="fw-semibold"
                            style={{ cursor: 'pointer', minHeight: 44, display: 'flex', alignItems: 'center' }}
                        >
                            Danh mục phân hệ
                        </summary>
                        <div className="mt-3">
                            <ErpSidebar />
                        </div>
                    </details>

                    {/* Từ tablet trở lên: menu luôn mở */}
                    <div className="d-none d-md-block wc-sidebar">
                        <ErpSidebar />
                    </div>
                </aside>

                <div className="col-12 col-md-8 col-lg-9 col-xl-10">
                    <ErpBreadcrumb />
                    {children}
                </div>
            </div>
        </ErpAuthGuard>
    );
}
