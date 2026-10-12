const JsonDB = require('./database');
const customerDB = new JsonDB('customers');

function calculateTag(orderCount = 0, totalSpent = 0) {
  if (totalSpent >= 50000000 || orderCount >= 5) return 'VIP';
  if (orderCount >= 2 || totalSpent >= 20000000) return 'Thân thiết';
  return 'Mới';
}

class CustomerModel {
  static getAll({ search = '', tag = '' } = {}) {
    let list = customerDB.findAll();

    if (search) {
      const q = search.toLowerCase().trim();
      list = list.filter(c =>
        (c.fullName && c.fullName.toLowerCase().includes(q)) ||
        (c.phone && c.phone.includes(q)) ||
        (c.email && c.email.toLowerCase().includes(q)) ||
        (c.address && c.address.toLowerCase().includes(q))
      );
    }

    if (tag && tag !== 'all') {
      list = list.filter(c => (c.tag || 'Mới') === tag);
    }

    return list.sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));
  }

  static findById(id) {
    return customerDB.findById(id);
  }

  static findByPhone(phone) {
    if (!phone) return null;
    return customerDB.findOne(c => c.phone && c.phone.trim() === phone.trim());
  }

  static rememberCustomer({ phone, fullName, email, address, note }) {
    if (!phone) return null;
    const cleanPhone = phone.trim();
    const existing = this.findByPhone(cleanPhone);

    if (existing) {
      const orderCount = existing.orderCount || 0;
      const totalSpent = existing.totalSpent || 0;
      return customerDB.update(existing.id, {
        fullName: fullName || existing.fullName,
        email: email !== undefined ? email : (existing.email || ''),
        address: address || existing.address,
        note: note || existing.note,
        visitCount: (existing.visitCount || 1) + 1,
        tag: existing.tag || calculateTag(orderCount, totalSpent),
        lastVisited: new Date().toISOString()
      });
    }

    const newCustomer = {
      id: 'CUST_' + Date.now(),
      fullName: fullName || 'Khách hàng',
      phone: cleanPhone,
      email: email || '',
      address: address || '',
      note: note || '',
      adminNote: '',
      tag: 'Mới',
      visitCount: 1,
      orderCount: 0,
      totalSpent: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    return customerDB.insert(newCustomer);
  }

  static createCustomer({ fullName, phone, email, address, note, adminNote, tag }) {
    if (!fullName || !phone) {
      throw new Error('Vui lòng cung cấp họ tên và số điện thoại');
    }
    const cleanPhone = phone.trim();
    const existing = this.findByPhone(cleanPhone);
    if (existing) {
      throw new Error(`Số điện thoại ${cleanPhone} đã tồn tại với khách hàng ${existing.fullName}`);
    }

    const newCustomer = {
      id: 'CUST_' + Date.now(),
      fullName,
      phone: cleanPhone,
      email: email || '',
      address: address || '',
      note: note || '',
      adminNote: adminNote || '',
      tag: tag || 'Mới',
      visitCount: 1,
      orderCount: 0,
      totalSpent: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    return customerDB.insert(newCustomer);
  }

  static updateCustomer(id, data) {
    const existing = customerDB.findById(id);
    if (!existing) return null;

    const fields = { ...data };
    if (fields.phone) fields.phone = fields.phone.trim();
    if (!fields.tag) {
      fields.tag = calculateTag(fields.orderCount ?? existing.orderCount, fields.totalSpent ?? existing.totalSpent);
    }

    return customerDB.update(id, fields);
  }

  static deleteCustomer(id) {
    return customerDB.delete(id);
  }

  static syncOrderStats(customerId, orderAmount) {
    const customer = customerDB.findById(customerId);
    if (!customer) return null;

    const newOrderCount = (customer.orderCount || 0) + 1;
    const newTotalSpent = (customer.totalSpent || 0) + (Number(orderAmount) || 0);
    const newTag = calculateTag(newOrderCount, newTotalSpent);

    return customerDB.update(customerId, {
      orderCount: newOrderCount,
      totalSpent: newTotalSpent,
      tag: customer.tag === 'VIP' ? 'VIP' : newTag,
      lastOrderAt: new Date().toISOString()
    });
  }
}

module.exports = CustomerModel;
