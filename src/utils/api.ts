//Địa chỉ back-end NestJS, khai báo trong file .env.local
export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

//Key dùng để lưu accessToken trong localStorage của trình duyệt
const TOKEN_KEY = "access_token";

export const saveToken = (token: string) => {
    localStorage.setItem(TOKEN_KEY, token);
}

export const getToken = () => {
    //localStorage chỉ tồn tại ở trình duyệt, không có ở phía server
    if (typeof window === "undefined") return null;
    return localStorage.getItem(TOKEN_KEY);
}

export const clearToken = () => {
    localStorage.removeItem(TOKEN_KEY);
}

//Hàm gọi API dùng chung: tự động gắn accessToken vào header Authorization
//Mọi route /notes ở back-end đều có @UseGuards(MyJwtGuard) nên bắt buộc phải có token
export const sendRequest = async <T>(props: {
    url: string;
    method: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
    body?: any;
}): Promise<T> => {
    const { url, method, body } = props;
    const token = getToken();

    const headers: Record<string, string> = {
        'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'application/json'
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(url, {
        method: method,
        headers: headers,
        body: body ? JSON.stringify(body) : undefined
    });

    //DELETE ở back-end trả về 204 No Content (không có body để đọc)
    if (res.status === 204) {
        return null as T;
    }

    const data = await res.json().catch(() => null);

    //res.ok = false khi back-end trả 400 / 401 / 403 / 404
    if (!res.ok) {
        //message của Nest có thể là string hoặc mảng string (lỗi từ ValidationPipe)
        const message = Array.isArray(data?.message)
            ? data.message.join(", ")
            : data?.message ?? "Có lỗi xảy ra, vui lòng thử lại";
        throw new Error(message);
    }

    return data as T;
}
