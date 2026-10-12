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
  if (!isPostgres || !pool) return null;
  return await pool.query(text, params);
}

async function initDatabase() {
  if (!isPostgres || !pool) return false;

  try {
    const client = await pool.connect();
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
        admin_note TEXT,
        note TEXT,
        status_history JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 4. Bảng products
    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        brand VARCHAR(50) NOT NULL,
        price BIGINT NOT NULL,
        old_price BIGINT,
        specs TEXT,
        image TEXT,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
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

    // Seed & đồng bộ toàn bộ sản phẩm từ products.json vào Postgres
    try {
      const jsonProducts = require('../data/products.json');
      for (const p of jsonProducts) {
        await client.query(`
          INSERT INTO products (id, name, brand, price, old_price, specs, image)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            brand = EXCLUDED.brand,
            price = EXCLUDED.price,
            old_price = EXCLUDED.old_price,
            specs = EXCLUDED.specs,
            image = EXCLUDED.image
        `, [p.id, p.name, p.brand, p.price, p.oldPrice || p.price, p.specs || '', p.image || '']);
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

// Tự động khởi tạo khi có kết nối
if (isPostgres) {
  initDatabase();
}

module.exports = {
  pool,
  isPostgres: () => isPostgres,
  query,
  initDatabase
};
