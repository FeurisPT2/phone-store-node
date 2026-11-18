# ADR 0012: Kiến Trúc 5 Trang Chuyên Biệt, Đồng Bộ Màu & Tái Thiết Kế Giỏ Hàng 3 Phân Lớp

## Bối cảnh & Phản hồi từ Giảng viên (Context & Feedback)

Trong buổi đánh giá tiến độ đồ án Nhập môn Công nghệ Thông tin (CSC00004), Giảng viên bộ môn đã đưa ra 6 góp ý kiến trúc và giao diện mang tính định hướng chất lượng sản phẩm:
1. **Đồng bộ màu**: Toàn bộ hệ thống cần một bảng màu đồng nhất, chuẩn mực công nghệ, loại bỏ các chi tiết màu sắc lệch tông.
2. **Dịch vụ trang riêng, thuê 1 trang, bán 1 trang**: Không gộp chung 3 mô hình kinh doanh khác biệt (Dịch vụ spa laptop, Thuê gear theo ngày, Mua đứt phụ kiện) vào một danh mục duy nhất, mà cần phân tách thành các trang độc lập.
3. **Trang đầu bảng hiệu và vì sao làm**: Trang chủ cần hiển thị trực quan bảng hiệu trạm dịch vụ GearHub Station tại trường và nêu bật câu chuyện bối cảnh/động lực giải quyết bài toán cho sinh viên KHTN.
4. **Chức năng 1 trang riêng**: Cần một trang riêng để giới thiệu các chức năng công nghệ của đồ án (Google Gemini AI Grounding, Tra cứu đơn thời gian thực, VietQR Sandbox, Admin CRM).
5. **Thiết kế dễ nhìn gọn**: Tối giản hóa bố cục, tăng khoảng trắng thở (whitespace), tránh nhồi nhét chữ và hiệu ứng màu mè.
6. **Chỉnh lại giỏ hàng**: Tái cấu trúc giỏ hàng để phân biệt rạch ròi giữa đặt lịch hẹn dịch vụ, thuê thiết bị và mua phụ kiện.

---

## Quyết Định Kiến Trúc (Decision)

### 1. Tối Ưu Hóa Tuyến Đường & Hợp Nhất Cửa Hàng (Streamlined Routing & Unified Shop)
* **`GET /` (`index.html`)**: Trang chủ giới thiệu Bảng Hiệu Trạm (`GearHub Station Signboard`), phân khu *"Vì Sao Làm (Why & Motivation)"* giải quyết nỗi đau sinh viên KHTN, và các liên kết nhanh tới dịch vụ & thiết bị.
* **`GET /shop` (`shop.html`)**: Hợp nhất toàn diện các gói Dịch Vụ Vệ Sinh & Spa Máy, Thiết Bị Cho Thuê (bằng thẻ SV) và Phụ Kiện Học Tập vào một cửa hàng duy nhất với bộ lọc phân loại thông minh, thẻ sản phẩm có hiệu ứng phóng to (hover zoom) và màu sắc dịu mắt (Calm Editorial / Bone & Stone). Các tuyến cũ `/services`, `/rentals`, `/features` được chuyển hướng 301/302 mượt mà về `/shop`.
* **`GET /cart` (`cart.html`)**: Trang Giỏ Hàng & Đặt Lịch Hẹn chuyên biệt khi người dùng nhấn vào nút giỏ hàng ở góc trên bên phải. Khi rê chuột (hover) vào nút giỏ hàng, flyout mini-cart tự động hiển thị danh sách sản phẩm đã thêm.
* **Bảng Thông Tin Chi Tiết Gọn Gàng**: Bảng thông số chi tiết sản phẩm được tinh gọn với bộ chuyển tab (Thông số kỹ thuật vs Tư vấn AI), bố cục nhãn trên - giá trị dưới rõ ràng, vừa vặn khung nhìn và không gây tràn màn hình.
* **Chuẩn Hóa Font Tiếng Việt (`Be Vietnam Pro`)**: Thay thế hoàn toàn font cũ bằng `Be Vietnam Pro` trên toàn bộ website nhằm hiển thị hoàn hảo dấu thanh tiếng Việt không lỗi phông hay lệch độ đậm.

### 2. Chuẩn Hóa Bảng Màu & Thiết Kế Tối Giản (Calm Editorial / Bone & Stone)
* **Bảng màu đồng nhất**:
  * Tông nền nhã nhặn: `--bg: #f3f2ee`, `--surface: #ffffff`, `--surface-raised: #f7f6f2`.
  * Màu chữ và tương phản cao: `--ink: #0f172a`, `--muted: #64748b`.
  * Thẻ sản phẩm: Viền mỏng, giảm độ chói màu, hiệu ứng `transform: translateY(-4px) scale(1.018)` mượt mà khi hover.

### 3. Tái Thiết Kế Giỏ Hàng 3 Phân Lớp & Hover Mini-Cart (Tri-Tier Cart Redesign)
Nâng cấp [`src/public/js/cart.js`](../../src/public/js/cart.js) và giao diện giỏ hàng:
* **Nhóm 1 - 🛠️ Lịch Hẹn Dịch Vụ**: Tên dịch vụ + Bộ chọn khung giờ hẹn tại Sảnh C trường.
* **Nhóm 2 - 📦 Thiết Bị Thuê**: Tên thiết bị + Bộ chọn thời gian thuê (buổi/ngày) + Huy hiệu *"0đ Cọc · Đối chiếu MSSV"*.
* **Nhóm 3 - 🛍️ Phụ Kiện Mua Đứt**: Tên món hàng + Bộ nút điều chỉnh số lượng (`-` / `+`).
* **Bảng tổng kết chi phí 4 dòng**: Tiền dịch vụ, Tiền thuê, Tiền mua hàng, Tiền cọc (0đ), và Tổng thanh toán minh bạch.
* **Flyout Mini-Cart**: Hover nút giỏ hàng góc trên bên phải mở nhanh danh sách món hàng, tổng tiền và nút đi tới `/cart`.

---

## Kết Quả & Đánh Giá (Consequences)

1. **Đáp ứng 100% nhận xét của Giảng viên & Người dùng**: Bố cục mạch lạc, trực quan, chuyên nghiệp, tiếng Việt hiển thị sắc nét.
2. **Trải nghiệm Mua sắm & Đặt hẹn Thân thiện**: Dễ dàng tra cứu thông số kỹ thuật dạng tab, thêm vào giỏ và xem nhanh giỏ hàng qua hover hoặc trang chuyên biệt `/cart`.
3. **An toàn Hệ thống**: Giữ nguyên toàn bộ 72/72 test cases pass xanh, tương thích 100% với backend API và Vercel Serverless.
