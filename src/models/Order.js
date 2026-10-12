const JsonDB = require('./database');
const db = require('../config/db');

const orderDB = new JsonDB('orders');

function mapRowToOrder(row) {
  if (!row) return null;
  return {
    id: row.id,
    customerId: row.customer_id,
    customerInfo: typeof row.customer_info === 'string' ? JSON.parse(row.customer_info) : row.customer_info,
    items: typeof row.items === 'string' ? JSON.parse(row.items) : row.items,
    totalAmount: parseInt(row.total_amount) || 0,
    status: row.status,
    adminNote: row.admin_note,
    note: row.note,
    statusHistory: typeof row.status_history === 'string' ? JSON.parse(row.status_history) : row.status_history,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

class OrderModel {
  static async createOrder({ customerId, customerInfo, items, totalAmount, note = '' }) {
    const id = 'ORD_' + Date.now();
    const amount = Number(totalAmount) || 0;
    const history = [
      {
        status: 'pending',
        title: 'Đơn hàng mới tạo',
        time: new Date().toISOString(),
        note: 'Khách hàng hoàn tất đặt hàng trên website'
      }
    ];

    if (db.isPostgres()) {
      try {
        const res = await db.query(`
          INSERT INTO orders (id, customer_id, customer_info, items, total_amount, status, admin_note, note, status_history)
          VALUES ($1, $2, $3, $4, $5, 'pending', '', $6, $7)
          RETURNING *
        `, [
          id,
          customerId || null,
          JSON.stringify(customerInfo || {}),
          JSON.stringify(items || []),
          amount,
          note || customerInfo?.note || '',
          JSON.stringify(history)
        ]);
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
      status: 'pending',
      adminNote: '',
      note: note || customerInfo?.note || '',
      statusHistory: history,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    return orderDB.insert(order);
  }

  static async getAll({ status = '', search = '' } = {}) {
    if (db.isPostgres()) {
      try {
        let sql = 'SELECT * FROM orders WHERE 1=1';
        const params = [];

        if (status && status !== 'all') {
          params.push(status);
          sql += ` AND status = $${params.length}`;
        }

        if (search) {
          const q = `%${search.toLowerCase().trim()}%`;
          params.push(q);
          sql += ` AND (LOWER(id) LIKE $${params.length} OR LOWER(customer_info->>'fullName') LIKE $${params.length} OR (customer_info->>'phone') LIKE $${params.length})`;
        }

        sql += ' ORDER BY created_at DESC';
        const res = await db.query(sql, params);
        return (res.rows || []).map(mapRowToOrder);
      } catch (err) {
        console.error('Lỗi lấy danh sách đơn từ Postgres:', err.message);
      }
    }

    // Fallback JSON
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

  static async findById(id) {
    if (db.isPostgres()) {
      try {
        const res = await db.query('SELECT * FROM orders WHERE id = $1 LIMIT 1', [id]);
        return res && res.rows[0] ? mapRowToOrder(res.rows[0]) : null;
      } catch (err) {
        console.error('Lỗi tìm đơn theo id từ Postgres:', err.message);
      }
    }
    return orderDB.findById(id);
  }

  static async findByCustomerId(customerId) {
    if (!customerId) return [];
    if (db.isPostgres()) {
      try {
        const res = await db.query('SELECT * FROM orders WHERE customer_id = $1 ORDER BY created_at DESC', [customerId]);
        return (res.rows || []).map(mapRowToOrder);
      } catch (err) {
        console.error('Lỗi tìm đơn theo khách hàng từ Postgres:', err.message);
      }
    }
    return orderDB.findAll()
      .filter(o => o.customerId === customerId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  static async updateStatus(id, newStatus, note = '') {
    const order = await this.findById(id);
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

    if (db.isPostgres()) {
      try {
        const res = await db.query(`
          UPDATE orders
          SET status = $1, status_history = $2, admin_note = COALESCE($3, admin_note), updated_at = NOW()
          WHERE id = $4
          RETURNING *
        `, [newStatus, JSON.stringify(history), note || null, id]);
        return mapRowToOrder(res.rows[0]);
      } catch (err) {
        console.error('Lỗi cập nhật trạng thái đơn Postgres:', err.message);
      }
    }

    return orderDB.update(id, {
      status: newStatus,
      statusHistory: history,
      adminNote: note ? note : (order.adminNote || '')
    });
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
