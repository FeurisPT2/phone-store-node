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

    // Guard: Completed order cannot be transitioned to cancelled or pending
    const revertCompletedRes = await fetch(`${baseUrl}/api/admin/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({ status: 'cancelled', note: 'Thử hủy đơn đã hoàn thành' })
    });
    assert.equal(revertCompletedRes.status, 400);
  });

  test('Manual customer cancellation of awaiting_payment QR order sets paymentStatus="cancelled" (distinct from TTL "expired") and guards cancelled -> completed transition', async () => {
    const manualQrOrder = await OrderModel.createOrder({
      customerId: testCustomerId,
      customerInfo: { fullName: 'Trần Văn QR', phone: testCustomerPhone, address: '123 Nguyễn Huệ' },
      items: [{ id: 'p3', name: 'Xiaomi 15 Ultra', price: 22000000, quantity: 1 }],
      totalAmount: 22000000,
      paymentMethod: 'qr'
    });
    createdOrderIds.push(manualQrOrder.id);

    // Verify initial statusHistory has both time and timestamp
    assert.equal(manualQrOrder.statusHistory.length, 1);
    assert.ok(manualQrOrder.statusHistory[0].time);
    assert.ok(manualQrOrder.statusHistory[0].timestamp);
    assert.equal(manualQrOrder.statusHistory[0].time, manualQrOrder.statusHistory[0].timestamp);

    // Customer cancels awaiting_payment QR order before 15m TTL
    const cancelRes = await fetch(`${baseUrl}/api/orders/${manualQrOrder.id}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: testCustomerPhone, reason: 'Muốn đổi sang trả góp' })
    });
    assert.equal(cancelRes.status, 200);
    const cancelJson = await cancelRes.json();
    assert.equal(cancelJson.success, true);
    assert.equal(cancelJson.order.status, 'cancelled');
    assert.equal(
      cancelJson.order.paymentStatus,
      'cancelled',
      'Manual QR cancellation must set paymentStatus="cancelled", NOT "expired"'
    );

    // Every statusHistory entry must have both time and timestamp
    for (const entry of cancelJson.order.statusHistory) {
      assert.ok(entry.time, 'statusHistory entry must include time');
      assert.ok(entry.timestamp, 'statusHistory entry must include timestamp');
      assert.ok(!Number.isNaN(Date.parse(entry.timestamp)), 'statusHistory timestamp must be valid ISO date');
    }

    // Guard: Admin cannot illegally transition a cancelled order directly to completed
    const custBeforeIllegal = await CustomerModel.findById(testCustomerId);
    const spentBefore = custBeforeIllegal.totalSpent;

    const illegalCompleteRes = await fetch(`${baseUrl}/api/admin/orders/${manualQrOrder.id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({ status: 'completed', note: 'Cố tình hoàn thành đơn đã hủy' })
    });
    assert.equal(illegalCompleteRes.status, 400);

    // Guard: Multi-hop bypass (cancelled -> confirmed -> completed) on cancelled/expired QR order must also be blocked
    const illegalConfirmRes = await fetch(`${baseUrl}/api/admin/orders/${manualQrOrder.id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({ status: 'confirmed', note: 'Cố tình khôi phục đơn QR đã hủy' })
    });
    assert.equal(illegalConfirmRes.status, 400);

    const orderAfterIllegal = await OrderModel.findById(manualQrOrder.id);
    assert.equal(orderAfterIllegal.status, 'cancelled');
    assert.equal(orderAfterIllegal.paymentStatus, 'cancelled');
    assert.equal(orderAfterIllegal.statsSynced, false);

    const custAfterIllegal = await CustomerModel.findById(testCustomerId);
    assert.equal(custAfterIllegal.totalSpent, spentBefore, 'Cancelled order must never credit customer totalSpent');

    // Admin confirming an awaiting_payment QR order ("Xác nhận TT") sets paymentStatus="paid"
    // and prevents evaluateLazyExpiration from falsely expiring it after TTL
    const adminConfirmedQr = await OrderModel.createOrder({
      customerId: testCustomerId,
      customerInfo: { fullName: 'Trần Văn QR', phone: testCustomerPhone, address: '123 Nguyễn Huệ' },
      items: [{ id: 'p4', name: 'Find X8 Pro', price: 19000000, quantity: 1 }],
      totalAmount: 19000000,
      paymentMethod: 'qr',
      paymentExpiresAt: new Date(Date.now() + 5000).toISOString()
    });
    createdOrderIds.push(adminConfirmedQr.id);

    const adminConfirmRes = await fetch(`${baseUrl}/api/admin/orders/${adminConfirmedQr.id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({ status: 'confirmed', note: 'Admin xác nhận đã nhận chuyển khoản' })
    });
    assert.equal(adminConfirmRes.status, 200);
    const adminConfirmJson = await adminConfirmRes.json();
    assert.equal(adminConfirmJson.data.status, 'confirmed');
    assert.equal(adminConfirmJson.data.paymentStatus, 'paid');

    // Even if paymentExpiresAt is in the past, evaluateLazyExpiration must NOT cancel a confirmed/paid order
    const evaluatedAfterTtl = await OrderModel.evaluateLazyExpiration({
      ...adminConfirmJson.data,
      paymentExpiresAt: new Date(Date.now() - 60000).toISOString()
    });
    assert.equal(evaluatedAfterTtl.status, 'confirmed');
    assert.equal(evaluatedAfterTtl.paymentStatus, 'paid');
  });
});
