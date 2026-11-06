process.env.NODE_ENV = 'test';
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');
const app = require('../server');
const ProductModel = require('../src/models/Product');

describe('Admin AI Data Update Boundary', () => {
  let server;
  let baseUrl;
  let adminCookie;
  let testProductId;

  before(async () => {
    const prod = await ProductModel.create({
      name: 'Samsung Galaxy S25 Test Edit',
      brand: 'Samsung',
      price: 22000000,
      specs: '6.2 inch 120Hz'
    });
    testProductId = prod.id;

    await new Promise((resolve) => {
      server = http.createServer(app);
      server.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://localhost:${port}`;
        resolve();
      });
    });

    const loginRes = await fetch(`${baseUrl}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin123' })
    });
    const setCookie = loginRes.headers.get('set-cookie');
    if (setCookie) adminCookie = setCookie.split(';')[0];
  });

  after(async () => {
    if (testProductId) await ProductModel.delete(testProductId);
    if (server) await new Promise((resolve) => server.close(resolve));
  });

  test('PUT /api/admin/products/:id updates detailedSpecs and aiReview', async () => {
    const customSpecs = {
      chip: 'Snapdragon 8 Elite Gen 4',
      screen: '6.8 inch Dynamic AMOLED 2X 120Hz',
      ram: '16GB',
      storage: '512GB',
      battery: '5500mAh',
      camera: '200MP + 50MP + 50MP',
      charging: '65W SuperFast',
      os: 'Android 15 One UI 7'
    };

    const customReview = {
      summary: 'Phiên bản chỉnh sửa thủ công bởi Admin với chip rồng thế hệ mới.',
      pros: ['Hiệu năng đỉnh chóp', 'Tản nhiệt buồng hơi lớn hơn'],
      cons: ['Mặt lưng bóng dễ bám vân tay'],
      targetAudience: 'Game thủ và người dùng sáng tạo nội dung'
    };

    const res = await fetch(`${baseUrl}/api/admin/products/${testProductId}`, {
      method: 'PUT',
      headers: {
        'Cookie': adminCookie,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'Samsung Galaxy S25 Test Edit (Updated)',
        price: 23000000,
        detailedSpecs: customSpecs,
        aiReview: customReview
      })
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.data.detailedSpecs?.chip, 'Snapdragon 8 Elite Gen 4');
    assert.equal(data.data.aiReview?.summary, 'Phiên bản chỉnh sửa thủ công bởi Admin với chip rồng thế hệ mới.');
    assert.equal(data.data.aiReview?.pros?.length, 2);
  });
});
