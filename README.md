# 📱 TechStore - Hệ Thống Bán Điện Thoại & Quản Trị Khách Hàng (CRM)

Dự án website thương mại điện tử bán điện thoại xây dựng trên nền tảng **Node.js + Express**, tích hợp hệ thống **Quản Trị Viên (Admin Panel)** toàn diện và lưu trữ dữ liệu khách hàng **Customer CRM**, hỗ trợ triển khai **Vercel Serverless** và cơ sở dữ liệu đám mây **Neon PostgreSQL**.

🔗 **Repository:** [https://github.com/FeurisPT2/phone-store-node](https://github.com/FeurisPT2/phone-store-node)

---

## ✨ Tính Năng Nổi Bật

### 🛒 1. Phía Khách Hàng (Storefront)
- **Danh mục sản phẩm**: Hiển thị điện thoại với cấu hình, giá niêm yết, phân loại theo hãng (Apple, Samsung, Xiaomi,...).
- **Giỏ hàng & Thanh toán**: Thêm/xóa sản phẩm, cập nhật số lượng tức thì.
- **Tự động ghi nhớ khách hàng (Customer Memory)**:
  - Khi khách đặt hàng và chọn *"Ghi nhớ thông tin của tôi"*, hệ thống lưu thông tin an toàn qua Session & Cookie.
  - Tự động điền lại Họ tên, SĐT, Địa chỉ cho các lần mua sau mà không cần tạo tài khoản rườm rà.
  - Tự động tra cứu thông tin cũ khi nhập số điện thoại.

### 🛡️ 2. Hệ Thống Quản Trị (Admin Panel & CRM)
- **Bảo mật & Đăng nhập**:
  - Trang đăng nhập riêng biệt (`/login.html`) với hiệu ứng Dark Glassmorphism.
  - Mã hóa mật khẩu an toàn với SHA-256.
  - Middleware bảo vệ toàn diện các trang và API quản trị.
  - Tài khoản mặc định: `admin` | Mật khẩu: `admin123` (có chức năng đổi mật khẩu ngay trong trang Cài đặt).
- **Bảng điều khiển (Dashboard Analytics)**:
  - 4 thẻ KPI: Doanh thu, Đơn hàng, Khách hàng, Sản phẩm.
  - Biểu đồ đường **Chart.js** trực quan hóa xu hướng doanh thu.
  - Biểu đồ tròn tỷ lệ đơn hàng theo trạng thái.
  - Bảng đơn hàng mới nhất và Top khách hàng VIP chi tiêu cao nhất.
- **Quản lý khách hàng (Customer CRM)**:
  - Tự động đồng bộ chi tiêu và số lần mua khi có đơn hàng mới.
  - Tự động thăng hạng khách hàng: `VIP`, `Thân thiết`, `Mới`.
  - Xem hồ sơ khách hàng và toàn bộ lịch sử đơn hàng đã đặt.
  - Thêm, sửa, xóa, tìm kiếm và thêm ghi chú nội bộ của Admin.
  - **Xuất dữ liệu khách hàng ra file Excel/CSV** (chuẩn UTF-8 BOM hiển thị tiếng Việt có dấu).
- **Quản lý đơn hàng (Order Management)**:
  - Quy trình 4 bước: *Chờ xác nhận* ➔ *Đang giao hàng* ➔ *Đã hoàn thành* ➔ *Đã hủy*.
  - Theo dõi nhật ký lịch sử chuyển trạng thái (Timeline history).
  - Modal chi tiết đơn hàng, cập nhật trạng thái đơn trực tiếp.
  - **In phiếu giao hàng / Hóa đơn bán lẻ** (Print-friendly format).
  - **Xuất danh sách đơn hàng ra file Excel/CSV**.
- **Quản lý sản phẩm**: Thêm, sửa, xóa điện thoại trong kho hàng trực tiếp từ giao diện Admin.

---

## 🐘 Kết Nối Neon Postgres (Lưu Trữ Bền Vững)

Hệ thống hỗ trợ kiến trúc kép **Hybrid Mode**:
- **Mặc định khi chạy Offline:** Sử dụng JSON Database tự động.
- **Khi kết nối Neon Postgres:** Tự động tạo bảng (`admins`, `customers`, `orders`, `products`) và lưu trữ dữ liệu vĩnh viễn trên đám mây.

### Cách lấy chuỗi kết nối Neon Postgres:
1. Đăng ký tài khoản miễn phí tại [neon.tech](https://neon.tech).
2. Tạo project mới (ví dụ: `phone-store`).
3. Copy chuỗi kết nối **Connection String** dạng:
   ```text
   postgresql://neondb_owner:npg_xxxx@ep-cool-cloud-xxxx.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
   ```
4. Đặt vào file `.env` (khi chạy local) hoặc dán vào mục **Environment Variables** trên Vercel:
   ```env
   DATABASE_URL=postgresql://...
   ```

---

## 🚀 Cài Đặt & Khởi Chạy

### 1. Cài đặt thư viện
```bash
npm install
```

### 2. Chạy môi trường phát triển
```bash
npm run dev
# hoặc chạy trực tiếp
npm start
```

### 3. Truy cập ứng dụng
- **Cửa hàng:** [http://localhost:3000](http://localhost:3000)
- **Đăng nhập Admin:** [http://localhost:3000/login.html](http://localhost:3000/login.html)
- **Bảng điều khiển Admin:** [http://localhost:3000/admin](http://localhost:3000/admin)
- **Tài khoản mặc định:** `admin` / `admin123`

---

## ⚡ Triển Khai Lên Vercel (1-Click Deploy)
1. Đăng nhập [vercel.com](https://vercel.com) với tài khoản GitHub.
2. Bấm **Add New Project** ➔ Chọn repo `phone-store-node` ➔ Bấm **Import**.
3. Thêm biến môi trường **`DATABASE_URL`** với chuỗi kết nối Neon Postgres của bạn.
4. Bấm **Deploy**.
