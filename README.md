# erp-web

Giao diện web cho hệ thống ERP, viết bằng Next.js 13 (App Router).
API nằm ở repo [`erp-api`](https://github.com/QuanggDat/erp-api).

Gồm hai khu vực tách riêng theo route:

| Khu vực | Route | Nội dung |
|---|---|---|
| **ERP** | `/erp` | Sản phẩm, mua hàng, bán hàng, kho, nhân sự. Đây là phần chính. |
| Blog | `/blogs` | Phần cũ, vẫn chạy được nhưng không còn ở menu chính. |

Mở `http://localhost:3001` sẽ được chuyển thẳng vào `/erp`, cấu hình chuyển
hướng nằm trong `next.config.js`. Lối vào Blog ở cuối thanh menu bên trái của
khu vực ERP, và trang Blog có liên kết quay về ERP.

## Kiến trúc

| Thành phần | Repo | Port |
|---|---|---|
| Front-end (Next.js) | `erp-web` | **3001** |
| Back-end (NestJS)   | `erp-api` | **3000** |
| Database (Postgres) | docker `dev-database` | 5434 |

Front-end chạy port 3001 để không đụng port 3000 của back-end.

## Cách chạy

**1. Bật database** (nếu chưa chạy):
```bash
cd ../erp-api
npm run db:dev:create
```

**2. Bật back-end** (cửa sổ terminal riêng):
```bash
cd ../erp-api
npm run start:dev
```

**3. Bật front-end** (cửa sổ terminal riêng):
```bash
npm install
npm run dev
```

Mở trình duyệt: http://localhost:3001

## Luồng sử dụng

1. Vào `/auth/register` đăng ký tài khoản (mật khẩu tối thiểu 6 ký tự).
2. Vào `/auth/login` đăng nhập, `accessToken` được lưu vào `localStorage`.
   Đăng nhập xong vào thẳng `/erp`.
3. Tài khoản mới mặc định là `VIEWER` nên **chỉ xem được**. Muốn thêm sửa xoá
   thì phải nâng vai trò, cách làm xem README của back-end.
4. Phần Blog nằm ở `/blogs`, vào qua liên kết cuối thanh menu bên trái.

> Token do back-end ký chỉ sống **10 phút** (`expiresIn: '10m'` trong `auth.service.ts`).
> Hết hạn thì đăng nhập lại.

## API back-end được sử dụng

Danh sách đầy đủ kèm mô tả từng tham số nằm ở README của [`erp-api`](https://github.com/QuanggDat/erp-api).
Dưới đây là những endpoint mà giao diện này gọi tới.

**Xác thực** (không cần token)

| Màn hình | Method | Endpoint |
|---|---|---|
| Đăng ký | POST | `/auth/register` |
| Đăng nhập | POST | `/auth/login` |
| Thanh điều hướng | GET | `/users/me` |

**ERP** (bắt buộc gửi token)

| Màn hình | Endpoint gốc | Ghi chú |
|---|---|---|
| Sản phẩm | `/products` | kèm `/products/categories` cho nhóm hàng |
| Đối tác | `/partners` | lọc `?type=CUSTOMER` lấy cả loại `BOTH` |
| Kho | `/warehouses` | |
| Tồn kho | `/warehouses/stocks` | kèm `/stocks/adjust` để kiểm kê |
| Sổ nhập xuất | `/warehouses/stock-movements` | chỉ đọc |
| Mua hàng | `/purchase-orders` | thêm `/:id/confirm` và `/:id/cancel` |
| Bán hàng | `/sales-orders` | thêm `/:id/confirm` và `/:id/cancel` |
| Nhân viên | `/hr/employees` | |
| Phòng ban, chức danh | `/hr/departments`, `/hr/positions` | |
| Chấm công | `/hr/attendances` | |

**Blog** (phần cũ): `/notes` với đủ bốn thao tác thêm, sửa, xoá, xem.

Mọi endpoint danh sách đều trả về `{ items, meta }` và nhận `?page`, `?limit`.
Hook `useErpList` đã xử lý sẵn việc này.

## Cấu trúc thư mục

```
src/
├── app/
│   ├── layout.tsx              # layout gốc: header + container + footer
│   ├── brand.css               # HỆ THỐNG THIẾT KẾ: màu, thang chữ, giãn cách
│   ├── globals.css             # reset nhỏ, chạy trước brand.css
│   ├── page.tsx                # dự phòng, thực tế "/" đã chuyển sang /erp
│   ├── auth/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── blogs/                  # PHẦN CŨ, tách riêng khỏi ERP
│   │   ├── layout.tsx          # kèm liên kết quay về ERP
│   │   ├── page.tsx            # danh sách blog (SWR)
│   │   └── [id]/                # chi tiết blog
│   └── erp/                    # KHU VỰC ERP
│       ├── layout.tsx          # thanh bên trái + nội dung bên phải
│       ├── page.tsx            # bảng điều khiển
│       ├── products/           # sản phẩm
│       ├── categories/         # nhóm hàng
│       ├── partners/           # khách hàng và nhà cung cấp
│       ├── warehouses/         # danh sách kho
│       ├── stocks/             # tồn kho + kiểm kê
│       ├── stock-movements/    # sổ nhập xuất
│       ├── purchase-orders/    # mua hàng
│       ├── sales-orders/       # bán hàng
│       ├── employees/          # nhân viên
│       ├── departments/        # phòng ban và chức danh
│       └── attendances/        # chấm công
├── components/
│   ├── app.header.tsx          # navbar + trạng thái đăng nhập
│   ├── app.footer.tsx
│   ├── app.container.tsx       # Container + ToastContainer
│   ├── app.pagination.tsx      # thanh phân trang, dùng chung cả blog và ERP
│   ├── app.table.tsx           # bảng blog + nút CRUD
│   ├── create.modal.tsx
│   ├── update.modal.tsx
│   ├── login.form.tsx
│   ├── register.form.tsx
│   └── erp/
│       ├── erp.sidebar.tsx     # menu trái của khu vực ERP
│       ├── erp.breadcrumb.tsx  # đường dẫn phân cấp
│       ├── erp.page.tsx        # khung chung: tiêu đề, tìm kiếm, phân trang
│       ├── erp.form.modal.tsx  # modal biểu mẫu dựng từ danh sách ô nhập
│       ├── erp.table.skeleton.tsx  # khung xương lúc chờ dữ liệu
│       ├── erp.empty.tsx       # trạng thái rỗng, phân biệt do lọc hay chưa có
│       ├── erp.auth.guard.tsx  # chặn truy cập khi chưa đăng nhập
│       └── order.items.editor.tsx  # bảng nhập dòng hàng của chứng từ
├── types/
│   ├── backend.d.ts            # IBlog, IUser, ILogin
│   └── erp.d.ts                # kiểu dữ liệu của 5 phân hệ ERP
└── utils/
    ├── api.ts                  # sendRequest + quản lý token
    ├── mutate.blogs.ts         # làm mới cache SWR của danh sách blog
    ├── erp.ts                  # định dạng tiền, ngày, nhãn trạng thái
    └── use.erp.list.ts         # hook dùng chung cho mọi màn hình danh sách
```

## Khu vực ERP

Đây là phần chính của hệ thống, có thanh menu riêng bên trái. Mở trang web lên
là vào thẳng đây.

> **Hệ thống không quản lý tiền lương.** Đây là dữ liệu nhạy cảm và đã được
> gỡ bỏ khỏi cả database, API lẫn giao diện. Phân hệ nhân sự chỉ quản lý hồ sơ,
> phòng ban, chức danh và chấm công.

**Phải đăng nhập trước.** Mọi route ERP ở back-end đều yêu cầu token, và các
thao tác ghi còn yêu cầu đúng vai trò. Tài khoản mới mặc định là `VIEWER` nên
chỉ xem được. Cách nâng vai trò xem README của back-end.

### Các thành phần dùng chung

Mười hai màn hình ERP đều dựng từ cùng một bộ thành phần. Đọc hiểu ba cái đầu
là hiểu được cả khu vực, ba cái sau chỉ là chi tiết bổ trợ.

**Ba cái cốt lõi:**

- `useErpList` gom việc phân trang, tìm kiếm và gọi API. Đổi bộ lọc thì key
  của SWR đổi theo, SWR tự gọi lại API. Không màn hình nào phải tự viết lại
  đoạn quản lý trang.
- `ErpPage` là khung ngoài: tiêu đề, mô tả mục đích, nút hành động, ô tìm kiếm,
  trạng thái đang tải, báo lỗi và thanh phân trang. Màn hình con chỉ lo phần bảng.
- `ErpFormModal` nhận một mảng mô tả các ô nhập rồi tự dựng biểu mẫu. Nhờ vậy
  không phải viết mười modal gần giống nhau.

**Ba cái bổ trợ:**

- `ErpAuthGuard` bọc quanh layout ERP, chặn truy cập khi chưa đăng nhập. Đặt ở
  layout nên cả mười hai màn hình được bảo vệ một lần.
- `ErpTableSkeleton` hiện khung xương lúc chờ dữ liệu, thay cho vòng xoay.
- `ErpEmpty` hiện khi bảng trống, phân biệt hai trường hợp: chưa có dữ liệu nào
  (đưa nút tạo mới) và bộ lọc che hết (đưa nút xoá bộ lọc).
- `ErpBreadcrumb` hiện đường dẫn phân cấp, tự dịch tên đoạn URL sang tiếng Việt.

**Một thành phần riêng cho chứng từ:** `OrderItemsEditor` là bảng nhập các dòng
hàng, dùng chung cho cả đơn mua lẫn đơn bán vì hai bên có cấu trúc dòng giống
hệt nhau. Chỉ khác ở chỗ đơn mua lấy giá mua làm gợi ý, đơn bán lấy giá bán.

### Vài điểm cần biết khi đọc code

**Prisma trả kiểu Decimal về dưới dạng chuỗi.** Tiền và số lượng trong
`erp.d.ts` đều khai báo là `string`, không phải `number`. Muốn tính toán phải
`Number(...)` trước. Các hàm `formatMoney` và `formatQuantity` trong `erp.ts`
đã xử lý sẵn việc này.

**Ô nhập luôn trả về chuỗi.** Trước khi gửi lên API phải ép về số, nếu không
back-end sẽ từ chối. Xem cách các trang xử lý trong hàm `handleSubmit`.

**Ô để trống phải gửi `undefined`, không phải chuỗi rỗng.** Back-end validate
email và ngày tháng, chuỗi rỗng sẽ bị trả lỗi 400. Các trang đều dùng
`values.email || undefined` cho việc này.

**Route xác nhận chứng từ dùng PATCH.** Đây là thao tác đổi trạng thái của một
tài nguyên đã có, không phải tạo tài nguyên mới. Xác nhận đơn mua thì hàng vào
kho, xác nhận đơn bán thì hàng rời kho. Bán quá số tồn sẽ nhận lỗi 409 và đơn
vẫn giữ nguyên trạng thái nháp.

## Màu sắc và logo

Bảng màu lấy theo app nội bộ `Accounting-Sales-Purchase-Update` để hai hệ thống
nhìn giống nhau. Toàn bộ định nghĩa nằm trong [`src/app/brand.css`](src/app/brand.css).

| Biến | Mã màu | Tương phản trên nền trắng | Dùng ở đâu |
|---|---|---|---|
| `--wc-primary` | `#3492AB` | 3.1:1 | **chỉ làm nền** với chữ trắng, viền, icon |
| `--wc-primary-dark` | `#236E84` | 5.8:1 | nút chính, liên kết, chữ màu thương hiệu |
| `--wc-primary-deep` | `#164553` | 10.5:1 | tiêu đề, số liệu lớn |
| `--wc-primary-pale` | `#C5E0E8` | nền | viền dưới tiêu đề bảng |
| `--wc-primary-wash` | `#EAF4F7` | nền | nền tiêu đề bảng, khi rê chuột |
| `--wc-surface-dark` | `#0F2A33` | nền | chân trang |

Điểm quan trọng nhất: **`#3492AB` không bao giờ dùng làm màu chữ trên nền
trắng**, vì chỉ đạt 3.1:1 trong khi chuẩn đòi 4.5:1. Chữ màu thương hiệu phải
dùng `--wc-primary-dark` trở lên. Màu gốc vẫn giữ nguyên ở thanh trên và các
mảng nền, nơi nó đi cùng chữ trắng.

Ba màu `--wc-success`, `--wc-warning`, `--wc-danger` chỉ dùng cho **trạng thái**
(thành công, cảnh báo, lỗi), không dùng làm màu trang trí. Trộn lẫn hai loại
này làm người dùng không phân biệt được đâu là thông tin quan trọng.

Phông chữ **Lexend** cho tiêu đề và **Roboto** cho nội dung, nạp qua `next/font`
thay vì thẻ link tới Google Fonts. Cách này tải font sẵn lúc build nên trang
không bị nhấp nháy đổi chữ khi mở lần đầu.

### Thay logo thật của công ty

Logo hiện tại ở [`public/logo.svg`](public/logo.svg) là bản tạm tôi vẽ theo
bảng màu Wecare, vì logo thật nằm trên Dataverse và cần đăng nhập mới tải được.

Muốn thay bằng logo thật:

1. Tải logo từ Dataverse (đường dẫn có trong `src/shared/ui/Footer.tsx` của app
   công ty, phần `LOGO_URL`).
2. Ghi đè `public/logo.svg` và `public/favicon.svg`.
3. Không cần sửa code, hai file này được tham chiếu theo đường dẫn cố định.

Nếu logo thật có nền sáng, thêm `filter: brightness(0) invert(1)` cho thẻ ảnh
trong `app.header.tsx` để nó thành màu trắng trên nền xanh, giống cách app công
ty đang làm ở chân trang.

### Lưu ý khi thêm CSS toàn cục

File CSS toàn cục **phải đặt trong thư mục `src/app/`**. Next 13 chỉ gom CSS
đặt ở đó vào gói build. Để `brand.css` ở `src/styles/` thì build vẫn chạy,
không báo lỗi gì, nhưng toàn bộ màu sắc không có tác dụng.

**Thứ tự nạp CSS quan trọng.** Xem `src/app/layout.tsx`:

```
bootstrap.min.css  →  ReactToastify.css  →  globals.css  →  brand.css
```

`brand.css` phải nạp **cuối cùng** vì nó đè lên biến của Bootstrap. Đảo thứ tự
là màu thương hiệu mất tác dụng, quay về màu xanh dương mặc định.

Một bẫy nữa: **Bootstrap dựng bo góc nút từ biến riêng của nó**. Đặt
`border-radius` trực tiếp lên `.btn` sẽ bị đè, phải đặt qua
`--bs-btn-border-radius`.

## Hệ thống thiết kế

Toàn bộ nằm trong [`src/app/brand.css`](src/app/brand.css). Ba quy tắc để giao
diện không bị lệch khi nhiều người cùng sửa:

**Khoảng cách theo lưới 8px.** Dùng biến `--wc-space-1` tới `--wc-space-8`
(4, 8, 12, 16, 24, 32, 48, 64px) thay vì gõ số trực tiếp. Khi mọi khoảng cách
đều là bội số của nhau, mắt nhận ra ngay là có trật tự.

**Cỡ chữ theo thang tỷ lệ 1.25.** Từ `--wc-text-xs` (12px) tới `--wc-text-2xl`
(31px). Nội dung chính là 16px, đây là mức tối thiểu cho chữ đọc lâu.

**Chỉ ba mức bo góc và ba mức đổ bóng.** Nút và ô nhập dùng `--wc-radius-sm`,
thẻ dùng `--wc-radius`. Không có ngoại lệ.

### Khả năng tiếp cận

Mọi cặp màu chữ và nền trong hệ thống đều đạt tối thiểu 4.5:1, riêng chữ trắng
trên nền thương hiệu đạt 3.6:1 (chuẩn cho chữ lớn). Ngoài màu sắc:

- **Điều hướng bàn phím.** Nhấn Tab từ đầu trang sẽ gặp liên kết "Bỏ qua, tới
  nội dung chính" trước tiên, khỏi phải đi qua toàn bộ menu. Viền focus dày 3px,
  dùng `:focus-visible` nên chuột bấm không hiện viền.
- **Không dựa riêng vào màu.** Mục menu đang mở có nền đậm **và** thanh chỉ báo
  bên trái. Badge trạng thái có màu **và** chữ. Ô nhập sai có viền đỏ **và**
  dòng lỗi bằng chữ.
- **Tên riêng cho nút lặp lại.** Một bảng có hàng chục nút "Sửa" giống hệt nhau
  thì trình đọc màn hình không phân biệt được. Mỗi nút có thêm phần ẩn nói rõ
  đang sửa bản ghi nào.
- **Vùng chạm 44px** trên thiết bị cảm ứng, áp dụng qua `@media (pointer: coarse)`.

### Bảng trên điện thoại

Dưới 768px, mỗi dòng bảng biến thành một thẻ dọc. Nhãn cột lấy từ thuộc tính
`data-label` trên từng ô, nên **khi thêm cột mới phải thêm `data-label` tương
ứng**, nếu không ô đó sẽ mất nhãn trên điện thoại.

```jsx
<td data-label="Mã hàng">{product.code}</td>
<td data-label="">   {/* nhãn rỗng: ô chiếm cả hàng, dùng cho cột thao tác */}
```

### Biểu mẫu

Lỗi hiện **ngay dưới ô sai**, không dùng thông báo nổi. Lý do là thông báo nổi
biến mất sau vài giây và không chỉ ra ô nào cần sửa. Khi bấm Lưu mà thiếu dữ
liệu, con trỏ tự nhảy về ô sai đầu tiên.

Ô nhập trong `ErpFormModal` nhận thêm thuộc tính `hint` để giải thích trước khi
người dùng gõ, thay vì để họ nhập xong mới báo sai.

### Ba mục tiêu không làm được trong code

Yêu cầu ban đầu có 10 mục tiêu. Bảy mục đã làm. Ba mục còn lại nằm ngoài phạm
vi của code:

1. **Kiểm thử với người dùng thật** (mục 10). Cần 5 người dùng thật ngồi thao
   tác và quan sát họ vướng ở đâu.
2. **Đo Core Web Vitals** (một phần mục 7). Cần đo trên trình duyệt thật bằng
   Lighthouse hoặc PageSpeed Insights. Phần tối ưu tài nguyên đã làm: font tải
   sẵn lúc build, logo là SVG dưới 1KB, có khung xương thay màn hình trắng.
3. **Bằng chứng xã hội** (một phần mục 9). Đánh giá và case study không áp dụng
   cho hệ thống nội bộ, không có khách hàng bên ngoài để lấy.

## Phần Blog (cũ)

Có từ trước khi dự án chuyển thành ERP, nằm ở `/blogs` và vẫn chạy bình thường.
Giữ lại vì nó là code mẫu tốt để đối chiếu: cùng một bài toán danh sách và biểu
mẫu, nhưng viết theo cách cũ, chưa dùng hệ thống thành phần chung của ERP.

Bảng `notes` ở back-end có ba trường bắt buộc: `title`, `description` và `url`.
Trường `url` validate bằng `@IsUrl()` nên phải đúng dạng `https://example.com`,
nhập chuỗi thường sẽ bị trả lỗi 400.

Lối vào nằm ở cuối thanh menu bên trái của khu vực ERP. Trang blog có liên kết
quay về ERP để không bị mắc kẹt, vì nó nằm ngoài layout có menu.
