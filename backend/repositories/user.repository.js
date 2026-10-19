const User = require('../models/user.model');
const db = require('../config/db');

class UserRepository {
  async findAll({ search, role, page, limit } = {}) {
    let baseQuery = `FROM users WHERE 1=1`;
    const params = [];

    if (search) {
      params.push(`%${search.toLowerCase()}%`);
      baseQuery += ` AND (
        LOWER(COALESCE(email, '')) LIKE $${params.length} OR
        LOWER(full_name) LIKE $${params.length} OR
        LOWER(COALESCE(nip, '')) LIKE $${params.length} OR
        LOWER(COALESCE(unit_kerja, '')) LIKE $${params.length} OR
        LOWER(COALESCE(phone, '')) LIKE $${params.length}
      )`;
    }

    if (role && role !== 'ALL') {
      params.push(role);
      baseQuery += ` AND role = $${params.length}`;
    }

    // Hitung total data
    const countRes = await db.query(`SELECT COUNT(*) as total ${baseQuery}`, params);
    const total = parseInt(countRes.rows[0].total, 10);

    // Query data dengan paginasi
    let dataQuery = `SELECT * ${baseQuery} ORDER BY id ASC`;

    if (limit && page) {
      const pageNum = parseInt(page, 10) || 1;
      const limitNum = parseInt(limit, 10) || 10;
      const offset = (pageNum - 1) * limitNum;

      params.push(limitNum);
      dataQuery += ` LIMIT $${params.length}`;

      params.push(offset);
      dataQuery += ` OFFSET $${params.length}`;
    }

    const res = await db.query(dataQuery, params);
    const users = res.rows.map(row => new User(row));

    return {
      users,
      total,
      page: parseInt(page, 10) || 1,
      limit: parseInt(limit, 10) || total,
      totalPages: limit ? Math.ceil(total / parseInt(limit, 10)) : 1,
    };
  }

  async findByEmail(identifier) {
    if (!identifier) return null;
    const clean = identifier.trim().toLowerCase();
    const res = await db.query(
      'SELECT * FROM users WHERE LOWER(email) = $1 OR LOWER(full_name) = $1',
      [clean]
    );
    if (res.rows.length === 0) return null;
    return new User(res.rows[0]);
  }

  async findById(id) {
    const res = await db.query('SELECT * FROM users WHERE id = $1', [id]);
    if (res.rows.length === 0) return null;
    return new User(res.rows[0]);
  }

  async create(userData) {
    const res = await db.query(
      `INSERT INTO users (email, password_hash, full_name, nip, role, unit_kerja, phone)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        userData.email.trim().toLowerCase(),
        userData.password_hash,
        userData.full_name.trim(),
        userData.nip ? userData.nip.trim() : null,
        userData.role || 'ppk',
        userData.unit_kerja ? userData.unit_kerja.trim() : null,
        userData.phone ? userData.phone.trim() : null,
      ]
    );
    return new User(res.rows[0]);
  }

  async update(id, userData) {
    const existing = await this.findById(id);
    if (!existing) return null;

    const email = userData.email ? userData.email.trim().toLowerCase() : existing.email;
    const fullName = userData.full_name ? userData.full_name.trim() : existing.full_name;
    const nip = userData.nip !== undefined ? (userData.nip ? userData.nip.trim() : null) : existing.nip;
    const role = userData.role || existing.role;
    const unitKerja = userData.unit_kerja !== undefined ? (userData.unit_kerja ? userData.unit_kerja.trim() : null) : existing.unit_kerja;
    const phone = userData.phone !== undefined ? (userData.phone ? userData.phone.trim() : null) : existing.phone;

    let query = `
      UPDATE users 
      SET email = $1, full_name = $2, nip = $3, role = $4, unit_kerja = $5, phone = $6, updated_at = NOW()
    `;
    const params = [email, fullName, nip, role, unitKerja, phone];

    if (userData.password_hash) {
      params.push(userData.password_hash);
      query += `, password_hash = $${params.length}`;
    }

    params.push(id);
    query += ` WHERE id = $${params.length} RETURNING *`;

    const res = await db.query(query, params);
    return new User(res.rows[0]);
  }

  async updatePassword(id, newPasswordHash) {
    const user = await this.findById(id);
    if (!user) return null;

    const res = await db.query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [newPasswordHash, id]
    );
    return new User(res.rows[0]);
  }

  async delete(id) {
    const user = await this.findById(id);
    if (!user) return null;

    await db.query('DELETE FROM users WHERE id = $1', [id]);
    return user;
  }
}

module.exports = new UserRepository();
