process.env.NODE_ENV = 'test';
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');
const app = require('../server');
const ProductModel = require('../src/models/Product');

describe('Full E2E Flow: Catalog -> AI Enrichment -> Storefront Chat Grounding', () => {
  let server;
  let baseUrl;
  let adminCookie;
  let createdId;

  before(async () => {
    // 1. Tạo một sản phẩm mới tinh chưa làm giàu
    const p = await ProductModel.create({
      name: 'Sony Xperia 1 VI 5G 256GB',
      brand: 'Sony',
      price: 26990000,
      description: 'Màn hình OLED 6.5 inch 120Hz Snapdragon 8 Gen 3 RAM 12GB ROM 256GB pin 5000mAh camera 48MP zoom quang',
      image: 'https://example.com/xperia.jpg'
    });
    createdId = p.id;

    // 2. Khởi động server
    await new Promise((resolve) => {
      server = http.createServer(app);
      server.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://localhost:${port}`;
        resolve();
      });
    });

    // 3. Đăng nhập Admin
    const loginRes = await fetch(`${baseUrl}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin123' })
    });
    const setCookie = loginRes.headers.get('set-cookie');
    if (setCookie) adminCookie = setCookie.split(';')[0];
  });

  after(async () => {
    if (createdId) await ProductModel.delete(createdId);
    if (server) await new Promise((resolve) => server.close(resolve));
  });

  test('Step 1: Admin enriches product via API', async () => {
    const res = await fetch(`${baseUrl}/api/admin/products/${createdId}/enrich`, {
      method: 'POST',
      headers: { 'Cookie': adminCookie }
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(data.product.detailedSpecs.screen);
    assert.ok(data.product.aiReview.summary);
  });

  test('Step 2: Customer retrieves product with enriched detailedSpecs & aiReview', async () => {
    const res = await fetch(`${baseUrl}/api/products/${createdId}`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(data.data.detailedSpecs);
    assert.ok(data.data.aiReview);
  });

  test('Step 3: Customer asks AI chat widget and gets grounded advice with product suggestion', async () => {
    const res = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Tư vấn cho tôi điện thoại Sony cao cấp chụp ảnh đẹp' })
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(data.reply);
    assert.ok(Array.isArray(data.suggestedProducts));
  });
});
