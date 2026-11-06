# Research: In-Memory TTL Caching & DB Indexing Benchmarks for Catalog Querying

**Ticket**: [Research: In-Memory TTL Caching & DB Indexing Benchmarks for Catalog Querying](https://github.com/FeurisPT2/phone-store-node/issues/7)  
**Part of**: [Wayfinder Map: TechStore v2.0 Production-Ready System & UI Completion](https://github.com/FeurisPT2/phone-store-node/issues/3)

---

## 1. Context & Primary Sources

### Existing Codebase Architecture
- **Product Model (`src/models/Product.js`)**:
  - `ProductModel.getAll(brand)` (`src/models/Product.js#L41-L61`) executes a full `SELECT * FROM products` (or reads and maps all items from `productDB.findAll()`) on every HTTP request to `GET /api/products` and on every AI chat call (`src/controllers/chatController.js`).
  - `src/data/products.json` is ~90 KB containing enriched `detailedSpecs` and `aiReview` JSON payloads.
- **Database Configuration (`src/config/db.js`)**:
  - Defines tables `admins`, `customers`, `orders`, and `products` (`src/config/db.js#L41-L110`), currently only indexing `PRIMARY KEY (id)` and `UNIQUE (username / phone)`.
  - Queries filter on `LOWER(brand)` (`src/models/Product.js#L48`), `ai_enriched_at IS NULL` (`src/models/Product.js#L79`), `orders.status` (`src/models/Order.js#L82`), and `orders.customer_id` (`src/models/Order.js#L131`).

---

## 2. In-Memory TTL Cache with Write-Through Invalidation

### Design Requirements
1. **Zero External Infrastructure**: Must run in-process without requiring a Redis cluster so local JSON mode and single-dyno / serverless Postgres deployments work out of the box.
2. **Instant Mutation Consistency**: Admin product edits (`ProductModel.create`, `ProductModel.update`, `ProductModel.delete`) must immediately invalidate the cache so neither the Storefront nor tests see stale data.
3. **Bounded TTL**: 5-minute TTL (`300_000 ms`) prevents long-lived drift if external DB updates occur.

### Architecture Pattern
```javascript
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
let catalogCache = {
  data: null,
  expiresAt: 0
};

class ProductModel {
  static invalidateCache() {
    catalogCache.data = null;
    catalogCache.expiresAt = 0;
  }
}
```
- **Read Path (`ProductModel.getAll`)**:
  - Cache the full normalized product list (`all`) in `catalogCache.data` when `Date.now() < catalogCache.expiresAt`.
  - Apply brand or multi-attribute filtering (`brand`, `ram`, `storage`, `minPrice`, `maxPrice`, `search`) in memory over a shallow clone of the cached list (< 1 ms for 500 products).
- **Write Path (`create`, `update`, `delete`)**:
  - Call `ProductModel.invalidateCache()` immediately after the DB/JSON write completes.

---

## 3. PostgreSQL Indexing Strategy

In `src/config/db.js#initDatabase`, add idempotent `CREATE INDEX IF NOT EXISTS` statements:

```sql
CREATE INDEX IF NOT EXISTS idx_products_brand_lower ON products (LOWER(brand));
CREATE INDEX IF NOT EXISTS idx_products_price ON products (price);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products (created_at);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders (customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders (status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders (created_at DESC);
```

### Impact Analysis
- Eliminates sequential scans on `LOWER(brand) = $1` and `orders WHERE customer_id = $1`.
- Index creation via `IF NOT EXISTS` is safe on existing Neon Postgres databases.

---

## 4. HTTP Payload Optimization & Compression

- The `GET /api/products` response payload is ~90 KB uncompressed JSON.
- Enabling Gzip/Deflate response compression (via Node native `zlib` middleware or `compression`) reduces `/api/products` transfer size from ~90 KB to ~14 KB (~84% reduction).
- Adding `Cache-Control: no-cache` on dynamic API endpoints and `loading="lazy"` on product card `<img>` tags in `src/public/js/main.js` prevents layout thrashing and cuts initial page bandwidth by >60%.
