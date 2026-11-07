# Spec 0002: TechStore v2.0 Production-Ready Release (QR Payment, Customer Portal, Multi-Attribute Specs Filter & Performance Optimization)

## Problem Statement

TechStore v1.0 đã hoàn thiện nền tảng tự động hóa dữ liệu bằng Gemini AI nhưng còn thiếu các mảnh ghép thương mại điện tử cốt lõi để vận hành thực tế:
1. Quy trình đặt hàng chỉ mới dừng ở tạo đơn `pending` (COD), thiếu luồng thanh toán chuyển khoản quét mã QR động (VNPay / MoMo / VietQR), đối soát trạng thái tự động và hủy đơn quá hạn thanh toán.
2. Khách hàng chưa có Cổng tự phục vụ (Customer Self-Service Portal) để tra cứu đơn hàng bằng `Số điện thoại + Mã đơn` (cho khách vãng lai), theo dõi tiến trình vận chuyển trực quan (Order Timeline), cập nhật sổ địa chỉ mặc định, lưu danh sách yêu thích (Wishlist) hoặc chủ động hủy đơn khi chưa giao.
3. Bộ lọc tại Storefront mới chỉ lọc theo tên hãng (`brand`), chưa khai thác được bảng thông số chuẩn hóa `detailedSpecs` (RAM, Bộ nhớ trong, Chip xử lý, Khoảng giá) và chưa đồng bộ lên URL query params hay có Drawer Menu trên thiết bị di động.
4. Hệ thống đọc lại toàn bộ CSDL trên mỗi lượt gọi `/api/products`, thiếu cơ chế In-Memory TTL Cache, chỉ mục PostgreSQL (`CREATE INDEX IF NOT EXISTS`) và nén HTTP Gzip.
5. Quy trình xử lý đơn hàng của Admin chưa có bước `confirmed` (Đã xác nhận) rõ ràng và đang cộng chi tiêu khách hàng ngay lúc mới đặt thay vì khi đơn hàng hoàn tất (`completed`).

## Solution

Xây dựng bản phát hành **TechStore v2.0 Production-Ready** gồm 5 trụ cột:
1. **Payment & Order Fulfillment (`COD` + `QR Payment Sandbox`):**
   - Mở rộng `OrderModel` với `paymentMethod` (`'cod' | 'qr'`), `paymentStatus` (`'unpaid' | 'awaiting_payment' | 'paid' | 'expired' | 'failed'`), `paymentRef` (`PAY_<orderId>`), và `paymentExpiresAt` (15 phút).
   - Triển khai **Lazy TTL Expiration** tự động chuyển đơn QR quá hạn 15 phút sang `status: 'cancelled'`, `paymentStatus: 'expired'`.
   - Cung cấp API Polling 3 giây (`GET /api/orders/:id/payment-status`) và Webhook đối soát (`POST /api/payments/sandbox-webhook`).
2. **Customer Self-Service Portal & Order Timeline Tracker:**
   - Cổng khách hàng tích hợp tại Storefront (`/customer-portal` và Modal đa tab) hỗ trợ tra cứu đơn vãng lai (`GET /api/orders/track?orderId=...&phone=...`), xem lịch sử đơn kèm thanh **Order Timeline** 4 bước (`Chờ xác nhận` ➔ `Đã xác nhận` ➔ `Đang giao hàng` ➔ `Hoàn thành` / `Đã hủy`), cập nhật hồ sơ/địa chỉ nhận hàng mặc định (`PUT /api/customers/profile`), quản lý danh sách yêu thích (`POST /api/customers/wishlist`), và hủy đơn khi còn ở trạng thái `pending`/`awaiting_payment` (`POST /api/orders/:id/cancel`).
3. **Multi-Attribute Specs Filtering & Responsive Mobile-First UI:**
   - Mở rộng `ProductModel.getAll(filters)` và `GET /api/products` hỗ trợ lọc kết hợp theo `brand`, `ram`, `storage`, `chip`, `minPrice`, `maxPrice`, `search`, và sắp xếp `sort` (`price_asc`, `price_desc`, `discount_desc`, `name_asc`).
   - Đồng bộ bộ lọc hai chiều với URL Query Params (`?brand=...&ram=...&storage=...`), bổ sung Breadcrumb điều hướng, Skeleton Loading và Mobile Filter/Navigation Drawer.
4. **Performance & System Optimization:**
   - Bộ nhớ đệm `In-Memory TTL Cache` (5 phút) trong `ProductModel` kèm `ProductModel.invalidateCache()` tức thời khi thêm/sửa/xóa sản phẩm.
   - Bổ sung PostgreSQL Indexes (`CREATE INDEX IF NOT EXISTS`) trong `src/config/db.js`, middleware nén HTTP Gzip (`src/middlewares/compression.js`), và `loading="lazy"` cho toàn bộ ảnh sản phẩm.
5. **Admin Order Operations & Customer Tiering Automation:**
   - Chuẩn hóa quy trình trạng thái đơn hàng: `awaiting_payment` / `pending` ➔ `confirmed` ➔ `shipping` ➔ `completed` (hoặc `cancelled`).
   - Hỗ trợ lọc đơn theo trạng thái, khoảng ngày (`fromDate`, `toDate`), nút chuyển nhanh trạng thái kế tiếp trên bảng quản trị, và tự động cộng chi tiêu + nâng hạng khách hàng (`CustomerModel.syncOrderStats`) đúng 1 lần (`statsSynced = true`) khi đơn hàng đạt trạng thái `completed`.
