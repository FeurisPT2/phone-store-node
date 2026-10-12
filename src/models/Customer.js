const JsonDB = require('./database');
const db = require('../config/db');

const customerDB = new JsonDB('customers');

function calculateTag(orderCount = 0, totalSpent = 0) {
  if (totalSpent >= 50000000 || orderCount >= 5) return 'VIP';
  if (orderCount >= 2 || totalSpent >= 20000000) return 'Thân thiết';
  return 'Mới';
}

function mapRowToCustomer(row) {
  if (!row) return null;
  return {
    id: row.id,
    fullName: row.full_name,
    phone: row.phone,
    email: row.email,
    address: row.address,
    note: row.note,
    adminNote: row.admin_note,
    tag: row.tag,
    visitCount: parseInt(row.visit_count) || 1,
    orderCount: parseInt(row.order_count) || 0,
    totalSpent: parseInt(row.total_spent) || 0,
    lastVisited: row.last_visited,
    lastOrderAt: row.last_order_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

class CustomerModel {
  static async getAll({ search = '', tag = '' } = {}) {
    if (db.isPostgres()) {
      try {
        let sql = 'SELECT * FROM customers WHERE 1=1';
        const params = [];

        if (search) {
          params.push(`%${search.toLowerCase().trim()}%`);
          sql += ` AND (LOWER(full_name) LIKE $${params.length} OR phone LIKE $${params.length} OR LOWER(email) LIKE $${params.length} OR LOWER(address) LIKE $${params.length})`;
        }

        if (tag && tag !== 'all') {
          params.push(tag);
          sql += ` AND tag = $${params.length}`;
        }

        sql += ' ORDER BY updated_at DESC';
        const res = await db.query(sql, params);
        return (res.rows || []).map(mapRowToCustomer);
      } catch (err) {
        console.error('Lỗi lấy khách hàng từ Postgres:', err.message);
      }
    }

    // Fallback JSON
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

  static async findById(id) {
    if (db.isPostgres()) {
      try {
        const res = await db.query('SELECT * FROM customers WHERE id = $1 LIMIT 1', [id]);
        return res && res.rows[0] ? mapRowToCustomer(res.rows[0]) : null;
      } catch (err) {
        console.error('Lỗi tìm khách hàng theo id từ Postgres:', err.message);
      }
    }
    return customerDB.findById(id);
  }

  static async findByPhone(phone) {
    if (!phone) return null;
    const cleanPhone = phone.trim();

    if (db.isPostgres()) {
      try {
        const res = await db.query('SELECT * FROM customers WHERE phone = $1 LIMIT 1', [cleanPhone]);
        return res && res.rows[0] ? mapRowToCustomer(res.rows[0]) : null;
      } catch (err) {
        console.error('Lỗi tìm khách hàng theo SĐT từ Postgres:', err.message);
      }
    }
    return customerDB.findOne(c => c.phone && c.phone.trim() === cleanPhone);
  }

  static async rememberCustomer({ phone, fullName, email, address, note }) {
    if (!phone) return null;
    const cleanPhone = phone.trim();
    const existing = await this.findByPhone(cleanPhone);

    if (existing) {
      const orderCount = existing.orderCount || 0;
      const totalSpent = existing.totalSpent || 0;
      const newTag = existing.tag || calculateTag(orderCount, totalSpent);
      const visitCount = (existing.visitCount || 1) + 1;

      if (db.isPostgres()) {
        try {
          const res = await db.query(`
            UPDATE customers
            SET full_name = COALESCE($1, full_name),
                email = COALESCE($2, email),
                address = COALESCE($3, address),
                note = COALESCE($4, note),
                visit_count = $5,
                tag = $6,
                last_visited = NOW(),
                updated_at = NOW()
            WHERE id = $7
            RETURNING *
          `, [
            fullName || existing.fullName,
            email !== undefined ? email : existing.email,
            address || existing.address,
            note || existing.note,
            visitCount,
            newTag,
            existing.id
          ]);
          return mapRowToCustomer(res.rows[0]);
        } catch (err) {
          console.error('Lỗi cập nhật khách hàng vào Postgres:', err.message);
        }
      }

      return customerDB.update(existing.id, {
        fullName: fullName || existing.fullName,
        email: email !== undefined ? email : (existing.email || ''),
        address: address || existing.address,
        note: note || existing.note,
        visitCount,
        tag: newTag,
        lastVisited: new Date().toISOString()
      });
    }

    const newId = 'CUST_' + Date.now();
    if (db.isPostgres()) {
      try {
        const res = await db.query(`
          INSERT INTO customers (id, full_name, phone, email, address, note, admin_note, tag, visit_count, order_count, total_spent, last_visited)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 1, 0, 0, NOW())
          RETURNING *
        `, [
          newId,
          fullName || 'Khách hàng',
          cleanPhone,
          email || '',
          address || '',
          note || '',
          '',
          'Mới'
        ]);
        return mapRowToCustomer(res.rows[0]);
      } catch (err) {
        console.error('Lỗi tạo mới khách hàng vào Postgres:', err.message);
      }
    }

    const newCustomer = {
      id: newId,
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

  static async createCustomer({ fullName, phone, email, address, note, adminNote, tag }) {
    if (!fullName || !phone) {
      throw new Error('Vui lòng cung cấp họ tên và số điện thoại');
    }
    const cleanPhone = phone.trim();
    const existing = await this.findByPhone(cleanPhone);
    if (existing) {
      throw new Error(`Số điện thoại ${cleanPhone} đã tồn tại với khách hàng ${existing.fullName}`);
    }

    const newId = 'CUST_' + Date.now();
    const newTag = tag || 'Mới';

    if (db.isPostgres()) {
      try {
        const res = await db.query(`
          INSERT INTO customers (id, full_name, phone, email, address, note, admin_note, tag, visit_count, order_count, total_spent, last_visited)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 1, 0, 0, NOW())
          RETURNING *
        `, [newId, fullName, cleanPhone, email || '', address || '', note || '', adminNote || '', newTag]);
        return mapRowToCustomer(res.rows[0]);
      } catch (err) {
        throw new Error('Lỗi lưu khách hàng vào Postgres: ' + err.message);
      }
    }

    const newCustomer = {
      id: newId,
      fullName,
      phone: cleanPhone,
      email: email || '',
      address: address || '',
      note: note || '',
      adminNote: adminNote || '',
      tag: newTag,
      visitCount: 1,
      orderCount: 0,
      totalSpent: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    return customerDB.insert(newCustomer);
  }

  static async updateCustomer(id, data) {
    const existing = await this.findById(id);
    if (!existing) return null;

    const fullName = data.fullName !== undefined ? data.fullName : existing.fullName;
    const phone = data.phone !== undefined ? data.phone.trim() : existing.phone;
    const email = data.email !== undefined ? data.email : existing.email;
    const address = data.address !== undefined ? data.address : existing.address;
    const note = data.note !== undefined ? data.note : existing.note;
    const adminNote = data.adminNote !== undefined ? data.adminNote : existing.adminNote;
    const tag = data.tag || existing.tag;

    if (db.isPostgres()) {
      try {
        const res = await db.query(`
          UPDATE customers
          SET full_name = $1, phone = $2, email = $3, address = $4, note = $5, admin_note = $6, tag = $7, updated_at = NOW()
          WHERE id = $8
          RETURNING *
        `, [fullName, phone, email, address, note, adminNote, tag, id]);
        return mapRowToCustomer(res.rows[0]);
      } catch (err) {
        console.error('Lỗi sửa khách hàng Postgres:', err.message);
      }
    }

    return customerDB.update(id, {
      fullName, phone, email, address, note, adminNote, tag
    });
  }

  static async deleteCustomer(id) {
    if (db.isPostgres()) {
      try {
        const res = await db.query('DELETE FROM customers WHERE id = $1', [id]);
        return res.rowCount > 0;
      } catch (err) {
        console.error('Lỗi xóa khách hàng Postgres:', err.message);
      }
    }
    return customerDB.delete(id);
  }

  static async syncOrderStats(customerId, orderAmount) {
    const customer = await this.findById(customerId);
    if (!customer) return null;

    const newOrderCount = (customer.orderCount || 0) + 1;
    const newTotalSpent = (customer.totalSpent || 0) + (Number(orderAmount) || 0);
    const calculatedTag = calculateTag(newOrderCount, newTotalSpent);
    const newTag = customer.tag === 'VIP' ? 'VIP' : calculatedTag;

    if (db.isPostgres()) {
      try {
        const res = await db.query(`
          UPDATE customers
          SET order_count = $1, total_spent = $2, tag = $3, last_order_at = NOW(), updated_at = NOW()
          WHERE id = $4
          RETURNING *
        `, [newOrderCount, newTotalSpent, newTag, customerId]);
        return mapRowToCustomer(res.rows[0]);
      } catch (err) {
        console.error('Lỗi sync order stats Postgres:', err.message);
      }
    }

    return customerDB.update(customerId, {
      orderCount: newOrderCount,
      totalSpent: newTotalSpent,
      tag: newTag,
      lastOrderAt: new Date().toISOString()
    });
  }
}

module.exports = CustomerModel;
