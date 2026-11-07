const crypto = require('crypto');
const { adminStorage } = require('./storage');

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

class AdminModel {
  static async findByUsername(username) {
    const cleanUser = (username || '').toLowerCase().trim();
    if (!cleanUser) return null;
    return await adminStorage.findOne({ username: { $iexact: cleanUser } });
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

    try {
      await adminStorage.update(admin.id, {
        passwordHash: newHash,
        password: null
      });
      return { success: true, message: 'Đổi mật khẩu thành công!' };
    } catch (err) {
      return { success: false, message: 'Lỗi cập nhật mật khẩu: ' + err.message };
    }
  }
}

module.exports = AdminModel;
