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

  static generateToken(admin) {
    if (!admin || !admin.username) return null;
    const secret = process.env.SESSION_SECRET || 'phone_store_secret_2026';
    const payload = JSON.stringify({
      id: admin.id,
      username: admin.username,
      role: admin.role || 'admin',
      iat: Date.now()
    });
    const b64 = Buffer.from(payload).toString('base64url');
    const sig = crypto.createHmac('sha256', secret).update(b64).digest('base64url');
    return `${b64}.${sig}`;
  }

  static verifyToken(token) {
    if (!token || typeof token !== 'string') return null;
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const [b64, sig] = parts;
    const secret = process.env.SESSION_SECRET || 'phone_store_secret_2026';
    const expectedSig = crypto.createHmac('sha256', secret).update(b64).digest('base64url');
    if (sig.length !== expectedSig.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))) {
      return null;
    }
    try {
      const data = JSON.parse(Buffer.from(b64, 'base64url').toString('utf8'));
      if (Date.now() - data.iat > 7 * 24 * 60 * 60 * 1000) {
        return null;
      }
      return data;
    } catch {
      return null;
    }
  }
}

module.exports = AdminModel;
