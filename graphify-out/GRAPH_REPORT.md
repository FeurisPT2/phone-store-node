# Graph Report - phone-store-node  (2026-11-07)

## Corpus Check
- 52 files · ~38,608 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 4 file(s) not represented in the graph (top: .css 2, .example 1, (none) 1)

## Summary
- 353 nodes · 668 edges · 15 communities (11 shown, 4 thin omitted)
- Extraction: 93% EXTRACTED · 7% INFERRED · 0% AMBIGUOUS · INFERRED: 45 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `4e4d2fd7`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- admin.js
- CustomerModel
- Product.js
- main.js
- Admin.js
- package.json
- express
- 📱 TechStore - Hệ Thống Bán Điện Thoại & Quản Trị Khách Hàng (CRM)
- server.js
- Spec 0001: Gemini AI Automation (Product Enrichment, Shopping Consultant & Self-healing Catalog)
- 0001. Sử dụng Google Gemini 2.5 Flash Tự Động Hóa Dữ Liệu Sản Phẩm Và Tư Vấn Khách Hàng
- 0002. Mở Rộng Schema Sản Phẩm Và Cơ Chế Dynamic Catalog Grounding
- 0003. Giao Diện Tương Tác Storefront Và Cơ Chế Graceful Fallback Khi Mất Kết Nối AI
- vercel.json
- TechStore

## God Nodes (most connected - your core abstractions)
1. `showToast()` - 15 edges
2. `CustomerModel` - 14 edges
3. `ProductModel` - 14 edges
4. `loadDashboard()` - 14 edges
5. `JsonDB` - 13 edges
6. `scripts` - 10 edges
7. `express` - 10 edges
8. `showToast()` - 9 edges
9. `OrderModel` - 9 edges
10. `formatMoney()` - 9 edges

## Surprising Connections (you probably didn't know these)
- None detected - all connections are within the same source files.

## Import Cycles
- None detected.

## Communities (15 total, 4 thin omitted)

### Community 0 - "admin.js"
Cohesion: 0.11
Nodes (44): closeModal(), currentCustFilter, currentOrderFilter, currentProdFilter, deleteCustomer(), deleteOrder(), deleteProduct(), enrichProductWithAI() (+36 more)

### Community 1 - "CustomerModel"
Cohesion: 0.07
Nodes (29): addProduct(), createCustomer(), deleteCustomer(), deleteOrder(), deleteProduct(), exportCustomersCsv(), exportOrdersCsv(), getAllCustomers() (+21 more)

### Community 3 - "Product.js"
Cohesion: 0.11
Nodes (22): addFlagships(), flagships, run(), crawlProducts(), enrichProductById(), selfHealProducts(), updateProduct(), addToCart() (+14 more)

### Community 4 - "main.js"
Cohesion: 0.15
Nodes (28): addToCart(), allProducts, appendChatBubble(), buyNow(), chatHistory, checkAuthState(), closeModal(), filterByBrand() (+20 more)

### Community 5 - "Admin.js"
Cohesion: 0.08
Nodes (15): crypto, fs, path, initDatabase(), { Pool }, changePassword(), login(), adminDB (+7 more)

### Community 6 - "package.json"
Cohesion: 0.08
Nodes (31): dependencies, cookie-parser@^1.4.6, cors@^2.8.5, dotenv@^18.0.7, express-session@^1.18.0, @google/genai@^3.0.0, pg@^8.23.1, devDependencies (+23 more)

### Community 7 - "express"
Cohesion: 0.08
Nodes (17): express@^4.19.2, express, chatController, express, router, express, router, express (+9 more)

### Community 8 - "📱 TechStore - Hệ Thống Bán Điện Thoại & Quản Trị Khách Hàng (CRM)"
Cohesion: 0.17
Nodes (11): 1. Cài đặt thư viện, 🛒 1. Phía Khách Hàng (Storefront), 2. Chạy môi trường phát triển, 🛡️ 2. Hệ Thống Quản Trị (Admin Panel & CRM), 3. Truy cập ứng dụng, 🚀 Cài Đặt & Khởi Chạy, Cách lấy chuỗi kết nối Neon Postgres:, 🐘 Kết Nối Neon Postgres (Lưu Trữ Bền Vững) (+3 more)

### Community 9 - "server.js"
Cohesion: 0.07
Nodes (32): app, cookieParser, cors, express, path, session, consultCustomer(), enrichProduct() (+24 more)

### Community 10 - "Spec 0001: Gemini AI Automation (Product Enrichment, Shopping Consultant & Self-healing Catalog)"
Cohesion: 0.22
Nodes (8): Further Notes, Implementation Decisions, Out of Scope, Problem Statement, Solution, Spec 0001: Gemini AI Automation (Product Enrichment, Shopping Consultant & Self-healing Catalog), Testing Decisions, User Stories

### Community 14 - "vercel.json"
Cohesion: 0.50
Nodes (3): builds, routes, version

## Knowledge Gaps
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `express` connect `express` to `server.js`, `package.json`?**
  _High betweenness centrality (0.067) - this node is a cross-community bridge._
- **Should `admin.js` be split into smaller, more focused modules?**
  _Cohesion score 0.10823311748381129 - nodes in this community are weakly interconnected._
- **Why does `ProductModel` connect `Product.js` to `CustomerModel`, `server.js`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **Should `CustomerModel` be split into smaller, more focused modules?**
  _Cohesion score 0.06853146853146853 - nodes in this community are weakly interconnected._
- **Should `Product.js` be split into smaller, more focused modules?**
  _Cohesion score 0.1066066066066066 - nodes in this community are weakly interconnected._
- **Should `Admin.js` be split into smaller, more focused modules?**
  _Cohesion score 0.08172043010752689 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.07862903225806452 - nodes in this community are weakly interconnected._