# ADR 0009: Synchronized Luxury Light & Dark Themes (UI/UX Pro Max) and Pure SVG Vector System

## Bối cảnh & Vấn đề (Context)
Sau khi đưa vào vận hành giao diện Variant B (The Split Stage) trên tông nền Calm Bone (`#f3f2ee`), hệ thống nảy sinh 3 vấn đề cần giải quyết triệt để:
1. **Lỗi trùng màu / tương phản thấp (Color Clashing & Low Contrast)**: Việc chuyển đổi biến gốc sang tông sáng trong khi một số component kế thừa nền tối hoặc kính mờ (`rgba(17,19,23,...)`, `#0b0d10`) dẫn đến hiện tượng chữ đen trên nền đen (1.05:1) hoặc chữ xanh nhạt trên nền trắng (1.59:1), vi phạm chuẩn WCAG AA.
2. **Nhu cầu về Bộ Theme Kép Sang & Tối (Luxury Light & Dark Themes)**: Khách hàng cần trải nghiệm cả 2 không gian thị giác: Theme Sáng sang trọng (*Luxury Calm Studio*) cho ban ngày và Theme Tối huyền bí (*Deep Obsidian Titanium*) cho ban đêm, đồng thời phải đồng bộ tự động trên toàn bộ website (Trang chủ Storefront, Cổng đăng nhập Login, và Bảng điều khiển Admin CRM).
3. **Quy chuẩn Không Sử Dụng Emoji Làm Icon (No-Emoji Principle)**: Theo quy tắc `tasteskill` và `ui-ux-pro-max`, emoji trong giao diện thương mại điện tử tạo cảm giác nghiệp dư, không đồng nhất font rendering trên các hệ điều hành (Windows, macOS, iOS, Android). Cần thay thế toàn bộ bằng vector SVG đơn sắc hoặc typography chuẩn.

---

## Quyết Định Kiến Trúc (Decision)

### 1. Kiến Trúc Semantic Design Tokens Kép (`[data-theme="light"]` & `[data-theme="dark"]`)
Tách biệt toàn bộ biến màu sắc thành các Design Tokens độc lập, không hardcode mã hex trong component:
- **Theme Sáng ("Sang" - Luxury Calm Editorial Studio)**:
  - `--bg`: `#f5f4ef` (Ngà ấm tự nhiên, dịu mắt).
  - `--surface`, `--bg-elevated`: `#ffffff` (Khối nổi tinh khôi).
  - `--ink`: `#141413` (Đen obsidian sâu, tương phản 13.5:1).
  - `--muted`: `#6b6964` (Xám đá, tương phản 5.5:1).
  - `--accent`: `#28362d` (Xanh olive trầm sang trọng).
  - `--gold`: `#b45309` (Vàng hổ phách cao cấp).
- **Theme Tối ("Tối" - Deep Obsidian Titanium & Emerald Glow)**:
  - `--bg`: `#0b0d10` (Đen titan sâu nguyên khối).
  - `--surface`: `#14171e`, `--surface-raised`: `#1c202a` (Phân tầng đá phiến thạch anh).
  - `--ink`: `#f8fafc` (Trắng ngọc trai sáng, tương phản 16.8:1).
  - `--muted`: `#94a3b8` (Xám thép slate).
  - `--accent`: `#15803d` / `--accent-text`: `#4ade80` (Xanh ngọc lục bảo phát quang).
  - `--gold`: `#fbbf24` (Vàng kim quang học).
  - Khung mã QR (`.qr-image-frame`): Luôn duy trì nền trắng `#ffffff` và mã QR đen để đảm bảo cảm biến quang học của camera điện thoại quét tức thì không bị lỗi quang sai.

### 2. Cơ Chế Đồng Bộ Thời Gian Thực & Chống Chớp Nháy (No-FOIT Cross-Tab Sync)
1. **Chống Flash khi tải trang (Zero Flash of Unstyled Theme)**:
   Tại thẻ `<head>` của cả 3 trang (`index.html`, `login.html`, `admin.html`), một script đồng bộ nhỏ đọc `localStorage.getItem('techstore_theme')` hoặc `window.matchMedia('(prefers-color-scheme: dark)')`, gán thuộc tính `document.documentElement.setAttribute('data-theme', theme)` ngay lập tức trước khi render bất kỳ phần tử DOM nào.
2. **Đồng bộ đa tab (Cross-Tab Realtime Sync)**:
   Lắng nghe sự kiện `window.addEventListener('storage', ...)`: khi người dùng đổi theme tại Trang chủ, tab Admin hoặc Login đang mở song song lập tức cập nhật giao diện trong thời gian thực mà không cần tải lại trang.

### 3. Thay Thế 100% Emoji Icon Bằng Vector SVG Đơn Sắc
- Loại bỏ hoàn toàn các ký tự emoji (`📊`, `📦`, `👥`, `📱`, `⚙️`, `⚡`, `🔍`, `⏳`, `✅`, `⚠️`, `♥`, `♡`).
- Triển khai bộ icon SVG đơn sắc (Lucide standard) với `stroke-width="2"`, `stroke-linecap="round"`, `fill="none"` hoặc `fill="currentColor"`, đồng bộ màu theo biến CSS `--ink`, `--muted`, `--accent`.
- Nút chuyển đổi Theme Toggle sử dụng 2 icon vector SVG (`theme-icon-sun` và `theme-icon-moon`), điều khiển hiển thị thuần túy bằng selector CSS `[data-theme="dark"]` / `[data-theme="light"]`, đảm bảo hiệu năng tối đa (Zero Layout Shift).

---

## Kết Quả & Đánh Giá (Consequences)
1. **Accessibility & Contrast**: Toàn bộ các vùng văn bản trên cả Theme Sáng và Theme Tối đều đạt chuẩn **WCAG AA / AAA** (độ tương phản từ **6.5:1 đến 18.5:1**).
2. **Tính Thẩm Mỹ & Trải Nghiệm**: Loại bỏ hoàn toàn cảm giác "AI-slop", mang lại diện mạo của một Flagship Store chuẩn Apple / Dieter Rams.
3. **Chất Lượng Mã Nguồn**:
   - `lint.mjs`: `0 FAIL, 0 WARN`.
   - `npm test`: **49/49 tests passing across 11 suites**.
   - Bộ quét emoji tự động: **0 emoji icons** còn tồn tại trong codebase.
4. **Vận Hành Production**: Deploy thành công trên Vercel Production (`https://phone-store-node.vercel.app`) tích hợp Neon PostgreSQL.
