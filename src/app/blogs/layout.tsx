import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Quản lý Blog',
    description: 'Danh sách blog của bạn',
}

export default function BlogLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <>
            {/* Blog nằm ngoài khu vực ERP nên không có thanh menu bên trái,
                thêm một lối quay về để người dùng không bị mắc kẹt ở đây */}
            <div className='mt-3'>
                <Link href='/erp' className='text-decoration-none small'>
                    &larr; Về hệ thống ERP
                </Link>
            </div>
            {children}
        </>
    )
}
