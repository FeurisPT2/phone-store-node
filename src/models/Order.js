const JsonDB = require('./database');
const orderDB = new JsonDB('orders');

class OrderModel {
  static createOrder({ customerId, customerInfo, items, totalAmount, note = '' }) {
    const order = {
      id: 'ORD_' + Date.now(),
      customerId: customerId || null,
      customerInfo: customerInfo || {},
      items: items || [],
      totalAmount: Number(totalAmount) || 0,
      status: 'pending', // pending | shipping | completed | cancelled
      adminNote: '',
      note: note || customerInfo?.note || '',
      statusHistory: [
        {
          status: 'pending',
          title: 'Đơn hàng mới tạo',
          time: new Date().toISOString(),
          note: 'Khách hàng hoàn tất đặt hàng trên website'
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    return orderDB.insert(order);
  }

  static getAll({ status = '', search = '' } = {}) {
    let list = orderDB.findAll();

    if (status && status !== 'all') {
      list = list.filter(o => o.status === status);
    }

    if (search) {
      const q = search.toLowerCase().trim();
      list = list.filter(o =>
        (o.id && o.id.toLowerCase().includes(q)) ||
        (o.customerInfo?.fullName && o.customerInfo.fullName.toLowerCase().includes(q)) ||
        (o.customerInfo?.phone && o.customerInfo.phone.includes(q)) ||
        (o.customerInfo?.address && o.customerInfo.address.toLowerCase().includes(q))
      );
    }

    return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  static findById(id) {
    return orderDB.findById(id);
  }

  static findByCustomerId(customerId) {
    if (!customerId) return [];
    return orderDB.findAll()
      .filter(o => o.customerId === customerId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  static updateStatus(id, newStatus, note = '') {
    const order = orderDB.findById(id);
    if (!order) return null;

    const validStatuses = ['pending', 'shipping', 'completed', 'cancelled'];
    if (!validStatuses.includes(newStatus)) {
      throw new Error('Trạng thái không hợp lệ: ' + newStatus);
    }

    const statusTitles = {
      pending: 'Chờ xác nhận',
      shipping: 'Đang giao hàng',
      completed: 'Đã hoàn thành',
      cancelled: 'Đã hủy đơn'
    };

    const history = order.statusHistory || [];
    history.push({
      status: newStatus,
      title: statusTitles[newStatus] || newStatus,
      time: new Date().toISOString(),
      note: note || `Cập nhật trạng thái thành ${statusTitles[newStatus]}`
    });

    return orderDB.update(id, {
      status: newStatus,
      statusHistory: history,
      adminNote: note ? note : (order.adminNote || '')
    });
  }

  static updateOrder(id, fields) {
    return orderDB.update(id, fields);
  }

  static deleteOrder(id) {
    return orderDB.delete(id);
  }
}

module.exports = OrderModel;
