# Graph Report - phone-store-node  (2026-11-07)

## Corpus Check
- 74 files · ~64,354 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 4 file(s) not represented in the graph (top: .css 2, .example 1, (none) 1)

## Summary
- 573 nodes · 1138 edges · 30 communities (25 shown, 5 thin omitted)
- Extraction: 93% EXTRACTED · 7% INFERRED · 0% AMBIGUOUS · INFERRED: 81 edges (avg confidence: 0.91)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `6a1e4e8a`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- admin.js
- PostgresStorageAdapter
- JsonDB
- Product.js
- main.js
- storageSeam.test.js
- dependencies
- ADR 0008: Storefront Redesign with Variant B (The Split Stage) and Tasteskill v2 Anti-Slop System
- 📱 TechStore - Hệ Thống Bán Điện Thoại & Quản Trị Khách Hàng (CRM)
- paymentAndOrderWorkflow.test.js
- Spec 0001: Gemini AI Automation (Product Enrichment, Shopping Consultant & Self-healing Catalog)
- 0001. Sử dụng Google Gemini 2.5 Flash Tự Động Hóa Dữ Liệu Sản Phẩm Và Tư Vấn Khách Hàng
- 0002. Mở Rộng Schema Sản Phẩm Và Cơ Chế Dynamic Catalog Grounding
- 0003. Giao Diện Tương Tác Storefront Và Cơ Chế Graceful Fallback Khi Mất Kết Nối AI
- vercel.json
- catalogFilter.js
- Product.js
- Research: In-Memory TTL Caching & DB Indexing Benchmarks for Catalog Querying
- catalogCacheAndFilter.test.js
- OrderModel
- ref_fs
- server.js
- express
- scripts
- package.json
- express-session
- adminRoutes.js
- adminAI.test.js
- fullFlow.test.js
- cartRoutes.js

## God Nodes (most connected - your core abstractions)
1. `ProductModel` - 31 edges
2. `CustomerModel` - 22 edges
3. `OrderModel` - 20 edges
4. `showToast()` - 16 edges
5. `showToast()` - 16 edges
6. `JsonStorageAdapter` - 15 edges
7. `PostgresStorageAdapter` - 15 edges
8. `JsonDB` - 15 edges
9. `loadDashboard()` - 15 edges
10. `renderProductList()` - 13 edges

## Surprising Connections (you probably didn't know these)
- `Bối cảnh & Lý do lựa chọn` --references--> `clearQrSessionTimers()`  [INFERRED]
  docs/adr/0007-ai-orchestration-deepening-and-frontend-cleanup.md → src/public/js/main.js
- `0005. Thiết Lập Storage Seam Và Tách Biệt Storage Adapter Cho Domain Models` --references--> `JsonStorageAdapter`  [INFERRED]
  docs/adr/0005-storage-seam-and-adapters.md → src/models/storage/JsonStorageAdapter.js
- `Solution` --references--> `OrderModel`  [INFERRED]
  docs/specs/0002-techstore-v2-production-release.md → src/models/Order.js
- `Bối cảnh & Lý do lựa chọn` --references--> `JsonDB`  [INFERRED]
  docs/adr/0005-storage-seam-and-adapters.md → src/models/database.js
- `Existing Codebase Architecture` --references--> `JsonDB`  [INFERRED]
  docs/research/qr-payment-state-machine.md → src/models/database.js

## Import Cycles
- None detected.

## Communities (30 total, 5 thin omitted)

### Community 0 - "admin.js"
Cohesion: 0.11
Nodes (47): closeAdminModal(), currentCustFilter, currentOrderFilter, currentProdFilter, deleteCustomer(), deleteOrder(), deleteProduct(), enrichProductWithAI() (+39 more)

### Community 1 - "PostgresStorageAdapter"
Cohesion: 0.07
Nodes (21): 0005. Thiết Lập Storage Seam Và Tách Biệt Storage Adapter Cho Domain Models, Bối cảnh & Lý do lựa chọn, PostgresStorageAdapter, adminSchema, customerSchema, findFieldDef(), mapRowToCustomer(), mapRowToOrder() (+13 more)

### Community 2 - "JsonDB"
Cohesion: 0.12
Nodes (13): 1. Context & Primary Sources, 2. Order & Payment State Machine Design, 3. Expiration Handling: Lazy TTL Evaluation vs Background Timers, 4. Client-Server Communication: Polling vs SSE/WebSockets, Comparison, Decision Recommendation, Existing Codebase Architecture, Findings (+5 more)

### Community 3 - "Product.js"
Cohesion: 0.06
Nodes (33): 0004. Máy Trạng Thái Thanh Toán QR (Lazy TTL) Và Bộ Nhớ Đệm Danh Mục Sản Phẩm (In-Memory TTL Cache), Bối cảnh & Lý do lựa chọn, 0007. Làm Sâu Điều Phối AI (AI Product Enrichment, Self-healing Catalog, AI Shopping Consultant) Và Tinh Gọn Mã Nguồn Giao Diện, Bối cảnh & Lý do lựa chọn, 2. In-Memory TTL Cache with Write-Through Invalidation, Architecture Pattern, Design Requirements, Problem Statement (+25 more)

### Community 4 - "main.js"
Cohesion: 0.06
Nodes (75): activeQrSession, addToCart(), allProducts, appendChatBubble(), applyQuickPreset(), BENCH_MODELS, buyNow(), cancelCustomerOrderUI() (+67 more)

### Community 5 - "storageSeam.test.js"
Cohesion: 0.07
Nodes (18): crypto, fs, path, initDatabase(), { Pool }, changePassword(), login(), chatController (+10 more)

### Community 6 - "dependencies"
Cohesion: 0.18
Nodes (11): dependencies, cookie-parser@^1.4.6, cors@^2.8.5, dotenv@^18.0.7, @google/genai@^3.0.0, pg@^8.23.1, cookie-parser, cors (+3 more)

### Community 7 - "ADR 0008: Storefront Redesign with Variant B (The Split Stage) and Tasteskill v2 Anti-Slop System"
Cohesion: 0.29
Nodes (6): ADR 0008: Storefront Redesign with Variant B (The Split Stage) and Tasteskill v2 Anti-Slop System, Bối cảnh & Vấn đề (Context), Các Phương Án Thử Nghiệm Qua Prototype, Quyết Định Thiết Kế (Decision), Trạng Thái Triển Khai (Status), selectFinishSwatch()

### Community 8 - "📱 TechStore - Hệ Thống Bán Điện Thoại & Quản Trị Khách Hàng (CRM)"
Cohesion: 0.17
Nodes (11): 1. Cài đặt thư viện, 🛒 1. Phía Khách Hàng (Storefront), 2. Chạy môi trường phát triển, 🛡️ 2. Hệ Thống Quản Trị (Admin Panel & CRM), 3. Truy cập ứng dụng, 🚀 Cài Đặt & Khởi Chạy, Cách lấy chuỗi kết nối Neon Postgres:, 🐘 Kết Nối Neon Postgres (Lưu Trữ Bền Vững) (+3 more)

### Community 9 - "paymentAndOrderWorkflow.test.js"
Cohesion: 0.16
Nodes (10): app, assert, http, { test, describe, before, after }, assert, http, { test, describe, before, after }, assert (+2 more)

### Community 10 - "Spec 0001: Gemini AI Automation (Product Enrichment, Shopping Consultant & Self-healing Catalog)"
Cohesion: 0.22
Nodes (8): Further Notes, Implementation Decisions, Out of Scope, Problem Statement, Solution, Spec 0001: Gemini AI Automation (Product Enrichment, Shopping Consultant & Self-healing Catalog), Testing Decisions, User Stories

### Community 14 - "vercel.json"
Cohesion: 0.50
Nodes (3): builds, routes, version

### Community 15 - "catalogFilter.js"
Cohesion: 0.44
Nodes (8): escapeRegExp(), filterProducts(), matchesPriceFilter(), matchesPricePreset(), matchesSearchQuery(), matchesSpecField(), normalizeCapacityTokens(), sortProducts()

### Community 16 - "Product.js"
Cohesion: 0.14
Nodes (10): catalogCache, assert, http, { test, describe, before, after }, assert, { test, describe }, assert, { test, describe, after } (+2 more)

### Community 17 - "Research: In-Memory TTL Caching & DB Indexing Benchmarks for Catalog Querying"
Cohesion: 0.29
Nodes (6): 1. Context & Primary Sources, 3. PostgreSQL Indexing Strategy, 4. HTTP Payload Optimization & Compression, Existing Codebase Architecture, Impact Analysis, Research: In-Memory TTL Caching & DB Indexing Benchmarks for Catalog Querying

### Community 18 - "catalogCacheAndFilter.test.js"
Cohesion: 0.15
Nodes (9): baseDataDir, fs, path, assert, http, { test, describe, before, after }, zlib, assert (+1 more)

### Community 19 - "OrderModel"
Cohesion: 0.06
Nodes (41): 0006. Làm Sâu Vòng Đời Đơn Hàng (Order Lifecycle), Bản Chiếu Khách Hàng An Toàn (Safe Customer Projection) Và Hợp Nhất Bộ Lọc Danh Mục (Catalog Filter Engine), Bối cảnh & Lý do lựa chọn, addProduct(), createCustomer(), deleteCustomer(), deleteOrder(), deleteProduct(), exportCustomersCsv() (+33 more)

### Community 20 - "ref_fs"
Cohesion: 0.17
Nodes (8): css, fs, replacements, css, fs, results, fs, html

### Community 21 - "server.js"
Cohesion: 0.20
Nodes (8): cookieParser, cors, express, path, compressionMiddleware(), zlib, express, router

### Community 22 - "express"
Cohesion: 0.18
Nodes (8): express@^4.19.2, express, express, router, express, router, express, router

### Community 23 - "scripts"
Cohesion: 0.20
Nodes (10): scripts, build, crawl, db:seed, dev, start, test, vercel:deploy (+2 more)

### Community 24 - "package.json"
Cohesion: 0.28
Nodes (8): devDependencies, nodemon@^3.1.14, vercel@^63.1.2, main, name, version, nodemon, vercel

### Community 25 - "express-session"
Cohesion: 0.50
Nodes (3): express-session@^1.18.0, express-session, session

### Community 27 - "adminAI.test.js"
Cohesion: 0.50
Nodes (3): assert, http, { test, describe, before, after }

### Community 28 - "fullFlow.test.js"
Cohesion: 0.50
Nodes (3): assert, http, { test, describe, before, after }

## Knowledge Gaps
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `ProductModel` connect `Product.js` to `storageSeam.test.js`, `Product.js`, `catalogCacheAndFilter.test.js`, `OrderModel`, `express`, `adminAI.test.js`, `fullFlow.test.js`?**
  _High betweenness centrality (0.267) - this node is a cross-community bridge._
- **Are the 4 inferred relationships involving `ProductModel` (e.g. with `0004. Máy Trạng Thái Thanh Toán QR (Lazy TTL) Và Bộ Nhớ Đệm Danh Mục Sản Phẩm (In-Memory TTL Cache)` and `Bối cảnh & Lý do lựa chọn`) actually correct?**
  _`ProductModel` has 4 INFERRED edges - model-reasoned connections that need verification._
- **Should `admin.js` be split into smaller, more focused modules?**
  _Cohesion score 0.10714285714285714 - nodes in this community are weakly interconnected._
- **Why does `Bối cảnh & Lý do lựa chọn` connect `Product.js` to `main.js`?**
  _High betweenness centrality (0.218) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `OrderModel` (e.g. with `0006. Làm Sâu Vòng Đời Đơn Hàng (Order Lifecycle), Bản Chiếu Khách Hàng An Toàn (Safe Customer Projection) Và Hợp Nhất Bộ Lọc Danh Mục (Catalog Filter Engine)` and `Bối cảnh & Lý do lựa chọn`) actually correct?**
  _`OrderModel` has 3 INFERRED edges - model-reasoned connections that need verification._
- **Should `PostgresStorageAdapter` be split into smaller, more focused modules?**
  _Cohesion score 0.06753006475485661 - nodes in this community are weakly interconnected._
- **Why does `clearQrSessionTimers()` connect `main.js` to `Product.js`?**
  _High betweenness centrality (0.212) - this node is a cross-community bridge._