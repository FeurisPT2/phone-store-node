# ADR 0013: Kiến Trúc Trang Chi Tiết Sản Phẩm (PDP) & Phân Tách Nút Hành Động Chuẩn E-Commerce

## Bối Cảnh (Context)

Nhằm nâng cấp GearHub từ một giao diện xem nhanh (quick-view modal) trở thành một nền tảng thương mại điện tử chuyên nghiệp:
1. **Trang sản phẩm độc lập**: Người dùng cần đường dẫn URL cố định (`/product?id=...` hoặc `/product/:id`) để chia sẻ link cho bạn bè, lưu bookmark, đọc toàn bộ thông số chi tiết và quy trình trạm.
2. **Phân tách hành động mua/thuê/đặt lịch**: Nút gộp cũ *"Đặt lịch / Thuê ngay"* gây mơ hồ về mặt ngữ nghĩa. Cần phân định rõ ràng:
   - Dịch vụ vệ sinh / tản nhiệt: `Đặt lịch ngay` + `Thêm vào giỏ hàng`.
   - Thuê thiết bị học tập: `Thuê ngay` + `Thêm vào giỏ hàng`.
   - Phụ kiện mua đứt: `Mua ngay` + `Thêm vào giỏ hàng`.
3. **Trải nghiệm tìm hiểu sâu**: Tích hợp phân tích Gemini AI Verified (ưu điểm, lưu ý, đối tượng phù hợp) và quy trình 4 bước tiếp nhận tại Sảnh C.

---

## Quyết Định Kiến Trúc (Decision)

### 1. Tuyến Đường & Bộ Điều Khiển Trang Chi Tiết
* **Tuyến đường Express ([server.js](../../server.js))**: Đăng ký `GET /product`, `/product.html`, `/product/:id` trỏ về `src/public/product.html`.
* **Giao diện ([product.html](../../src/public/product.html) & [product.css](../../src/public/css/product.css))**:
  - Breadcrumbs điều hướng 4 cấp: `Trang chủ / Cửa hàng / [Danh mục] / [Tên sản phẩm]`.
  - Khung ảnh lớn 16:11 có bo góc, ribbon danh mục, 3 huy hiệu cam kết trạm (30-45p, 0đ cọc thẻ SV, bảo hành 7 ngày).
  - Khối định giá lớn kèm pill tiết kiệm và ghi chú trợ giá sinh viên.
  - Bộ 3 tab thông tin: *Thông Số Kỹ Thuật*, *Đánh Giá GearHub AI (Gemini Verified)*, và *Quy Trình 4 Bước Chuẩn Dân IT*.
  - Khối gợi ý dịch vụ & thiết bị liên quan (Related Products).
* **Script điều khiển ([product.js](../../src/public/js/product.js))**: Tự động bóc tách ID từ URL, nạp dữ liệu từ `/api/products/:id`, xử lý thêm vào giỏ, đặt ngay (`buyNow`), lưu yêu thích và chia sẻ liên kết.

### 2. Chuẩn Hóa Nhãn Nút Hành Động
* **Trang chủ Hero ([index.html](../../src/public/index.html))**: Tách thành 2 nút độc lập: `[ Đặt Lịch Vệ Sinh ]` (dẫn đến `/shop?category=service`) và `[ Thuê Gear Ngay ]` (nút xanh `.cta-btn-rental` dẫn đến `/shop?category=rental`).
* **Thẻ sản phẩm ([main.js](../../src/public/js/main.js))**:
  - Nút chính đổi ngữ cảnh: `Đặt lịch ngay` (dịch vụ) / `Thuê ngay` (thuê gear) / `Mua ngay` (phụ kiện).
  - Nút phụ thống nhất: `Thêm vào giỏ hàng`.
  - Nút `Chi tiết`: Dẫn thẳng tới trang sản phẩm riêng `/product?id=...`.
* **Cân chỉnh CSS ([style.css](../../src/public/css/style.css))**: Tối ưu `grid-template-columns: 1fr 1fr auto`, giữ chiều cao và căn hàng hoàn hảo.

---

## Kết Quả (Consequences)

1. Đáp ứng trọn vẹn mô hình e-commerce hiện đại, thoát ly hoàn toàn mác đồ án thử nghiệm.
2. 100% test suites (73/73 tests) vượt qua thành công, sẵn sàng cho cả môi trường local và Vercel Serverless.
