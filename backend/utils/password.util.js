const crypto = require('crypto');

/**
 * Validasi kekuatan password:
 * - Minimal 8 karakter
 * - Memiliki minimal 1 huruf besar (uppercase)
 * - Memiliki minimal 1 huruf kecil (lowercase)
 */
function validatePasswordSecurity(password) {
  if (!password || typeof password !== 'string') {
    return { valid: false, message: 'Password wajib diisi!' };
  }

  if (password.length < 8) {
    return { valid: false, message: 'Password harus memiliki minimal 8 karakter!' };
  }

  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password harus mengandung minimal 1 huruf besar (A-Z)!' };
  }

  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Password harus mengandung minimal 1 huruf kecil (a-z)!' };
  }

  return { valid: true };
}

/**
 * Enkripsi password menggunakan SHA-256 hash dengan salt
 */
function hashPassword(password) {
  const salt = 'sipandu_salt_2027';
  return crypto.createHash('sha256').update(password + salt).digest('hex');
}

/**
 * Verifikasi password plain dengan hash di database (juga kompatibel dengan password legacy plain)
 */
function verifyPassword(plainPassword, storedHash) {
  if (!storedHash) return false;
  // Periksa hash enkripsi sha256
  const computedHash = hashPassword(plainPassword);
  if (computedHash === storedHash) return true;
  // Fallback untuk password seed awal plain (misal: 'biro123', 'petugas123')
  return plainPassword === storedHash;
}

module.exports = {
  validatePasswordSecurity,
  hashPassword,
  verifyPassword,
};
