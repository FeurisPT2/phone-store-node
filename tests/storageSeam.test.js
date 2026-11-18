process.env.NODE_ENV = 'test';
const { test, describe, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const {
  StorageCollection,
  JsonStorageAdapter,
  PostgresStorageAdapter,
  schemas,
  productStorage,
  orderStorage,
  customerStorage,
  adminStorage
} = require('../src/models/storage');
const db = require('../src/config/db');

describe('Storage Seam & Adapter Architecture', () => {
  after(() => {
    const dataDir = path.join(__dirname, '..', 'src', 'data');
    const testFiles = ['test_cloning.json', 'test_queries.json', 'test_table.json'];
    for (const file of testFiles) {
      const fullPath = path.join(dataDir, file);
      if (fs.existsSync(fullPath)) {
        try { fs.unlinkSync(fullPath); } catch {}
      }
    }
  });

  test('Singletons export collection-oriented interface (find, findById, findOne, insert, update, delete, count)', () => {
    const collections = [productStorage, orderStorage, customerStorage, adminStorage];
    for (const col of collections) {
      assert.ok(col instanceof StorageCollection);
      assert.equal(typeof col.find, 'function');
      assert.equal(typeof col.findById, 'function');
      assert.equal(typeof col.findOne, 'function');
      assert.equal(typeof col.insert, 'function');
      assert.equal(typeof col.update, 'function');
      assert.equal(typeof col.delete, 'function');
      assert.equal(typeof col.count, 'function');
    }
  });

  test('StorageCollection dynamically selects adapter based on db.isPostgres() without silent fallthrough', async () => {
    const originalIsPostgres = db.isPostgres;
    try {
      const col = new StorageCollection('test_table', schemas.productSchema, { defaultData: [] });

      // When db.isPostgres is false -> JsonStorageAdapter
      assert.ok(col.adapter instanceof JsonStorageAdapter);

      // When db.isPostgres is true -> PostgresStorageAdapter
      db.isPostgres = () => true;
      assert.ok(col.adapter instanceof PostgresStorageAdapter);

      // Verify NO fallback: when postgresAdapter throws, col.adapter throws and does not fall back to jsonAdapter
      col.postgresAdapter.findById = async () => {
        throw new Error('Postgres connection lost');
      };
      await assert.rejects(async () => {
        await col.findById('some_id');
      }, /Postgres connection lost/);
    } finally {
      db.isPostgres = originalIsPostgres;
    }
  });

  test('JsonStorageAdapter deep cloning prevents direct in-memory mutation', async () => {
    const testSchema = {
      tableName: 'test_cloning',
      primaryKey: 'id',
      fields: {
        id: { column: 'id', type: 'string' },
        title: { column: 'title', type: 'string' },
        tags: { column: 'tags', type: 'json' }
      },
      normalize: (row) => ({ ...row })
    };

    const adapter = new JsonStorageAdapter('test_cloning', testSchema, []);
    const inserted = await adapter.insert({ id: 'c1', title: 'Original', tags: ['a', 'b'] });

    // Mutate the returned object
    inserted.tags.push('c');
    inserted.title = 'Mutated';

    // Re-fetch from adapter
    const fetched = await adapter.findById('c1');
    assert.equal(fetched.title, 'Original');
    assert.deepEqual(fetched.tags, ['a', 'b']);

    await adapter.delete('c1');
  });

  test('JsonStorageAdapter query matching (exact, null, $iexact, $search, sort, limit, offset)', async () => {
    const testSchema = {
      tableName: 'test_queries',
      primaryKey: 'id',
      fields: {
        id: { column: 'id', type: 'string' },
        name: { column: 'name', type: 'string' },
        category: { column: 'category', type: 'string' },
        enrichedAt: { column: 'enriched_at', type: 'timestamp', default: null }
      },
      normalize: (row) => ({ ...row })
    };

    const adapter = new JsonStorageAdapter('test_queries', testSchema, []);
    await adapter.insert({ id: 'q1', name: 'Alpha Phone', category: 'phone', enrichedAt: '2026-01-01T00:00:00Z' });
    await adapter.insert({ id: 'q2', name: 'Beta Tablet', category: 'tablet', enrichedAt: null });
    await adapter.insert({ id: 'q3', name: 'Gamma Phone', category: 'phone', enrichedAt: null });

    // 1. Exact match
    const phones = await adapter.find({ category: 'phone' });
    assert.equal(phones.length, 2);

    // 2. Null matching
    const unenriched = await adapter.find({ enrichedAt: null });
    assert.equal(unenriched.length, 2);
    assert.ok(unenriched.every((i) => i.enrichedAt === null));

    // 3. $iexact matching
    const alpha = await adapter.findOne({ name: { $iexact: 'ALPHA PHONE' } });
    assert.ok(alpha);
    assert.equal(alpha.id, 'q1');

    // 4. $search matching
    const searchResult = await adapter.find({ $search: { term: 'beta', fields: ['name', 'category'] } });
    assert.equal(searchResult.length, 1);
    assert.equal(searchResult[0].id, 'q2');

    // 5. count
    const totalCount = await adapter.count();
    assert.equal(totalCount, 3);
    const phoneCount = await adapter.count({ category: 'phone' });
    assert.equal(phoneCount, 2);

    // 6. Sort and pagination
    const sorted = await adapter.find({}, { sort: { id: -1 }, limit: 2, offset: 0 });
    assert.equal(sorted.length, 2);
    assert.equal(sorted[0].id, 'q3');
    assert.equal(sorted[1].id, 'q2');

    // 7. Undefined values in query are safely ignored
    const allWithUndef = await adapter.find({ category: undefined });
    assert.equal(allWithUndef.length, 3);

    // Clean up
    await adapter.delete('q1');
    await adapter.delete('q2');
    await adapter.delete('q3');
  });

  test('PostgresStorageAdapter builds parameterized SQL queries and handles mapping', async () => {
    const executedQueries = [];
    const originalQuery = db.query;

    db.query = async (sql, params) => {
      executedQueries.push({ sql: sql.replace(/\s+/g, ' ').trim(), params });
      if (sql.includes('SELECT * FROM products WHERE id = $1')) {
        return {
          rows: [
            {
              id: 'p_test',
              name: 'PG Phone',
              brand: 'Apple',
              price: '20000000',
              old_price: '22000000',
              specs: 'A18 Pro',
              image: '',
              detailed_specs: JSON.stringify({ chip: 'A18 Pro', ram: '8GB' }),
              ai_review: JSON.stringify({ summary: 'Tuyệt vời' }),
              ai_enriched_at: '2026-11-01T00:00:00Z',
              created_at: '2026-10-01T00:00:00Z',
              updated_at: '2026-11-01T00:00:00Z'
            }
          ]
        };
      }
      if (sql.includes('INSERT INTO products')) {
        return {
          rows: [
            {
              id: params[0],
              name: params[1],
              brand: params[2],
              price: params[3],
              old_price: params[4],
              specs: params[5],
              image: params[6],
              detailed_specs: params[7],
              ai_review: params[8],
              ai_enriched_at: params[9],
              created_at: '2026-11-01T00:00:00Z',
              updated_at: '2026-11-01T00:00:00Z'
            }
          ]
        };
      }
      if (sql.includes('UPDATE products')) {
        return {
          rows: [
            {
              id: params[params.length - 1],
              name: 'Updated Name',
              brand: 'Apple',
              price: '25000000',
              old_price: '25000000',
              specs: '',
              image: '',
              detailed_specs: null,
              ai_review: null,
              ai_enriched_at: null,
              created_at: '2026-10-01T00:00:00Z',
              updated_at: '2026-11-07T00:00:00Z'
            }
          ]
        };
      }
      if (sql.includes('DELETE FROM products')) {
        return { rowCount: 1 };
      }
      if (sql.includes('SELECT COUNT(*) FROM products')) {
        return { rows: [{ count: '42' }] };
      }
      return { rows: [] };
    };

    try {
      const adapter = new PostgresStorageAdapter('products', schemas.productSchema);

      // 1. findById
      const p = await adapter.findById('p_test');
      assert.ok(p);
      assert.equal(p.name, 'PG Phone');
      assert.equal(p.price, 20000000);
      assert.equal(p.oldPrice, 22000000);
      assert.equal(typeof p.detailedSpecs, 'object');
      assert.equal(p.detailedSpecs.chip, 'A18 Pro');
      assert.equal(p.aiReview.summary, 'Tuyệt vời');
      assert.equal(executedQueries[0].params[0], 'p_test');

      // 2. insert
      const inserted = await adapter.insert({
        id: 'p_new',
        name: 'New Product',
        brand: 'Samsung',
        price: 15000000,
        detailedSpecs: { chip: 'Exynos' }
      });
      assert.ok(inserted);
      const insertCall = executedQueries.find((q) => q.sql.includes('INSERT INTO products'));
      assert.ok(insertCall);
      // Detailed specs must be stringified JSON in params
      assert.equal(typeof insertCall.params[7], 'string');
      assert.ok(insertCall.params[7].includes('Exynos'));

      // 3. update (with partial undefined field and snake_case column support)
      const updated = await adapter.update('p_new', { name: 'Updated Name', price: 25000000, image: undefined, old_price: 27000000 });
      assert.ok(updated);
      const updateCall = executedQueries.find((q) => q.sql.includes('UPDATE products'));
      assert.ok(updateCall);
      assert.ok(updateCall.sql.includes('updated_at = NOW()'));
      assert.ok(updateCall.sql.includes('old_price = $'));
      assert.ok(!updateCall.sql.includes('image ='));

      // 4. buildWhere with undefined values
      const whereRes = adapter.buildWhere({ brand: undefined, name: 'Apple' });
      assert.equal(whereRes.clause, 'WHERE name = $1');
      assert.deepEqual(whereRes.params, ['Apple']);

      // 5. count
      const count = await adapter.count({ brand: 'Apple' });
      assert.equal(count, 42);

      // 6. delete
      const deleted = await adapter.delete('p_new');
      assert.equal(deleted, true);

      // 7. verify errors are rethrown (never swallowed on connection error)
      db.query = async () => {
        throw new Error('Simulated PG connection refusal');
      };
      await assert.rejects(async () => {
        await adapter.findById('err_id');
      }, /Simulated PG connection refusal/);

      // 8. verify null db.query returns throw properly
      db.query = async () => null;
      await assert.rejects(async () => {
        await adapter.findById('err_id');
      }, /Database query returned null/);
      await assert.rejects(async () => {
        await adapter.delete('err_id');
      }, /Database query returned null/);
      await assert.rejects(async () => {
        await adapter.count();
      }, /Database query returned null/);
    } finally {
      db.query = originalQuery;
    }
  });

  test('Schema normalizers map snake_case and camelCase rows to normalized domain objects', () => {
    // 1. Product normalizer
    const normProd = schemas.productSchema.normalize({
      id: 'p1',
      name: 'Phone 1',
      brand: 'BrandA',
      price: '12000000',
      old_price: '14000000',
      specs: '6.7 inch',
      detailed_specs: '{"screen":"OLED"}',
      ai_review: '{"summary":"Tốt"}',
      ai_enriched_at: '2026-11-01T00:00:00Z',
      image: 'http://img.jpg',
      created_at: '2026-10-01T00:00:00Z',
      updated_at: '2026-11-01T00:00:00Z'
    });
    assert.equal(normProd.price, 12000000);
    assert.equal(normProd.oldPrice, 14000000);
    assert.equal(normProd.detailedSpecs.screen, 'OLED');
    assert.equal(normProd.aiReview.summary, 'Tốt');
    assert.equal(normProd.aiEnrichedAt, '2026-11-01T00:00:00Z');

    // 2. Order normalizer
    const normOrder = schemas.orderSchema.normalize({
      id: 'ORD_1',
      customer_id: 'CUST_1',
      customer_info: '{"phone":"0901234567"}',
      items: '[{"id":"p1","quantity":1}]',
      total_amount: '12000000',
      status: 'pending',
      payment_method: 'cod',
      payment_status: 'unpaid',
      payment_ref: 'PAY_1',
      payment_expires_at: null,
      stats_synced: false,
      admin_note: 'Giao nhanh',
      note: 'Trước 5h',
      status_history: '[{"status":"pending"}]',
      created_at: '2026-11-01T00:00:00Z',
      updated_at: '2026-11-01T00:00:00Z'
    });
    assert.equal(normOrder.customerId, 'CUST_1');
    assert.equal(normOrder.customerInfo.phone, '0901234567');
    assert.equal(normOrder.items.length, 1);
    assert.equal(normOrder.totalAmount, 12000000);
    assert.equal(normOrder.adminNote, 'Giao nhanh');

    // 3. Customer normalizer
    const normCust = schemas.customerSchema.normalize({
      id: 'CUST_1',
      full_name: 'Nguyễn Văn A',
      phone: '0901234567',
      password_hash: 'hash123',
      email: 'a@example.com',
      address: 'Hà Nội',
      note: 'VIP khách',
      admin_note: '',
      tag: 'VIP',
      wishlist: '["p1","p2"]',
      visit_count: '5',
      order_count: '2',
      total_spent: '24000000',
      last_visited: '2026-11-01T00:00:00Z',
      last_order_at: '2026-11-01T00:00:00Z',
      created_at: '2026-10-01T00:00:00Z',
      updated_at: '2026-11-01T00:00:00Z'
    });
    assert.equal(normCust.fullName, 'Nguyễn Văn A');
    assert.deepEqual(normCust.wishlist, ['p1', 'p2']);
    assert.equal(normCust.visitCount, 5);
    assert.equal(normCust.orderCount, 2);
    assert.equal(normCust.totalSpent, 24000000);

    // 4. Admin normalizer
    const normAdmin = schemas.adminSchema.normalize({
      id: 'admin_1',
      username: 'admin',
      password_hash: 'adminhash',
      full_name: 'Admin User',
      email: 'admin@techstore.vn',
      role: 'Super Admin',
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z'
    });
    assert.equal(normAdmin.username, 'admin');
    assert.equal(normAdmin.passwordHash, 'adminhash');
    assert.equal(normAdmin.role, 'Super Admin');
  });

  test('Domain models (Product, Order, Customer, Admin) seamlessly operate through seam in Postgres mode', async () => {
    const ProductModel = require('../src/models/Product');
    const OrderModel = require('../src/models/Order');
    const CustomerModel = require('../src/models/Customer');
    const AdminModel = require('../src/models/Admin');

    const originalIsPostgres = db.isPostgres;
    const originalQuery = db.query;

    db.isPostgres = () => true;

    const mockOrders = new Map();
    const mockCustomers = new Map();
    const mockProducts = new Map();
    const mockAdmins = new Map();

    const crypto = require('crypto');
    mockAdmins.set('admin', {
      id: 'admin_pg',
      username: 'admin',
      password_hash: crypto.createHash('sha256').update('secret123').digest('hex'),
      full_name: 'Postgres Admin',
      email: 'pgadmin@store.vn',
      role: 'Super Admin',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    db.query = async (sql, params) => {
      // Mock Product create
      if (sql.includes('INSERT INTO products')) {
        const row = {
          id: params[0],
          name: params[1],
          brand: params[2],
          price: params[3],
          old_price: params[4],
          specs: params[5],
          image: params[6],
          detailed_specs: params[7],
          ai_review: params[8],
          ai_enriched_at: params[9],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        mockProducts.set(row.id, row);
        return { rows: [row] };
      }
      if (sql.includes('SELECT * FROM products WHERE id = $1')) {
        const row = mockProducts.get(params[0]);
        return { rows: row ? [row] : [] };
      }
      // Mock Customer register/create
      if (sql.includes('INSERT INTO customers')) {
        const row = {
          id: params[0],
          full_name: params[1],
          phone: params[2],
          password_hash: params[3],
          email: params[4],
          address: params[5],
          note: params[6],
          admin_note: params[7],
          tag: params[8],
          wishlist: '[]',
          visit_count: 1,
          order_count: 0,
          total_spent: 0,
          last_visited: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        mockCustomers.set(row.phone, row);
        mockCustomers.set(row.id, row);
        return { rows: [row] };
      }
      if (sql.includes('SELECT * FROM customers WHERE phone = $1')) {
        const row = mockCustomers.get(params[0]);
        return { rows: row ? [row] : [] };
      }
      if (sql.includes('SELECT * FROM customers WHERE id = $1')) {
        const row = mockCustomers.get(params[0]);
        return { rows: row ? [row] : [] };
      }
      // Mock Order create
      if (sql.includes('INSERT INTO orders')) {
        const row = {
          id: params[0],
          customer_id: params[1],
          customer_info: params[2],
          items: params[3],
          total_amount: params[4],
          status: params[5],
          payment_method: params[6],
          payment_status: params[7],
          payment_ref: params[8],
          payment_expires_at: params[9],
          stats_synced: false,
          admin_note: '',
          note: params[10],
          status_history: params[11],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        mockOrders.set(row.id, row);
        return { rows: [row] };
      }
      if (sql.includes('SELECT * FROM orders WHERE id = $1')) {
        const row = mockOrders.get(params[0]);
        return { rows: row ? [row] : [] };
      }
      if (sql.includes('UPDATE orders')) {
        const id = params[params.length - 1];
        const existing = mockOrders.get(id);
        if (existing) {
          const setMatch = sql.match(/SET([\s\S]+?)WHERE/i);
          if (setMatch) {
            const assignments = setMatch[1].split(',').map((s) => s.trim());
            assignments.forEach((assign) => {
              const m = assign.match(/([a-z_]+)\s*=\s*\$(\d+)/i);
              if (m) {
                const col = m[1];
                const pIdx = parseInt(m[2], 10) - 1;
                existing[col] = params[pIdx];
              }
            });
          }
          return { rows: [existing] };
        }
        return { rows: [] };
      }
      if (sql.includes('SELECT * FROM orders WHERE payment_ref = $1')) {
        for (const o of mockOrders.values()) {
          if (o.payment_ref === params[0]) return { rows: [o] };
        }
        return { rows: [] };
      }
      if (sql.includes('WHERE customer_id = $1')) {
        const list = [];
        for (const o of mockOrders.values()) {
          if (o.customer_id === params[0]) list.push(o);
        }
        return { rows: list };
      }
      if (sql.includes('UPDATE customers')) {
        const id = params[params.length - 1];
        const existing = mockCustomers.get(id);
        if (existing) {
          const setMatch = sql.match(/SET([\s\S]+?)WHERE/i);
          if (setMatch) {
            const assignments = setMatch[1].split(',').map((s) => s.trim());
            assignments.forEach((assign) => {
              const m = assign.match(/([a-z_]+)\s*=\s*\$(\d+)/i);
              if (m) {
                const col = m[1];
                const pIdx = parseInt(m[2], 10) - 1;
                existing[col] = params[pIdx];
              }
            });
          }
          return { rows: [existing] };
        }
        return { rows: [] };
      }
      if (sql.includes('UPDATE products')) {
        const id = params[params.length - 1];
        const existing = mockProducts.get(id);
        if (existing) {
          const setMatch = sql.match(/SET([\s\S]+?)WHERE/i);
          if (setMatch) {
            const assignments = setMatch[1].split(',').map((s) => s.trim());
            assignments.forEach((assign) => {
              const m = assign.match(/([a-z_]+)\s*=\s*\$(\d+)/i);
              if (m) {
                const col = m[1];
                const pIdx = parseInt(m[2], 10) - 1;
                existing[col] = params[pIdx];
              }
            });
          }
          return { rows: [existing] };
        }
        return { rows: [] };
      }
      if (sql.includes('DELETE FROM products WHERE id = $1')) {
        mockProducts.delete(params[0]);
        return { rowCount: 1 };
      }
      if (sql.includes('WHERE ai_enriched_at IS NULL')) {
        const list = [];
        for (const p of mockProducts.values()) {
          if (!p.ai_enriched_at) list.push(p);
        }
        return { rows: list };
      }
      if (sql.includes('UPDATE admins')) {
        const existing = mockAdmins.get('admin');
        if (existing) {
          existing.password_hash = params[0];
          return { rows: [existing] };
        }
        return { rows: [] };
      }
      // Mock Admin
      if (sql.includes('SELECT * FROM admins WHERE LOWER(username) = LOWER($1)')) {
        const row = mockAdmins.get(params[0].toLowerCase());
        return { rows: row ? [row] : [] };
      }
      return { rows: [] };
    };

    try {
      // 1. ProductModel in Postgres mode: create, getById, update, delete
      const prod = await ProductModel.create({
        name: 'PG Model Test',
        brand: 'PGBrand',
        price: 19000000
      });
      assert.ok(prod.id);
      const fetchedProd = await ProductModel.getById(prod.id);
      assert.equal(fetchedProd.name, 'PG Model Test');

      const updatedProd = await ProductModel.update(prod.id, { price: 21000000 });
      assert.equal(updatedProd.price, 21000000);

      // 2. CustomerModel in Postgres mode: register, remember, wishlist, syncOrderStats
      const cust = await CustomerModel.register({
        fullName: 'PG Customer',
        phone: '0988776655',
        password: 'password123'
      });
      assert.equal(cust.fullName, 'PG Customer');
      assert.equal(cust.phone, '0988776655');

      const wishlistResult = await CustomerModel.toggleWishlist(cust.id, prod.id);
      assert.equal(wishlistResult.added, true);
      assert.ok(wishlistResult.wishlist.includes(prod.id));

      // 3. OrderModel in Postgres mode: create, findById, updateStatus -> completed, findByCustomerId
      const order = await OrderModel.createOrder({
        customerId: cust.id,
        customerInfo: { fullName: cust.fullName, phone: cust.phone },
        items: [{ id: prod.id, price: 21000000, quantity: 1 }],
        totalAmount: 21000000,
        paymentMethod: 'cod'
      });
      assert.ok(order.id);
      const fetchedOrder = await OrderModel.findById(order.id);
      assert.equal(fetchedOrder.totalAmount, 21000000);

      // Update order to completed -> customer stats synced
      const completedOrder = await OrderModel.updateStatus(order.id, 'completed', 'Giao xong');
      assert.equal(completedOrder.status, 'completed');
      assert.equal(completedOrder.paymentStatus, 'paid');
      assert.equal(completedOrder.statsSynced, true);

      const custAfterOrder = await CustomerModel.findById(cust.id);
      assert.equal(custAfterOrder.orderCount, 1);
      assert.equal(custAfterOrder.totalSpent, 21000000);
      assert.equal(custAfterOrder.tag, 'Thân thiết');

      // findByCustomerId
      const custOrders = await OrderModel.findByCustomerId(cust.id);
      assert.equal(custOrders.length, 1);
      assert.equal(custOrders[0].id, order.id);

      // 4. AdminModel in Postgres mode: verify, changePassword
      const admin = await AdminModel.verify('admin', 'secret123');
      assert.ok(admin);
      assert.equal(admin.username, 'admin');

      const changePass = await AdminModel.changePassword('admin', 'secret123', 'newsecret456');
      assert.equal(changePass.success, true);
      const adminNewPass = await AdminModel.verify('admin', 'newsecret456');
      assert.ok(adminNewPass);

      // Clean up product
      const deletedProd = await ProductModel.delete(prod.id);
      assert.equal(deletedProd, true);
    } finally {
      db.isPostgres = originalIsPostgres;
      db.query = originalQuery;
    }
  });

  test('ProductModel.getById deep clones cached items to guarantee cache immutability', async () => {
    const ProductModel = require('../src/models/Product');
    await ProductModel.getAll(); // warm cache

    const p1 = await ProductModel.getById('gearhub_clean_cool');
    assert.ok(p1);
    if (p1.detailedSpecs) {
      const originalType = p1.detailedSpecs.type;
      p1.detailedSpecs.type = 'ATTACK_MUTATION_ATTEMPT';

      const p2 = await ProductModel.getById('gearhub_clean_cool');
      assert.equal(p2.detailedSpecs.type, originalType);
      assert.notEqual(p2.detailedSpecs.type, 'ATTACK_MUTATION_ATTEMPT');
    }
  });

  test('OrderModel.processPaymentWebhook resolves order by paymentRef via targeted findOne', async () => {
    const OrderModel = require('../src/models/Order');
    const order = await OrderModel.createOrder({
      customerInfo: { fullName: 'Target QR', phone: '0911223344' },
      items: [{ id: 'p1', price: 1000000, quantity: 1 }],
      totalAmount: 1000000,
      paymentMethod: 'qr'
    });

    // Lookup by paymentRef only without orderId
    const res = await OrderModel.processPaymentWebhook({
      paymentRef: order.paymentRef,
      action: 'confirm'
    });
    assert.equal(res.success, true);
    assert.equal(res.order.paymentStatus, 'paid');
    assert.equal(res.order.status, 'confirmed');

    await OrderModel.deleteOrder(order.id);
  });

  test('initDatabase seeds products preserving detailed_specs and ai_review with non-destructive conflict handling', async () => {
    const originalPool = db.pool;
    const originalIsPostgres = db.isPostgres;

    const executedSql = [];
    const mockClient = {
      query: async (sql, params) => {
        executedSql.push({ sql: sql.replace(/\s+/g, ' ').trim(), params });
        if (sql.includes('SELECT COUNT(*) FROM admins')) {
          return { rows: [{ count: '1' }] };
        }
        return { rows: [] };
      },
      release: () => {}
    };

    db.pool = {
      connect: async () => mockClient,
      query: async (sql, params) => mockClient.query(sql, params)
    };
    db.isPostgres = () => true;

    try {
      const initialized = await db.initDatabase();
      assert.equal(initialized, true);

      // Verify product seed SQL contains conflict resolution preserving ai enrichment
      const seedCall = executedSql.find((q) => q.sql.includes('INSERT INTO products'));
      assert.ok(seedCall, 'Must execute INSERT INTO products');
      assert.ok(seedCall.sql.includes('ON CONFLICT (id) DO UPDATE SET'));
      assert.ok(seedCall.sql.includes('detailed_specs = COALESCE(products.detailed_specs, EXCLUDED.detailed_specs)'));
      assert.ok(seedCall.sql.includes('ai_review = COALESCE(products.ai_review, EXCLUDED.ai_review)'));
      assert.ok(seedCall.sql.includes('ai_enriched_at = COALESCE(products.ai_enriched_at, EXCLUDED.ai_enriched_at)'));
    } finally {
      db.pool = originalPool;
      db.isPostgres = originalIsPostgres;
    }
  });
});

