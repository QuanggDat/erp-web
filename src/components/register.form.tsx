'use client'
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import Form from 'react-bootstrap/Form';
import Spinner from 'react-bootstrap/Spinner';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { API_URL, sendRequest } from '@/utils/api';

type TErrors = {
    email?: string;
    password?: string;
    confirmPassword?: string;
};

const RegisterForm = () => {
    const router = useRouter();

    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [confirmPassword, setConfirmPassword] = useState<string>('');
    const [errors, setErrors] = useState<TErrors>({});
    const [formError, setFormError] = useState<string>('');
    const [submitting, setSubmitting] = useState<boolean>(false);

    const clearError = (field: keyof TErrors) => {
        if (errors[field]) setErrors(p => ({ ...p, [field]: undefined }));
    }

    const handleSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault();
        setFormError('');

        const next: TErrors = {};
        if (!email.trim()) {
            next.email = 'Vui lòng nhập email';
        } else if (!email.includes('@')) {
            next.email = 'Email chưa đúng định dạng, ví dụ ten@congty.vn';
        }
        //back-end validate @MinLength(6), kiểm tra trước ở đây cho đỡ mất công gọi API
        if (!password) {
            next.password = 'Vui lòng nhập mật khẩu';
        } else if (password.length < 6) {
            next.password = 'Mật khẩu phải có ít nhất 6 ký tự';
        }
        if (password && confirmPassword !== password) {
            next.confirmPassword = 'Hai lần nhập mật khẩu chưa khớp';
        }
        setErrors(next);

        if (Object.keys(next).length > 0) {
            const first = next.email ? 'email' : next.password ? 'password' : 'confirm';
            document.getElementById(`register-${first}`)?.focus();
            return;
        }

        setSubmitting(true);
        try {
            //POST /auth/register -> back-end trả về { id, email, createdAt }
            const res = await sendRequest<IUser>({
                url: `${API_URL}/auth/register`,
                method: 'POST',
                body: { email: email.trim(), password },
            });

            if (res?.id) {
                toast.success('Đăng ký thành công, mời bạn đăng nhập');
                router.push('/auth/login');
            }
        } catch (error: any) {
            //email đã tồn tại thì back-end trả 403 "Email already exists"
            if (error.message === 'Email already exists') {
                setErrors({ email: 'Email này đã được đăng ký' });
                document.getElementById('register-email')?.focus();
            } else {
                setFormError(error.message ?? 'Không đăng ký được, vui lòng thử lại.');
            }
            setSubmitting(false);
        }
    }

    return (
        <Card className="mt-5 mx-auto" style={{ maxWidth: 420 }}>
            <Card.Body className="text-center pt-4 pb-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo.svg" alt="" width={48} height={48} />
                <h1 className="h5 mt-3 mb-1">Tạo tài khoản</h1>
                <p className="text-muted mb-0" style={{ fontSize: 'var(--wc-text-sm)' }}>
                    Tài khoản mới chỉ xem được dữ liệu. Quản trị viên sẽ cấp quyền sau.
                </p>
            </Card.Body>

            <Card.Body>
                {formError &&
                    <Alert variant="danger" role="alert" className="py-2">
                        {formError}
                    </Alert>
                }

                <Form noValidate onSubmit={handleSubmit}>
                    <Form.Group className="mb-3">
                        <Form.Label htmlFor="register-email">Email</Form.Label>
                        <Form.Control
                            id="register-email"
                            name="email"
                            type="email"
                            autoComplete="username"
                            autoFocus
                            placeholder="ten@congty.vn"
                            value={email}
                            isInvalid={!!errors.email}
                            aria-describedby={errors.email ? 'register-email-error' : undefined}
                            onChange={(e) => { setEmail(e.target.value); clearError('email'); }}
                        />
                        {errors.email &&
                            <span id="register-email-error" className="wc-field-error" role="alert">
                                {errors.email}
                            </span>
                        }
                    </Form.Group>

                    <Form.Group className="mb-3">
                        <Form.Label htmlFor="register-password">Mật khẩu</Form.Label>
                        <Form.Control
                            id="register-password"
                            name="password"
                            type="password"
                            autoComplete="new-password"
                            value={password}
                            isInvalid={!!errors.password}
                            aria-describedby={
                                errors.password ? 'register-password-error' : 'register-password-hint'
                            }
                            onChange={(e) => { setPassword(e.target.value); clearError('password'); }}
                        />
                        {errors.password
                            ? <span id="register-password-error" className="wc-field-error" role="alert">
                                {errors.password}
                            </span>
                            //yêu cầu về mật khẩu nói TRƯỚC khi người dùng gõ,
                            //không để họ nhập xong mới báo là sai
                            : <Form.Text id="register-password-hint" className="text-muted">
                                Tối thiểu 6 ký tự.
                            </Form.Text>
                        }
                    </Form.Group>

                    <Form.Group className="mb-4">
                        <Form.Label htmlFor="register-confirm">Nhập lại mật khẩu</Form.Label>
                        <Form.Control
                            id="register-confirm"
                            name="confirmPassword"
                            type="password"
                            autoComplete="new-password"
                            value={confirmPassword}
                            isInvalid={!!errors.confirmPassword}
                            aria-describedby={errors.confirmPassword ? 'register-confirm-error' : undefined}
                            onChange={(e) => {
                                setConfirmPassword(e.target.value);
                                clearError('confirmPassword');
                            }}
                        />
                        {errors.confirmPassword &&
                            <span id="register-confirm-error" className="wc-field-error" role="alert">
                                {errors.confirmPassword}
                            </span>
                        }
                    </Form.Group>

                    <Button
                        variant="primary"
                        type="submit"
                        className="w-100"
                        disabled={submitting}
                    >
                        {submitting &&
                            <Spinner animation="border" size="sm" className="me-2" aria-hidden="true" />
                        }
                        {submitting ? 'Đang tạo tài khoản...' : 'Đăng ký'}
                    </Button>
                </Form>
            </Card.Body>

            <Card.Footer className="text-muted text-center">
                Đã có tài khoản? <Link href="/auth/login">Đăng nhập</Link>
            </Card.Footer>
        </Card>
    )
}

export default RegisterForm;
