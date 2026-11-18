# ADR 0008: Storefront Redesign with Variant B (The Split Stage) and Tasteskill v2 Anti-Slop System

## Bối cảnh & Vấn đề (Context)
Giao diện trước đây mang phong cách tối mờ (`#111317`) với sắc xanh xám (`#98b896`), tạo cảm giác trầm và thiếu độ sáng sủa, độ tương phản của một cửa hàng bán lẻ thiết bị công nghệ chính hãng. Ngoài ra, giao diện chứa nhiều "AI-slop / tells" phổ biến (60 emoji dùng làm icon giao diện, nhãn kicker `section-eyebrow`, số thứ tự trang trí `01 · `, `02 · `, `Bước 01`, và viền mờ bóng đổ dày đặc) khiến trang web thiếu tính tin cậy và nghệ thuật cao cấp.

Người dùng yêu cầu: *"Viết lại hoàn toàn giao diện của app để nó đẹp hơn và nhìn rõ hơn hãy học từ các store và lấy giao diện từ đó"*, sau đó yêu cầu áp dụng quy chuẩn **`design-taste-frontend` (Tasteskill v2)** và đã chọn **Variant B** thông qua quy trình `/prototype`.

## Các Phương Án Thử Nghiệm Qua Prototype
Trên nhánh `prototype/store-redesign` đã phát triển 3 biến thể độc lập thông qua bộ chuyển đổi nổi (Floating Switcher):
1. **Variant A: `hero-object` (Retail Flagship)**: Nền trắng studio sáng, hero 2 cột kiểu CellphoneS/TopZone, banner Giờ vàng săn deal có đồng hồ đếm ngược.
2. **Variant B: `split-stage` (Calm Editorial Studio)**: Chia đôi 50/50, cột trái cố định (sticky) ảnh sản phẩm flagship với bộ chọn màu sắc thực tế (`Titan Tự Nhiên`, `Titan Sa Mạc`, `Titan Trắng`, `Titan Đen`); cột phải cuộn êm đề cập thông số vi xử lý, màn hình, camera và liên kết đặt hàng trực tiếp.
3. **Variant C: `specimen-catalogue` (Hardware Archive)**: Phong cách phòng lưu trữ kỹ thuật Dieter Rams / Nothing Tech với các chỉ số viễn trắc (telemetry), kiểm chuẩn AnTuTu và đèn LED viền.

Người dùng đã trực tiếp đánh giá và lựa chọn **Variant B**.

## Quyết Định Thiết Kế (Decision)
1. **Kiến Trúc Giao Diện (The Split Stage)**:
   - Áp dụng bố cục Split Stage 50/50 cho khu vực tâm điểm Flagship. Cột trái sử dụng `position: sticky; top: 90px;` với khung ảnh studio trắng sắc nét và bộ chọn finish swatch tương tác (`selectFinishSwatch`) kích hoạt đổi màu máy thời gian thực.
   - Cột phải hiển thị cấu trúc thông số kỹ thuật rõ ràng, không dùng bảng kẻ hairline mà dùng danh sách phân cấp không gian (`spec-line`), số tiền in đậm định dạng số liệu bảng (`font-variant-numeric: tabular-nums;`).
2. **Loại Bỏ 100% "AI-Slop" theo Tasteskill v2**:
   - Xóa bỏ toàn bộ 60 emoji khỏi thanh điều hướng, nút bấm, bộ lọc và thẻ sản phẩm. Sử dụng icon vector SVG hoặc văn bản trực tiếp.
   - Xóa bỏ toàn bộ các nhãn kicker / eyebrow (`section-eyebrow`, `modal-eyebrow`).
   - Xóa bỏ số thứ tự trang trí (`01 · `, `Bước 01`).
   - Đạt kiểm định `scripts/lint.mjs`: **`0 FAIL, 0 WARN`**.
3. **Hệ Thống Bảng Màu & Typography Mới**:
   - Nền chính: `#f3f2ee` (Calm Bone - ấm áp, sáng sủa, êm dịu, không gây chói gắt).
   - Bề mặt thẻ: `#ffffff` (Khối màu đơn sắc chắc chắn, một bước sắc độ so với nền).
   - Màu chữ: `#141413` (Deep Obsidian Ink - tương phản cực cao, dễ đọc trong mọi điều kiện ánh sáng).
   - Màu nhấn: `#36453b` (Forest Olive) và `#1d4ed8` (Royal Cobalt).
   - Phông chữ: `Albert Sans` theo chuẩn direction sheet của `split-stage`.
4. **Bảo Tồn Toàn Bộ Tầng Nghiệp Vụ & Dữ Liệu**:
   - Đảm bảo 100% các tính năng giỏ hàng, thanh toán VietQR 3s đối soát tự động, tra cứu vận đơn timeline 4 bước bằng SĐT, phân quyền CRM admin và tư vấn AI Gemini 2.0 hoạt động chính xác.
   - Đạt tỷ lệ vượt qua bài test: **49/49 tests pass across 11 suites**.
   - Lưu trữ bản prototype làm nguồn sơ cấp (primary source) trên nhánh `prototype/store-redesign`.

## Trạng Thái Triển Khai (Status)
- Đã hợp nhất vào nhánh `main` (`e0bc6f5`).
- Đã deploy thành công lên Vercel Production: `https://phone-store-node.vercel.app`.
- Kiểm tra sức khỏe hệ thống: `{"status":"ok","uptime":0,"database":"neon-postgres"}`.
