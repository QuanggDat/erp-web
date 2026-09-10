"use client";
import AppPagination from "@/components/app.pagination";
import AppTable from "@/components/app.table";
import { blogsKey, getToken, sendRequest } from "@/utils/api";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import useSWR from "swr";

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];

const BlogsPage = () => {
  const router = useRouter();

  //page/limit khớp với GetNotesQueryDTO ở back-end (page >= 1, limit <= 100)
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);

  //route /notes ở back-end có @UseGuards -> chưa đăng nhập thì không gọi được
  useEffect(() => {
    if (!getToken()) {
      router.replace("/auth/login");
    }
  }, [router]);

  //fetcher tự gắn accessToken vào header Authorization
  const fetcher = (url: string) =>
    sendRequest<IPaginated<IBlog>>({ url, method: "GET" });

  //key đổi theo page/limit nên SWR tự gọi lại API mỗi khi chuyển trang
  const { data, error, isLoading } = useSWR(blogsKey(page, limit), fetcher, {
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    keepPreviousData: true, //giữ bảng cũ trong lúc tải trang mới, tránh nhấp nháy
  });

  //xoá hết blog ở trang cuối thì lùi về trang trước cho khỏi hiện bảng rỗng
  useEffect(() => {
    const totalPages = data?.meta.totalPages ?? 0;
    if (totalPages > 0 && page > totalPages) {
      setPage(totalPages);
    }
  }, [data?.meta.totalPages, page]);

  if (isLoading && !data) {
    return <div className="mt-3">loading...</div>;
  }

  if (error) {
    return (
      <div className="mt-3 alert alert-danger">
        Không lấy được danh sách blog: {error.message}
      </div>
    );
  }

  const meta = data?.meta;

  return (
    <div className="mt-3">
      <AppTable
        blogs={data?.items ?? []}
        page={page}
        limit={limit}
        //blog vừa tạo nằm ở trang 1 (back-end sắp xếp createdAt giảm dần)
        onCreated={() => setPage(1)}
      />

      <div
        className="d-flex align-items-center justify-content-between flex-wrap gap-2"
        style={{ marginTop: 16 }}
      >
        <div className="text-muted">
          {meta && meta.total > 0
            ? `Hiển thị ${(meta.page - 1) * meta.limit + 1} - ${Math.min(
                meta.page * meta.limit,
                meta.total,
              )} trên tổng ${meta.total} blog`
            : "Chưa có blog nào"}
        </div>

        <div className="d-flex align-items-center gap-2">
          <span className="text-muted">Số dòng / trang:</span>
          <select
            className="form-select form-select-sm"
            style={{ width: 90 }}
            value={limit}
            onChange={(e) => {
              setLimit(Number(e.target.value));
              setPage(1); //đổi limit thì vị trí trang cũ không còn ý nghĩa
            }}
          >
            {PAGE_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
      </div>

      <AppPagination
        page={meta?.page ?? page}
        totalPages={meta?.totalPages ?? 0}
        onChange={setPage}
      />
    </div>
  );
};

export default BlogsPage;
