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
        <Pagination className='justify-content-center mt-3'>
            <Pagination.First
                disabled={page <= 1}
                onClick={() => onChange(1)}
            />
            <Pagination.Prev
                disabled={page <= 1}
                onClick={() => onChange(page - 1)}
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
                    >{item}</Pagination.Item>
                )
            })}

            <Pagination.Next
                disabled={page >= totalPages}
                onClick={() => onChange(page + 1)}
            />
            <Pagination.Last
                disabled={page >= totalPages}
                onClick={() => onChange(totalPages)}
            />
        </Pagination>
    )
}

export default AppPagination;
