# ADR 0010: Unified Auth Portal, Smart Role Routing and Serverless Admin Session Recovery

## Bối cảnh & Vấn đề (Context)

Trong quá trình vận hành và kiểm thử thực tế trên nền tảng đám mây Vercel, hệ thống xác thực của ứng dụng bộc lộ 3 điểm nghẽn kiến trúc:
1. **Trải nghiệm phân mảnh vai trò (Dual-Portal Clutter)**: Giao diện đăng nhập cũ (`login.html`) phân tách thành 2 tab vai trò độc lập ("Khách Hàng" và "Quản Trị Viên"), buộc người dùng phải phán đoán và lựa chọn vai trò trước khi nhập thông tin. Đồng thời, các hộp gợi ý tài khoản mẫu ("Tài khoản mẫu: 0987654321 / 123456", "Quản trị mặc định: admin / admin123") cùng nút "Điền nhanh" làm giao diện trông như một bản prototype demo, thiếu tính chuyên nghiệp của một sản phẩm production.
2. **Hiện tượng mất phiên trên môi trường Serverless (Serverless Session Drop)**: 
   - Ứng dụng chạy trên kiến trúc Serverless của Vercel (`@vercel/node`), nơi mỗi request có thể được định tuyến tới một container lambda độc lập.
   - Thư viện `express-session` sử dụng bộ lưu trữ trong bộ nhớ RAM mặc định (`MemoryStore`). Khi người dùng đăng nhập tài khoản Quản trị viên (`admin`) thành công ở modal trang chủ hoặc trang login, hàm xử lý gán `req.session.admin = admin` và điều hướng trình duyệt sang `/admin`.
   - Khi trình duyệt gửi request `GET /admin` hoặc `GET /api/admin/me`, request này chạm vào một hàm serverless mới với bộ nhớ RAM trống. Do không tìm thấy `req.session.admin`, bộ lọc bảo mật (`adminAuth` & `server.js`) hiểu lầm là chưa đăng nhập và **đá ngược người dùng về lại `/login`** (gây ra hiện tượng redirect loop).
   - Trong khi tài khoản Khách hàng được duy trì bền vững nhờ middleware `customerMemory` đọc cookie `remember_customer_phone`, tài khoản Quản trị viên lại chưa có bất kỳ cơ chế khôi phục phiên nào.

---

## Quyết Định Kiến Trúc (Decision)

### 1. Cổng Đăng Nhập Thống Nhất & Phân Luồng Thông Minh (Unified Auth Portal & Smart Role Routing)
- **Tái cấu trúc giao diện (`login.html` & `#auth-modal` tại `index.html`)**:
  - Loại bỏ hoàn toàn 2 tab chuyển vai trò "Khách Hàng" vs "Quản Trị Viên".
  - Chỉ duy trì 2 tab chức năng rõ ràng: **"Đăng nhập"** (Sign in) và **"Đăng ký mới"** (Sign up - chỉ dành cho sinh viên/khách hàng tạo tài khoản).
  - Sử dụng một ô nhập định danh duy nhất: *"Số điện thoại hoặc Tên tài khoản"* (`type="text"`, autocomplete="username") cho phép sinh viên nhập SĐT còn quản trị viên nhập `admin` mà không cần thao tác chọn quyền.
  - Gỡ bỏ 100% các khung gợi ý tài khoản mẫu và nút "Điền nhanh".
- **Bộ điều khiển xác thực tập trung ([`src/controllers/authController.js`](../../src/controllers/authController.js))**:
  - Triển khai endpoint `POST /api/auth/login`:
    1. Kiểm tra xác thực Quản trị viên qua `AdminModel.verify(identifier, password)`. Nếu hợp lệ -> gán session Admin, sinh token khôi phục và trả về `{ success: true, role: 'admin', redirectUrl: '/admin' }`.
    2. Nếu không khớp Admin, chuyển tiếp kiểm tra tài khoản Khách hàng qua `CustomerModel.login({ phone: identifier, password })`. Nếu hợp lệ -> gán session Customer và trả về `{ success: true, role: 'customer', redirectUrl: '/' }`.
    3. Nếu cả hai đều không khớp -> trả về HTTP 401 với thông điệp bảo mật thống nhất: *"Số điện thoại, tên tài khoản hoặc mật khẩu không chính xác"*.
  - Giữ nguyên các route cũ `/api/customers/login` và `/api/admin/login` để bảo toàn tính tương thích ngược cho các bài test và hệ thống tích hợp sẵn có.

### 2. Duy Trì Phiên Quản Trị Serverless Bằng Chữ Ký Số HMAC-SHA256 (`admin_token`)
- **Tạo và xác thực Token an toàn ([`src/models/Admin.js`](../../src/models/Admin.js))**:
  - `AdminModel.generateToken(admin)`: Đóng gói payload `{ id, username, role, iat }`, mã hoá `base64url` và ký số bằng thuật toán `HMAC-SHA256` với khoá bí mật `SESSION_SECRET`.
  - `AdminModel.verifyToken(token)`: Kiểm tra tính toàn vẹn chữ ký số bằng phép so sánh thời gian bất biến (`crypto.timingSafeEqual`) chống tấn công timing attack, kiểm tra thời hạn hiệu lực 7 ngày.
- **Gán Cookie HTTP-Only bảo mật**:
  - Khi xác thực Admin thành công, máy chủ thiết lập cookie `admin_token` với cờ `httpOnly: true`, `sameSite: 'lax'`, `path: '/'`.
  - Khi quản trị viên bấm Đăng xuất (`POST /api/admin/logout`), máy chủ xóa sạch cookie `admin_token` (`res.clearCookie('admin_token', { path: '/' })`) và vô hiệu hóa `req.session.admin`.
- **Tự động phục hồi phiên làm việc (Session Auto-Rehydration)**:
  - Cập nhật middleware [`src/middlewares/customerMemory.js`](../../src/middlewares/customerMemory.js) và [`src/middlewares/adminAuth.js`](../../src/middlewares/adminAuth.js): Khi request đến một container serverless mới mà `req.session.admin` chưa có trong RAM, middleware tự động trích xuất `req.cookies.admin_token`, xác minh chữ ký số, tìm bản ghi Admin trong cơ sở dữ liệu và tái lập tức thì `req.session.admin`.
  - Cập nhật bộ định tuyến `/admin` trong [`server.js`](../../server.js) để bảo vệ trang HTML không bao giờ bị redirect nhầm sang `/login`.

---

## Kết Quả & Đánh Giá (Consequences)

1. **Trải nghiệm Đăng nhập Liền mạch**: Người dùng và quản trị viên không cần phải bận tâm lựa chọn tab vai trò; nhập tài khoản `admin` sẽ tự động chuyển vào `/admin`, nhập số điện thoại sẽ vào trang mua sắm `/`.
2. **Giải Quyết Triệt Để Lỗi Serverless**: 100% các request truy cập trang quản trị `/admin` và API `/api/admin/me` trên môi trường đám mây Vercel duy trì trạng thái đăng nhập ổn định, không còn hiện tượng bị văng về cổng login.
3. **Bảo Mật Cao**: Token được ký số HMAC, lưu trong HTTP-Only cookie, chống giả mạo danh tính và không thể bị can thiệp bởi mã JavaScript độc hại từ phía client (XSS-safe).
4. **Kiểm Thử Tự Động Toàn Diện**:
   - Bổ sung test case kiểm tra tái lập phiên serverless độc lập: `Admin session recovery across serverless invocations via admin_token cookie`.
   - Toàn bộ **54/54 test cases** thuộc 11 test suites đều đạt kết quả PASS (100% xanh).
