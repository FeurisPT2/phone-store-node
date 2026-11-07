const crypto = require('crypto');
const { customerStorage } = require('./storage');

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function calculateTag(orderCount = 0, totalSpent = 0) {
  if (totalSpent >= 50000000 || orderCount >= 5) return 'VIP';
  if (orderCount >= 2 || totalSpent >= 20000000) return 'Thân thiết';
  return 'Mới';
}

class CustomerModel {
  static toSafeCustomer(customer) {
    if (!customer || typeof customer !== 'object') return null;
    const safe = { ...customer };
    delete safe.passwordHash;
    return safe;
  }

  static async getAll({ search = '', tag = '' } = {}) {
    const query = {};
    if (tag && tag !== 'all') {
      query.tag = tag;
    }
    if (search) {
      query.$search = {
        term: search,
        fields: ['fullName', 'phone', 'email', 'address']
      };
    }
    const list = await customerStorage.find(query, { sort: { updatedAt: -1 } });
    return (list || []).map((c) => this.toSafeCustomer(c));
  }

  static async findById(id) {
    if (!id) return null;
    const found = await customerStorage.findById(id);
    return this.toSafeCustomer(found);
  }

  static async findByPhone(phone) {
    if (!phone) return null;
    const cleanPhone = String(phone).trim();
    const found = await customerStorage.findOne({ phone: cleanPhone });
    return this.toSafeCustomer(found);
  }

  // Đăng ký tài khoản khách hàng
  static async register({ fullName, phone, password, email = '', address = '' }) {
    if (!fullName || !phone || !password) {
      throw new Error('Vui lòng cung cấp họ tên, số điện thoại và mật khẩu');
    }
    if (password.length < 6) {
      throw new Error('Mật khẩu phải có ít nhất 6 ký tự');
    }

    const cleanPhone = String(phone).trim();
    const existing = await customerStorage.findOne({ phone: cleanPhone });
    const passHash = hashPassword(password);

    if (existing) {
      if (existing.passwordHash) {
        throw new Error('Số điện thoại này đã có tài khoản. Vui lòng đăng nhập.');
      }
      // Nâng cấp khách cũ thành tài khoản có mật khẩu
      const updated = await customerStorage.update(existing.id, {
        fullName,
        passwordHash: passHash,
        email: email || existing.email,
        address: address || existing.address
      });
      return this.toSafeCustomer(updated);
    }

    const newId = 'CUST_' + Date.now();
    const newCust = {
      id: newId,
      fullName,
      phone: cleanPhone,
      passwordHash: passHash,
      email: email || '',
      address: address || '',
      note: '',
      adminNote: '',
      tag: 'Mới',
      wishlist: [],
      visitCount: 1,
      orderCount: 0,
      totalSpent: 0,
      lastVisited: new Date().toISOString()
    };
    const created = await customerStorage.insert(newCust);
    return this.toSafeCustomer(created);
  }

  // Đăng nhập tài khoản khách hàng
  static async login({ phone, password }) {
    if (!phone || !password) {
      throw new Error('Vui lòng nhập số điện thoại và mật khẩu');
    }
    const cleanPhone = String(phone).trim();
    const customer = await customerStorage.findOne({ phone: cleanPhone });
    if (!customer) {
      throw new Error('Số điện thoại chưa được đăng ký tài khoản');
    }
    if (!customer.passwordHash) {
      throw new Error('Số điện thoại này đã từng mua hàng nhưng chưa tạo mật khẩu. Vui lòng bấm Đăng Ký để thiết lập mật khẩu.');
    }

    const passHash = hashPassword(password);
    if (customer.passwordHash !== passHash) {
      throw new Error('Mật khẩu không chính xác');
    }

    return this.toSafeCustomer(customer);
  }

  static async rememberCustomer({ phone, fullName, email, address, note }) {
    if (!phone) return null;
    const cleanPhone = String(phone).trim();
    const existing = await this.findByPhone(cleanPhone);

    if (existing) {
      const orderCount = existing.orderCount || 0;
      const totalSpent = existing.totalSpent || 0;
      const newTag = existing.tag || calculateTag(orderCount, totalSpent);
      const visitCount = (existing.visitCount || 1) + 1;

      const updated = await customerStorage.update(existing.id, {
        fullName: fullName || existing.fullName,
        email: email !== undefined ? email : (existing.email || ''),
        address: address || existing.address,
        note: note || existing.note,
        visitCount,
        tag: newTag,
        lastVisited: new Date().toISOString()
      });
      return this.toSafeCustomer(updated);
    }

    const newId = 'CUST_' + Date.now();
    const newCustomer = {
      id: newId,
      fullName: fullName || 'Khách hàng',
      phone: cleanPhone,
      email: email || '',
      address: address || '',
      note: note || '',
      adminNote: '',
      tag: 'Mới',
      wishlist: [],
      visitCount: 1,
      orderCount: 0,
      totalSpent: 0,
      lastVisited: new Date().toISOString()
    };
    const created = await customerStorage.insert(newCustomer);
    return this.toSafeCustomer(created);
  }

  static async createCustomer({ fullName, phone, email, address, note, adminNote, tag }) {
    if (!fullName || !phone) {
      throw new Error('Vui lòng cung cấp họ tên và số điện thoại');
    }
    const cleanPhone = String(phone).trim();
    const existing = await this.findByPhone(cleanPhone);
    if (existing) {
      throw new Error(`Số điện thoại ${cleanPhone} đã tồn tại với khách hàng ${existing.fullName}`);
    }

    const newId = 'CUST_' + Date.now();
    const newTag = tag || 'Mới';

    const newCustomer = {
      id: newId,
      fullName,
      phone: cleanPhone,
      email: email || '',
      address: address || '',
      note: note || '',
      adminNote: adminNote || '',
      tag: newTag,
      wishlist: [],
      visitCount: 1,
      orderCount: 0,
      totalSpent: 0,
      lastVisited: new Date().toISOString()
    };
    const created = await customerStorage.insert(newCustomer);
    return this.toSafeCustomer(created);
  }

  static async updateCustomer(id, data) {
    const existing = await this.findById(id);
    if (!existing) return null;

    const fullName = data.fullName !== undefined ? data.fullName : existing.fullName;
    const phone = data.phone !== undefined ? String(data.phone).trim() : existing.phone;
    const email = data.email !== undefined ? data.email : existing.email;
    const address = data.address !== undefined ? data.address : existing.address;
    const note = data.note !== undefined ? data.note : existing.note;
    const adminNote = data.adminNote !== undefined ? data.adminNote : existing.adminNote;
    const tag = data.tag || existing.tag;
    const wishlist = Array.isArray(data.wishlist) ? data.wishlist : (existing.wishlist || []);

    const updated = await customerStorage.update(id, {
      fullName,
      phone,
      email,
      address,
      note,
      adminNote,
      tag,
      wishlist
    });
    return this.toSafeCustomer(updated);
  }

  static async toggleWishlist(id, productId) {
    const existing = await this.findById(id);
    if (!existing || !productId) return null;

    const currentList = Array.isArray(existing.wishlist) ? [...existing.wishlist] : [];
    const pid = String(productId);
    const idx = currentList.indexOf(pid);
    let added = false;
    if (idx >= 0) {
      currentList.splice(idx, 1);
    } else {
      currentList.push(pid);
      added = true;
    }

    const updated = await this.updateCustomer(id, { wishlist: currentList });
    return {
      added,
      wishlist: updated?.wishlist || currentList,
      customer: this.toSafeCustomer(updated)
    };
  }

  static async deleteCustomer(id) {
    return await customerStorage.delete(id);
  }

  static async syncOrderStats(customerId, orderAmount) {
    const customer = await this.findById(customerId);
    if (!customer) return null;

    const newOrderCount = (customer.orderCount || 0) + 1;
    const newTotalSpent = (customer.totalSpent || 0) + (Number(orderAmount) || 0);
    const calculatedTag = calculateTag(newOrderCount, newTotalSpent);
    const newTag = customer.tag === 'VIP' ? 'VIP' : calculatedTag;

    const updated = await customerStorage.update(customerId, {
      orderCount: newOrderCount,
      totalSpent: newTotalSpent,
      tag: newTag,
      lastOrderAt: new Date().toISOString()
    });
    return this.toSafeCustomer(updated);
  }
}

module.exports = CustomerModel;
