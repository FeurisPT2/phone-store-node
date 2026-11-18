# 0002. Mở Rộng Schema Sản Phẩm Và Cơ Chế Dynamic Catalog Grounding

Chúng tôi quyết định mở rộng Schema của bảng `products` (bao gồm cả Neon PostgreSQL và JSON DB) với 3 trường cấu trúc mới (`aiReview`, `detailedSpecs`, `aiEnrichedAt`), đồng thời áp dụng kỹ thuật Dynamic Catalog Grounding cho trợ lý tư vấn bán hàng thời gian thực.

## Bối cảnh & Lý do lựa chọn
- Cấu trúc `products` cũ chỉ lưu `specs` dạng chuỗi thô (plain text), không thể phân tích rạch ròi thành bảng thông số hay hiển thị các mục Ưu/Nhược điểm sinh động trên giao diện Storefront.
- Việc lưu `aiReview` và `detailedSpecs` dưới dạng JSON (JSONB trên Postgres) cho phép linh hoạt lưu trữ các trường đa dạng (Pros, Cons, Screen, Chip, Battery) mà không cần tạo quá nhiều bảng phụ (relational normalization) phức tạp.
- Kỹ thuật Dynamic Catalog Grounding (tiêm trực tiếp danh mục tóm tắt vào System Instruction) giúp Gemini tư vấn trung thực 100% dựa trên hàng có sẵn trong kho, giải quyết dứt điểm vấn đề ảo giác (hallucination) mà không cần phụ thuộc vào hạ tầng Vector Database cồng kềnh.
