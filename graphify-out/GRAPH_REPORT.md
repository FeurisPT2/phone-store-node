# Graph Report - phone-store-node  (2026-11-18)

## Corpus Check
- 96 files · ~150,102 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 6 file(s) not represented in the graph (top: .css 4, .example 1, (none) 1)

## Summary
- 782 nodes · 1343 edges · 46 communities (38 shown, 8 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 60 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `920a1865`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- main.js
- adminController.js
- Admin CRM & Inventory Client
- package.json
- ref_figma
- Storefront DOM & Mobile Components
- paymentAndOrderWorkflow.test.js
- Catalog Filter & Spec Extractor
- product.js
- Design System Master File
- customerPortal.js
- GearHub Design System Rules & Architecture
- ref_node_assert
- storageSeam.js
- Getting Started & Runbooks
- JsonStorageAdapter
- utils.js
- server.js
- ProductModel
- geminiService.js
- Admin UI Views & Filters
- storageSeam.test.js
- express
- ADR 0012: Kiến Trúc 5 Trang Chuyên Biệt, Đồng Bộ Màu & Tái Thiết Kế Giỏ Hàng 3 Phân Lớp
- ADR 0011: Tách biệt Trang Giới Thiệu (About Us Landing Page) và Trang Bán Hàng (Storefront Routing)
- designTokensContract.test.js
- Student Settings Page & Profile UI
- Issue Tracker & GitHub Workflow
- Agent Instructions & Governance
- Domain Modeling Conventions
- catalogCacheAndFilter.test.js
- cart.js
- ref_http
- Glossary & Domain Terms
- Unified Login Page UI
- qrPayment.js
- aiChat.js
- Vercel Serverless Config
- seed-db.js
- Triage Labels & Workflow

## God Nodes (most connected - your core abstractions)
1. `ProductModel` - 26 edges
2. `CustomerModel` - 21 edges
3. `OrderModel` - 16 edges
4. `showToast()` - 16 edges
5. `loadDashboard()` - 15 edges
6. `JsonStorageAdapter` - 14 edges
7. `PostgresStorageAdapter` - 14 edges
8. `renderProductList()` - 13 edges
9. `loadProducts()` - 12 edges
10. `StorageCollection` - 11 edges

## Surprising Connections (you probably didn't know these)
- `1. Tuyến Đường & Bộ Điều Khiển Trang Chi Tiết` --references--> `buyNow()`  [INFERRED]
  docs/adr/0013-dedicated-product-detail-page-and-commercial-actions.md → src/public/js/cart.js

## Import Cycles
- None detected.

## Communities (46 total, 8 thin omitted)

### Community 0 - "main.js"
Cohesion: 0.10
Nodes (33): allProducts, applyQuickPreset(), BENCH_MODELS, CATEGORY_BUTTON_LABELS, CATEGORY_ICONS, closeProductDetailModal(), currentSpecsFilter, escapeHtml() (+25 more)

### Community 1 - "adminController.js"
Cohesion: 0.06
Nodes (35): addProduct(), createCustomer(), deleteCustomer(), deleteOrder(), deleteProduct(), exportCustomersCsv(), exportOrdersCsv(), getAllCustomers() (+27 more)

### Community 2 - "Admin CRM & Inventory Client"
Cohesion: 0.09
Nodes (54): ADMIN_CATEGORY_DEFAULTS, closeAdminModal(), currentCustFilter, currentOrderFilter, currentProdFilter, deleteCustomer(), deleteOrder(), deleteProduct() (+46 more)

### Community 3 - "package.json"
Cohesion: 0.07
Nodes (34): dependencies, cookie-parser@^1.4.6, cors@^2.8.5, dotenv@^18.0.7, express@^4.19.2, express-session@^1.18.0, @google/genai@^3.0.0, pg@^8.23.1 (+26 more)

### Community 5 - "Storefront DOM & Mobile Components"
Cohesion: 0.07
Nodes (27): active-filter-chips, auth-modal, auth-modal-title, btn-customer-portal, btn-mobile-drawer, cart-modal, catalog-section, customer-portal-modal (+19 more)

### Community 6 - "paymentAndOrderWorkflow.test.js"
Cohesion: 0.50
Nodes (3): assert, http, { test, describe, before, after }

### Community 7 - "Catalog Filter & Spec Extractor"
Cohesion: 0.24
Nodes (16): buildProductTextHaystack(), escapeRegExp(), filterProducts(), getCategoryMeta(), groupProductsByCategory(), inferCategory(), matchesGearHubPolicy(), matchesGearHubStandard() (+8 more)

### Community 8 - "product.js"
Cohesion: 0.19
Nodes (17): allCatalog, formatVnd(), getUrlProductId(), getWishlistIds(), handlePdpWishlistToggle(), initProductTabs(), loadProductDetailPage(), renderAiReview() (+9 more)

### Community 9 - "Design System Master File"
Cohesion: 0.11
Nodes (17): Additional Forbidden Patterns, Anti-Patterns (Do NOT Use), Buttons, Cards, Color Palette, Component Specs, Design System Master File, Global Rules (+9 more)

### Community 10 - "customerPortal.js"
Cohesion: 0.16
Nodes (22): cancelCustomerOrderUI(), checkAuthState(), escPortal(), executeTrackOrder(), handleCustomerLogin(), handleCustomerRegister(), handleTrackOrderSubmit(), handleUpdateCustomerProfile() (+14 more)

### Community 12 - "GearHub Design System Rules & Architecture"
Cohesion: 0.17
Nodes (11): 1. Token Definitions, 2. Component Library, 3. Frameworks & Libraries, 4. Asset Management, 5. Icon System, 6. Styling Approach, 7. Project Structure, Color Tokens (+3 more)

### Community 13 - "ref_node_assert"
Cohesion: 0.16
Nodes (9): assert, { test, describe, after }, assert, http, { test, describe, before, after }, assert, { test }, assert (+1 more)

### Community 14 - "storageSeam.js"
Cohesion: 0.06
Nodes (18): PostgresStorageAdapter, adminSchema, customerSchema, findFieldDef(), mapRowToOrder(), mapRowToProduct(), normalizeOrderHistoryEntry(), orderSchema (+10 more)

### Community 15 - "Getting Started & Runbooks"
Cohesion: 0.15
Nodes (12): 1. Cài đặt thư viện, 🛒 1. Phía Khách Hàng (Storefront), 2. Chạy môi trường phát triển, 🛡️ 2. Hệ Thống Quản Trị (Admin Panel & CRM), 3. Truy cập ứng dụng, 🚀 Cài Đặt & Khởi Chạy, Cách lấy chuỗi kết nối Neon Postgres:, hoặc chạy trực tiếp (+4 more)

### Community 16 - "JsonStorageAdapter"
Cohesion: 0.17
Nodes (5): baseDataDir, fs, JsonDB, path, JsonStorageAdapter

### Community 17 - "utils.js"
Cohesion: 0.17
Nodes (6): copyTextToClipboard(), getStoredTheme(), setTheme(), showToast(), toggleTheme(), updateThemeUI()

### Community 18 - "server.js"
Cohesion: 0.12
Nodes (14): app, cookieParser, cors, express, path, assert, http, { test, describe, before, after } (+6 more)

### Community 19 - "ProductModel"
Cohesion: 0.10
Nodes (12): addFlagships(), flagships, run(), crawlProducts(), addToCart(), ProductModel, ACCESSORY_KEYWORDS, cleanProductName() (+4 more)

### Community 21 - "geminiService.js"
Cohesion: 0.10
Nodes (20): chatController, express, router, buildDirectProductReply(), buildGearHubIntentResponse(), consultCustomer(), consultWithCatalog(), enrichProduct() (+12 more)

### Community 22 - "Admin UI Views & Filters"
Cohesion: 0.17
Nodes (11): cust-tag-filters, modal-crawl-products, modal-cust-edit-title, modal-customer-detail, modal-customer-edit, modal-order-detail, modal-order-id, modal-prod-title (+3 more)

### Community 24 - "storageSeam.test.js"
Cohesion: 0.14
Nodes (7): crypto, STATUS_TITLES, catalogCache, assert, fs, path, { test, describe, after }

### Community 25 - "express"
Cohesion: 0.06
Nodes (21): express, changePassword(), login(), unifiedLogin(), AdminModel, crypto, hashPassword(), express (+13 more)

### Community 26 - "ADR 0012: Kiến Trúc 5 Trang Chuyên Biệt, Đồng Bộ Màu & Tái Thiết Kế Giỏ Hàng 3 Phân Lớp"
Cohesion: 0.25
Nodes (7): 1. Tối Ưu Hóa Tuyến Đường & Hợp Nhất Cửa Hàng (Streamlined Routing & Unified Shop), 2. Chuẩn Hóa Bảng Màu & Thiết Kế Tối Giản (Calm Editorial / Bone & Stone), 3. Tái Thiết Kế Giỏ Hàng 3 Phân Lớp & Hover Mini-Cart (Tri-Tier Cart Redesign), ADR 0012: Kiến Trúc 5 Trang Chuyên Biệt, Đồng Bộ Màu & Tái Thiết Kế Giỏ Hàng 3 Phân Lớp, Bối cảnh & Phản hồi từ Giảng viên (Context & Feedback), Kết Quả & Đánh Giá (Consequences), Quyết Định Kiến Trúc (Decision)

### Community 27 - "ADR 0011: Tách biệt Trang Giới Thiệu (About Us Landing Page) và Trang Bán Hàng (Storefront Routing)"
Cohesion: 0.29
Nodes (6): 1. Phân Tách Định Tuyến Hai Tầng (Dual-Route Decoupling), 2. Đồng Nhất Hệ Thống Điều Hướng & Trợ Lý AI, ADR 0011: Tách biệt Trang Giới Thiệu (About Us Landing Page) và Trang Bán Hàng (Storefront Routing), Bối cảnh & Vấn đề (Context), Kết Quả & Đánh Giá (Consequences), Quyết Định Kiến Trúc (Decision)

### Community 28 - "designTokensContract.test.js"
Cohesion: 0.29
Nodes (4): assert, fs, path, { test, describe }

### Community 30 - "Student Settings Page & Profile UI"
Cohesion: 0.25
Nodes (7): hero-avatar-initial, hero-phone-number, hero-student-status, hero-tier-badge, hero-user-name, section-settings-hero, user-hero-card

### Community 31 - "Issue Tracker & GitHub Workflow"
Cohesion: 0.29
Nodes (6): Conventions, Issue tracker: GitHub, Pull requests as a triage surface, Wayfinding operations, When a skill says "fetch the relevant ticket", When a skill says "publish to the issue tracker"

### Community 32 - "Agent Instructions & Governance"
Cohesion: 0.33
Nodes (5): Agent Instructions, Agent skills, Domain docs, Issue tracker, Triage labels

### Community 34 - "Domain Modeling Conventions"
Cohesion: 0.33
Nodes (5): Before exploring, read these, Domain Docs, File structure, Flag ADR conflicts, Use the glossary's vocabulary

### Community 35 - "catalogCacheAndFilter.test.js"
Cohesion: 0.12
Nodes (10): zlib, assert, http, { test, describe, before, after }, zlib, assert, { test }, assert (+2 more)

### Community 36 - "cart.js"
Cohesion: 0.14
Nodes (26): 1. Tuyến Đường & Bộ Điều Khiển Trang Chi Tiết, 2. Chuẩn Hóa Nhãn Nút Hành Động, ADR 0013: Kiến Trúc Trang Chi Tiết Sản Phẩm (PDP) & Phân Tách Nút Hành Động Chuẩn E-Commerce, Bối Cảnh (Context), Kết Quả (Consequences), Quyết Định Kiến Trúc (Decision), addToCart(), buildBookingAddress() (+18 more)

### Community 37 - "ref_http"
Cohesion: 0.22
Nodes (6): assert, http, { test, describe, before, after }, assert, http, { test, describe, before, after }

### Community 38 - "Glossary & Domain Terms"
Cohesion: 0.50
Nodes (3): _Avoid_, Language, TechStore

### Community 39 - "Unified Login Page UI"
Cohesion: 0.50
Nodes (3): header-icon, portal-subtitle, portal-title

### Community 40 - "qrPayment.js"
Cohesion: 0.53
Nodes (8): activeQrSession, clearQrSessionTimers(), closeQrPaymentModal(), openQrModalByOrderMeta(), openQrPaymentModal(), pollQrPaymentStatus(), simulateQrWebhook(), updateQrCountdownDisplay()

### Community 41 - "aiChat.js"
Cohesion: 0.36
Nodes (6): appendChatBubble(), chatHistory, handleAiChatSubmit(), scrollChatToBottom(), sendAiMessage(), sendQuickPrompt()

### Community 42 - "Vercel Serverless Config"
Cohesion: 0.50
Nodes (3): builds, routes, version

### Community 46 - "seed-db.js"
Cohesion: 0.21
Nodes (6): crypto, fs, path, ensureReady(), initDatabase(), { Pool }

## Knowledge Gaps
- **80 isolated node(s):** `1. Cài đặt thư viện`, `🛒 1. Phía Khách Hàng (Storefront)`, `2. Chạy môi trường phát triển`, `🛡️ 2. Hệ Thống Quản Trị (Admin Panel & CRM)`, `3. Truy cập ứng dụng` (+75 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 337 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **8 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `handlePlaceOrder()` connect `cart.js` to `main.js`?**
  _High betweenness centrality (0.056) - this node is a cross-community bridge._
- **What connects `1. Cài đặt thư viện`, `🛒 1. Phía Khách Hàng (Storefront)`, `2. Chạy môi trường phát triển` to the rest of the system?**
  _80 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `main.js` be split into smaller, more focused modules?**
  _Cohesion score 0.09986504723346828 - nodes in this community are weakly interconnected._
- **Why does `express` connect `express` to `server.js`, `package.json`, `geminiService.js`?**
  _High betweenness centrality (0.037) - this node is a cross-community bridge._
- **Should `adminController.js` be split into smaller, more focused modules?**
  _Cohesion score 0.06105834464043419 - nodes in this community are weakly interconnected._
- **Why does `ProductModel` connect `ProductModel` to `adminController.js`, `catalogCacheAndFilter.test.js`, `ref_http`, `ref_node_assert`, `server.js`, `geminiService.js`, `storageSeam.test.js`, `express`?**
  _High betweenness centrality (0.034) - this node is a cross-community bridge._
- **Should `Admin CRM & Inventory Client` be split into smaller, more focused modules?**
  _Cohesion score 0.09025974025974026 - nodes in this community are weakly interconnected._