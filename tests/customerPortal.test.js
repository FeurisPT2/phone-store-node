process.env.NODE_ENV = 'test';
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');
const app = require('../server');
const OrderModel = require('../src/models/Order');
const CustomerModel = require('../src/models/Customer');

describe('Customer Self-Service Portal: Guest Tracking, Profile Update, Wishlist & Cancellation Rules', () => {
  let server;
  let baseUrl;
  let custCookie;
  let testPhone = '0977665544';
  let testOrderId;

  before(async () => {
    await new Promise((resolve) => {
      server = http.createServer(app);
      server.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://localhost:${port}`;
        resolve();
      });
    });

    const existing = await CustomerModel.findByPhone(testPhone);
    if (existing) {
      await CustomerModel.deleteCustomer(existing.id);
    }

    const regRes = await fetch(`${baseUrl}/api/customers/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Lê Thị Portal',
        phone: testPhone,
        password: 'password123',
        email: 'portal@example.com',
        address: '456 Lê Lợi, Quận 1'
      })
    });
    const setCookie = regRes.headers.get('set-cookie');
    if (setCookie) custCookie = setCookie.split(';')[0];
  });

  after(async () => {
    if (testOrderId) {
      await OrderModel.deleteOrder(testOrderId);
    }
    const existing = await CustomerModel.findByPhone(testPhone);
    if (existing) {
      await CustomerModel.deleteCustomer(existing.id);
    }
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  test('GET /customer-portal returns 200 and serves the storefront with Customer Portal modal', async () => {
    const res = await fetch(`${baseUrl}/customer-portal`);
    assert.equal(res.status, 200);
    const html = await res.text();
    assert.ok(html.includes('GearHub') || html.includes('TechStore'));
  });

  test('PUT /api/customers/profile updates default address and POST /api/customers/wishlist toggles wishlist items', async () => {
    const updateRes = await fetch(`${baseUrl}/api/customers/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Cookie: custCookie },
      body: JSON.stringify({
        fullName: 'Lê Thị Portal VIP',
        address: '789 Điện Biên Phủ, Quận 3, TP.HCM',
        email: 'portal.vip@example.com'
      })
    });
    assert.equal(updateRes.status, 200);
    const updateData = await updateRes.json();
    assert.equal(updateData.success, true);
    assert.equal(updateData.customer.address, '789 Điện Biên Phủ, Quận 3, TP.HCM');

    // Toggle wishlist item ON
    const wishAddRes = await fetch(`${baseUrl}/api/customers/wishlist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: custCookie },
      body: JSON.stringify({ productId: 'p1' })
    });
    assert.equal(wishAddRes.status, 200);
    const wishAddData = await wishAddRes.json();
    assert.equal(wishAddData.success, true);
    assert.ok(wishAddData.wishlist.includes('p1'));

    // GET wishlist
    const wishGetRes = await fetch(`${baseUrl}/api/customers/wishlist`, {
      headers: { Cookie: custCookie }
    });
    assert.equal(wishGetRes.status, 200);
    const wishGetData = await wishGetRes.json();
    assert.equal(wishGetData.success, true);
    assert.ok(wishGetData.wishlist.includes('p1'));

    // Toggle wishlist item OFF
    const wishRemRes = await fetch(`${baseUrl}/api/customers/wishlist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: custCookie },
      body: JSON.stringify({ productId: 'p1' })
    });
    const wishRemData = await wishRemRes.json();
    assert.ok(!wishRemData.wishlist.includes('p1'));
  });

  test('Guest Order Lookup (Phone + Order ID) and Customer Order Cancellation rules', async () => {
    // Create an order
    const checkoutRes = await fetch(`${baseUrl}/api/orders/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: custCookie },
      body: JSON.stringify({
        fullName: 'Lê Thị Portal VIP',
        phone: testPhone,
        address: '789 Điện Biên Phủ, Quận 3, TP.HCM',
        paymentMethod: 'cod',
        items: [{ id: 'p1', name: 'iPhone 16', price: 20000000, quantity: 1 }]
      })
    });
    const checkoutData = await checkoutRes.json();
    testOrderId = checkoutData.orderId;
    assert.equal(checkoutData.customer.passwordHash, undefined, 'Checkout response must never expose passwordHash');

    // Regression: Calling QR sandbox webhook on a COD order must be rejected with 400
    const codWebhook = await fetch(`${baseUrl}/api/payments/sandbox-webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId: testOrderId, action: 'confirm' })
    });
    assert.equal(codWebhook.status, 400);

    // Guest lookup with wrong phone -> 404
    const badTrack = await fetch(`${baseUrl}/api/orders/track?orderId=${testOrderId}&phone=0900000000`);
    assert.equal(badTrack.status, 404);

    // Guest lookup with matching phone -> 200 + statusHistory
    const goodTrack = await fetch(`${baseUrl}/api/orders/track?orderId=${testOrderId}&phone=${testPhone}`);
    assert.equal(goodTrack.status, 200);
    const goodTrackData = await goodTrack.json();
    assert.equal(goodTrackData.success, true);
    assert.equal(goodTrackData.order.id, testOrderId);
    assert.ok(Array.isArray(goodTrackData.order.statusHistory));

    // Customer cancels pending order -> 200
    const cancelRes = await fetch(`${baseUrl}/api/orders/${testOrderId}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: custCookie },
      body: JSON.stringify({ phone: testPhone, reason: 'Đổi ý chọn màu khác' })
    });
    assert.equal(cancelRes.status, 200);
    const cancelData = await cancelRes.json();
    assert.equal(cancelData.order.status, 'cancelled');

    // Move order to shipping and verify customer cancellation is blocked (400)
    await OrderModel.updateStatus(testOrderId, 'shipping', 'Đang giao');
    const blockedCancel = await fetch(`${baseUrl}/api/orders/${testOrderId}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: custCookie },
      body: JSON.stringify({ phone: testPhone })
    });
    assert.equal(blockedCancel.status, 400);
  });

  test('Safe Customer Projection at the seam: CustomerModel methods, Admin CRM endpoints, and customerMemory never leak passwordHash', async () => {
    // 1. Direct model methods must never return passwordHash
    const byPhone = await CustomerModel.findByPhone(testPhone);
    assert.ok(byPhone);
    assert.equal(byPhone.passwordHash, undefined, 'findByPhone must not expose passwordHash');

    const byId = await CustomerModel.findById(byPhone.id);
    assert.ok(byId);
    assert.equal(byId.passwordHash, undefined, 'findById must not expose passwordHash');

    const allCustomers = await CustomerModel.getAll();
    assert.ok(allCustomers.length > 0);
    assert.ok(
      allCustomers.every((c) => c.passwordHash === undefined),
      'getAll must strip passwordHash from every customer'
    );

    const synced = await CustomerModel.syncOrderStats(byPhone.id, 1000000);
    assert.ok(synced);
    assert.equal(synced.passwordHash, undefined, 'syncOrderStats must not expose passwordHash');

    // 2. Verify login still works after findByPhone strips passwordHash on public projection
    const loggedIn = await CustomerModel.login({ phone: testPhone, password: 'password123' });
    assert.ok(loggedIn);
    assert.equal(loggedIn.passwordHash, undefined, 'login must not expose passwordHash');

    // 3. Verify Admin endpoints never leak passwordHash
    const adminLoginRes = await fetch(`${baseUrl}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin123' })
    });
    const adminCookie = (adminLoginRes.headers.get('set-cookie') || '').split(';')[0];

    const adminCustListRes = await fetch(`${baseUrl}/api/admin/customers`, {
      headers: { Cookie: adminCookie }
    });
    const adminCustListData = await adminCustListRes.json();
    assert.equal(adminCustListData.success, true);
    assert.ok(
      adminCustListData.data.every((c) => c.passwordHash === undefined),
      'GET /api/admin/customers must never leak passwordHash'
    );

    const adminCustDetailRes = await fetch(`${baseUrl}/api/admin/customers/${byPhone.id}`, {
      headers: { Cookie: adminCookie }
    });
    const adminCustDetailData = await adminCustDetailRes.json();
    assert.equal(adminCustDetailData.success, true);
    assert.equal(
      adminCustDetailData.data.customer.passwordHash,
      undefined,
      'GET /api/admin/customers/:id must never leak passwordHash'
    );

    const adminStatsRes = await fetch(`${baseUrl}/api/admin/stats`, {
      headers: { Cookie: adminCookie }
    });
    const adminStatsData = await adminStatsRes.json();
    assert.equal(adminStatsData.success, true);
    assert.ok(
      adminStatsData.data.topCustomers.every((c) => c.passwordHash === undefined),
      'GET /api/admin/stats topCustomers must never leak passwordHash'
    );

    // 4. Verify customerMemory middleware sanitizes legacy session customer containing passwordHash
    const customerMemory = require('../src/middlewares/customerMemory');
    const mockReq = {
      session: { customer: { id: 'c_legacy', fullName: 'Legacy User', passwordHash: 'secret_hash' } },
      cookies: {}
    };
    await new Promise((resolve) => customerMemory(mockReq, {}, resolve));
    assert.equal(mockReq.session.customer.passwordHash, undefined);
    assert.equal(mockReq.currentCustomer.passwordHash, undefined);
  });

  test('Customer Settings Page & Change Password workflow', async () => {
    // 1. Verify GET /settings and GET /profile returns 200 HTML
    const settingsRes = await fetch(`${baseUrl}/settings`);
    assert.equal(settingsRes.status, 200);
    const settingsHtml = await settingsRes.text();
    assert.ok(settingsHtml.includes('Cài Đặt Tài Khoản · GearHub'));

    const profileRes = await fetch(`${baseUrl}/profile`);
    assert.equal(profileRes.status, 200);

    // 2. Unauthenticated change-password returns 401
    const unauthRes = await fetch(`${baseUrl}/api/customers/change-password`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ oldPassword: 'password123', newPassword: 'newpassword456' })
    });
    assert.equal(unauthRes.status, 401);

    // 3. Authenticated change-password with wrong oldPassword returns 400
    const wrongOldRes = await fetch(`${baseUrl}/api/customers/change-password`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Cookie: custCookie
      },
      body: JSON.stringify({ oldPassword: 'wrongpass', newPassword: 'newpassword456' })
    });
    assert.equal(wrongOldRes.status, 400);

    // 4. Authenticated change-password with valid credentials succeeds
    const changeRes = await fetch(`${baseUrl}/api/customers/change-password`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Cookie: custCookie
      },
      body: JSON.stringify({ oldPassword: 'password123', newPassword: 'newpassword456' })
    });
    const changeData = await changeRes.json();
    assert.equal(changeRes.status, 200);
    assert.equal(changeData.success, true);

    // 5. Verify customer can login with new password
    const newLoginRes = await fetch(`${baseUrl}/api/customers/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: testPhone, password: 'newpassword456' })
    });
    const newLoginData = await newLoginRes.json();
    assert.equal(newLoginRes.status, 200);
    assert.equal(newLoginData.success, true);
  });
});
