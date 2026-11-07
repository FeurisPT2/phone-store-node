const JsonDB = require('./database');
const db = require('../config/db');
const CustomerModel = require('./Customer');

const orderDB = new JsonDB('orders');

const QR_PAYMENT_TTL_MS = 15 * 60 * 1000; // 15 minutes

const STATUS_TITLES = {
  awaiting_payment: 'Chờ thanh toán QR',
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  shipping: 'Đang giao hàng',
  completed: 'Đã hoàn thành',
  cancelled: 'Đã hủy đơn'
};

function parseJsonSafe(val, fallback) {
  if (!val) return fallback;
  if (typeof val === 'object') return val;
  try {
    return JSON.parse(val);
  } catch {
    return fallback;
  }
}

function mapRowToOrder(row) {
  if (!row) return null;
  return {
    id: row.id,
    customerId: row.customer_id !== undefined ? row.customer_id : row.customerId,
    customerInfo: parseJsonSafe(row.customer_info !== undefined ? row.customer_info : row.customerInfo, {}),
    items: parseJsonSafe(row.items, []),
    totalAmount: parseInt(row.total_amount !== undefined ? row.total_amount : row.totalAmount) || 0,
    status: row.status || 'pending',
    paymentMethod: row.payment_method || row.paymentMethod || 'cod',
    paymentStatus: row.payment_status || row.paymentStatus || 'unpaid',
    paymentRef: row.payment_ref || row.paymentRef || null,
    paymentExpiresAt: row.payment_expires_at || row.paymentExpiresAt || null,
    statsSynced: Boolean(row.stats_synced !== undefined ? row.stats_synced : row.statsSynced),
    adminNote: row.admin_note !== undefined ? row.admin_note : (row.adminNote || ''),
    note: row.note || '',
    statusHistory: parseJsonSafe(row.status_history !== undefined ? row.status_history : row.statusHistory, []),
    createdAt: row.created_at || row.createdAt,
    updatedAt: row.updated_at || row.updatedAt
  };
}

class OrderModel {
  static async evaluateLazyExpiration(order) {
    if (!order) return null;
    const isAwaiting = order.paymentStatus === 'awaiting_payment' || order.status === 'awaiting_payment';
    if (!isAwaiting || !order.paymentExpiresAt) {
      return order;
    }

    const expiresMs = Date.parse(order.paymentExpiresAt);
    if (Number.isNaN(expiresMs) || Date.now() <= expiresMs) {
      return order;
    }

    const history = Array.isArray(order.statusHistory) ? [...order.statusHistory] : [];
    history.push({
      status: 'cancelled',
      title: 'Đã hủy đơn (Quá hạn thanh toán QR)',
      time: new Date().toISOString(),
      note: 'Quá hạn thanh toán QR (15 phút)'
    });

    if (db.isPostgres()) {
      try {
        const res = await db.query(
          `
          UPDATE orders
          SET status = 'cancelled', payment_status = 'expired', status_history = $1, updated_at = NOW()
          WHERE id = $2
          RETURNING *
        `,
          [JSON.stringify(history), order.id]
        );
        if (res && res.rows[0]) return mapRowToOrder(res.rows[0]);
      } catch (err) {
        console.error('Lỗi cập nhật lazy expiration Postgres:', err.message);
      }
    }

    const updated = orderDB.update(order.id, {
      status: 'cancelled',
      paymentStatus: 'expired',
      statusHistory: history
    });
    return mapRowToOrder(updated);
  }

  static async createOrder({
    customerId,
    customerInfo,
    items,
    totalAmount,
    note = '',
    paymentMethod = 'cod',
    paymentExpiresAt: customExpiresAt = null
  }) {
    const id = 'ORD_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6).toUpperCase();
    const amount = Number(totalAmount) || 0;
    const rawMethod = String(paymentMethod || 'cod').toLowerCase().trim();
    const isQr = ['qr', 'vnpay', 'momo', 'vietqr'].includes(rawMethod);
    const normalizedMethod = isQr ? 'qr' : 'cod';
    const initialStatus = isQr ? 'awaiting_payment' : 'pending';
    const initialPaymentStatus = isQr ? 'awaiting_payment' : 'unpaid';
    const paymentRef = 'PAY_' + id;
    const paymentExpiresAt = isQr
      ? customExpiresAt || new Date(Date.now() + QR_PAYMENT_TTL_MS).toISOString()
      : null;

    const history = [
      {
        status: initialStatus,
        title: isQr ? 'Chờ thanh toán QR (15 phút)' : 'Đơn hàng mới tạo',
        time: new Date().toISOString(),
        note: isQr
          ? `Khởi tạo thanh toán QR (${paymentRef}) - Hạn 15 phút`
          : 'Khách hàng hoàn tất đặt hàng trên website (COD)'
      }
    ];

    if (db.isPostgres()) {
      try {
        const res = await db.query(
          `
          INSERT INTO orders (
            id, customer_id, customer_info, items, total_amount, status,
            payment_method, payment_status, payment_ref, payment_expires_at, stats_synced,
            admin_note, note, status_history
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, FALSE, '', $11, $12)
          RETURNING *
        `,
          [
            id,
            customerId || null,
            JSON.stringify(customerInfo || {}),
            JSON.stringify(items || []),
            amount,
            initialStatus,
            normalizedMethod,
            initialPaymentStatus,
            paymentRef,
            paymentExpiresAt,
            note || customerInfo?.note || '',
            JSON.stringify(history)
          ]
        );
        return mapRowToOrder(res.rows[0]);
      } catch (err) {
        console.error('Lỗi tạo đơn hàng Postgres:', err.message);
      }
    }

    const order = {
      id,
      customerId: customerId || null,
      customerInfo: customerInfo || {},
      items: items || [],
      totalAmount: amount,
      status: initialStatus,
      paymentMethod: normalizedMethod,
      paymentStatus: initialPaymentStatus,
      paymentRef,
      paymentExpiresAt,
      statsSynced: false,
      adminNote: '',
      note: note || customerInfo?.note || '',
      statusHistory: history,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    return mapRowToOrder(orderDB.insert(order));
  }

  static async getAll({ status = '', search = '', fromDate = '', toDate = '', paymentStatus = '' } = {}) {
    let list = [];
    if (db.isPostgres()) {
      try {
        const res = await db.query('SELECT * FROM orders ORDER BY created_at DESC');
        list = (res.rows || []).map(mapRowToOrder);
      } catch (err) {
        console.error('Lỗi lấy danh sách đơn từ Postgres:', err.message);
      }
    } else {
      list = orderDB.findAll().map(mapRowToOrder);
    }

    // Evaluate lazy expiration across orders before filtering so expired awaiting_payment orders
    // transition to cancelled/expired and appear in status=cancelled / paymentStatus=expired queries
    const evaluated = [];
    for (const o of list) {
      evaluated.push(await this.evaluateLazyExpiration(o));
    }
    list = evaluated;

    if (status && status !== 'all') {
      list = list.filter((o) => o.status === status);
    }
    if (paymentStatus && paymentStatus !== 'all') {
      list = list.filter((o) => o.paymentStatus === paymentStatus);
    }
    if (search) {
      const q = search.toLowerCase().trim();
      list = list.filter(
        (o) =>
          (o.id && o.id.toLowerCase().includes(q)) ||
          (o.paymentRef && o.paymentRef.toLowerCase().includes(q)) ||
          (o.customerInfo?.fullName && o.customerInfo.fullName.toLowerCase().includes(q)) ||
          (o.customerInfo?.phone && o.customerInfo.phone.includes(q)) ||
          (o.customerInfo?.address && o.customerInfo.address.toLowerCase().includes(q))
      );
    }
    if (fromDate) {
      const fromTs = Date.parse(fromDate);
      if (!Number.isNaN(fromTs)) {
        list = list.filter((o) => Date.parse(o.createdAt) >= fromTs);
      }
    }
    if (toDate) {
      // Include end of day if YYYY-MM-DD is provided
      const toStr = toDate.length === 10 ? `${toDate}T23:59:59.999Z` : toDate;
      const toTs = Date.parse(toStr);
      if (!Number.isNaN(toTs)) {
        list = list.filter((o) => Date.parse(o.createdAt) <= toTs);
      }
    }

    return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  static async findById(id) {
    if (!id) return null;
    const cleanId = String(id).replace(/^#/, '').trim();
    let order = null;
    if (db.isPostgres()) {
      try {
        const res = await db.query('SELECT * FROM orders WHERE id = $1 LIMIT 1', [cleanId]);
        order = res && res.rows[0] ? mapRowToOrder(res.rows[0]) : null;
      } catch (err) {
        console.error('Lỗi tìm đơn theo id từ Postgres:', err.message);
      }
    }
    if (!order) {
      const found = orderDB.findById(cleanId) || orderDB.findOne((o) => o.id && o.id.toLowerCase() === cleanId.toLowerCase());
      order = mapRowToOrder(found);
    }
    return await this.evaluateLazyExpiration(order);
  }

  static async findByCustomerId(customerId) {
    if (!customerId) return [];
    let list = [];
    if (db.isPostgres()) {
      try {
        const res = await db.query('SELECT * FROM orders WHERE customer_id = $1 ORDER BY created_at DESC', [customerId]);
        list = (res.rows || []).map(mapRowToOrder);
      } catch (err) {
        console.error('Lỗi tìm đơn theo khách hàng từ Postgres:', err.message);
      }
    } else {
      list = orderDB
        .findAll()
        .filter((o) => o.customerId === customerId)
        .map(mapRowToOrder)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    const evaluated = [];
    for (const o of list) {
      evaluated.push(await this.evaluateLazyExpiration(o));
    }
    return evaluated;
  }

  static async trackOrder({ orderId, phone }) {
    if (!orderId || !phone) return null;
    const order = await this.findById(orderId);
    if (!order) return null;
    const cleanPhone = String(phone).trim();
    const orderPhone = String(order.customerInfo?.phone || '').trim();
    if (orderPhone !== cleanPhone) return null;
    return order;
  }

  static async processPaymentWebhook({ orderId, paymentRef, action = 'confirm' }) {
    let order = null;
    if (orderId) {
      order = await this.findById(orderId);
    }
    if (!order && paymentRef) {
      const all = await this.getAll();
      order = all.find((o) => o.paymentRef === paymentRef) || null;
    }
    if (!order) {
      return { success: false, status: 404, message: 'Không tìm thấy đơn hàng đối soát thanh toán' };
    }

    if (order.paymentMethod !== 'qr') {
      return {
        success: false,
        status: 400,
        message: 'Đơn hàng này không sử dụng phương thức thanh toán QR',
        order
      };
    }

    if (paymentRef && order.paymentRef && paymentRef !== order.paymentRef) {
      return { success: false, status: 400, message: 'Mã tham chiếu thanh toán (paymentRef) không khớp' };
    }

    // Check lazy expiration first
    order = await this.evaluateLazyExpiration(order);
    if (order.paymentStatus === 'expired' || order.status === 'cancelled') {
      return {
        success: false,
        status: 400,
        message: 'Đơn hàng đã quá hạn thanh toán QR (15 phút) hoặc đã bị hủy',
        order
      };
    }

    // Guard already-paid orders BEFORE handling cancel/confirm actions
    if (order.paymentStatus === 'paid') {
      if (action === 'cancel') {
        return {
          success: false,
          status: 400,
          message: 'Đơn hàng đã được thanh toán, không thể hủy giao dịch QR',
          order
        };
      }
      return { success: true, status: 200, order };
    }

    if (order.status !== 'awaiting_payment') {
      return {
        success: false,
        status: 400,
        message: 'Đơn hàng không ở trạng thái chờ thanh toán QR',
        order
      };
    }

    if (action === 'cancel') {
      const history = [...(order.statusHistory || [])];
      history.push({
        status: 'cancelled',
        title: 'Đã hủy thanh toán QR',
        time: new Date().toISOString(),
        note: 'Khách hàng hủy giao dịch thanh toán QR'
      });

      if (db.isPostgres()) {
        try {
          const res = await db.query(
            `
            UPDATE orders
            SET status = 'cancelled', payment_status = 'failed', status_history = $1, updated_at = NOW()
            WHERE id = $2
            RETURNING *
          `,
            [JSON.stringify(history), order.id]
          );
          return { success: true, status: 200, order: mapRowToOrder(res.rows[0]) };
        } catch (err) {
          console.error('Lỗi hủy webhook Postgres:', err.message);
        }
      }

      const updated = orderDB.update(order.id, {
        status: 'cancelled',
        paymentStatus: 'failed',
        statusHistory: history
      });
      return { success: true, status: 200, order: mapRowToOrder(updated) };
    }

    // Default action === 'confirm'

    const history = [...(order.statusHistory || [])];
    history.push({
      status: 'confirmed',
      title: 'Đã xác nhận (Thanh toán QR thành công)',
      time: new Date().toISOString(),
      note: `Đã nhận thanh toán QR thành công (Mã GD: ${order.paymentRef || 'PAY_' + order.id})`
    });

    if (db.isPostgres()) {
      try {
        const res = await db.query(
          `
          UPDATE orders
          SET status = 'confirmed', payment_status = 'paid', status_history = $1, updated_at = NOW()
          WHERE id = $2
          RETURNING *
        `,
          [JSON.stringify(history), order.id]
        );
        return { success: true, status: 200, order: mapRowToOrder(res.rows[0]) };
      } catch (err) {
        console.error('Lỗi xác nhận webhook Postgres:', err.message);
      }
    }

    const updated = orderDB.update(order.id, {
      status: 'confirmed',
      paymentStatus: 'paid',
      statusHistory: history
    });
    return { success: true, status: 200, order: mapRowToOrder(updated) };
  }

  static async updateStatus(id, newStatus, note = '') {
    const order = await this.findById(id);
    if (!order) return null;

    const validStatuses = ['awaiting_payment', 'pending', 'confirmed', 'shipping', 'completed', 'cancelled'];
    if (!validStatuses.includes(newStatus)) {
      throw new Error('Trạng thái không hợp lệ: ' + newStatus);
    }

    const history = [...(order.statusHistory || [])];
    history.push({
      status: newStatus,
      title: STATUS_TITLES[newStatus] || newStatus,
      time: new Date().toISOString(),
      note: note || `Cập nhật trạng thái thành ${STATUS_TITLES[newStatus]}`
    });

    let newPaymentStatus = order.paymentStatus || 'unpaid';
    if (newStatus === 'completed') {
      newPaymentStatus = 'paid';
    } else if (newStatus === 'cancelled' && newPaymentStatus === 'awaiting_payment') {
      newPaymentStatus = 'expired';
    }

    let statsSynced = Boolean(order.statsSynced);
    if (newStatus === 'completed' && !statsSynced) {
      let targetCustomerId = order.customerId;
      if (!targetCustomerId && order.customerInfo?.phone) {
        const custByPhone = await CustomerModel.findByPhone(order.customerInfo.phone);
        if (custByPhone) targetCustomerId = custByPhone.id;
      }
      if (targetCustomerId) {
        await CustomerModel.syncOrderStats(targetCustomerId, order.totalAmount);
        statsSynced = true;
      }
    }

    if (db.isPostgres()) {
      try {
        const res = await db.query(
          `
          UPDATE orders
          SET status = $1, payment_status = $2, stats_synced = $3, status_history = $4,
              admin_note = COALESCE($5, admin_note), updated_at = NOW()
          WHERE id = $6
          RETURNING *
        `,
          [newStatus, newPaymentStatus, statsSynced, JSON.stringify(history), note || null, order.id]
        );
        return mapRowToOrder(res.rows[0]);
      } catch (err) {
        console.error('Lỗi cập nhật trạng thái đơn Postgres:', err.message);
      }
    }

    const updated = orderDB.update(order.id, {
      status: newStatus,
      paymentStatus: newPaymentStatus,
      statsSynced,
      statusHistory: history,
      adminNote: note ? note : (order.adminNote || '')
    });
    return mapRowToOrder(updated);
  }

  static async cancelByCustomer({ orderId, customerId, phone, reason = '' }) {
    const order = await this.findById(orderId);
    if (!order) {
      return { success: false, status: 404, message: 'Không tìm thấy đơn hàng' };
    }

    const isOwnerById = customerId && order.customerId && String(order.customerId) === String(customerId);
    const isOwnerByPhone =
      phone && order.customerInfo?.phone && String(order.customerInfo.phone).trim() === String(phone).trim();

    if (!isOwnerById && !isOwnerByPhone) {
      return { success: false, status: 403, message: 'Bạn không có quyền hủy đơn hàng này' };
    }

    if (!['pending', 'awaiting_payment'].includes(order.status)) {
      return {
        success: false,
        status: 400,
        message: 'Chỉ có thể hủy đơn hàng khi đang ở trạng thái Chờ xác nhận hoặc Chờ thanh toán QR'
      };
    }

    const updated = await this.updateStatus(
      order.id,
      'cancelled',
      reason ? `Khách hàng yêu cầu hủy: ${reason}` : 'Khách hàng chủ động hủy đơn trên Cổng Khách Hàng'
    );
    return { success: true, status: 200, order: updated };
  }

  static async deleteOrder(id) {
    if (db.isPostgres()) {
      try {
        const res = await db.query('DELETE FROM orders WHERE id = $1', [id]);
        return res.rowCount > 0;
      } catch (err) {
        console.error('Lỗi xóa đơn hàng Postgres:', err.message);
      }
    }
    return orderDB.delete(id);
  }
}

module.exports = OrderModel;
