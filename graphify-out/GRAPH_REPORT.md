# Graph Report - phone-store-node  (2026-11-07)

## Corpus Check
- 65 files · ~74,797 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 4 file(s) not represented in the graph (top: .css 2, .example 1, (none) 1)

## Summary
- 464 nodes · 951 edges · 20 communities (14 shown, 6 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 49 edges (avg confidence: 0.87)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `ade48c54`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- admin.js
- CustomerModel
- scripts
- Product.js
- main.js
- Admin.js
- dependencies
- express
- 📱 TechStore - Hệ Thống Bán Điện Thoại & Quản Trị Khách Hàng (CRM)
- server.js
- Spec 0001: Gemini AI Automation (Product Enrichment, Shopping Consultant & Self-healing Catalog)
- 0001. Sử dụng Google Gemini 2.5 Flash Tự Động Hóa Dữ Liệu Sản Phẩm Và Tư Vấn Khách Hàng
- 0002. Mở Rộng Schema Sản Phẩm Và Cơ Chế Dynamic Catalog Grounding
- 0003. Giao Diện Tương Tác Storefront Và Cơ Chế Graceful Fallback Khi Mất Kết Nối AI
- vercel.json
- TechStore
- package.json
- express-session
- adminRoutes.js
- cartRoutes.js

## God Nodes (most connected - your core abstractions)
1. `ProductModel` - 26 edges
2. `CustomerModel` - 19 edges
3. `OrderModel` - 17 edges
4. `showToast()` - 16 edges
5. `loadDashboard()` - 15 edges
6. `showToast()` - 15 edges
7. `renderProductList()` - 14 edges
8. `loadOrders()` - 11 edges
9. `loadProducts()` - 11 edges
10. `closeModal()` - 11 edges

## Surprising Connections (you probably didn't know these)
- `Solution` --references--> `OrderModel`  [INFERRED]
  docs/specs/0002-techstore-v2-production-release.md → src/models/Order.js
- `0004. Máy Trạng Thái Thanh Toán QR (Lazy TTL) Và Bộ Nhớ Đệm Danh Mục Sản Phẩm (In-Memory TTL Cache)` --references--> `ProductModel`  [INFERRED]
  docs/adr/0004-qr-payment-state-machine-and-catalog-caching.md → src/models/Product.js
- `Solution` --references--> `ProductModel`  [INFERRED]
  docs/specs/0002-techstore-v2-production-release.md → src/models/Product.js

## Import Cycles
- None detected.

## Communities (20 total, 6 thin omitted)

### Community 0 - "admin.js"
Cohesion: 0.08
Nodes (59): closeAdminModal(), closeModal(), currentCustFilter, currentOrderFilter, currentProdFilter, deleteCustomer(), deleteOrder(), deleteProduct() (+51 more)

### Community 1 - "CustomerModel"
Cohesion: 0.06
Nodes (39): addProduct(), createCustomer(), deleteCustomer(), deleteOrder(), deleteProduct(), exportCustomersCsv(), exportOrdersCsv(), getAllCustomers() (+31 more)

### Community 2 - "scripts"
Cohesion: 0.20
Nodes (10): scripts, build, crawl, db:seed, dev, start, test, vercel:deploy (+2 more)

### Community 3 - "Product.js"
Cohesion: 0.06
Nodes (36): 0004. Máy Trạng Thái Thanh Toán QR (Lazy TTL) Và Bộ Nhớ Đệm Danh Mục Sản Phẩm (In-Memory TTL Cache), Bối cảnh & Lý do lựa chọn, Problem Statement, Solution, Spec 0002: TechStore v2.0 Production-Ready Release (QR Payment, Customer Portal, Multi-Attribute Specs Filter & Performance Optimization), addFlagships(), flagships, run() (+28 more)

### Community 4 - "main.js"
Cohesion: 0.06
Nodes (77): activeQrSession, addToCart(), allProducts, appendChatBubble(), BENCH_MODELS, buyNow(), cancelCustomerOrderUI(), chatHistory (+69 more)

### Community 5 - "Admin.js"
Cohesion: 0.09
Nodes (15): crypto, fs, path, initDatabase(), { Pool }, changePassword(), login(), adminDB (+7 more)

### Community 6 - "dependencies"
Cohesion: 0.18
Nodes (11): dependencies, cookie-parser@^1.4.6, cors@^2.8.5, dotenv@^18.0.7, @google/genai@^3.0.0, pg@^8.23.1, cookie-parser, cors (+3 more)

### Community 7 - "express"
Cohesion: 0.18
Nodes (8): express@^4.19.2, express, express, router, express, router, express, router

### Community 8 - "📱 TechStore - Hệ Thống Bán Điện Thoại & Quản Trị Khách Hàng (CRM)"
Cohesion: 0.17
Nodes (11): 1. Cài đặt thư viện, 🛒 1. Phía Khách Hàng (Storefront), 2. Chạy môi trường phát triển, 🛡️ 2. Hệ Thống Quản Trị (Admin Panel & CRM), 3. Truy cập ứng dụng, 🚀 Cài Đặt & Khởi Chạy, Cách lấy chuỗi kết nối Neon Postgres:, 🐘 Kết Nối Neon Postgres (Lưu Trữ Bền Vững) (+3 more)

### Community 9 - "server.js"
Cohesion: 0.05
Nodes (43): app, cookieParser, cors, express, path, compressionMiddleware(), zlib, express (+35 more)

### Community 10 - "Spec 0001: Gemini AI Automation (Product Enrichment, Shopping Consultant & Self-healing Catalog)"
Cohesion: 0.22
Nodes (8): Further Notes, Implementation Decisions, Out of Scope, Problem Statement, Solution, Spec 0001: Gemini AI Automation (Product Enrichment, Shopping Consultant & Self-healing Catalog), Testing Decisions, User Stories

### Community 14 - "vercel.json"
Cohesion: 0.50
Nodes (3): builds, routes, version

### Community 16 - "package.json"
Cohesion: 0.28
Nodes (8): devDependencies, nodemon@^3.1.14, vercel@^63.1.2, main, name, version, nodemon, vercel

### Community 17 - "express-session"
Cohesion: 0.50
Nodes (3): express-session@^1.18.0, express-session, session

## Knowledge Gaps
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `ProductModel` connect `Product.js` to `CustomerModel`, `server.js`?**
  _High betweenness centrality (0.062) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `ProductModel` (e.g. with `0004. Máy Trạng Thái Thanh Toán QR (Lazy TTL) Và Bộ Nhớ Đệm Danh Mục Sản Phẩm (In-Memory TTL Cache)` and `Solution`) actually correct?**
  _`ProductModel` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Should `admin.js` be split into smaller, more focused modules?**
  _Cohesion score 0.08196721311475409 - nodes in this community are weakly interconnected._
- **Why does `express` connect `express` to `Product.js`, `server.js`, `package.json`, `adminRoutes.js`, `cartRoutes.js`?**
  _High betweenness centrality (0.040) - this node is a cross-community bridge._
- **Should `CustomerModel` be split into smaller, more focused modules?**
  _Cohesion score 0.060694579681921455 - nodes in this community are weakly interconnected._
- **Why does `OrderModel` connect `CustomerModel` to `server.js`, `Product.js`?**
  _High betweenness centrality (0.028) - this node is a cross-community bridge._
- **Should `Product.js` be split into smaller, more focused modules?**
  _Cohesion score 0.05734767025089606 - nodes in this community are weakly interconnected._