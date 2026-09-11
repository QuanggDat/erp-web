'use client'
import Pagination from 'react-bootstrap/Pagination';

interface IProps {
    page: number;
    totalPages: number;
    onChange: (page: number) => void;
}

//Tính dãy số trang hiển thị: luôn có trang đầu, trang cuối và vài trang quanh trang hiện tại
//Chỗ bị lược bớt được đánh dấu bằng "..."
const buildPageItems = (page: number, totalPages: number) => {
    const DELTA = 1; //số trang hiện ở mỗi bên của trang hiện tại
    const pages: number[] = [];

    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= page - DELTA && i <= page + DELTA)) {
            pages.push(i);
        }
    }

    const items: (number | "...")[] = [];
    let previous = 0;
    for (const current of pages) {
        if (previous && current - previous > 1) {
            items.push("...");
        }
        items.push(current);
        previous = current;
    }
    return items;
}

const AppPagination = (props: IProps) => {
    const { page, totalPages, onChange } = props;

    //chỉ có một trang (hoặc chưa có dữ liệu) thì không cần thanh phân trang
    if (totalPages <= 1) return null;

    return (
        //nav với nhãn để trình đọc màn hình biết đây là điều hướng phân trang.
        //Các nút mũi tên chỉ có biểu tượng nên cần aria-label mô tả bằng chữ.
        <nav aria-label="Phân trang">
            <Pagination className='mb-0'>
                <Pagination.First
                    disabled={page <= 1}
                    onClick={() => onChange(1)}
                    aria-label="Về trang đầu"
                />
                <Pagination.Prev
                    disabled={page <= 1}
                    onClick={() => onChange(page - 1)}
                    aria-label="Trang trước"
                />

                {buildPageItems(page, totalPages).map((item, index) => {
                    if (item === "...") {
                        return <Pagination.Ellipsis key={`gap-${index}`} disabled />
                    }
                    return (
                        <Pagination.Item
                            key={item}
                            active={item === page}
                            onClick={() => onChange(item)}
                            aria-label={`Trang ${item}`}
                            //aria-current cho biết đang ở trang nào
                            aria-current={item === page ? 'page' : undefined}
                        >{item}</Pagination.Item>
                    )
                })}

                <Pagination.Next
                    disabled={page >= totalPages}
                    onClick={() => onChange(page + 1)}
                    aria-label="Trang sau"
                />
                <Pagination.Last
                    disabled={page >= totalPages}
                    onClick={() => onChange(totalPages)}
                    aria-label="Tới trang cuối"
                />
            </Pagination>
        </nav>
    )
}

export default AppPagination;
