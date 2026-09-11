import { API_URL } from "./api";

//Tạo key SWR cho một danh sách có phân trang
//Mỗi tổ hợp trang, giới hạn và bộ lọc là một cache riêng của SWR
export const listKey = (
    path: string,
    page: number,
    limit: number,
    filters?: Record<string, string | number | boolean | undefined>
) => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", String(limit));
    //bỏ qua bộ lọc rỗng để URL không có tham số thừa
    Object.entries(filters ?? {}).forEach(([key, value]) => {
        if (value !== undefined && value !== "") {
            params.set(key, String(value));
        }
    });
    return `${API_URL}${path}?${params.toString()}`;
}

//Định dạng tiền theo kiểu Việt Nam: 1200000 thành "1.200.000"
//Back-end trả Decimal dưới dạng chuỗi nên nhận cả string lẫn number
export const formatMoney = (value: string | number | null | undefined) => {
    if (value === null || value === undefined || value === "") return "0";
    const parsed = Number(value);
    if (Number.isNaN(parsed)) return String(value);
    return parsed.toLocaleString("vi-VN");
}

//Số lượng có thể lẻ tới ba chữ số thập phân, nhưng thường là số nguyên
//Cắt bỏ phần thập phân bằng 0 cho dễ đọc: "10.000" thành "10"
export const formatQuantity = (value: string | number | null | undefined) => {
    if (value === null || value === undefined || value === "") return "0";
    const parsed = Number(value);
    if (Number.isNaN(parsed)) return String(value);
    return parsed.toLocaleString("vi-VN", { maximumFractionDigits: 3 });
}

//Ngày từ back-end ở dạng ISO, hiển thị theo kiểu ngày/tháng/năm
export const formatDate = (value: string | null | undefined) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleDateString("vi-VN");
}

//Chuyển ngày ISO sang định dạng mà thẻ input type="date" hiểu được
export const toDateInput = (value: string | null | undefined) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toISOString().slice(0, 10);
}

//Nhãn tiếng Việt và màu badge cho trạng thái chứng từ
export const ORDER_STATUS_LABEL: Record<TOrderStatus, string> = {
    DRAFT: "Nháp",
    CONFIRMED: "Đã xác nhận",
    CANCELLED: "Đã huỷ",
}

//Tên hậu tố của lớp badge trong brand.css, ví dụ "wc-badge-success".
//Mỗi lớp có màu nền, màu chữ và viền riêng, đều đạt tương phản 4.5:1.
export const ORDER_STATUS_VARIANT: Record<TOrderStatus, string> = {
    DRAFT: "neutral",
    CONFIRMED: "success",
    CANCELLED: "danger",
}

export const PARTNER_TYPE_LABEL: Record<TPartnerType, string> = {
    CUSTOMER: "Khách hàng",
    SUPPLIER: "Nhà cung cấp",
    BOTH: "Cả hai",
}

export const MOVEMENT_TYPE_LABEL: Record<TMovementType, string> = {
    IN: "Nhập kho",
    OUT: "Xuất kho",
    ADJUST: "Điều chỉnh",
}

export const MOVEMENT_TYPE_VARIANT: Record<TMovementType, string> = {
    IN: "success",
    OUT: "warning",
    ADJUST: "neutral",
}

export const ROLE_LABEL: Record<TRole, string> = {
    ADMIN: "Quản trị",
    SALES: "Bán hàng",
    PURCHASE: "Mua hàng",
    WAREHOUSE: "Kho",
    HR: "Nhân sự",
    VIEWER: "Chỉ xem",
}

//Sinh số phiếu gợi ý theo ngày giờ, ví dụ PO-260910-1435
//Người dùng vẫn sửa được, đây chỉ là giá trị điền sẵn cho đỡ phải nghĩ
export const suggestCode = (prefix: string) => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const datePart = `${String(now.getFullYear()).slice(2)}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
    const timePart = `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
    return `${prefix}-${datePart}-${timePart}`;
}
