# Graph Report - phone-store-node  (2026-11-07)

## Corpus Check
- 74 files · ~65,673 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 4 file(s) not represented in the graph (top: .css 2, .example 1, (none) 1)

## Summary
- 585 nodes · 1156 edges · 24 communities (20 shown, 4 thin omitted)
- Extraction: 93% EXTRACTED · 7% INFERRED · 0% AMBIGUOUS · INFERRED: 81 edges (avg confidence: 0.91)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `3a94e1e9`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- admin.js
- PostgresStorageAdapter
- JsonDB
- Product.js
- main.js
- storageSeam.test.js
- package.json
- ADR 0008: Storefront Redesign with Variant B (The Split Stage) and Tasteskill v2 Anti-Slop System
- 📱 TechStore - Hệ Thống Bán Điện Thoại & Quản Trị Khách Hàng (CRM)
- adminController.js
- Spec 0001: Gemini AI Automation (Product Enrichment, Shopping Consultant & Self-healing Catalog)
- 0001. Sử dụng Google Gemini 2.5 Flash Tự Động Hóa Dữ Liệu Sản Phẩm Và Tư Vấn Khách Hàng
- 0002. Mở Rộng Schema Sản Phẩm Và Cơ Chế Dynamic Catalog Grounding
- 0003. Giao Diện Tương Tác Storefront Và Cơ Chế Graceful Fallback Khi Mất Kết Nối AI
- vercel.json
- catalogFilter.js
- server.js
- Research: In-Memory TTL Caching & DB Indexing Benchmarks for Catalog Querying
- OrderModel
- CustomerModel
- ref_fs
- Customer.js
- express
- .findByCustomerId

## God Nodes (most connected - your core abstractions)
1. `ProductModel` - 31 edges
2. `CustomerModel` - 22 edges
3. `OrderModel` - 20 edges
4. `showToast()` - 16 edges
5. `showToast()` - 16 edges
6. `loadDashboard()` - 15 edges
7. `JsonStorageAdapter` - 15 edges
8. `PostgresStorageAdapter` - 15 edges
9. `JsonDB` - 15 edges
10. `renderProductList()` - 13 edges

## Surprising Connections (you probably didn't know these)
- `Bối cảnh & Lý do lựa chọn` --references--> `clearQrSessionTimers()`  [INFERRED]
  docs/adr/0007-ai-orchestration-deepening-and-frontend-cleanup.md → src/public/js/main.js
- `0005. Thiết Lập Storage Seam Và Tách Biệt Storage Adapter Cho Domain Models` --references--> `JsonStorageAdapter`  [INFERRED]
  docs/adr/0005-storage-seam-and-adapters.md → src/models/storage/JsonStorageAdapter.js
- `Bối cảnh & Lý do lựa chọn` --references--> `CustomerModel`  [INFERRED]
  docs/adr/0006-order-lifecycle-customer-projection-and-catalog-filter.md → src/models/Customer.js
- `Solution` --references--> `OrderModel`  [INFERRED]
  docs/specs/0002-techstore-v2-production-release.md → src/models/Order.js
- `Bối cảnh & Lý do lựa chọn` --references--> `JsonDB`  [INFERRED]
  docs/adr/0005-storage-seam-and-adapters.md → src/models/database.js

## Import Cycles
- None detected.

## Communities (24 total, 4 thin omitted)

### Community 0 - "admin.js"
Cohesion: 0.10
Nodes (51): closeAdminModal(), currentCustFilter, currentOrderFilter, currentProdFilter, deleteCustomer(), deleteOrder(), deleteProduct(), enrichProductWithAI() (+43 more)

### Community 1 - "PostgresStorageAdapter"
Cohesion: 0.05
Nodes (26): 0005. Thiết Lập Storage Seam Và Tách Biệt Storage Adapter Cho Domain Models, Bối cảnh & Lý do lựa chọn, crypto, fs, path, initDatabase(), { Pool }, PostgresStorageAdapter (+18 more)

### Community 2 - "JsonDB"
Cohesion: 0.10
Nodes (16): 1. Context & Primary Sources, 2. Order & Payment State Machine Design, 3. Expiration Handling: Lazy TTL Evaluation vs Background Timers, 4. Client-Server Communication: Polling vs SSE/WebSockets, Comparison, Decision Recommendation, Existing Codebase Architecture, Findings (+8 more)

### Community 3 - "Product.js"
Cohesion: 0.06
Nodes (35): 0004. Máy Trạng Thái Thanh Toán QR (Lazy TTL) Và Bộ Nhớ Đệm Danh Mục Sản Phẩm (In-Memory TTL Cache), Bối cảnh & Lý do lựa chọn, 0007. Làm Sâu Điều Phối AI (AI Product Enrichment, Self-healing Catalog, AI Shopping Consultant) Và Tinh Gọn Mã Nguồn Giao Diện, Bối cảnh & Lý do lựa chọn, 2. In-Memory TTL Cache with Write-Through Invalidation, Architecture Pattern, Design Requirements, Problem Statement (+27 more)

### Community 4 - "main.js"
Cohesion: 0.06
Nodes (79): activeQrSession, addToCart(), allProducts, appendChatBubble(), applyQuickPreset(), BENCH_MODELS, buyNow(), cancelCustomerOrderUI() (+71 more)

### Community 5 - "storageSeam.test.js"
Cohesion: 0.13
Nodes (9): changePassword(), login(), AdminModel, crypto, hashPassword(), assert, fs, path (+1 more)

### Community 6 - "package.json"
Cohesion: 0.07
Nodes (33): dependencies, cookie-parser@^1.4.6, cors@^2.8.5, dotenv@^18.0.7, express@^4.19.2, express-session@^1.18.0, @google/genai@^3.0.0, pg@^8.23.1 (+25 more)

### Community 7 - "ADR 0008: Storefront Redesign with Variant B (The Split Stage) and Tasteskill v2 Anti-Slop System"
Cohesion: 0.29
Nodes (6): ADR 0008: Storefront Redesign with Variant B (The Split Stage) and Tasteskill v2 Anti-Slop System, Bối cảnh & Vấn đề (Context), Các Phương Án Thử Nghiệm Qua Prototype, Quyết Định Thiết Kế (Decision), Trạng Thái Triển Khai (Status), selectFinishSwatch()

### Community 8 - "📱 TechStore - Hệ Thống Bán Điện Thoại & Quản Trị Khách Hàng (CRM)"
Cohesion: 0.17
Nodes (11): 1. Cài đặt thư viện, 🛒 1. Phía Khách Hàng (Storefront), 2. Chạy môi trường phát triển, 🛡️ 2. Hệ Thống Quản Trị (Admin Panel & CRM), 3. Truy cập ứng dụng, 🚀 Cài Đặt & Khởi Chạy, Cách lấy chuỗi kết nối Neon Postgres:, 🐘 Kết Nối Neon Postgres (Lưu Trữ Bền Vững) (+3 more)

### Community 9 - "adminController.js"
Cohesion: 0.11
Nodes (12): createCustomer(), deleteCustomer(), deleteOrder(), exportCustomersCsv(), exportOrdersCsv(), getAllCustomers(), getAllOrders(), getOrderDetail() (+4 more)

### Community 10 - "Spec 0001: Gemini AI Automation (Product Enrichment, Shopping Consultant & Self-healing Catalog)"
Cohesion: 0.22
Nodes (8): Further Notes, Implementation Decisions, Out of Scope, Problem Statement, Solution, Spec 0001: Gemini AI Automation (Product Enrichment, Shopping Consultant & Self-healing Catalog), Testing Decisions, User Stories

### Community 14 - "vercel.json"
Cohesion: 0.50
Nodes (3): builds, routes, version

### Community 15 - "catalogFilter.js"
Cohesion: 0.44
Nodes (8): escapeRegExp(), filterProducts(), matchesPriceFilter(), matchesPricePreset(), matchesSearchQuery(), matchesSpecField(), normalizeCapacityTokens(), sortProducts()

### Community 16 - "server.js"
Cohesion: 0.05
Nodes (41): app, cookieParser, cors, express, path, compressionMiddleware(), zlib, catalogCache (+33 more)

### Community 17 - "Research: In-Memory TTL Caching & DB Indexing Benchmarks for Catalog Querying"
Cohesion: 0.29
Nodes (6): 1. Context & Primary Sources, 3. PostgreSQL Indexing Strategy, 4. HTTP Payload Optimization & Compression, Existing Codebase Architecture, Impact Analysis, Research: In-Memory TTL Caching & DB Indexing Benchmarks for Catalog Querying

### Community 18 - "OrderModel"
Cohesion: 0.22
Nodes (10): 0006. Làm Sâu Vòng Đời Đơn Hàng (Order Lifecycle), Bản Chiếu Khách Hàng An Toàn (Safe Customer Projection) Và Hợp Nhất Bộ Lọc Danh Mục (Catalog Filter Engine), Bối cảnh & Lý do lựa chọn, cancelOrder(), createOrder(), getPaymentStatus(), handleSandboxWebhook(), trackOrder(), createHistoryEntry() (+2 more)

### Community 19 - "CustomerModel"
Cohesion: 0.19
Nodes (10): getProfile(), getWishlist(), login(), lookup(), register(), toggleWishlist(), updateProfile(), calculateTag() (+2 more)

### Community 20 - "ref_fs"
Cohesion: 0.12
Nodes (12): fs, rootEndIdx, styleCss, adminHtml, adminJs, fs, indexHtml, loginHtml (+4 more)

### Community 21 - "Customer.js"
Cohesion: 0.24
Nodes (5): crypto, STATUS_TITLES, assert, http, { test, describe, before, after }

### Community 22 - "express"
Cohesion: 0.10
Nodes (14): express, chatController, express, router, express, router, express, router (+6 more)

## Knowledge Gaps
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `ProductModel` connect `Product.js` to `storageSeam.test.js`, `adminController.js`, `server.js`, `OrderModel`, `CustomerModel`, `express`?**
  _High betweenness centrality (0.267) - this node is a cross-community bridge._
- **Are the 4 inferred relationships involving `ProductModel` (e.g. with `0004. Máy Trạng Thái Thanh Toán QR (Lazy TTL) Và Bộ Nhớ Đệm Danh Mục Sản Phẩm (In-Memory TTL Cache)` and `Bối cảnh & Lý do lựa chọn`) actually correct?**
  _`ProductModel` has 4 INFERRED edges - model-reasoned connections that need verification._
- **Should `admin.js` be split into smaller, more focused modules?**
  _Cohesion score 0.0965166908563135 - nodes in this community are weakly interconnected._
- **Why does `Bối cảnh & Lý do lựa chọn` connect `Product.js` to `main.js`?**
  _High betweenness centrality (0.221) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `OrderModel` (e.g. with `0006. Làm Sâu Vòng Đời Đơn Hàng (Order Lifecycle), Bản Chiếu Khách Hàng An Toàn (Safe Customer Projection) Và Hợp Nhất Bộ Lọc Danh Mục (Catalog Filter Engine)` and `Bối cảnh & Lý do lựa chọn`) actually correct?**
  _`OrderModel` has 3 INFERRED edges - model-reasoned connections that need verification._
- **Should `PostgresStorageAdapter` be split into smaller, more focused modules?**
  _Cohesion score 0.05202661826981246 - nodes in this community are weakly interconnected._
- **Why does `clearQrSessionTimers()` connect `main.js` to `Product.js`?**
  _High betweenness centrality (0.215) - this node is a cross-community bridge._