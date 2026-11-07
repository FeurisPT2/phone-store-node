process.env.NODE_ENV = 'test';
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');
const app = require('../server');
const OrderModel = require('../src/models/Order');
const CustomerModel = require('../src/models/Customer');

describe('QR Payment Sandbox, Lazy TTL Expiration & Admin Order Tiering Workflow', () => {
  let server;
  let baseUrl;
  let adminCookie;
  const createdOrderIds = [];
  let testCustomerPhone = '0919888777';
  let testCustomerId = null;

  before(async () => {
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

    const existing = await CustomerModel.findByPhone(testCustomerPhone);
    if (existing) {
      await CustomerModel.deleteCustomer(existing.id);
    }
  });

  after(async () => {
    for (const oid of createdOrderIds) {
      await OrderModel.deleteOrder(oid);
    }
    const cust = await CustomerModel.findByPhone(testCustomerPhone);
    if (cust) {
      await CustomerModel.deleteCustomer(cust.id);
    }
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  test('QR Checkout creates awaiting_payment order with 15m TTL, polls status, and confirms via sandbox webhook', async () => {
    const checkoutRes = await fetch(`${baseUrl}/api/orders/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Trần Văn QR',
        phone: testCustomerPhone,
        address: '123 Nguyễn Huệ, Quận 1, TP.HCM',
        paymentMethod: 'qr',
        items: [{ id: 'p1', name: 'iPhone 16 Pro Max 256GB', price: 28000000, quantity: 1 }]
      })
    });
    assert.equal(checkoutRes.status, 200);
    const checkoutData = await checkoutRes.json();
    assert.equal(checkoutData.success, true);
    assert.ok(checkoutData.orderId);
    createdOrderIds.push(checkoutData.orderId);
    testCustomerId = checkoutData.customer?.id;

    assert.equal(checkoutData.paymentMethod, 'qr');
    assert.equal(checkoutData.paymentStatus, 'awaiting_payment');
    assert.equal(checkoutData.paymentRef, `PAY_${checkoutData.orderId}`);
    assert.ok(checkoutData.paymentExpiresAt);

    // Poll payment status -> awaiting_payment
    const poll1 = await fetch(`${baseUrl}/api/orders/${checkoutData.orderId}/payment-status`);
    assert.equal(poll1.status, 200);
    const pollData1 = await poll1.json();
    assert.equal(pollData1.paymentStatus, 'awaiting_payment');
    assert.equal(pollData1.status, 'awaiting_payment');

    // Trigger Sandbox Webhook to confirm payment
    const webhookRes = await fetch(`${baseUrl}/api/payments/sandbox-webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: checkoutData.orderId,
        paymentRef: checkoutData.paymentRef,
        action: 'confirm'
      })
    });
    assert.equal(webhookRes.status, 200);
    const webhookData = await webhookRes.json();
    assert.equal(webhookData.success, true);
    assert.equal(webhookData.order.paymentStatus, 'paid');
    assert.equal(webhookData.order.status, 'confirmed');

    // Poll again -> paid & confirmed
    const poll2 = await fetch(`${baseUrl}/api/orders/${checkoutData.orderId}/payment-status`);
    const pollData2 = await poll2.json();
    assert.equal(pollData2.paymentStatus, 'paid');
    assert.equal(pollData2.status, 'confirmed');

    // Regression: Cancelling an already-paid QR order via webhook must be rejected with 400
    const cancelPaidWebhook = await fetch(`${baseUrl}/api/payments/sandbox-webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: checkoutData.orderId,
        paymentRef: checkoutData.paymentRef,
        action: 'cancel'
      })
    });
    assert.equal(cancelPaidWebhook.status, 400);
    const afterCancelAttempt = await OrderModel.findById(checkoutData.orderId);
    assert.equal(afterCancelAttempt.status, 'confirmed');
    assert.equal(afterCancelAttempt.paymentStatus, 'paid');
  });

  test('Lazy TTL expiration automatically cancels expired QR order on poll and blocks late webhook confirmation', async () => {
    const expiredOrder = await OrderModel.createOrder({
      customerId: testCustomerId,
      customerInfo: { fullName: 'Trần Văn QR', phone: testCustomerPhone, address: '123 Nguyễn Huệ' },
      items: [{ id: 'p2', name: 'Galaxy S25 Ultra', price: 25000000, quantity: 1 }],
      totalAmount: 25000000,
      paymentMethod: 'qr',
      paymentExpiresAt: new Date(Date.now() - 60 * 1000).toISOString() // Expired 1 minute ago
    });
    createdOrderIds.push(expiredOrder.id);

    const pollRes = await fetch(`${baseUrl}/api/orders/${expiredOrder.id}/payment-status`);
    assert.equal(pollRes.status, 200);
    const pollData = await pollRes.json();
    assert.equal(pollData.paymentStatus, 'expired');
    assert.equal(pollData.status, 'cancelled');

    // Late webhook must fail with 400
    const lateWebhook = await fetch(`${baseUrl}/api/payments/sandbox-webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: expiredOrder.id,
        paymentRef: expiredOrder.paymentRef,
        action: 'confirm'
      })
    });
    assert.equal(lateWebhook.status, 400);
  });

  test('Admin Order Progression credits customer totalSpent and upgrades tier only upon completed status (idempotently)', async () => {
    const orderId = createdOrderIds[0]; // 28,000,000 VND order currently in 'confirmed'

    // Verify Admin stats endpoint returns all 6 status distribution buckets
    const statsRes = await fetch(`${baseUrl}/api/admin/stats`, {
      headers: { Cookie: adminCookie }
    });
    assert.equal(statsRes.status, 200);
    const statsJson = await statsRes.json();
    assert.equal(statsJson.data.charts.statusDistribution.length, 6);

    // Before completion, customer should still have 0 completed totalSpent
    const custBefore = await CustomerModel.findById(testCustomerId);
    assert.equal(custBefore.totalSpent, 0);
    assert.equal(custBefore.tag, 'Mới');

    // Move to shipping -> still 0 completed totalSpent
    const shipRes = await fetch(`${baseUrl}/api/admin/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({ status: 'shipping', note: 'Đã bàn giao đơn vị vận chuyển' })
    });
    assert.equal(shipRes.status, 200);
    const custShipping = await CustomerModel.findById(testCustomerId);
    assert.equal(custShipping.totalSpent, 0);

    // Move to completed -> credits 28,000,000 VND and upgrades tier to 'Thân thiết' (>= 20M)
    const compRes = await fetch(`${baseUrl}/api/admin/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({ status: 'completed', note: 'Giao hàng thành công' })
    });
    assert.equal(compRes.status, 200);

    const custAfter = await CustomerModel.findById(testCustomerId);
    assert.equal(custAfter.totalSpent, 28000000);
    assert.equal(custAfter.orderCount, 1);
    assert.equal(custAfter.tag, 'Thân thiết');

    // Repeating completed update must be idempotent (must NOT double-count totalSpent)
    await fetch(`${baseUrl}/api/admin/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({ status: 'completed', note: 'Gửi lại lần 2' })
    });
    const custIdempotent = await CustomerModel.findById(testCustomerId);
    assert.equal(custIdempotent.totalSpent, 28000000);
    assert.equal(custIdempotent.orderCount, 1);
  });
});
