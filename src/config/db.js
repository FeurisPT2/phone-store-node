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

    // Seed Products nếu bảng trống
    const prodCheck = await client.query('SELECT COUNT(*) FROM products');
    if (parseInt(prodCheck.rows[0].count) === 0) {
      const defaultProducts = [
        { id: "p1", name: "iPhone 15 Pro Max 256GB", brand: "Apple", price: 29490000, oldPrice: 34990000, specs: "6.7 inch OLED 120Hz | A17 Pro | 256GB", image: "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=500&auto=format&fit=crop&q=80" },
        { id: "p2", name: "Samsung Galaxy S24 Ultra", brand: "Samsung", price: 27990000, oldPrice: 31990000, specs: "6.8 inch 2K+ 120Hz | Snap 8 Gen 3 | 256GB", image: "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=500&auto=format&fit=crop&q=80" },
        { id: "p3", name: "Xiaomi 14 Ultra Leica", brand: "Xiaomi", price: 21990000, oldPrice: 24990000, specs: "6.73 inch LTPO | Snap 8 Gen 3 | 512GB", image: "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=500&auto=format&fit=crop&q=80" }
      ];
      for (const p of defaultProducts) {
        await client.query(`
          INSERT INTO products (id, name, brand, price, old_price, specs, image)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [p.id, p.name, p.brand, p.price, p.oldPrice, p.specs, p.image]);
      }
      console.log('🌱 [NEON POSTGRES] Đã khởi tạo sản phẩm mặc định vào cơ sở dữ liệu');
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
