import Link from 'next/link'

//Bình thường người dùng không bao giờ thấy trang này: next.config.js đã
//chuyển hướng "/" sang "/erp" ngay ở tầng server.
//Giữ lại một trang thật làm phương án dự phòng, vì nếu để redirect() ở đây
//thì Next 13 dựng tĩnh trang gốc thành trang lỗi.
export default function Home() {
  return (
    <div className='mt-5 text-center'>
      <h3>Hệ thống ERP</h3>
      <p className='text-muted'>
        Quản lý sản phẩm, mua hàng, bán hàng, kho và nhân sự
      </p>
      <Link href='/erp' className='btn btn-primary'>
        Vào hệ thống
      </Link>
    </div>
  )
}
