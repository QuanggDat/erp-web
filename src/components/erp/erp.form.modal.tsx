'use client'
import { useEffect, useState } from 'react';
import { Alert, Button, Form, Modal, Spinner } from 'react-bootstrap';

//Mô tả một ô nhập; danh sách các ô này quyết định hình dạng biểu mẫu
export interface IField {
    name: string;
    label: string;
    type?: 'text' | 'number' | 'date' | 'email' | 'select' | 'textarea';
    required?: boolean;
    //chỉ dùng cho type "select"
    options?: { value: string | number; label: string }[];
    placeholder?: string;
    //dòng gợi ý dưới ô nhập, giải thích cách điền hoặc điều gì sẽ xảy ra
    hint?: string;
    //ô chiếm nửa hàng thay vì cả hàng, dùng để xếp hai ô cạnh nhau
    half?: boolean;
    //khoá không cho sửa, ví dụ mã phiếu khi đang xem lại
    disabled?: boolean;
}

interface IProps {
    show: boolean;
    onHide: () => void;
    title: string;
    fields: IField[];
    //giá trị ban đầu; sửa thì truyền bản ghi hiện có, thêm mới thì để trống
    values: Record<string, any>;
    onChange: (values: Record<string, any>) => void;
    //hàm gọi API, ném lỗi thì modal giữ nguyên để người dùng sửa lại
    onSubmit: () => Promise<void>;
    submitLabel?: string;
    //nội dung thêm phía dưới các ô, ví dụ bảng chi tiết dòng hàng
    extra?: React.ReactNode;
    size?: 'sm' | 'lg' | 'xl';
}

//Modal biểu mẫu dùng chung cho mọi màn hình ERP.
//Nhận danh sách ô nhập rồi tự dựng giao diện, nhờ vậy không phải
//viết lại cùng một modal cho từng bảng dữ liệu.
const ErpFormModal = (props: IProps) => {
    const {
        show, onHide, title, fields, values, onChange,
        onSubmit, submitLabel, extra, size,
    } = props;

    const [saving, setSaving] = useState<boolean>(false);
    //lỗi của từng ô, hiện ngay dưới ô đó thay vì gom vào một thông báo chung
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    //lỗi từ server, ví dụ mã trùng; hiện ở đầu biểu mẫu
    const [formError, setFormError] = useState<string>('');

    //mở lại modal thì xoá hết lỗi cũ, tránh hiện lỗi của lần nhập trước
    useEffect(() => {
        if (show) {
            setFieldErrors({});
            setFormError('');
        }
    }, [show]);

    const validate = () => {
        const errors: Record<string, string> = {};
        fields
            .filter(f => f.required && !f.disabled)
            .forEach(f => {
                const v = values[f.name];
                if (v === undefined || v === null || v === '') {
                    errors[f.name] = `Vui lòng nhập ${f.label.toLowerCase()}`;
                }
            });
        setFieldErrors(errors);
        return errors;
    }

    const handleSubmit = async () => {
        setFormError('');
        const errors = validate();

        if (Object.keys(errors).length > 0) {
            //đưa con trỏ về ô sai đầu tiên để người dùng sửa được ngay,
            //không phải tự đi tìm xem chỗ nào thiếu
            const firstName = fields.find(f => errors[f.name])?.name;
            if (firstName) {
                document.getElementById(`wc-field-${firstName}`)?.focus();
            }
            return;
        }

        setSaving(true);
        try {
            await onSubmit();
            onHide();
        } catch (error: any) {
            //giữ modal mở để người dùng sửa lại dữ liệu vừa nhập
            setFormError(error.message ?? 'Không lưu được, vui lòng thử lại.');
        } finally {
            setSaving(false);
        }
    }

    const setValue = (name: string, value: any) => {
        onChange({ ...values, [name]: value });
        //người dùng bắt đầu sửa thì lỗi của ô đó biến mất ngay,
        //không bắt họ bấm Lưu lần nữa mới biết đã đúng chưa
        if (fieldErrors[name]) {
            setFieldErrors(prev => {
                const next = { ...prev };
                delete next[name];
                return next;
            });
        }
    }

    const renderField = (field: IField) => {
        const value = values[field.name] ?? '';
        const invalid = !!fieldErrors[field.name];
        const id = `wc-field-${field.name}`;
        //trỏ trình đọc màn hình tới dòng gợi ý và dòng lỗi của chính ô này
        const describedBy = [
            field.hint ? `${id}-hint` : null,
            invalid ? `${id}-error` : null,
        ].filter(Boolean).join(' ') || undefined;

        const common = {
            id,
            disabled: field.disabled,
            isInvalid: invalid,
            'aria-describedby': describedBy,
            'aria-required': field.required ? true : undefined,
        };

        if (field.type === 'select') {
            return (
                <Form.Select
                    {...common}
                    value={value}
                    onChange={(e) => setValue(field.name, e.target.value)}
                >
                    <option value="">-- Chọn --</option>
                    {(field.options ?? []).map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </Form.Select>
            );
        }

        if (field.type === 'textarea') {
            return (
                <Form.Control
                    {...common}
                    as="textarea"
                    rows={2}
                    value={value}
                    placeholder={field.placeholder}
                    onChange={(e) => setValue(field.name, e.target.value)}
                />
            );
        }

        return (
            <Form.Control
                {...common}
                type={field.type ?? 'text'}
                value={value}
                placeholder={field.placeholder}
                onChange={(e) => setValue(field.name, e.target.value)}
            />
        );
    }

    return (
        <Modal show={show} onHide={onHide} size={size ?? 'lg'} backdrop="static" centered>
            <Modal.Header closeButton>
                <Modal.Title as="h2" className="h5">{title}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {formError &&
                    //role="alert" để trình đọc màn hình đọc ngay khi lỗi xuất hiện
                    <Alert variant="danger" role="alert" className="py-2">
                        {formError}
                    </Alert>
                }

                <Form noValidate>
                    <div className="row g-3">
                        {fields.map(field => {
                            const id = `wc-field-${field.name}`;
                            return (
                                <div key={field.name} className={field.half ? 'col-md-6' : 'col-12'}>
                                    <Form.Group>
                                        {/* nhãn thật gắn với ô qua htmlFor, bấm vào nhãn
                                            là con trỏ nhảy vào ô */}
                                        <Form.Label htmlFor={id}>
                                            {field.label}
                                            {field.required &&
                                                <span className="text-danger ms-1" aria-hidden="true">*</span>
                                            }
                                            {field.required &&
                                                <span className="wc-sr-only"> (bắt buộc)</span>
                                            }
                                        </Form.Label>
                                        {renderField(field)}
                                        {field.hint && !fieldErrors[field.name] &&
                                            <Form.Text id={`${id}-hint`} className="text-muted">
                                                {field.hint}
                                            </Form.Text>
                                        }
                                        {fieldErrors[field.name] &&
                                            <span id={`${id}-error`} className="wc-field-error" role="alert">
                                                {fieldErrors[field.name]}
                                            </span>
                                        }
                                    </Form.Group>
                                </div>
                            );
                        })}
                    </div>
                    {extra}
                </Form>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="outline-secondary" onClick={onHide} disabled={saving}>
                    Huỷ
                </Button>
                <Button variant="primary" onClick={handleSubmit} disabled={saving}>
                    {saving &&
                        <Spinner animation="border" size="sm" className="me-2" aria-hidden="true" />
                    }
                    {saving ? 'Đang lưu...' : (submitLabel ?? 'Lưu')}
                </Button>
            </Modal.Footer>
        </Modal>
    );
}

export default ErpFormModal;
