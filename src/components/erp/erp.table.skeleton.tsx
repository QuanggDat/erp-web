'use client'

interface IProps {
    columns?: number;
    rows?: number;
}

//Khung xương hiện trong lúc chờ dữ liệu.
//Hiện đúng hình dạng của bảng sắp tới, nhờ vậy bố cục không nhảy khi
//dữ liệu về, và người dùng cảm thấy nhanh hơn so với nhìn màn hình trắng.
const ErpTableSkeleton = ({ columns = 6, rows = 5 }: IProps) => {
    return (
        <div>
            {/* thông báo cho trình đọc màn hình, không hiện trên giao diện */}
            <span className="wc-sr-only" role="status">Đang tải dữ liệu</span>

            {/* dòng tiêu đề */}
            <div className="d-flex gap-3 px-3 py-3 mb-1 rounded"
                style={{ backgroundColor: 'var(--wc-primary-wash)' }}
                aria-hidden="true"
            >
                {Array.from({ length: columns }).map((_, i) => (
                    <div key={i} className="wc-skeleton flex-grow-1"
                        style={{ height: 12 }} />
                ))}
            </div>

            {/* các dòng dữ liệu, độ rộng lệch nhau chút cho tự nhiên */}
            {Array.from({ length: rows }).map((_, r) => (
                <div key={r} className="d-flex gap-3 px-3 py-3 border-bottom"
                    aria-hidden="true"
                >
                    {Array.from({ length: columns }).map((_, c) => (
                        <div key={c} className="wc-skeleton flex-grow-1"
                            style={{
                                height: 14,
                                //cột cuối thường là nút thao tác, để hẹp hơn
                                maxWidth: c === columns - 1 ? 90 : undefined,
                                opacity: 1 - r * 0.12,
                            }}
                        />
                    ))}
                </div>
            ))}
        </div>
    );
}

export default ErpTableSkeleton;
