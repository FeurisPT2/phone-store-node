# 📱 TechStore - Hệ Thống Bán Điện Thoại & Quản Trị Khách Hàng (CRM)

Dự án website thương mại điện tử bán điện thoại xây dựng trên nền tảng **Node.js + Express**, tích hợp hệ thống **Quản Trị Viên (Admin Panel)** toàn diện và lưu trữ dữ liệu khách hàng **Customer CRM**.

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

## 📁 Cấu Trúc Thư Mục

```text
├── server.js                   # Điểm khởi chạy Express server & cấu hình routing
├── src/
│   ├── config/
│   │   └── sessionConfig.js    # Cấu hình Express Session
│   ├── controllers/
│   │   ├── adminController.js  # Controller xử lý auth, thống kê, CRM, đơn hàng
│   │   ├── cartController.js   # Xử lý giỏ hàng
│   │   ├── customerController.js # API hồ sơ và tra cứu khách hàng
│   │   ├── orderController.js  # Xử lý tạo đơn và đồng bộ CRM
│   │   └── productController.js # Xử lý sản phẩm
│   ├── data/                   # Cơ sở dữ liệu JSON cục bộ
│   │   ├── admins.json
│   │   ├── customers.json
│   │   ├── orders.json
│   │   └── products.json
│   ├── middlewares/
│   │   ├── adminAuth.js        # Middleware bảo vệ trang và API Admin
│   │   └── customerMemory.js   # Middleware ghi nhớ khách hàng qua Cookie/Session
│   ├── models/
│   │   ├── Admin.js
│   │   ├── Customer.js
│   │   ├── Order.js
│   │   ├── Product.js
│   │   └── database.js         # Lớp tiện ích đọc/ghi JsonDB
│   ├── public/                 # Giao diện tĩnh & Frontend Assets
│   │   ├── css/
│   │   │   ├── admin.css       # Style cho Admin Dashboard
│   │   │   └── style.css       # Style cho trang chủ Storefront
│   │   ├── js/
│   │   │   ├── admin.js        # Script quản trị, biểu đồ Chart.js, CRM
│   │   │   └── main.js         # Script phía khách hàng
│   │   ├── admin.html          # Giao diện Admin Portal
│   │   ├── index.html          # Giao diện Cửa hàng
│   │   └── login.html          # Giao diện Đăng nhập Admin
│   └── routes/                 # Định tuyến API
```
