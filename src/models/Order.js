const { orderStorage } = require('./storage');
const CustomerModel = require('./Customer');

const QR_PAYMENT_TTL_MS = 15 * 60 * 1000; // 15 minutes

const STATUS_TITLES = {
  awaiting_payment: 'Chờ thanh toán QR',
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  shipping: 'Đang giao hàng',
  completed: 'Đã hoàn thành',
  cancelled: 'Đã hủy đơn'
};

function createHistoryEntry({ status, title, note = '', time = null }) {
  const iso = time || new Date().toISOString();
  return {
    status,
    title: title || STATUS_TITLES[status] || status,
    time: iso,
    timestamp: iso,
    note
  };
}

function normalizeStatusHistory(history, fallbackTime = null) {
  if (!Array.isArray(history)) return [];
  return history.map((entry) => {
    if (!entry || typeof entry !== 'object') return entry;
    const ts = entry.timestamp || entry.time || fallbackTime || new Date().toISOString();
    return {
      ...entry,
      time: entry.time || ts,
      timestamp: entry.timestamp || ts
    };
  });
}

class OrderModel {
  static async evaluateLazyExpiration(order) {
    if (!order) return null;
    if (Array.isArray(order.statusHistory)) {
      order.statusHistory = normalizeStatusHistory(order.statusHistory, order.createdAt);
    }
    const isAwaiting = order.status === 'awaiting_payment' && order.paymentStatus === 'awaiting_payment';
    if (!isAwaiting || !order.paymentExpiresAt) {
      return order;
    }

    const expiresMs = Date.parse(order.paymentExpiresAt);
    if (Number.isNaN(expiresMs) || Date.now() <= expiresMs) {
      return order;
    }

    const history = normalizeStatusHistory(order.statusHistory, order.createdAt);
    history.push(
      createHistoryEntry({
        status: 'cancelled',
        title: 'Đã hủy đơn (Quá hạn thanh toán QR)',
        note: 'Quá hạn thanh toán QR (15 phút)'
      })
    );

    return await orderStorage.update(order.id, {
      status: 'cancelled',
      paymentStatus: 'expired',
      statusHistory: history
    });
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
    const id = 'GH26_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6).toUpperCase();
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
      createHistoryEntry({
        status: initialStatus,
        title: isQr ? 'Chờ thanh toán QR (15 phút)' : 'Đơn hàng mới tạo',
        note: isQr
          ? `Khởi tạo thanh toán QR (${paymentRef}) - Hạn 15 phút`
          : 'Khách hàng hoàn tất đặt hàng trên website (COD)'
      })
    ];

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
      statusHistory: history
    };

    return await orderStorage.insert(order);
  }

  static async getAll({ status = '', search = '', fromDate = '', toDate = '', paymentStatus = '' } = {}) {
    let list = await orderStorage.find({}, { sort: { createdAt: -1 } });

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
    let order = await orderStorage.findById(cleanId);
    if (!order) {
      order = await orderStorage.findOne({ id: { $iexact: cleanId } });
    }
    return await this.evaluateLazyExpiration(order);
  }

  static async findByCustomerId(customerId) {
    if (!customerId) return [];
    let list = await orderStorage.find({ customerId }, { sort: { createdAt: -1 } });
    const evaluated = [];
    for (const o of list) {
      evaluated.push(await this.evaluateLazyExpiration(o));
    }
    return evaluated.filter(Boolean);
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
      const cleanRef = String(paymentRef).trim();
      order = await orderStorage.findOne({ paymentRef: cleanRef });
      if (order) {
        order = await this.evaluateLazyExpiration(order);
      }
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
      const history = normalizeStatusHistory(order.statusHistory, order.createdAt);
      history.push(
        createHistoryEntry({
          status: 'cancelled',
          title: 'Đã hủy thanh toán QR',
          note: 'Khách hàng hủy giao dịch thanh toán QR'
        })
      );

      const updated = await orderStorage.update(order.id, {
        status: 'cancelled',
        paymentStatus: 'cancelled',
        statusHistory: history
      });
      return { success: true, status: 200, order: updated };
    }

    // Default action === 'confirm'
    const history = normalizeStatusHistory(order.statusHistory, order.createdAt);
    history.push(
      createHistoryEntry({
        status: 'confirmed',
        title: 'Đã xác nhận (Thanh toán QR thành công)',
        note: `Đã nhận thanh toán QR thành công (Mã GD: ${order.paymentRef || 'PAY_' + order.id})`
      })
    );

    const updated = await orderStorage.update(order.id, {
      status: 'confirmed',
      paymentStatus: 'paid',
      statusHistory: history
    });
    return { success: true, status: 200, order: updated };
  }

  static async updateStatus(id, newStatus, note = '') {
    const order = await this.findById(id);
    if (!order) return null;

    const validStatuses = ['awaiting_payment', 'pending', 'confirmed', 'shipping', 'completed', 'cancelled'];
    if (!validStatuses.includes(newStatus)) {
      throw new Error('Trạng thái không hợp lệ: ' + newStatus);
    }

    // Terminal state transition guards:
    // 1. A cancelled order cannot be transitioned directly to completed (prevents bogus 'paid' & stats credit)
    if (order.status === 'cancelled' && newStatus === 'completed') {
      throw new Error('Không thể chuyển đơn hàng đã hủy sang trạng thái hoàn thành');
    }
    // 2. An order with expired or cancelled payment cannot be revived or completed via intermediate states
    if (
      (order.paymentStatus === 'expired' || order.paymentStatus === 'cancelled') &&
      newStatus !== 'cancelled'
    ) {
      throw new Error('Không thể khôi phục hoặc hoàn thành đơn hàng đã hủy hoặc quá hạn thanh toán QR');
    }
    // 3. A completed order cannot be reverted or cancelled (idempotent completed -> completed is allowed)
    if (order.status === 'completed' && newStatus !== 'completed') {
      throw new Error('Đơn hàng đã hoàn thành không thể chuyển sang trạng thái khác');
    }

    const history = normalizeStatusHistory(order.statusHistory, order.createdAt);
    history.push(
      createHistoryEntry({
        status: newStatus,
        title: STATUS_TITLES[newStatus] || newStatus,
        note: note || `Cập nhật trạng thái thành ${STATUS_TITLES[newStatus]}`
      })
    );

    let newPaymentStatus = order.paymentStatus || 'unpaid';
    if (newStatus === 'completed') {
      newPaymentStatus = 'paid';
    } else if (
      (newStatus === 'confirmed' || newStatus === 'shipping') &&
      newPaymentStatus === 'awaiting_payment'
    ) {
      // Admin confirming/shipping an awaiting_payment QR order ("Xác nhận TT") marks payment as paid
      newPaymentStatus = 'paid';
    } else if (newStatus === 'cancelled' && newPaymentStatus === 'awaiting_payment') {
      // Manual cancellation of an awaiting_payment order sets paymentStatus = 'cancelled'
      // ('expired' is reserved strictly for evaluateLazyExpiration when the 15-minute TTL elapses)
      newPaymentStatus = 'cancelled';
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

    const updateData = {
      status: newStatus,
      paymentStatus: newPaymentStatus,
      statsSynced,
      statusHistory: history
    };
    if (note) {
      updateData.adminNote = note;
    }

    return await orderStorage.update(order.id, updateData);
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
    return await orderStorage.delete(id);
  }
}

module.exports = OrderModel;
