# Graph Report - phone-store-node  (2026-11-18)

## Corpus Check
- 94 files · ~147,235 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 6 file(s) not represented in the graph (top: .css 4, .example 1, (none) 1)

## Summary
- 752 nodes · 1304 edges · 49 communities (39 shown, 10 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 58 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `bca3668f`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- main.js
- CustomerModel
- Admin CRM & Inventory Client
- package.json
- ref_figma
- Storefront DOM & Mobile Components
- multiPageRouting.test.js
- Catalog Filter & Spec Extractor
- product.js
- JsonStorageAdapter
- customerPortal.js
- ProductModel
- GearHub Design System Rules & Architecture
- loginAndDeploy.test.js
- storageSeam.js
- Getting Started & Runbooks
- ref_node_assert
- utils.js
- server.js
- geminiService.js
- storageSeam.test.js
- paymentAndOrderWorkflow.test.js
- Admin UI Views & Filters
- crawlerService.js
- Product.js
- chatRoutes.js
- ADR 0012: Kiến Trúc 5 Trang Chuyên Biệt, Đồng Bộ Màu & Tái Thiết Kế Giỏ Hàng 3 Phân Lớp
- ADR 0011: Tách biệt Trang Giới Thiệu (About Us Landing Page) và Trang Bán Hàng (Storefront Routing)
- designTokensContract.test.js
- Student Settings Page & Profile UI
- Issue Tracker & GitHub Workflow
- Agent Instructions & Governance
- Domain Modeling Conventions
- catalogCacheAndFilter.test.js
- cart.js
- adminUpdateAI.test.js
- Glossary & Domain Terms
- Unified Login Page UI
- qrPayment.js
- aiChat.js
- Vercel Serverless Config
- cartController.js
- Triage Labels & Workflow

## God Nodes (most connected - your core abstractions)
1. `ProductModel` - 27 edges
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

## Communities (49 total, 10 thin omitted)

### Community 0 - "main.js"
Cohesion: 0.10
Nodes (33): allProducts, applyQuickPreset(), BENCH_MODELS, CATEGORY_BUTTON_LABELS, CATEGORY_ICONS, closeProductDetailModal(), currentSpecsFilter, escapeHtml() (+25 more)

### Community 1 - "CustomerModel"
Cohesion: 0.06
Nodes (38): addProduct(), createCustomer(), deleteCustomer(), deleteOrder(), exportCustomersCsv(), exportOrdersCsv(), getAllCustomers(), getAllOrders() (+30 more)

### Community 2 - "Admin CRM & Inventory Client"
Cohesion: 0.09
Nodes (54): ADMIN_CATEGORY_DEFAULTS, closeAdminModal(), currentCustFilter, currentOrderFilter, currentProdFilter, deleteCustomer(), deleteOrder(), deleteProduct() (+46 more)

### Community 3 - "package.json"
Cohesion: 0.05
Nodes (43): dependencies, cookie-parser@^1.4.6, cors@^2.8.5, dotenv@^18.0.7, express@^4.19.2, express-session@^1.18.0, @google/genai@^3.0.0, pg@^8.23.1 (+35 more)

### Community 5 - "Storefront DOM & Mobile Components"
Cohesion: 0.07
Nodes (27): active-filter-chips, auth-modal, auth-modal-title, btn-customer-portal, btn-mobile-drawer, cart-modal, catalog-section, customer-portal-modal (+19 more)

### Community 6 - "multiPageRouting.test.js"
Cohesion: 0.50
Nodes (3): assert, http, { test, describe, before, after }

### Community 7 - "Catalog Filter & Spec Extractor"
Cohesion: 0.24
Nodes (16): buildProductTextHaystack(), escapeRegExp(), filterProducts(), getCategoryMeta(), groupProductsByCategory(), inferCategory(), matchesGearHubPolicy(), matchesGearHubStandard() (+8 more)

### Community 8 - "product.js"
Cohesion: 0.19
Nodes (17): allCatalog, formatVnd(), getUrlProductId(), getWishlistIds(), handlePdpWishlistToggle(), initProductTabs(), loadProductDetailPage(), renderAiReview() (+9 more)

### Community 10 - "customerPortal.js"
Cohesion: 0.16
Nodes (22): cancelCustomerOrderUI(), checkAuthState(), escPortal(), executeTrackOrder(), handleCustomerLogin(), handleCustomerRegister(), handleTrackOrderSubmit(), handleUpdateCustomerProfile() (+14 more)

### Community 11 - "ProductModel"
Cohesion: 0.21
Nodes (6): addFlagships(), flagships, deleteProduct(), updateProduct(), ProductModel, enrichAndPersistProduct()

### Community 12 - "GearHub Design System Rules & Architecture"
Cohesion: 0.17
Nodes (11): 1. Token Definitions, 2. Component Library, 3. Frameworks & Libraries, 4. Asset Management, 5. Icon System, 6. Styling Approach, 7. Project Structure, Color Tokens (+3 more)

### Community 13 - "loginAndDeploy.test.js"
Cohesion: 0.50
Nodes (3): assert, http, { test, describe, before, after }

### Community 14 - "storageSeam.js"
Cohesion: 0.05
Nodes (24): crypto, fs, path, ensureReady(), initDatabase(), { Pool }, PostgresStorageAdapter, adminSchema (+16 more)

### Community 15 - "Getting Started & Runbooks"
Cohesion: 0.15
Nodes (12): 1. Cài đặt thư viện, 🛒 1. Phía Khách Hàng (Storefront), 2. Chạy môi trường phát triển, 🛡️ 2. Hệ Thống Quản Trị (Admin Panel & CRM), 3. Truy cập ứng dụng, 🚀 Cài Đặt & Khởi Chạy, Cách lấy chuỗi kết nối Neon Postgres:, hoặc chạy trực tiếp (+4 more)

### Community 16 - "ref_node_assert"
Cohesion: 0.19
Nodes (8): geminiService, assert, http, { test, describe, before, after }, assert, { test, describe }, assert, { test, describe }

### Community 17 - "utils.js"
Cohesion: 0.21
Nodes (6): copyTextToClipboard(), getStoredTheme(), setTheme(), showToast(), toggleTheme(), updateThemeUI()

### Community 18 - "server.js"
Cohesion: 0.20
Nodes (5): cookieParser, cors, express, path, zlib

### Community 19 - "geminiService.js"
Cohesion: 0.20
Nodes (8): consultCustomer(), consultWithCatalog(), enrichProduct(), fallbackEnrich(), getClient(), normalizeEnrichArgs(), selfHealCatalog(), toMiniProductCard()

### Community 20 - "storageSeam.test.js"
Cohesion: 0.07
Nodes (14): changePassword(), login(), unifiedLogin(), AdminModel, crypto, hashPassword(), express, router (+6 more)

### Community 21 - "paymentAndOrderWorkflow.test.js"
Cohesion: 0.50
Nodes (3): assert, http, { test, describe, before, after }

### Community 22 - "Admin UI Views & Filters"
Cohesion: 0.17
Nodes (11): cust-tag-filters, modal-crawl-products, modal-cust-edit-title, modal-customer-detail, modal-customer-edit, modal-order-detail, modal-order-id, modal-prod-title (+3 more)

### Community 23 - "crawlerService.js"
Cohesion: 0.31
Nodes (7): run(), crawlProducts(), ACCESSORY_KEYWORDS, cleanProductName(), CrawlerService, generateSpecs(), normalizeBrand()

### Community 24 - "Product.js"
Cohesion: 0.17
Nodes (7): catalogCache, express, router, assert, { test, describe, after }, assert, { test }

### Community 25 - "chatRoutes.js"
Cohesion: 0.29
Nodes (3): chatController, express, router

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
Cohesion: 0.16
Nodes (9): baseDataDir, fs, path, assert, http, { test, describe, before, after }, zlib, assert (+1 more)

### Community 36 - "cart.js"
Cohesion: 0.15
Nodes (23): 1. Tuyến Đường & Bộ Điều Khiển Trang Chi Tiết, 2. Chuẩn Hóa Nhãn Nút Hành Động, ADR 0013: Kiến Trúc Trang Chi Tiết Sản Phẩm (PDP) & Phân Tách Nút Hành Động Chuẩn E-Commerce, Bối Cảnh (Context), Kết Quả (Consequences), Quyết Định Kiến Trúc (Decision), addToCart(), buildBookingAddress() (+15 more)

### Community 37 - "adminUpdateAI.test.js"
Cohesion: 0.16
Nodes (10): app, assert, http, { test, describe, before, after }, assert, http, { test, describe, before, after }, assert (+2 more)

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

## Knowledge Gaps
- **80 isolated node(s):** `1. Cài đặt thư viện`, `🛒 1. Phía Khách Hàng (Storefront)`, `2. Chạy môi trường phát triển`, `🛡️ 2. Hệ Thống Quản Trị (Admin Panel & CRM)`, `3. Truy cập ứng dụng` (+75 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 320 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `handlePlaceOrder()` connect `cart.js` to `main.js`?**
  _High betweenness centrality (0.059) - this node is a cross-community bridge._
- **What connects `1. Cài đặt thư viện`, `🛒 1. Phía Khách Hàng (Storefront)`, `2. Chạy môi trường phát triển` to the rest of the system?**
  _80 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `main.js` be split into smaller, more focused modules?**
  _Cohesion score 0.09986504723346828 - nodes in this community are weakly interconnected._
- **Why does `ProductModel` connect `ProductModel` to `CustomerModel`, `catalogCacheAndFilter.test.js`, `adminUpdateAI.test.js`, `cartController.js`, `geminiService.js`, `storageSeam.test.js`, `crawlerService.js`, `Product.js`?**
  _High betweenness centrality (0.039) - this node is a cross-community bridge._
- **Should `CustomerModel` be split into smaller, more focused modules?**
  _Cohesion score 0.05886708626434654 - nodes in this community are weakly interconnected._
- **Why does `express` connect `package.json` to `Product.js`, `chatRoutes.js`, `server.js`, `storageSeam.test.js`?**
  _High betweenness centrality (0.039) - this node is a cross-community bridge._
- **Should `Admin CRM & Inventory Client` be split into smaller, more focused modules?**
  _Cohesion score 0.09025974025974026 - nodes in this community are weakly interconnected._