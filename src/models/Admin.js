const crypto = require('crypto');
const JsonDB = require('./database');

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
  static getAdmin() {
    const admins = adminDB.findAll();
    if (admins.length === 0) {
      const def = defaultAdmins[0];
      adminDB.insert(def);
      return def;
    }
    return admins[0];
  }

  static findByUsername(username) {
    return adminDB.findOne(a => a.username.toLowerCase() === (username || '').toLowerCase().trim());
  }

  static verify(username, password) {
    const admin = this.findByUsername(username);
    if (!admin) return null;

    const hash = hashPassword(password);
    // Backward compatibility if plain text exists or matching hash
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

  static changePassword(username, oldPassword, newPassword) {
    const admin = this.findByUsername(username);
    if (!admin) return { success: false, message: 'Không tìm thấy tài khoản quản trị' };

    const oldHash = hashPassword(oldPassword);
    if (admin.passwordHash !== oldHash && admin.password !== oldPassword) {
      return { success: false, message: 'Mật khẩu hiện tại không chính xác' };
    }

    if (!newPassword || newPassword.length < 6) {
      return { success: false, message: 'Mật khẩu mới phải có ít nhất 6 ký tự' };
    }

    adminDB.update(admin.id, {
      passwordHash: hashPassword(newPassword),
      password: null, // clear old plain text if any
      updatedAt: new Date().toISOString()
    });

    return { success: true, message: 'Đổi mật khẩu thành công!' };
  }
}

module.exports = AdminModel;
