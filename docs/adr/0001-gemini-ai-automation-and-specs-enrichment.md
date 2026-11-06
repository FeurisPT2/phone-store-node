# 0001. Sử dụng Google Gemini 2.5 Flash Tự Động Hóa Dữ Liệu Sản Phẩm Và Tư Vấn Khách Hàng

Chúng tôi quyết định tích hợp Google Gemini 2.5 Flash thông qua official SDK `@google/genai` để thực hiện hai nhiệm vụ cốt lõi: tự động hóa làm giàu thông tin sản phẩm (AI Product Enrichment) kết hợp cơ chế tự vá dữ liệu thiếu (Self-healing Catalog), và trợ lý tư vấn bán hàng thời gian thực (AI Shopping Consultant) tại Storefront.

## Bối cảnh & Lý do lựa chọn
- Trước đây hệ thống bóc tách thông số điện thoại bằng biểu thức chính quy (Regex) trong `crawlerService.js`, dẫn đến thông số thiếu chính xác, thiếu tính hấp dẫn và không có bài viết review chuyên sâu.
- Gemini 2.5 Flash cung cấp tốc độ phản hồi cực nhanh (< 1 giây), hỗ trợ tiếng Việt rất tự nhiên, hỗ trợ Structured Outputs (JSON Schema) và có hạn mức miễn phí rộng rãi phù hợp với quy mô vận hành của cửa hàng.
- Việc tách kiến trúc thành cơ chế Event-driven (trigger khi cào/thêm sản phẩm) kết hợp tác vụ ngầm tự vá (Self-healing Catalog) giúp đảm bảo toàn bộ kho hàng luôn đầy đủ dữ liệu chất lượng cao mà không làm chậm trải nghiệm duyệt web của người dùng.
