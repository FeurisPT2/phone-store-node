require('dotenv').config();
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { pool, isPostgres, initDatabase } = require('../src/config/db');
const geminiService = require('../src/services/geminiService');

async function seed() {
  console.log('====================================================');
  console.log('🌱 BẮT ĐẦU QUÁ TRÌNH NẠP DỮ LIỆU VÀO CƠ SỞ DỮ LIỆU');
  console.log('====================================================');

  const usingPostgres = isPostgres();
  console.log(`📌 Chế độ lưu trữ: ${usingPostgres ? '🐘 NEON POSTGRESQL' : '📁 LOCAL JSON DB'}`);

  // 1. Đọc dữ liệu nguồn
  const dataDir = path.join(__dirname, '..', 'src', 'data');
  const productsSource = JSON.parse(fs.readFileSync(path.join(dataDir, 'products.json'), 'utf8') || '[]');
  const adminsSource = JSON.parse(fs.readFileSync(path.join(dataDir, 'admins.json'), 'utf8') || '[]');
  const customersSource = JSON.parse(fs.readFileSync(path.join(dataDir, 'customers.json'), 'utf8') || '[]');
  const ordersSource = JSON.parse(fs.readFileSync(path.join(dataDir, 'orders.json'), 'utf8') || '[]');

  console.log(`📦 Tìm thấy trong nguồn: ${productsSource.length} sản phẩm, ${adminsSource.length} admin, ${customersSource.length} khách hàng, ${ordersSource.length} đơn hàng.`);

  // 2. Làm giàu AI trước cho toàn bộ sản phẩm nếu chưa có
  console.log('✨ Kiểm tra và tự động làm giàu thông số kỹ thuật (detailedSpecs) & AI Review...');
  let enrichedCount = 0;
  for (const p of productsSource) {
    if (!p.detailedSpecs || !p.aiReview) {
      const enrichment = geminiService.fallbackEnrich({
        name: p.name,
        brand: p.brand,
        rawText: p.specs || p.description || ''
      });
      p.detailedSpecs = enrichment.detailedSpecs;
      p.aiReview = enrichment.aiReview;
      p.aiEnrichedAt = new Date().toISOString();
      enrichedCount++;
    }
  }
  // Ghi lại vào products.json để cập nhật nguồn
  fs.writeFileSync(path.join(dataDir, 'products.json'), JSON.stringify(productsSource, null, 2), 'utf8');
  console.log(`✅ Đã đồng bộ thông số AI cho ${enrichedCount} sản phẩm.`);

  // 3. Nếu dùng Postgres -> Nạp vào PostgreSQL
  if (usingPostgres && pool) {
    console.log('🐘 Đang nạp dữ liệu vào các bảng Neon Postgres...');
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 3.1 Bảng admins
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

      for (const a of adminsSource) {
        await client.query(`
          INSERT INTO admins (id, username, password_hash, full_name, email, role)
          VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (username) DO UPDATE SET
            password_hash = EXCLUDED.password_hash,
            full_name = EXCLUDED.full_name,
            email = EXCLUDED.email,
            role = EXCLUDED.role;
        `, [a.id || 'admin_1', a.username, a.passwordHash, a.fullName || 'Quản Trị Viên', a.email || 'admin@techstore.vn', a.role || 'Super Admin']);
      }

      // 3.2 Bảng customers
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

      for (const c of customersSource) {
        await client.query(`
          INSERT INTO customers (id, full_name, phone, password_hash, email, address, tag, visit_count, order_count, total_spent)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          ON CONFLICT (phone) DO UPDATE SET
            full_name = EXCLUDED.full_name,
            password_hash = EXCLUDED.password_hash,
            email = EXCLUDED.email,
            address = EXCLUDED.address,
            total_spent = EXCLUDED.total_spent;
        `, [
          c.id, c.fullName, c.phone, c.passwordHash || null, c.email || '', c.address || '',
          c.tag || 'Mới', c.visitCount || 1, c.orderCount || 0, c.totalSpent || 0
        ]);
      }

      // 3.3 Bảng products
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

      await client.query('DELETE FROM products WHERE id = $1', ['iphone_duo_256gb']);

      for (const p of productsSource) {
        await client.query(`
          INSERT INTO products (
            id, name, brand, category, category_label, unit, duration, badge, description,
            price, old_price, specs, image, detailed_specs, ai_review, ai_enriched_at
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
            detailed_specs = EXCLUDED.detailed_specs,
            ai_review = EXCLUDED.ai_review,
            ai_enriched_at = EXCLUDED.ai_enriched_at;
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
          JSON.stringify(p.detailedSpecs || {}),
          JSON.stringify(p.aiReview || {}),
          p.aiEnrichedAt || new Date().toISOString()
        ]);
      }

      // 3.4 Bảng orders
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

      for (const o of ordersSource) {
        await client.query(`
          INSERT INTO orders (id, customer_id, customer_info, items, total_amount, status, admin_note, note, status_history)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          ON CONFLICT (id) DO UPDATE SET
            status = EXCLUDED.status,
            total_amount = EXCLUDED.total_amount;
        `, [
          o.id, o.customerId || null, JSON.stringify(o.customerInfo || {}), JSON.stringify(o.items || []),
          o.totalAmount || 0, o.status || 'pending', o.adminNote || '', o.note || '', JSON.stringify(o.statusHistory || [])
        ]);
      }

      await client.query('COMMIT');
      console.log('🎉 [POSTGRES] Hoàn tất nạp dữ liệu vào Postgres thành công 100%!');
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('❌ Lỗi khi nạp dữ liệu vào Postgres:', err);
      throw err;
    } finally {
      client.release();
    }
  } else {
    // 4. Nếu dùng JSON DB cục bộ
    console.log('📁 Đang đồng bộ và cập nhật các tệp JSON DB cục bộ...');
    const runtimeDataDir = process.env.VERCEL ? '/tmp' : dataDir;
    if (!fs.existsSync(runtimeDataDir)) {
      fs.mkdirSync(runtimeDataDir, { recursive: true });
    }

    fs.writeFileSync(path.join(runtimeDataDir, 'products.json'), JSON.stringify(productsSource, null, 2), 'utf8');
    fs.writeFileSync(path.join(runtimeDataDir, 'admins.json'), JSON.stringify(adminsSource, null, 2), 'utf8');
    fs.writeFileSync(path.join(runtimeDataDir, 'customers.json'), JSON.stringify(customersSource, null, 2), 'utf8');
    fs.writeFileSync(path.join(runtimeDataDir, 'orders.json'), JSON.stringify(ordersSource, null, 2), 'utf8');
    console.log('🎉 [JSON DB] Đã nạp và đồng bộ toàn bộ file dữ liệu thành công!');
  }

  console.log('====================================================');
  console.log('✅ HỆ THỐNG SẴN SÀNG KHỞI CHẠY VÀ DEPLOY');
  console.log('   - 🛠️  Tổng số dịch vụ & thiết bị GearHub: ' + productsSource.length);
  console.log('   - 🔑 Tài khoản Admin: admin / admin123');
  console.log('   - 👤 Khách hàng mẫu: 0901112233 / 123456');
  console.log('====================================================');
}

if (require.main === module) {
  seed()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = seed;
