/** @type {import('next').NextConfig} */
const nextConfig = {
  //Chuyển hướng ở tầng server, trước khi React chạy.
  //Dùng cách này thay vì redirect() trong Server Component vì Next 13
  //dựng tĩnh trang gốc thành trang lỗi khi Server Component gọi redirect,
  //làm người dùng thấy màn hình trắng chớp qua trước khi tới ERP.
  async redirects() {
    return [
      {
        source: '/',
        destination: '/erp',
        //tạm thời chứ không vĩnh viễn: trình duyệt không nhớ cache,
        //sau này muốn đổi trang chủ thì không phải xoá cache của người dùng
        permanent: false,
      },
    ]
  },
}

module.exports = nextConfig
