'use client'
import { Alert, Button, Card, Form } from 'react-bootstrap';
import AppPagination from '../app.pagination';
import ErpTableSkeleton from './erp.table.skeleton';

interface IProps {
    title: string;
    //một câu nói rõ màn hình này dùng để làm gì; giúp người mới hiểu ngay
    description?: string;
    //nút hành động chính, mỗi màn hình chỉ có MỘT nút loại này
    actionLabel?: string;
    onAction?: () => void;
    //ô tìm kiếm, bỏ trống thì không hiện
    search?: string;
    onSearchChange?: (value: string) => void;
    searchPlaceholder?: string;
    //bộ lọc riêng của từng màn hình, ví dụ chọn kho hoặc trạng thái
    filters?: React.ReactNode;
    isLoading?: boolean;
    error?: any;
    //số bản ghi để hiện dòng "Tổng N bản ghi"
    total?: number;
    page?: number;
    totalPages?: number;
    onPageChange?: (page: number) => void;
    //số cột của bảng, để khung xương lúc tải có đúng hình dạng
    skeletonColumns?: number;
    children: React.ReactNode;
}

//Khung chung cho mọi màn hình danh sách của ERP.
//Gom tiêu đề, mô tả, ô tìm kiếm, trạng thái tải, báo lỗi và thanh phân trang
//để từng màn hình chỉ còn phải lo phần bảng dữ liệu của riêng nó.
const ErpPage = (props: IProps) => {
    const {
        title, description, actionLabel, onAction,
        search, onSearchChange, searchPlaceholder,
        filters, isLoading, error,
        total, page, totalPages, onPageChange,
        skeletonColumns = 6,
        children,
    } = props;

    //phiên hết hạn là chuyện thường gặp, tách riêng để nói bằng ngôn ngữ
    //người dùng thay vì hiện chữ "Unauthorized" của máy
    const expired = error?.message === 'Unauthorized';

    return (
        <Card>
            <Card.Header className="wc-card-header">
                <div className="d-flex justify-content-between align-items-start flex-wrap gap-3">
                    <div>
                        {/* h1 vì đây là tiêu đề chính của màn hình,
                            trình đọc màn hình dựa vào cấp heading để điều hướng */}
                        <h1 className="h5 mb-0">{title}</h1>
                        {description &&
                            <p className="text-muted small mb-0 mt-1 wc-prose">
                                {description}
                            </p>
                        }
                    </div>
                    {actionLabel && onAction &&
                        <Button variant="primary" onClick={onAction}>
                            {actionLabel}
                        </Button>
                    }
                </div>
            </Card.Header>

            {(onSearchChange || filters) &&
                <div className="px-3 py-3 border-bottom bg-white">
                    <div className="d-flex flex-wrap gap-2 align-items-end">
                        {onSearchChange &&
                            <div style={{ minWidth: 220, flexGrow: 1, maxWidth: 320 }}>
                                {/* nhãn thật gắn với ô nhập, không dùng placeholder
                                    làm nhãn vì chữ biến mất ngay khi bắt đầu gõ */}
                                <Form.Label htmlFor="wc-search" className="mb-1">
                                    Tìm kiếm
                                </Form.Label>
                                <Form.Control
                                    id="wc-search"
                                    type="search"
                                    size="sm"
                                    placeholder={searchPlaceholder ?? 'Nhập mã hoặc tên...'}
                                    value={search ?? ''}
                                    onChange={(e) => onSearchChange(e.target.value)}
                                />
                            </div>
                        }
                        {filters}
                    </div>
                </div>
            }

            <Card.Body className="p-3">
                {error &&
                    <Alert variant={expired ? 'warning' : 'danger'}>
                        <div className="fw-semibold">
                            {expired
                                ? 'Phiên đăng nhập đã hết hạn'
                                : 'Không tải được dữ liệu'}
                        </div>
                        <div className="small mt-1">
                            {expired
                                ? 'Vui lòng đăng nhập lại để tiếp tục.'
                                : (error.message ?? 'Vui lòng thử lại sau ít phút.')}
                        </div>
                        {expired &&
                            <a href="/auth/login" className="btn btn-sm btn-primary mt-2">
                                Đăng nhập lại
                            </a>
                        }
                    </Alert>
                }

                {/* aria-busy cho trình đọc màn hình biết vùng này đang tải */}
                <div aria-busy={isLoading ? 'true' : 'false'}>
                    {isLoading
                        ? <ErpTableSkeleton columns={skeletonColumns} />
                        : children
                    }
                </div>

                {!isLoading && total !== undefined &&
                    <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mt-3">
                        <span className="text-muted small">
                            Tổng {total.toLocaleString('vi-VN')} bản ghi
                        </span>
                        {page !== undefined && totalPages !== undefined && onPageChange &&
                            <AppPagination
                                page={page}
                                totalPages={totalPages}
                                onChange={onPageChange}
                            />
                        }
                    </div>
                }
            </Card.Body>
        </Card>
    );
}

export default ErpPage;
