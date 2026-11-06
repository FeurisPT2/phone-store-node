# Spec 0001: Gemini AI Automation (Product Enrichment, Shopping Consultant & Self-healing Catalog)

## Problem Statement

TechStore hiện tại chỉ bóc tách thông số điện thoại bằng các biểu thức chính quy (regex) thô sơ khi cào dữ liệu, khiến thông tin sản phẩm đơn điệu, thiếu bài đánh giá chuyên sâu (ưu điểm, nhược điểm, đối tượng phù hợp) và không hỗ trợ khách hàng tìm kiếm thông minh theo nhu cầu. Khách hàng vào trang web phải tự tìm kiếm và đọc cấu hình khô khan, dễ phân vân dẫn đến tỷ lệ rời bỏ cao. Quản trị viên cũng tốn nhiều công sức nếu muốn viết bài mô tả hấp dẫn cho từng dòng điện thoại.

## Solution

Tích hợp Google Gemini 2.5 Flash thông qua official SDK `@google/genai` để tự động hóa hoàn thiện website liên tục:
1. **AI Product Enrichment (Hậu đài & Quản trị):** Tự động bóc tách và chuẩn hóa bảng thông số kỹ thuật 8 trường cốt lõi (`detailedSpecs`) và tạo bài đánh giá chuyên sâu (`aiReview`) gồm Tóm tắt, Ưu điểm (xanh lá), Nhược điểm (cam/đỏ), và Đối tượng phù hợp.
2. **AI Shopping Consultant (Tiền sảnh & Khách hàng):** Cửa sổ chat nổi góc phải màn hình Storefront hỗ trợ Quick Prompts và thẻ sản phẩm mini có nút mua ngay, tư vấn dựa trên kho hàng thực tế của cửa hàng (Dynamic Catalog Grounding).
3. **Self-healing Catalog & Graceful Fallback:** Tác vụ quét ngầm tự động bù đắp dữ liệu sản phẩm thiếu, tự động chuyển về regex an toàn khi thiếu key hoặc gặp sự cố API mà không bao giờ gây lỗi 500.

## User Stories

1. As a Storefront customer, I want to click on an AI chat bubble at the bottom right corner, so that I can ask for buying advice tailored to my needs and budget.
2. As a Storefront customer, I want to tap pre-defined Quick Prompts in the chat box, so that I can get instant recommendations without typing a long question.
3. As a Storefront customer, I want the AI Consultant to recommend only phones currently available in the store with price and photo, so that I don't get recommendations for out-of-stock items.
4. As a Storefront customer, I want to see Mini Product Cards inside the AI's reply with "Add to Cart" and "View Details" buttons, so that I can purchase immediately without manual search.
5. As a Storefront customer, I want to click on any phone card on the homepage to open a comprehensive Product Detail Modal, so that I can read the AI's honest pros and cons before buying.
6. As a Storefront customer, I want to view a structured 8-field spec sheet (Screen, Chip, RAM, ROM, Battery, Camera, Charging, OS), so that I can quickly compare technical specs.
7. As an Admin, I want newly crawled products to be automatically enriched with detailed specs and AI reviews, so that I don't have to manually write descriptions.
8. As an Admin, I want to click a "✨ Enrich with AI" button on any product in the Admin Portal, so that I can re-generate or refresh its AI review and specs on demand.
9. As an Admin, I want to preview and edit the AI-generated pros, cons, and specs before publishing, so that I maintain full control over product copy.
10. As an Admin, I want a background self-healing task to scan and enrich any product lacking AI data, so that the entire catalog remains complete over time.
11. As a Storefront customer, I want to receive a friendly maintenance message if the AI service is temporarily unavailable, so that my shopping experience is not abruptly broken.
12. As a Store Manager, I want the system to fall back to regex spec extraction if the Gemini API key is missing or quota is exhausted, so that product crawling never fails with a 500 error.

## Implementation Decisions

- **AI Service Adapter:** Xây dựng module dịch vụ Gemini đóng vai trò adapter bọc lấy `@google/genai`, cung cấp 2 phương thức chính: `enrichProduct({ name, brand, rawText })` trả về Structured JSON theo schema nghiêm ngặt, và `consultCustomer({ query, catalogSummary, conversationHistory })`.
- **Structured JSON Schema:** Yêu cầu Gemini trả về JSON chuẩn xác:
  - `detailedSpecs`: `{ screen: string, chip: string, ram: string, storage: string, battery: string, camera: string, charging: string, os: string }`
  - `aiReview`: `{ summary: string, pros: string[], cons: string[], targetAudience: string }`
- **Schema Evolution (Database & Storage):**
  - Mở rộng bảng `products` (Postgres DDL & JSON DB mapping) bổ sung 3 trường: `ai_review` (JSON/JSONB), `detailed_specs` (JSON/JSONB), và `ai_enriched_at` (TIMESTAMPTZ/ISO String).
- **API Contracts:**
  - `POST /api/chat`: Nhận `{ message, history }`, trả về `{ reply, suggestedProducts: [...] }`.
  - `POST /api/admin/products/:id/enrich`: Yêu cầu AI làm giàu sản phẩm theo ID.
  - `POST /api/admin/products/self-heal`: Trigger quét ngầm kho hàng và bù đắp dữ liệu thiếu.
- **Storefront Components:**
  - Widget chat nổi (Floating Action Button + Chat Window).
  - Modal chi tiết sản phẩm toàn diện (Product Detail Modal) hiển thị ảnh lớn, giá, nút mua, bảng 8 thông số và bài đánh giá AI (Pros/Cons).
- **Admin Panel Controls:**
  - Nút bấm AI cạnh mỗi dòng sản phẩm và các ô input tương ứng trong modal sửa sản phẩm.
  - Cảnh báo trạng thái cấu hình `GEMINI_API_KEY`.

## Testing Decisions

- **Good Test Criteria:** Kiểm thử hoàn toàn hành vi bên ngoài qua đường biên HTTP và API endpoints, không test các chi tiết thực thi nội bộ.
- **Primary Testing Seam:** Cấp cao nhất là **HTTP Route Seam** (`POST /api/chat`, `POST /api/admin/products/:id/enrich`, `POST /api/admin/products/self-heal`, `GET /api/products/:id`).
- **Adapter Mocking Seam:** Thay thế bộ client gọi ra Google Gemini bằng một test mock deterministic (trả về kết quả JSON mẫu) để bộ test chạy độc lập, siêu nhanh, không phụ thuộc internet và không tốn quota API.
- **Prior Art:** Chưa có file test trong codebase hiện tại; bộ test sẽ được khởi tạo theo chuẩn Jest/Node test runner với `supertest`.

## Out of Scope

- Tích hợp nhận diện giọng nói (Voice Speech-to-Text) trong khung chat.
- Tích hợp cổng thanh toán trực tiếp trong khung chat (khách sẽ bấm "Thêm vào giỏ" và checkout qua luồng chuẩn).
- Tự động dịch đa ngôn ngữ cho bài viết sản phẩm (chỉ tập trung tiếng Việt chuẩn).

## Further Notes

- Cần cung cấp biến môi trường `GEMINI_API_KEY` trong file `.env`. Nếu chưa có, hệ thống kích hoạt cơ chế Graceful Fallback để đảm bảo an toàn tuyệt đối.
