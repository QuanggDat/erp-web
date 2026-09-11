'use client'
import Container from 'react-bootstrap/Container';

const AppFooter = () => {
    const year = new Date().getFullYear();

    return (
        //nền tối kèm viền trên màu thương hiệu, giống chân trang app nội bộ
        <div className='wc-footer py-3 mt-4'>
            <Container>
                <div className='d-flex flex-wrap justify-content-between align-items-center gap-2 small'>
                    <span>
                        <span className='wc-footer-brand fw-semibold'>Wecare ERP</span>
                        <span className='wc-footer-muted ms-2'>
                            Sản phẩm · Mua hàng · Bán hàng · Kho · Nhân sự
                        </span>
                    </span>
                    <span className='wc-footer-muted'>
                        &copy; {year} &middot; Next.js + NestJS
                    </span>
                </div>
            </Container>
        </div>
    );
}

export default AppFooter;
