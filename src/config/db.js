require('dotenv').config();
const { Pool } = require('pg');

let pool = null;
let isPostgres = false;

if (process.env.DATABASE_URL) {
  try {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000
    });
    isPostgres = true;
    console.log('🐘 [NEON POSTGRES] Đã khởi tạo kết nối Neon Postgres.');
  } catch (err) {
    console.error('❌ [NEON POSTGRES] Lỗi khởi tạo kết nối:', err.message);
    isPostgres = false;
  }
} else {
  console.log('📁 [DATABASE] Chưa có biến DATABASE_URL. Hệ thống tự động dùng JSON DB cục bộ.');
}

async function query(text, params) {
  const activePostgres = typeof module.exports?.isPostgres === 'function' ? module.exports.isPostgres() : isPostgres;
  const activePool = module.exports?.pool !== undefined ? module.exports.pool : pool;
  if (!activePostgres || !activePool) return null;
  return await activePool.query(text, params);
}

async function initDatabase() {
  const activePostgres = typeof module.exports?.isPostgres === 'function' ? module.exports.isPostgres() : isPostgres;
  const activePool = module.exports?.pool !== undefined ? module.exports.pool : pool;
  if (!activePostgres || !activePool) return false;

  try {
    const client = await activePool.connect();
    console.log('✅ [NEON POSTGRES] Kết nối cơ sở dữ liệu thành công!');

    // 1. Bảng admins
    await client.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id VARCHAR(50) PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        full_name VARCHAR(100),
        email VARCHAR(100),
        role VARCHAR(50) DEFAULT 'Super Admin',
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Bảng customers
    await client.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id VARCHAR(50) PRIMARY KEY,
        full_name VARCHAR(100) NOT NULL,
        phone VARCHAR(20) UNIQUE NOT NULL,
        password_hash TEXT,
        email VARCHAR(100),
        address TEXT,
        note TEXT,
        admin_note TEXT,
        tag VARCHAR(20) DEFAULT 'Mới',
        visit_count INT DEFAULT 1,
        order_count INT DEFAULT 0,
        total_spent BIGINT DEFAULT 0,
        last_visited TIMESTAMPTZ,
        last_order_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
      ALTER TABLE customers ADD COLUMN IF NOT EXISTS password_hash TEXT;
      ALTER TABLE customers ADD COLUMN IF NOT EXISTS wishlist JSONB DEFAULT '[]'::jsonb;
    `);

    // 3. Bảng orders
    await client.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id VARCHAR(50) PRIMARY KEY,
        customer_id VARCHAR(50),
        customer_info JSONB NOT NULL,
        items JSONB NOT NULL,
        total_amount BIGINT NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        payment_method VARCHAR(20) DEFAULT 'cod',
        payment_status VARCHAR(30) DEFAULT 'unpaid',
        payment_ref VARCHAR(100),
        payment_expires_at TIMESTAMPTZ,
        stats_synced BOOLEAN DEFAULT FALSE,
        admin_note TEXT,
        note TEXT,
        status_history JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method VARCHAR(20) DEFAULT 'cod';
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status VARCHAR(30) DEFAULT 'unpaid';
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_ref VARCHAR(100);
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_expires_at TIMESTAMPTZ;
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS stats_synced BOOLEAN DEFAULT FALSE;
    `);

    // 4. Bảng products
    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        brand VARCHAR(50) NOT NULL,
        category VARCHAR(50),
        category_label VARCHAR(100),
        unit VARCHAR(50),
        duration VARCHAR(100),
        badge VARCHAR(100),
        description TEXT,
        price BIGINT NOT NULL,
        old_price BIGINT,
        specs TEXT,
        image TEXT,
        detailed_specs JSONB,
        ai_review JSONB,
        ai_enriched_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
      ALTER TABLE products ADD COLUMN IF NOT EXISTS category VARCHAR(50);
      ALTER TABLE products ADD COLUMN IF NOT EXISTS category_label VARCHAR(100);
      ALTER TABLE products ADD COLUMN IF NOT EXISTS unit VARCHAR(50);
      ALTER TABLE products ADD COLUMN IF NOT EXISTS duration VARCHAR(100);
      ALTER TABLE products ADD COLUMN IF NOT EXISTS badge VARCHAR(100);
      ALTER TABLE products ADD COLUMN IF NOT EXISTS description TEXT;
    `);

    // 5. Indexes tối ưu hóa hiệu năng truy vấn
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_products_brand_lower ON products (LOWER(brand));
      CREATE INDEX IF NOT EXISTS idx_products_price ON products (price);
      CREATE INDEX IF NOT EXISTS idx_products_created_at ON products (created_at);
      CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders (customer_id);
      CREATE INDEX IF NOT EXISTS idx_orders_status ON orders (status);
      CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders (created_at DESC);
    `);

    // Seed Admin mặc định nếu bảng trống
    const adminCheck = await client.query('SELECT COUNT(*) FROM admins');
    if (parseInt(adminCheck.rows[0].count) === 0) {
      const crypto = require('crypto');
      const hash = crypto.createHash('sha256').update('admin123').digest('hex');
      await client.query(`
        INSERT INTO admins (id, username, password_hash, full_name, email, role)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, ['admin_1', 'admin', hash, 'Quản Trị Viên', 'admin@techstore.vn', 'Super Admin']);
      console.log('🌱 [NEON POSTGRES] Đã khởi tạo tài khoản Admin mặc định: admin / admin123');
    }

    // Seed & đồng bộ toàn bộ sản phẩm GearHub từ products.json vào Postgres
    try {
      await client.query('DELETE FROM products WHERE id = $1', ['iphone_duo_256gb']);

      const jsonProducts = require('../data/products.json');
      for (const p of jsonProducts) {
        const detailedSpecs = p.detailedSpecs || p.detailed_specs || null;
        const serializedSpecs = detailedSpecs ? (typeof detailedSpecs === 'object' ? JSON.stringify(detailedSpecs) : detailedSpecs) : null;
        const aiReview = p.aiReview || p.ai_review || null;
        const serializedReview = aiReview ? (typeof aiReview === 'object' ? JSON.stringify(aiReview) : aiReview) : null;
        const aiEnrichedAt = p.aiEnrichedAt || p.ai_enriched_at || null;
        await client.query(`
          INSERT INTO products (
            id, name, brand, category, category_label, unit, duration, badge, description,
            price, old_price, specs, image,
            detailed_specs, ai_review, ai_enriched_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
          ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            brand = EXCLUDED.brand,
            category = EXCLUDED.category,
            category_label = EXCLUDED.category_label,
            unit = EXCLUDED.unit,
            duration = EXCLUDED.duration,
            badge = EXCLUDED.badge,
            description = EXCLUDED.description,
            price = EXCLUDED.price,
            old_price = EXCLUDED.old_price,
            specs = EXCLUDED.specs,
            image = EXCLUDED.image,
            detailed_specs = COALESCE(products.detailed_specs, EXCLUDED.detailed_specs),
            ai_review = COALESCE(products.ai_review, EXCLUDED.ai_review),
            ai_enriched_at = COALESCE(products.ai_enriched_at, EXCLUDED.ai_enriched_at)
        `, [
          p.id,
          p.name,
          p.brand,
          p.category || '',
          p.categoryLabel || p.category_label || '',
          p.unit || '',
          p.duration || '',
          p.badge || '',
          p.description || '',
          p.price,
          p.oldPrice || p.price,
          p.specs || '',
          p.image || '',
          serializedSpecs,
          serializedReview,
          aiEnrichedAt
        ]);
      }
      console.log(`🌱 [NEON POSTGRES] Đã đồng bộ ${jsonProducts.length} sản phẩm vào cơ sở dữ liệu`);
    } catch (err) {
      console.error('Lỗi sync sản phẩm vào Postgres:', err.message);
    }

    client.release();
    return true;
  } catch (err) {
    console.error('❌ [NEON POSTGRES] Lỗi khởi tạo bảng:', err.message);
    return false;
  }
}

let initPromise = null;

async function ensureReady() {
  const activePostgres = typeof module.exports?.isPostgres === 'function' ? module.exports.isPostgres() : isPostgres;
  const activePool = module.exports?.pool !== undefined ? module.exports.pool : pool;
  if (!activePostgres || !activePool) return false;
  if (!initPromise) {
    initPromise = initDatabase().catch((err) => {
      initPromise = null;
      throw err;
    });
  }
  return initPromise;
}

// Tự động khởi tạo khi có kết nối
if (isPostgres) {
  ensureReady();
}

module.exports = {
  pool,
  isPostgres: () => isPostgres,
  query,
  initDatabase,
  ensureReady
};
