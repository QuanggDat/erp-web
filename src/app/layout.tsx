import { Lexend, Roboto } from 'next/font/google'
import 'bootstrap/dist/css/bootstrap.min.css';
import 'react-toastify/dist/ReactToastify.css';
import './globals.css';
import './brand.css';
import AppHeader from '@/components/app.header';
import AppFooter from '@/components/app.footer';
import AppContainer from '@/components/app.container';
import { Metadata } from 'next';

//Lexend cho tiêu đề, Roboto cho nội dung, giống app nội bộ của công ty.
//Dùng next/font thay vì thẻ link tới Google Fonts: font được tải sẵn lúc build
//nên trang không bị nhấp nháy đổi chữ khi mở lần đầu.
const lexend = Lexend({
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-lexend',
  display: 'swap',
});

const roboto = Roboto({
  subsets: ['latin', 'vietnamese'],
  weight: ['300', '400', '500', '700'],
  variable: '--font-roboto',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Wecare ERP',
  description: 'Quản lý sản phẩm, mua hàng, bán hàng, kho và nhân sự',
  icons: { icon: '/favicon.svg' },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="vi" className={`${lexend.variable} ${roboto.variable}`}>
      <body className={roboto.className}>
        {/* Người dùng bàn phím nhấn Tab một lần là nhảy thẳng tới nội dung,
            không phải đi qua toàn bộ menu. Liên kết ẩn cho tới khi được focus. */}
        <a href="#wc-main" className="wc-skip-link">
          Bỏ qua, tới nội dung chính
        </a>
        <AppHeader />
        <AppContainer>
          {children}
        </AppContainer>
        <AppFooter />
      </body>
    </html>
  )
}
