'use client'
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import Form from 'react-bootstrap/Form';
import Spinner from 'react-bootstrap/Spinner';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { API_URL, saveToken, sendRequest } from '@/utils/api';

const LoginForm = () => {
    const router = useRouter();

    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
    const [formError, setFormError] = useState<string>('');
    const [submitting, setSubmitting] = useState<boolean>(false);

    const handleSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault();
        setFormError('');

        //kiểm tra ngay tại trình duyệt, lỗi hiện dưới đúng ô sai
        const next: { email?: string; password?: string } = {};
        if (!email.trim()) {
            next.email = 'Vui lòng nhập email';
        } else if (!email.includes('@')) {
            next.email = 'Email chưa đúng định dạng, ví dụ ten@congty.vn';
        }
        if (!password) {
            next.password = 'Vui lòng nhập mật khẩu';
        }
        setErrors(next);

        if (Object.keys(next).length > 0) {
            //đưa con trỏ về ô sai đầu tiên
            document.getElementById(next.email ? 'login-email' : 'login-password')?.focus();
            return;
        }

        setSubmitting(true);
        try {
            //POST /auth/login -> back-end trả về { accessToken: "..." }
            const res = await sendRequest<ILogin>({
                url: `${API_URL}/auth/login`,
                method: 'POST',
                body: { email: email.trim(), password },
            });

            if (res?.accessToken) {
                //lưu token lại để các request sau gắn vào header Authorization
                saveToken(res.accessToken);
                router.push('/erp');
                //làm mới header để hiện email user vừa đăng nhập
                router.refresh();
            }
        } catch (error: any) {
            //back-end trả 403 kèm "User not found" hoặc "Incorrect password".
            //Không nói rõ sai email hay sai mật khẩu, vì như vậy là tiết lộ
            //email nào có tồn tại trong hệ thống.
            setFormError(
                error.message === 'User not found' || error.message === 'Incorrect password'
                    ? 'Email hoặc mật khẩu không đúng.'
                    : (error.message ?? 'Không đăng nhập được, vui lòng thử lại.')
            );
            setSubmitting(false);
        }
    }

    return (
        <Card className="mt-5 mx-auto" style={{ maxWidth: 420 }}>
            <Card.Body className="text-center pt-4 pb-0">
                {/* logo để người dùng biết mình đang vào hệ thống nào.
                    alt rỗng vì tên hệ thống đã có ngay bên dưới, đọc hai lần là thừa */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo.svg" alt="" width={48} height={48} />
                <h1 className="h5 mt-3 mb-1">Wecare ERP</h1>
                <p className="text-muted mb-0" style={{ fontSize: 'var(--wc-text-sm)' }}>
                    Đăng nhập để quản lý sản phẩm, mua bán, kho và nhân sự
                </p>
            </Card.Body>

            <Card.Body>
                {formError &&
                    <Alert variant="danger" role="alert" className="py-2">
                        {formError}
                    </Alert>
                }

                {/* form thật với onSubmit: nhấn Enter ở bất kỳ ô nào cũng gửi được,
                    và trình duyệt gợi ý lưu mật khẩu đúng cách */}
                <Form noValidate onSubmit={handleSubmit}>
                    <Form.Group className="mb-3">
                        <Form.Label htmlFor="login-email">Email</Form.Label>
                        <Form.Control
                            id="login-email"
                            name="email"
                            type="email"
                            autoComplete="username"
                            autoFocus
                            placeholder="ten@congty.vn"
                            value={email}
                            isInvalid={!!errors.email}
                            aria-describedby={errors.email ? 'login-email-error' : undefined}
                            onChange={(e) => {
                                setEmail(e.target.value);
                                if (errors.email) setErrors(p => ({ ...p, email: undefined }));
                            }}
                        />
                        {errors.email &&
                            <span id="login-email-error" className="wc-field-error" role="alert">
                                {errors.email}
                            </span>
                        }
                    </Form.Group>

                    <Form.Group className="mb-4">
                        <Form.Label htmlFor="login-password">Mật khẩu</Form.Label>
                        <Form.Control
                            id="login-password"
                            name="password"
                            type="password"
                            autoComplete="current-password"
                            value={password}
                            isInvalid={!!errors.password}
                            aria-describedby={errors.password ? 'login-password-error' : undefined}
                            onChange={(e) => {
                                setPassword(e.target.value);
                                if (errors.password) setErrors(p => ({ ...p, password: undefined }));
                            }}
                        />
                        {errors.password &&
                            <span id="login-password-error" className="wc-field-error" role="alert">
                                {errors.password}
                            </span>
                        }
                    </Form.Group>

                    {/* một hành động chính duy nhất trên màn hình này */}
                    <Button
                        variant="primary"
                        type="submit"
                        className="w-100"
                        disabled={submitting}
                    >
                        {submitting &&
                            <Spinner animation="border" size="sm" className="me-2" aria-hidden="true" />
                        }
                        {submitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
                    </Button>
                </Form>
            </Card.Body>

            <Card.Footer className="text-muted text-center">
                Chưa có tài khoản? <Link href="/auth/register">Đăng ký ngay</Link>
            </Card.Footer>
        </Card>
    )
}

export default LoginForm;
