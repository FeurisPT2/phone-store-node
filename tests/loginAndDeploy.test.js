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

  test('GET /login returns 200 and renders the unified login portal without demo boxes', async () => {
    const res = await fetch(`${baseUrl}/login`);
    assert.equal(res.status, 200);
    const html = await res.text();
    assert.ok(html.includes('Cổng Đăng Nhập'));
    assert.ok(html.includes('sub-login-btn'));
    assert.ok(html.includes('sub-reg-btn'));
    assert.ok(html.includes('cust-login-phone'));
    // Demo hint boxes must be completely removed
    assert.equal(html.includes('Tài khoản mẫu:'), false);
    assert.equal(html.includes('Quản trị mặc định:'), false);
  });

  test('POST /api/auth/login with admin credentials authenticates and returns role admin', async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'admin', password: 'admin123' })
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.role, 'admin');
    assert.equal(data.redirectUrl, '/admin');
    assert.equal(data.admin.username, 'admin');
  });

  test('POST /api/auth/login with customer credentials authenticates and returns role customer', async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: '0901112233', password: '123456' })
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.role, 'customer');
    assert.equal(data.redirectUrl, '/');
    assert.equal(data.customer.phone, '0901112233');
  });

  test('POST /api/auth/login with wrong password returns 401', async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'admin', password: 'wrongpassword' })
    });
    assert.equal(res.status, 401);
    const data = await res.json();
    assert.equal(data.success, false);
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

  test('Admin session recovery across serverless invocations via admin_token cookie', async () => {
    // 1. Login via unified auth
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'admin', password: 'admin123' })
    });
    assert.equal(loginRes.status, 200);
    const setCookie = loginRes.headers.get('set-cookie');
    assert.ok(setCookie.includes('admin_token='), 'Must set admin_token cookie');

    // Extract admin_token value
    const match = setCookie.match(/admin_token=([^;]+)/);
    assert.ok(match, 'admin_token match');
    const adminCookie = `admin_token=${match[1]}`;

    // 2. Access /admin without session cookie (simulating new serverless instance)
    const adminPageRes = await fetch(`${baseUrl}/admin`, {
      headers: { Cookie: adminCookie },
      redirect: 'manual'
    });
    assert.equal(adminPageRes.status, 200, '/admin should return 200 and not redirect to /login');
    const pageHtml = await adminPageRes.text();
    assert.ok(pageHtml.includes('Quản trị Pro Max') || pageHtml.includes('admin.html') || pageHtml.includes('dashboard'));

    // 3. Call /api/admin/me with only admin_token cookie
    const meRes = await fetch(`${baseUrl}/api/admin/me`, {
      headers: { Cookie: adminCookie }
    });
    assert.equal(meRes.status, 200);
    const meData = await meRes.json();
    assert.equal(meData.success, true);
    assert.equal(meData.admin.username, 'admin');
  });
});
