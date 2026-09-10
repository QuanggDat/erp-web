'use client'
import { useState } from "react";
import useSWR from "swr";
import { sendRequest } from "./api";
import { listKey } from "./erp";

//Hook dùng chung cho MỌI màn hình danh sách của ERP
//Gom việc phân trang, tìm kiếm và gọi API vào một chỗ,
//nhờ vậy sáu màn hình không phải lặp lại cùng một đoạn code
export const useErpList = <T,>(
    path: string,
    filters?: Record<string, string | number | boolean | undefined>,
    limit: number = 10
) => {
    const [page, setPage] = useState<number>(1);

    //filters được đưa vào key nên đổi bộ lọc là SWR tự gọi lại API
    const key = listKey(path, page, limit, filters);

    const { data, error, isLoading, mutate } = useSWR<IPaginated<T>>(
        key,
        (url: string) => sendRequest<IPaginated<T>>({ url, method: "GET" }),
        {
            //giữ dữ liệu cũ trên màn hình khi đang tải trang mới, tránh nhấp nháy
            keepPreviousData: true,
            revalidateOnFocus: false,
        }
    );

    //xoá bản ghi cuối cùng của một trang sẽ làm trang đó trống,
    //nên lùi về trang trước thay vì hiện bảng rỗng
    const refreshAfterDelete = () => {
        if (data && data.items.length === 1 && page > 1) {
            setPage(page - 1);
        } else {
            mutate();
        }
    }

    return {
        items: data?.items ?? [],
        meta: data?.meta,
        page,
        setPage,
        limit,
        isLoading,
        error,
        mutate,
        refreshAfterDelete,
    };
}
