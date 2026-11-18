process.env.NODE_ENV = 'test';
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');
const app = require('../server');
const ProductModel = require('../src/models/Product');

describe('Admin AI Enrichment & Self-Healing Routes', () => {
  let server;
  let baseUrl;
  let adminCookie;
  let testProductId;

  before(async () => {
    // Tạo 1 sản phẩm chưa được enrich để test
    const testProd = await ProductModel.create({
      name: 'Xiaomi 14 Pro Test Phone',
      price: 18990000,
      brand: 'Xiaomi',
      description: 'Màn hình 6.73 inch 120Hz 12GB+256GB pin 4880mAh camera 50MP Leica',
      stock: 10,
      image: '/images/xiaomi14.jpg'
    });
    testProductId = testProd.id;

    await new Promise((resolve) => {
      server = http.createServer(app);
      server.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://localhost:${port}`;
        resolve();
      });
    });

    // Login admin
    const loginRes = await fetch(`${baseUrl}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin123' })
    });
    const setCookie = loginRes.headers.get('set-cookie');
    if (setCookie) {
      adminCookie = setCookie.split(';')[0];
    }
  });

  after(async () => {
    if (testProductId) {
      await ProductModel.delete(testProductId);
    }
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  test('POST /api/admin/products/:id/enrich returns 401 if unauthenticated', async () => {
    const res = await fetch(`${baseUrl}/api/admin/products/${testProductId}/enrich`, {
      method: 'POST'
    });
    assert.equal(res.status, 401);
  });

  test('POST /api/admin/products/:id/enrich enriches product with specs & review', async () => {
    const res = await fetch(`${baseUrl}/api/admin/products/${testProductId}/enrich`, {
      method: 'POST',
      headers: {
        'Cookie': adminCookie
      }
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(data.product.detailedSpecs, 'Should have detailedSpecs');
    assert.ok(data.product.aiReview, 'Should have aiReview');
    assert.ok(data.product.aiEnrichedAt, 'Should have aiEnrichedAt timestamp');
  });

  test('POST /api/admin/products/self-heal enriches batch of unenriched products', async () => {
    const res = await fetch(`${baseUrl}/api/admin/products/self-heal`, {
      method: 'POST',
      headers: {
        'Cookie': adminCookie,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ limit: 5 })
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(typeof data.count === 'number');
  });
});
