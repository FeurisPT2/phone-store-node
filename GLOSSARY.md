# TechStore

Hệ thống bán lẻ điện thoại trực tuyến kết hợp Cổng quản trị (Admin Portal), Quản trị khách hàng (Customer CRM) và Hệ thống tự động hóa làm giàu dữ liệu bằng Google Gemini AI.

## Language

**Product**:
Điện thoại thông minh chính hãng được bày bán trên cửa hàng với thông số kỹ thuật, hình ảnh và giá niêm yết.
_Avoid_: Item, goods, phone_item

**AI Product Enrichment**:
Quy trình tự động sử dụng Google Gemini AI để chuẩn hóa bảng thông số kỹ thuật và tạo bài viết đánh giá chuyên sâu (Ưu điểm, Nhược điểm, Đối tượng phù hợp) cho sản phẩm mới cào hoặc mới thêm.
_Avoid_: Auto-generation, AI crawl, AI desc

**Dynamic Catalog Grounding**:
Kỹ thuật tiêm danh mục kho hàng thực tế của cửa hàng vào ngữ cảnh System Instruction của Gemini để chống ảo giác (hallucination) và chỉ tư vấn đúng sản phẩm đang có sẵn.
_Avoid_: RAG, vector search, embedding store

**Detailed Specs Sheet**:
Bảng thông số kỹ thuật chuẩn hóa gồm 8 trường cốt lõi: Màn hình, Vi xử lý (Chip), RAM, Bộ nhớ trong (ROM), Dung lượng pin, Camera, Công nghệ sạc, Hệ điều hành.
_Avoid_: Specs table, technical data

**AI Review Body**:
Bài viết phân tích chuyên sâu gồm 4 phần: Tóm tắt tổng quan, Ưu điểm nổi bật (Pros), Nhược điểm cần lưu ý (Cons), và Đối tượng người dùng phù hợp (Target Audience).
_Avoid_: Product description, marketing text

**AI Shopping Consultant**:
Trợ lý AI trực tuyến gắn tại Storefront hỗ trợ khách hàng tìm kiếm và tư vấn điện thoại theo nhu cầu tài chính, thói quen sử dụng dựa trên kho hàng thực tế.
_Avoid_: Chatbot, bot, virtual assistant

**Self-healing Catalog**:
Tác vụ ngầm định kỳ quét toàn bộ kho sản phẩm để phát hiện và tự động điền các thông tin, thông số hoặc bài đánh giá AI còn thiếu.
_Avoid_: Auto-cleaner, cron sync

**Customer**:
Người mua hàng có số điện thoại định danh, được hệ thống tự động ghi nhớ lịch sử đơn mua và phân hạng thành viên.
_Avoid_: User, account, client

**Order**:
Yêu cầu mua một hoặc nhiều sản phẩm của khách hàng, trải qua quy trình xác nhận, giao hàng và thanh toán.
_Avoid_: Transaction, purchase

**Quick Prompt**:
Nút bấm gợi ý câu hỏi nhanh được thiết lập sẵn trong widget chat để khách hàng bắt đầu cuộc hội thoại tư vấn với AI mà không cần gõ phím.
_Avoid_: Sample question, starter query

**Mini Product Card**:
Thẻ sản phẩm thu nhỏ (ảnh, tên máy, giá, nút thao tác) được nhúng trực tiếp vào tin nhắn trả lời của AI Shopping Consultant.
_Avoid_: Product badge, preview item

**Graceful Fallback**:
Cơ chế tự động chuyển đổi sang bộ phân tích Regex truyền thống hoặc hiển thị thông báo an toàn khi thiếu GEMINI_API_KEY hoặc quá hạn mức, đảm bảo website không bao giờ bị gián đoạn hay phát sinh lỗi 500.
_Avoid_: Error handler, try-catch fallback

**QR Payment Sandbox**:
Phương thức thanh toán chuyển khoản quét mã QR động (mô phỏng chuẩn VietQR / VNPay / MoMo) gắn với mã tham chiếu giao dịch duy nhất và thời hạn hiệu lực 15 phút cho mỗi đơn hàng.
_Avoid_: Fake payment, dummy gateway

**Lazy TTL Expiration**:
Cơ chế kiểm tra và tự động chuyển đơn hàng chờ thanh toán QR quá hạn 15 phút sang trạng thái hủy ngay tại thời điểm truy vấn hoặc đối soát, không phụ thuộc bộ đếm ngầm trong bộ nhớ.
_Avoid_: Background cron cancel, timeout timer

**Customer Self-Service Portal**:
Cổng tự phục vụ cho phép khách hàng (đã đăng nhập hoặc khách vãng lai dùng Số điện thoại + Mã đơn) tra cứu tiến độ đơn hàng, cập nhật địa chỉ nhận hàng mặc định, quản lý danh sách yêu thích và chủ động hủy đơn khi chưa giao.
_Avoid_: User settings page, profile tab

**Order Timeline**:
Thanh tiến trình trực quan hóa vòng đời thực thi của một đơn hàng qua các mốc: Chờ thanh toán QR / Chờ xác nhận ➔ Đã xác nhận ➔ Đang giao hàng ➔ Đã hoàn thành (hoặc Đã hủy).
_Avoid_: Order log, status text

