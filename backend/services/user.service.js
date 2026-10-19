const userRepository = require('../repositories/user.repository');
const { validatePasswordSecurity, hashPassword, verifyPassword } = require('../utils/password.util');

class UserService {
  async authenticate(loginIdentifier, password) {
    if (!loginIdentifier || !password) {
      throw new Error('Email dan password wajib diisi!');
    }

    // Cari user berdasarkan email
    const user = await userRepository.findByEmail(loginIdentifier);
    if (!user) {
      throw new Error('Email atau password tidak sesuai!');
    }

    const isValid = verifyPassword(password, user.password_hash);
    if (!isValid) {
      throw new Error('Email atau password tidak sesuai!');
    }

    return {
      user: user.toSafeObject(),
      token: `jwt-token-sipandu-${user.id}-${Date.now()}`,
    };
  }

  async getAllUsers(filters = {}) {
    const result = await userRepository.findAll(filters);
    return {
      users: result.users.map(u => u.toSafeObject()),
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    };
  }

  async getUserById(id) {
    const user = await userRepository.findById(id);
    if (!user) throw new Error('Pengguna tidak ditemukan!');
    return user.toSafeObject();
  }

  async createUser(userData) {
    // Validasi field wajib: email, password, full_name, role
    if (!userData.email || !userData.email.trim()) {
      throw new Error('Email akun wajib diisi!');
    }

    // Validasi format email dasar
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userData.email.trim())) {
      throw new Error('Format email tidak valid (contoh: user@kemenkeu.go.id)!');
    }

    if (!userData.full_name || !userData.full_name.trim()) {
      throw new Error('Nama lengkap wajib diisi!');
    }

    if (!userData.role) {
      throw new Error('Role akses wajib dipilih!');
    }

    // Validasi aturan password: min 8 karakter, huruf besar & kecil
    const passwordCheck = validatePasswordSecurity(userData.password);
    if (!passwordCheck.valid) {
      throw new Error(passwordCheck.message);
    }

    // Periksa keunikan email
    const existing = await userRepository.findByEmail(userData.email);
    if (existing) {
      throw new Error(`Email "${userData.email}" sudah terdaftar di sistem!`);
    }

    // Enkripsi password menggunakan SHA-256 salted hash
    const password_hash = hashPassword(userData.password);

    const created = await userRepository.create({
      ...userData,
      password_hash,
    });

    return created.toSafeObject();
  }

  async updateUser(id, userData) {
    const user = await userRepository.findById(id);
    if (!user) throw new Error('Pengguna tidak ditemukan!');

    if (userData.email && userData.email.trim().toLowerCase() !== user.email.toLowerCase()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(userData.email.trim())) {
        throw new Error('Format email tidak valid!');
      }

      const existing = await userRepository.findByEmail(userData.email);
      if (existing && existing.id !== parseInt(id, 10)) {
        throw new Error(`Email "${userData.email}" sudah digunakan oleh pengguna lain!`);
      }
    }

    let password_hash = undefined;
    if (userData.password && userData.password.trim() !== '') {
      const passwordCheck = validatePasswordSecurity(userData.password);
      if (!passwordCheck.valid) {
        throw new Error(passwordCheck.message);
      }
      password_hash = hashPassword(userData.password);
    }

    const updated = await userRepository.update(id, {
      ...userData,
      password_hash,
    });

    return updated.toSafeObject();
  }

  async changePassword(id, { currentPassword, newPassword }) {
    const user = await userRepository.findById(id);
    if (!user) throw new Error('Pengguna tidak ditemukan!');

    const isValidCurrent = verifyPassword(currentPassword, user.password_hash);
    if (!isValidCurrent) {
      throw new Error('Password saat ini tidak sesuai!');
    }

    const passwordCheck = validatePasswordSecurity(newPassword);
    if (!passwordCheck.valid) {
      throw new Error(passwordCheck.message);
    }

    const newHash = hashPassword(newPassword);
    const updated = await userRepository.updatePassword(id, newHash);
    return updated.toSafeObject();
  }

  async deleteUser(id) {
    const deleted = await userRepository.delete(id);
    if (!deleted) throw new Error('Pengguna tidak ditemukan atau gagal dihapus!');
    return deleted.toSafeObject();
  }
}

module.exports = new UserService();
