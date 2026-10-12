const OrderModel = require('../models/Order');
const CustomerModel = require('../models/Customer');

exports.createOrder = async (req, res) => {
  try {
    const cart = req.session.cart || [];
    if (cart.length === 0) return res.status(400).json({ success: false, message: 'Giỏ hàng trống' });
    const { fullName, phone, email, address, note, rememberMe } = req.body;
    if (!fullName || !phone || !address) {
      return res.status(400).json({ success: false, message: 'Vui lòng điền đủ họ tên, số điện thoại và địa chỉ nhận hàng' });
    }

    const customer = await CustomerModel.rememberCustomer({ fullName, phone, email, address, note });
    req.session.customer = customer;
    if (rememberMe) {
      res.cookie('remember_customer_phone', phone, { maxAge: 30 * 24 * 60 * 60 * 1000, httpOnly: true });
    }

    const totalAmount = cart.reduce((s, i) => s + i.price * i.quantity, 0);
    const order = await OrderModel.createOrder({
      customerId: customer ? customer.id : null,
      customerInfo: { fullName, phone, email, address, note },
      items: [...cart],
      totalAmount,
      note
    });

    if (customer && customer.id) {
      await CustomerModel.syncOrderStats(customer.id, totalAmount);
    }

    req.session.cart = [];
    res.json({ success: true, orderId: order.id, customer });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi tạo đơn hàng: ' + err.message });
  }
};
