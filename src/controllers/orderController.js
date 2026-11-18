const OrderModel = require('../models/Order');
const CustomerModel = require('../models/Customer');

exports.createOrder = async (req, res) => {
  try {
    const sessionCart = Array.isArray(req.session?.cart) ? req.session.cart : [];
    const bodyItems = Array.isArray(req.body?.items) ? req.body.items : [];
    const cart = sessionCart.length > 0 ? sessionCart : bodyItems;

    if (cart.length === 0) {
      return res.status(400).json({ success: false, message: 'Giỏ hàng trống' });
    }

    const { fullName, phone, email, address, note, rememberMe, paymentMethod = 'cod' } = req.body;
    if (!fullName || !phone || !address) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng điền đủ họ tên, số điện thoại và địa chỉ nhận hàng'
      });
    }

    const customer = await CustomerModel.rememberCustomer({ fullName, phone, email, address, note });
    if (req.session) {
      req.session.customer = customer;
    }
    if (rememberMe) {
      res.cookie('remember_customer_phone', phone, {
        maxAge: 30 * 24 * 60 * 60 * 1000,
        httpOnly: true
      });
    }

    const totalAmount = cart.reduce((s, i) => s + (Number(i.price) || 0) * (Number(i.quantity) || 1), 0);
    const order = await OrderModel.createOrder({
      customerId: customer ? customer.id : null,
      customerInfo: { fullName, phone, email, address, note, paymentGateway: paymentMethod },
      items: [...cart],
      totalAmount,
      note,
      paymentMethod
    });

    if (req.session) {
      req.session.cart = [];
    }

    res.json({
      success: true,
      orderId: order.id,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      paymentRef: order.paymentRef,
      paymentExpiresAt: order.paymentExpiresAt,
      order,
      customer
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi tạo đơn hàng: ' + err.message });
  }
};

exports.getPaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await OrderModel.findById(id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
    }

    res.json({
      success: true,
      orderId: order.id,
      status: order.status,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      paymentRef: order.paymentRef,
      paymentExpiresAt: order.paymentExpiresAt,
      totalAmount: order.totalAmount,
      statusHistory: order.statusHistory,
      order
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.handleSandboxWebhook = async (req, res) => {
  try {
    const orderId = req.body.orderId || req.params.id;
    const { paymentRef, action = 'confirm' } = req.body;
    const result = await OrderModel.processPaymentWebhook({ orderId, paymentRef, action });
    if (!result.success) {
      return res.status(result.status || 400).json({
        success: false,
        message: result.message,
        order: result.order || null
      });
    }

    res.json({
      success: true,
      message: action === 'cancel' ? 'Đã hủy giao dịch thanh toán QR' : 'Thanh toán QR thành công!',
      order: result.order
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.trackOrder = async (req, res) => {
  try {
    const orderId = req.query.orderId || req.body?.orderId;
    const phone = req.query.phone || req.body?.phone;
    if (!orderId || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập đầy đủ Mã đơn hàng và Số điện thoại đặt hàng'
      });
    }

    const order = await OrderModel.trackOrder({ orderId, phone });
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng khớp với Mã đơn và Số điện thoại này'
      });
    }

    res.json({
      success: true,
      order
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const sessionCust = req.currentCustomer || req.session?.customer;
    const customerId = sessionCust?.id || null;
    const phone = req.body?.phone || sessionCust?.phone || null;
    const reason = req.body?.reason || '';

    const result = await OrderModel.cancelByCustomer({ orderId: id, customerId, phone, reason });
    if (!result.success) {
      return res.status(result.status || 400).json({
        success: false,
        message: result.message
      });
    }

    res.json({
      success: true,
      message: 'Đã hủy đơn hàng thành công',
      order: result.order
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
