//Khớp với model Note ở back-end NestJS (bảng "notes")
interface IBlog {
    id: number;
    title: string;
    description: string;
    url: string;
    userId: number;
    createdAt: string;
    updatedAt: string;
}

//Khớp với model User ở back-end NestJS (bảng "users")
//back-end không bao giờ trả hashedPassword về client
interface IUser {
    id: number;
    email: string;
    firstName: string | null;
    lastName: string | null;
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
