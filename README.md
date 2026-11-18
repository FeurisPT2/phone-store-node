# 🛠️ GearHub - Trạm Chăm Sóc Thiết Bị & Cho Thuê Gear Sinh Viên (ĐHKHTN - ĐHQG-HCM)

Dự án website dịch vụ công nghệ xây dựng trên nền tảng **Node.js + Express**, phục vụ nhu cầu vệ sinh/spa laptop lấy liền trong 30–45 phút, cho thuê thiết bị ngoại vi học tập (bàn phím cơ, chuột công thái học, combo trình chiếu) với chính sách **0đ tiền cọc qua Thẻ Sinh Viên**, tích hợp trợ lý **Google Gemini AI Consultant**, cổng thanh toán giả lập **VietQR Napas247 Sandbox** và hệ thống quản trị **Admin CRM**.

🔗 **Repository:** [https://github.com/FeurisPT2/GearHub](https://github.com/FeurisPT2/GearHub)

---

## ✨ Tính Năng Nổi Bật

### 🛒 1. Trải Nghiệm Khách Hàng (Storefront & Booking)
- **Trang chủ bảng hiệu trạm (`/`)**: Giới thiệu bảng hiệu nhận diện GearHub Station tại Sảnh C trường ĐHKHTN (227 Nguyễn Văn Cừ), bối cảnh *"Vì sao làm"* giải quyết bài toán quá nhiệt, lag máy mùa thi và thiếu thiết bị ngoại vi cho sinh viên.
- **Cửa hàng hợp nhất (`/shop`)**:
  - Gộp chung toàn diện 3 phân loại: Gói Dịch Vụ Vệ Sinh lấy liền, Thiết Bị Cho Thuê bằng Thẻ SV, và Phụ Kiện IT Học Tập.
  - Hiệu ứng thẻ hover zoom mượt mà, bảng màu chuẩn mực Calm Editorial / Bone & Stone dịu mắt.
  - Bảng thông tin chi tiết dạng thẻ chuyển tab: **Thông Số Kỹ Thuật** vs **Tư Vấn & Đánh Giá AI**, bố cục nhãn trên - giá trị dưới rõ ràng, không gây tràn trang.
- **Trang Giỏ hàng & Lịch hẹn chuyên biệt (`/cart`)**:
  - Giỏ hàng 3 phân lớp (Tri-Tier Cart): phân tách rõ ràng Lịch hẹn dịch vụ, Thiết bị thuê (áp dụng cọc 0đ thẻ SV), và Phụ kiện mua đứt.
  - Mini-cart flyout hiển thị nhanh khi rê chuột (hover) vào nút giỏ hàng ở góc trên bên phải.
  - Form đặt lịch hẹn chọn ca sáng / trưa / chiều tại Sảnh C trường hoặc KTX Khu B.
- **Thanh toán VietQR Napas247 Sandbox**: Tạo mã QR giao dịch động, đối soát webhook tự động sau 3 giây.
- **Typography Be Vietnam Pro**: Chuẩn hóa phông chữ tiếng Việt toàn diện, hiển thị hoàn hảo dấu thanh và độ đậm nhạt.

### 🛡️ 2. Hệ Thống Quản Trị (Admin Panel & CRM)
- **Bảo mật & Đăng nhập**: Trang đăng nhập riêng biệt (`/login.html`), mã hóa SHA-256, phiên làm việc serverless an toàn.
  - Tài khoản mặc định: `admin` | Mật khẩu: `admin123`.
- **Bảng điều khiển (Dashboard Analytics)**: Thống kê KPI, biểu đồ doanh thu và cơ cấu đơn hẹn.
- **Quản lý đơn hẹn & trạng thái dịch vụ**: Theo dõi tiến trình 4 bước: *Tiếp nhận ➔ Chuẩn bị / Vệ sinh ➔ Sẵn sàng tại sảnh C ➔ Hoàn thành*.
- **Quản trị khách hàng sinh viên (CRM)**: Lưu trữ MSSV, số điện thoại, lịch sử đặt hẹn và phân hạng thành viên.

---

## 🐘 Cơ Sở Dữ Liệu Kép (Hybrid Storage Seam)

- **Mặc định khi chạy Offline / Local:** Tự động sử dụng JSON Database cục bộ (`src/data/`).
- **Khi kết nối Neon Postgres:** Tự động chuyển đổi thông qua kiến trúc Adapter, lưu trữ bền vững trên đám mây khi có biến môi trường `DATABASE_URL`.

---

## 🚀 Cài Đặt & Khởi Chạy

### 1. Cài đặt thư viện
```bash 
npm install
```

### 2. Chạy môi trường phát triển
```bash
npm start
# hoặc chế độ dev với nodemon
npm run dev
```

### 3. Kiểm thử tự động (Test Suites)
```bash
npm test
```
*(Đảm bảo 100% pass 72/72 test cases bao phủ định tuyến đa trang, giỏ hàng 3 phân lớp, bảng màu và hợp đồng lưu trữ).*

### 4. Truy cập ứng dụng
- **Trang chủ bảng hiệu:** [http://localhost:3000](http://localhost:3000)
- **Cửa hàng & Dịch vụ:** [http://localhost:3000/shop](http://localhost:3000/shop)
- **Giỏ hàng & Lịch hẹn:** [http://localhost:3000/cart](http://localhost:3000/cart)
- **Cổng Admin Quản Trị:** [http://localhost:3000/admin](http://localhost:3000/admin) (Đăng nhập: `admin` / `admin123`)

---

## ⚡ Triển Khai Lên Vercel
```bash
npm run vercel:deploy
```
Hoặc liên kết trực tiếp repository GitHub trên Vercel Dashboard với biến môi trường `DATABASE_URL`.
