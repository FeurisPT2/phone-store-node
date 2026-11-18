# ADR 0011: Tách biệt Trang Giới Thiệu (About Us Landing Page) và Trang Bán Hàng (Storefront Routing)

## Bối cảnh & Vấn đề (Context)

Dự án GearHub là đồ án thực hành môn **Nhập môn Công nghệ Thông tin (CSC00004)** thuộc Khoa Công nghệ Thông tin, Trường Đại học Khoa học Tự nhiên - ĐHQG-HCM. Trong buổi báo cáo triển lãm poster A1, Giảng viên bộ môn và các bạn sinh viên tham quan sẽ quét mã QR trên poster để truy cập trực tiếp website từ điện thoại di động.

Trước đây, đường dẫn gốc (`/`) đóng vai trò là một Single Page Application (SPA) tích hợp trực tiếp toàn bộ danh mục sản phẩm, bộ lọc phần cứng, giỏ hàng và thanh toán. Cấu trúc này bộc lộ những hạn chế trong bối cảnh đánh giá đồ án:
1. **Thiếu không gian giới thiệu đồ án và nhóm tác giả**: Khi quét mã QR từ poster, khách tham quan cần nắm bắt nhanh bối cảnh đề tài, bài toán thực tế của sinh viên (laptop quá nhiệt mùa thi cử, thiếu gear thuyết trình), các giải pháp cốt lõi và thông tin nhóm sinh viên thực hiện trước khi bước vào trải nghiệm mua sắm/đặt dịch vụ.
2. **Trải nghiệm tiếp cận nặng nề trên di động**: Tải ngay lập tức toàn bộ danh mục sản phẩm, bộ lọc đa thuộc tính và canvas đồ họa khiến người xem thiếu điểm nhấn dẫn dắt (narrative walkthrough).
3. **Phân tách trách nhiệm trải nghiệm (Separation of Concerns)**: Trang đích (`Landing Page`) cần đóng vai trò là "bộ mặt" truyền thông, giới thiệu sứ mệnh, đội ngũ và kiến trúc công nghệ; trong khi Trang Cửa hàng (`Storefront`) tập trung tối đa cho tác vụ duyệt sản phẩm, tra cứu thông số, đặt hàng và quản lý tài khoản.

---

## Quyết Định Kiến Trúc (Decision)

### 1. Phân Tách Định Tuyến Hai Tầng (Dual-Route Decoupling)
- **Trang chủ (`/` - `src/public/index.html`)**:
  - Chuyển đổi thành **About Us Landing Page** cao cấp, chuẩn phong cách Editorial Tech & Anti-slop.
  - Tích hợp 6 phân khu nội dung:
    1. *Hero Spotlight*: Sứ mệnh trạm dịch vụ GearHub, huy hiệu học phần CSC00004 Khoa CNTT - ĐHKHTN, nút kêu gọi hành động CTA kép `[Khám phá Cửa hàng ➔]` dẫn sang `/shop` và `[Xem Báo Cáo Đồ Án]`.
    2. *Vấn đề & Giải pháp*: Laptop quá nhiệt mùa đồ án, thiếu phụ kiện thuyết trình, rủi ro giữ máy qua đêm ở tiệm ngoài vs. Lấy liền tại sảnh trường 30–45 phút.
    3. *Showcase 3 Trụ Cột*: Spa Laptop tiêu chuẩn, Cho thuê Gear bằng MSSV, Trợ lý AI Shopping Consultant.
    4. *Kiến Trúc Công Nghệ*: Node.js, Express, Neon PostgreSQL, Google Gemini AI, Vercel Serverless, VietQR Sandbox.
    5. *Đội Ngũ Sáng Lập (Meet Our Team)*: Card 5 sinh viên Khoa CNTT ĐHKHTN ĐHQG-HCM (Trưởng nhóm, Frontend Architect, Backend & Cloud, UI/UX Designer, QA & Documentation).
    6. *Vị Trí & Liên Hệ*: Bản đồ điểm tiếp nhận trực tiếp tại Sảnh C, 227 Nguyễn Văn Cừ & Linh Trung Thủ Đức kèm mã QR mobile.
- **Trang Cửa Hàng (`/shop` & alias `/store` - `src/public/shop.html`)**:
  - Di dời toàn bộ giao diện bán lẻ, giỏ hàng, tra cứu mã đơn, thanh toán QR và cổng tự phục vụ khách hàng sang `src/public/shop.html`.
  - Cập nhật định tuyến trong `server.js` để phục vụ `shop.html` tại các route `/shop` và `/store`.
  - Giữ nguyên toàn bộ mã JavaScript mô-đun (`main.js`, `cart.js`, `customerPortal.js`, `qrPayment.js`, `aiChat.js`, `catalogFilter.js`, `utils.js`), đảm bảo 100% tính tương thích ngược và không làm gãy bất kỳ test case nào.

### 2. Đồng Nhất Hệ Thống Điều Hướng & Trợ Lý AI
- Cả hai trang `/` và `/shop` sử dụng chung cấu trúc Header và Mobile Drawer với cơ chế hiển thị trạng thái tab tích cực (`active` indicator trên liên kết `Giới thiệu` hoặc `Cửa hàng`).
- Tích hợp widget Trợ lý AI (`AI Shopping Consultant`) trên cả 2 trang, cho phép ban giám khảo và người dùng có thể kích hoạt tư vấn thông minh ở bất kỳ trang nào.
- Đồng bộ hóa Theme Sáng/Tối (Dark/Light mode) dựa trên `localStorage` thông qua `utils.js`.

---

## Kết Quả & Đánh Giá (Consequences)

1. **Giao diện Giới thiệu Chuyên nghiệp**: Phù hợp tối đa cho buổi thuyết trình poster A1, cung cấp đầy đủ thông tin về đồ án và nhóm sinh viên Khoa CNTT.
2. **Trải nghiệm Người dùng Rõ ràng**: Phân định rạch ròi giữa nhu cầu tìm hiểu đồ án (`/`) và nhu cầu thao tác mua bán/đặt dịch vụ (`/shop`).
3. **An toàn Hệ thống & 100% Pass Tests**: Toàn bộ các API và cấu trúc logic phục vụ bài test kiểm thử cú pháp `vm.Script` và tương tác DOM được giữ nguyên vẹn.
