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

**Storage Seam**:
Ranh giới kiến trúc phân tách giữa các mô hình nghiệp vụ (Product, Order, Customer, Admin) và tầng lưu trữ vật lý, cung cấp giao diện tập hợp nhất quán, chuẩn hóa ánh xạ trường dữ liệu giữa snake_case và camelCase, loại bỏ hoàn toàn các lệnh rẽ nhánh lưu trữ trong domain models.
_Avoid_: Database layer, ORM, data access layer, repository layer

**Storage Adapter**:
Thành phần cụ thể hóa Storage Seam cho một công nghệ lưu trữ xác định (PostgresStorageAdapter giao tiếp với Neon PostgreSQL và JsonStorageAdapter thao tác trên file JSON cục bộ).
_Avoid_: DB driver, DB client, data provider

**Safe Customer Projection**:
Bản chiếu dữ liệu khách hàng đã được loại bỏ trường nhạy cảm (`passwordHash`) ngay tại ranh giới `CustomerModel.toSafeCustomer()`, đảm bảo mọi truy vấn đọc, cập nhật hồ sơ, thống kê CRM hay khôi phục phiên (`customerMemory`) đều không bao giờ làm rò rỉ mã băm mật khẩu ra tầng điều khiển hoặc giao diện.
_Avoid_: Sanitized user, stripped customer object, public user DTO

**Catalog Filter Engine**:
Mô-đun lọc, sắp xếp và trích xuất thông số danh mục đa môi trường (`catalogFilter.js`, chuẩn UMD dùng chung cho cả Node.js lẫn trình duyệt) thực thi khớp thông số theo ranh giới từ (`Detailed Specs Sheet`), chuẩn hóa các mốc khoảng giá (`priceRange`, `minPrice`/`maxPrice`), đồng nhất bí danh sắp xếp, tìm kiếm toàn văn và bóc tách thông số phần cứng (`extractHardwareSpecs`).
_Avoid_: Client filter script, product query helper, search util

**Unified Auth Portal**:
Cổng đăng nhập thống nhất thay thế luồng chuyển tab vai trò truyền thống ("Khách hàng" vs "Quản trị viên"), chỉ duy trì 2 tab chức năng "Đăng nhập" và "Đăng ký mới". Hệ thống tiếp nhận cả Số điện thoại sinh viên hoặc Username quản trị trên một ô nhập duy nhất và tự động phân luồng điều hướng (Smart Role Routing) dựa trên đặc quyền tài khoản được xác thực.
_Avoid_: Multi-login, dual portal, role selector

**Serverless Admin Session Recovery**:
Cơ chế tự động khôi phục phiên đăng nhập Quản trị viên trên kiến trúc serverless phân tán (Vercel) thông qua HTTP-Only Cookie mang token chữ ký số HMAC-SHA256 (`admin_token`). Giúp giải quyết triệt để vấn đề mất phiên làm việc do `express-session` sử dụng in-memory MemoryStore khi hệ thống luân chuyển sang container mới.
_Avoid_: Cookie login, session hack, token bypass

**GearHub Station**:
Mô hình dịch vụ công nghệ tại chỗ phục vụ sinh viên (đặt tại Sảnh C, 227 Nguyễn Văn Cừ, ĐHKHTN ĐHQG-HCM), cung cấp dịch vụ vệ sinh máy tính lấy liền trong 30-45 phút và cho thuê phụ kiện/thiết bị học tập không cần cọc tiền mặt (áp dụng thủ tục thẻ sinh viên).
_Avoid_: Phone shop, mobile store, tech workshop

**About Us Landing Page**:
Trang đích giới thiệu đồ án GearHub (đường dẫn `/`), hiển thị thông tin học phần CSC00004 - Nhập môn CNTT (Khoa CNTT - ĐHKHTN ĐHQG-HCM), sứ mệnh giải quyết sự cố thiết bị cho sinh viên, showcase các dịch vụ cốt lõi, hồ sơ đội ngũ 5 thành viên sáng lập và kiến trúc công nghệ kèm lời kêu gọi hành động (CTA) dẫn sang GearHub Storefront.
_Avoid_: Homepage, intro page, splash screen

**GearHub Storefront**:
Trang bán lẻ và cho thuê thiết bị trực tuyến chuyên biệt (đường dẫn `/shop`, alias `/store`), tích hợp đầy đủ bộ lọc danh mục, chi tiết cấu hình, giỏ hàng, thanh toán mô phỏng VietQR Sandbox, cổng tự phục vụ khách hàng và trợ lý AI Shopping Consultant.
_Avoid_: Main page, catalog view, product list

**GearHub Station Signboard**:
Bảng hiệu nhận diện trạm dịch vụ tại Sảnh C trường ĐHKHTN đặt tại đầu trang chủ (`/`), hiển thị rõ ràng thông tin trạm, cam kết dịch vụ lấy liền 30–45 phút và thời gian tiếp nhận sinh viên.
_Avoid_: Header banner, hero ad, billboard

**Dedicated Multi-Page Architecture**:
Kiến trúc định tuyến phân tách rõ ràng 5 trang chức năng độc lập (`/` - Trang chủ bảng hiệu & Vì sao làm, `/services` - Trạm Dịch vụ vệ sinh & spa máy, `/rentals` - Trạm Cho thuê gear học tập bằng thẻ SV, `/shop` - Gian hàng phụ kiện mua đứt, `/features` - Trang Giới thiệu tính năng & công nghệ đồ án), xóa bỏ hoàn toàn hiện tượng nhồi nhét nội dung trên một trang đơn lẻ.
_Avoid_: Monolithic SPA, bloated page, all-in-one catalog

**Tri-Tier Cart**:
Thành phần giỏ hàng thông minh phân tách rạch ròi 3 nhóm mục trong một phiên giao dịch: Lịch hẹn dịch vụ (có chọn ca hẹn tại sảnh trường), Thiết bị thuê (có chọn số buổi/ngày và áp dụng chính sách 0đ tiền cọc qua thẻ SV), và Phụ kiện mua đứt (có điều chỉnh số lượng).
_Avoid_: Single cart list, checkout basket





