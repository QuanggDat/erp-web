'use client'
import Container from 'react-bootstrap/Container';
import { ToastContainer } from 'react-toastify';

//Container + ToastContainer phải nằm trong Client Component
//vì react-bootstrap và react-toastify dùng hook của React
const AppContainer = ({ children }: { children: React.ReactNode }) => {
    return (
        <>
            {/* main là mốc điều hướng cho trình đọc màn hình và cho
                liên kết "Bỏ qua tới nội dung" ở đầu trang.
                flex-grow đẩy chân trang xuống đáy thay vì tính chiều cao bằng tay */}
            <Container as="main" id="wc-main" className="flex-grow-1 py-4">
                {children}
            </Container>
            <ToastContainer
                position="bottom-center"
                autoClose={4000}
                newestOnTop
                closeOnClick
                pauseOnFocusLoss
                pauseOnHover
                theme="light"
                //trình đọc màn hình đọc thông báo ngay khi nó xuất hiện
                role="status"
            />
        </>
    )
}

export default AppContainer;
