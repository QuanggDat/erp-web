'use client'
import { Button } from 'react-bootstrap';

interface IProps {
    colSpan: number;
    //trường hợp chưa có dữ liệu nào
    title?: string;
    hint?: string;
    //nút đưa người dùng tới bước tiếp theo, ví dụ "Thêm sản phẩm đầu tiên"
    actionLabel?: string;
    onAction?: () => void;
    //true khi bảng trống vì bộ lọc, không phải vì chưa có dữ liệu
    filtered?: boolean;
    onClearFilter?: () => void;
}

//Dòng hiện khi bảng không có dữ liệu.
//Phân biệt hai trường hợp khác hẳn nhau: chưa có gì để hiện, và
//có dữ liệu nhưng bộ lọc đang che hết. Mỗi trường hợp cần một lối đi khác.
const ErpEmpty = (props: IProps) => {
    const {
        colSpan, title, hint, actionLabel, onAction,
        filtered, onClearFilter,
    } = props;

    return (
        <tr>
            <td colSpan={colSpan} className="wc-empty" data-label="">
                {filtered
                    ? <>
                        <p className="wc-empty-title">Không tìm thấy kết quả phù hợp</p>
                        <p className="small mb-0">
                            Thử đổi từ khoá hoặc bỏ bớt bộ lọc.
                        </p>
                        {onClearFilter &&
                            <Button variant="outline-secondary" size="sm"
                                className="mt-3"
                                onClick={onClearFilter}
                            >
                                Xoá bộ lọc
                            </Button>
                        }
                    </>
                    : <>
                        <p className="wc-empty-title">{title ?? 'Chưa có dữ liệu'}</p>
                        {hint &&
                            <p className="small mb-0">{hint}</p>
                        }
                        {actionLabel && onAction &&
                            <Button variant="primary" size="sm"
                                className="mt-3"
                                onClick={onAction}
                            >
                                {actionLabel}
                            </Button>
                        }
                    </>
                }
            </td>
        </tr>
    );
}

export default ErpEmpty;
