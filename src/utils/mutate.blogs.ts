import { mutate } from "swr";
import { API_URL } from "./api";

//Mỗi trang là một key SWR riêng (.../notes?page=1&limit=10, ?page=2&limit=10, ...)
//nên sau khi thêm/sửa/xoá phải làm mới TẤT CẢ key bắt đầu bằng .../notes
//mutate nhận một hàm lọc key để làm việc đó
export const mutateBlogs = () => {
    return mutate(
        (key) => typeof key === "string" && key.startsWith(`${API_URL}/notes?`),
        undefined,
        { revalidate: true }
    );
}
