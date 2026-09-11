'use client'
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Spinner } from 'react-bootstrap';
import { getToken } from '@/utils/api';

//Canh cửa cho toàn bộ khu vực ERP.
//Mọi route ERP ở back-end đều có guard, chưa đăng nhập thì gọi API nào cũng
//nhận 401. Chặn ngay từ đây để người dùng không phải nhìn một màn hình đầy
//lỗi rồi mới hiểu là mình cần đăng nhập.
const ErpAuthGuard = ({ children }: { children: React.ReactNode }) => {
    const router = useRouter();

    //localStorage chỉ đọc được ở trình duyệt, không có khi Next dựng HTML,
    //nên phải chờ lần render đầu tiên rồi mới biết có token hay không
    const [checked, setChecked] = useState<boolean>(false);
    const [hasToken, setHasToken] = useState<boolean>(false);

    useEffect(() => {
        const token = getToken();
        if (!token) {
            router.replace('/auth/login');
        }
        setHasToken(!!token);
        setChecked(true);
    }, [router]);

    //trong lúc chờ kiểm tra, và trong lúc chuyển sang trang đăng nhập,
    //không hiện menu hay nội dung để tránh nhấp nháy
    if (!checked || !hasToken) {
        return (
            <div className='text-center py-5'>
                <Spinner animation='border' size='sm' />
                <span className='ms-2 text-muted'>Đang kiểm tra đăng nhập...</span>
            </div>
        );
    }

    return <>{children}</>;
}

export default ErpAuthGuard;
