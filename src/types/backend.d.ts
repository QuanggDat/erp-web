//Khớp với model User ở back-end NestJS (bảng "users")
//back-end không bao giờ trả hashedPassword về client
interface IUser {
    id: number;
    email: string;
    firstName: string | null;
    lastName: string | null;
    role?: TRole; //back-end trả về từ khi thêm phân hệ ERP
    createdAt: string;
}

//Kết quả trả về khi login thành công
interface ILogin {
    accessToken: string;
}

//Back-end trả về dạng { items, meta } cho route có phân trang: GET /notes?page=1&limit=10
interface IPaginationMeta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

interface IPaginated<T> {
    items: T[];
    meta: IPaginationMeta;
}
