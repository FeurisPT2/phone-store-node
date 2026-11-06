process.env.NODE_ENV = 'test';
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');
const app = require('../server');

describe('Deployment Readiness & Unified Login Portal', () => {
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
    if (server) await new Promise((resolve) => server.close(resolve));
  });

  test('GET /api/health returns 200 with ok status and database mode', async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.status, 'ok');
    assert.ok(data.database === 'neon-postgres' || data.database === 'json-db');
    assert.ok(typeof data.uptime === 'number');
    assert.ok(data.timestamp);
  });

  test('GET /login returns 200 and renders the dual login portal', async () => {
    const res = await fetch(`${baseUrl}/login`);
    assert.equal(res.status, 200);
    const html = await res.text();
    assert.ok(html.includes('Cổng Đăng Nhập'));
    assert.ok(html.includes('tab-btn-customer'));
    assert.ok(html.includes('tab-btn-admin'));
  });

  test('POST /api/customers/login with valid customer logs in successfully', async () => {
    const res = await fetch(`${baseUrl}/api/customers/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '0901112233', password: '123456' })
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.customer.phone, '0901112233');
  });

  test('POST /api/admin/login with admin credentials logs in successfully', async () => {
    const res = await fetch(`${baseUrl}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin123' })
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.admin.username, 'admin');
  });
});
