'use client'
import Badge from 'react-bootstrap/Badge';
import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import Button from 'react-bootstrap/Button';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { API_URL, clearToken, getToken, sendRequest } from '@/utils/api';
import { ROLE_LABEL } from '@/utils/erp';

const AppHeader = () => {
    const router = useRouter();
    //pathname đổi mỗi khi chuyển trang -> dùng để kiểm tra lại token
    const pathname = usePathname();
    const [user, setUser] = useState<IUser | null>(null);

    useEffect(() => {
        const token = getToken();
        if (!token) {
            setUser(null);
            return;
        }
        //gọi GET /users/me để lấy thông tin user đang đăng nhập
        sendRequest<IUser>({
            url: `${API_URL}/users/me`,
            method: "GET"
        })
            .then(res => setUser(res))
            //token hết hạn (back-end ký token chỉ sống 10 phút) thì coi như đã đăng xuất
            .catch(() => {
                clearToken();
                setUser(null);
            });
    }, [pathname]);

    const handleLogout = () => {
        clearToken();
        setUser(null);
        toast.success("Đăng xuất thành công !");
        router.push("/auth/login");
    }

    return (
        <Navbar expand="lg" className="wc-navbar" variant="dark">
            <Container>
                {/* logo, đường kẻ, tên hệ thống: xếp giống app nội bộ công ty */}
                <Navbar.Brand
                    as={Link}
                    href="/erp"
                    className="d-flex align-items-center gap-2 fw-semibold"
                >
                    {/* dùng thẻ img thường chứ không phải next/image:
                        đây là ảnh SVG tĩnh nhỏ, không cần tối ưu kích thước */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/logo.svg" alt="" width={30} height={30} />
                    <span className="wc-brand-divider d-none d-sm-block" />
                    <span>Wecare ERP</span>
                </Navbar.Brand>
                <Navbar.Toggle aria-controls="basic-navbar-nav" />
                <Navbar.Collapse id="basic-navbar-nav">
                    {/* menu các phân hệ nằm ở thanh bên trái của khu vực ERP */}
                    <Nav className="me-auto" />
                    <Nav className="align-items-lg-center">
                        {user
                            ?
                            <>
                                <Navbar.Text className='me-3'>
                                    {user.email}
                                    {/* vai trò quyết định người dùng thao tác được gì, nên hiện luôn */}
                                    {user.role &&
                                        <Badge bg='light' text='dark' className='ms-2 fw-normal'>
                                            {ROLE_LABEL[user.role]}
                                        </Badge>
                                    }
                                </Navbar.Text>
                                {/* nút viền trắng thay vì viền đỏ: trên nền xanh đậm
                                    màu đỏ chỏi và trông như một cảnh báo lỗi */}
                                <Button variant='outline-light' size='sm'
                                    onClick={() => handleLogout()}
                                >Đăng xuất</Button>
                            </>
                            :
                            <>
                                <Link href={"/auth/login"} className='nav-link'>
                                    Đăng nhập
                                </Link>
                                <Link href={"/auth/register"} className='nav-link'>
                                    Đăng ký
                                </Link>
                            </>
                        }
                    </Nav>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    );
}

export default AppHeader;
