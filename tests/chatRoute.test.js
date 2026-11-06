process.env.NODE_ENV = 'test';
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');
const app = require('../server');
const geminiService = require('../src/services/geminiService');

describe('AI Consultant & Chat Route', () => {
  let server;
  let baseUrl;

  before(async () => {
    await new Promise((resolve) => {
      server = http.createServer(app);
      server.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://localhost:${port}`;
        resolve();
      });
    });
  });

  after(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  test('geminiService.consultCustomer with mock client parses AI response and recommendations', async () => {
    const mockClient = {
      models: {
        generateContent: async () => ({
          text: JSON.stringify({
            reply: 'Chào bạn, với ngân sách 15 triệu, chiếc iPhone 13 128GB là lựa chọn tuyệt vời với camera sắc nét và pin bền bỉ.',
            suggestedProductIds: [1]
          })
        })
      }
    };

    const mockCatalog = [
      { id: 1, name: 'iPhone 13 128GB', price: 14500000, brand: 'Apple' },
      { id: 2, name: 'Samsung Galaxy S23 FE', price: 12990000, brand: 'Samsung' }
    ];

    const result = await geminiService.consultCustomer({
      message: 'Tư vấn cho tôi điện thoại chụp ảnh đẹp tầm 15 triệu',
      catalog: mockCatalog,
      client: mockClient
    });

    assert.ok(result.reply.includes('iPhone 13'));
    assert.deepEqual(result.suggestedProductIds, [1]);
  });

  test('geminiService.consultCustomer falls back gracefully when no API client or key', async () => {
    const origKey = process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY;

    try {
      const mockCatalog = [
        { id: 10, name: 'Samsung Galaxy A54 5G', price: 7990000, brand: 'Samsung' },
        { id: 11, name: 'iPhone 11 64GB', price: 8990000, brand: 'Apple' }
      ];

      const result = await geminiService.consultCustomer({
        message: 'Tôi muốn mua máy Samsung giá dưới 10 triệu',
        catalog: mockCatalog
      });

      assert.ok(result.reply, 'Should have a reply');
      assert.ok(result.suggestedProductIds.includes(10), 'Should suggest the Samsung phone');
    } finally {
      if (origKey) process.env.GEMINI_API_KEY = origKey;
    }
  });

  test('POST /api/chat returns 400 when message is missing', async () => {
    const res = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });

    assert.equal(res.status, 400);
    const data = await res.json();
    assert.equal(data.success, false);
  });

  test('POST /api/chat returns 200 with reply and suggestedProducts', async () => {
    const res = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Tư vấn điện thoại iPhone' })
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(typeof data.reply === 'string');
    assert.ok(Array.isArray(data.suggestedProducts));
  });

  test('POST /api/chat gracefully returns 200 with friendly fallback when an unexpected service error occurs (never 500)', async () => {
    const origConsult = geminiService.consultCustomer;
    geminiService.consultCustomer = async () => {
      throw new Error('Simulated network or service crash');
    };

    try {
      const res = await fetch(`${baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Tư vấn điện thoại giá tốt' })
      });

      assert.equal(res.status, 200, 'Must never return 500');
      const data = await res.json();
      assert.equal(data.success, true);
      assert.ok(typeof data.reply === 'string');
      assert.ok(Array.isArray(data.suggestedProducts));
    } finally {
      geminiService.consultCustomer = origConsult;
    }
  });
});
