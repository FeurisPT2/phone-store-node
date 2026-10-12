const crypto = require('crypto');
const JsonDB = require('./database');
const db = require('../config/db');

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

const defaultAdmins = [
  {
    id: 'admin_1',
    username: 'admin',
    passwordHash: hashPassword('admin123'),
    fullName: 'Quản Trị Viên',
    email: 'admin@techstore.vn',
    role: 'Super Admin',
    createdAt: new Date().toISOString()
  }
];

const adminDB = new JsonDB('admins', defaultAdmins);

class AdminModel {
  static async findByUsername(username) {
    const cleanUser = (username || '').toLowerCase().trim();
    if (db.isPostgres()) {
      try {
        const res = await db.query('SELECT * FROM admins WHERE LOWER(username) = $1 LIMIT 1', [cleanUser]);
        if (res && res.rows.length > 0) {
          const row = res.rows[0];
          return {
            id: row.id,
            username: row.username,
            passwordHash: row.password_hash,
            fullName: row.full_name,
            email: row.email,
            role: row.role,
            createdAt: row.created_at
          };
        }
        return null;
      } catch (err) {
        console.error('Lỗi truy vấn admin từ Postgres:', err.message);
      }
    }
    return adminDB.findOne(a => a.username.toLowerCase() === cleanUser);
  }

  static async verify(username, password) {
    const admin = await this.findByUsername(username);
    if (!admin) return null;

    const hash = hashPassword(password);
    if (admin.passwordHash === hash || admin.password === password) {
      return {
        id: admin.id,
        username: admin.username,
        fullName: admin.fullName,
        email: admin.email,
        role: admin.role
      };
    }
    return null;
  }

  static async changePassword(username, oldPassword, newPassword) {
    const admin = await this.findByUsername(username);
    if (!admin) return { success: false, message: 'Không tìm thấy tài khoản quản trị' };

    const oldHash = hashPassword(oldPassword);
    if (admin.passwordHash !== oldHash && admin.password !== oldPassword) {
      return { success: false, message: 'Mật khẩu hiện tại không chính xác' };
    }

    if (!newPassword || newPassword.length < 6) {
      return { success: false, message: 'Mật khẩu mới phải có ít nhất 6 ký tự' };
    }

    const newHash = hashPassword(newPassword);

    if (db.isPostgres()) {
      try {
        await db.query('UPDATE admins SET password_hash = $1, updated_at = NOW() WHERE id = $2', [newHash, admin.id]);
        return { success: true, message: 'Đổi mật khẩu thành công!' };
      } catch (err) {
        return { success: false, message: 'Lỗi cập nhật mật khẩu Postgres: ' + err.message };
      }
    }

    adminDB.update(admin.id, {
      passwordHash: newHash,
      password: null,
      updatedAt: new Date().toISOString()
    });

    return { success: true, message: 'Đổi mật khẩu thành công!' };
  }
}

module.exports = AdminModel;
