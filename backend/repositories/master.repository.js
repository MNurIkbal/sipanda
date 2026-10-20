const db = require('../config/db');

class MasterRepository {
  // ===================== MASTER UNITS =====================
  async findAllUnits({ search } = {}) {
    let query = 'SELECT * FROM master_units WHERE 1=1';
    const params = [];

    if (search) {
      params.push(`%${search.toLowerCase().trim()}%`);
      query += ` AND LOWER(nama) LIKE $${params.length}`;
    }

    query += ' ORDER BY id ASC';
    const res = await db.query(query, params);
    return res.rows;
  }

  async findUnitById(id) {
    const res = await db.query('SELECT * FROM master_units WHERE id = $1', [id]);
    return res.rows[0] || null;
  }

  async findUnitByName(name, excludeId = null) {
    if (!name) return null;
    let query = 'SELECT * FROM master_units WHERE LOWER(nama) = $1';
    const params = [name.toLowerCase().trim()];

    if (excludeId) {
      params.push(excludeId);
      query += ` AND id != $${params.length}`;
    }

    const res = await db.query(query, params);
    return res.rows[0] || null;
  }

  async createUnit({ nama, keterangan, is_active = true }) {
    const res = await db.query(
      `INSERT INTO master_units (nama, keterangan, is_active, updated_at) 
       VALUES ($1, $2, $3, NOW()) 
       RETURNING *`,
      [nama.trim(), keterangan ? keterangan.trim() : null, is_active !== false]
    );
    return res.rows[0];
  }

  async updateUnit(id, { nama, keterangan, is_active }) {
    let query = 'UPDATE master_units SET updated_at = NOW()';
    const params = [];

    if (nama !== undefined) {
      params.push(nama.trim());
      query += `, nama = $${params.length}`;
    }
    if (keterangan !== undefined) {
      params.push(keterangan ? keterangan.trim() : null);
      query += `, keterangan = $${params.length}`;
    }
    if (is_active !== undefined) {
      params.push(Boolean(is_active));
      query += `, is_active = $${params.length}`;
    }

    params.push(id);
    query += ` WHERE id = $${params.length} RETURNING *`;

    const res = await db.query(query, params);
    return res.rows[0];
  }

  async deleteUnit(id) {
    const res = await db.query('DELETE FROM master_units WHERE id = $1 RETURNING *', [id]);
    return res.rows[0] || null;
  }

  // ===================== MASTER JENIS DOKUMEN =====================
  async findAllJenisDokumen({ search } = {}) {
    let query = 'SELECT * FROM master_jenis_dokumen WHERE 1=1';
    const params = [];

    if (search) {
      params.push(`%${search.toLowerCase().trim()}%`);
      query += ` AND LOWER(nama) LIKE $${params.length}`;
    }

    query += ' ORDER BY id ASC';
    const res = await db.query(query, params);
    return res.rows;
  }

  async findJenisDokumenById(id) {
    const res = await db.query('SELECT * FROM master_jenis_dokumen WHERE id = $1', [id]);
    return res.rows[0] || null;
  }

  async findJenisDokumenByName(name, excludeId = null) {
    if (!name) return null;
    let query = 'SELECT * FROM master_jenis_dokumen WHERE LOWER(nama) = $1';
    const params = [name.toLowerCase().trim()];

    if (excludeId) {
      params.push(excludeId);
      query += ` AND id != $${params.length}`;
    }

    const res = await db.query(query, params);
    return res.rows[0] || null;
  }

  async createJenisDokumen({ nama, keterangan, is_active = true }) {
    const res = await db.query(
      `INSERT INTO master_jenis_dokumen (nama, keterangan, is_active, updated_at) 
       VALUES ($1, $2, $3, NOW()) 
       RETURNING *`,
      [nama.trim(), keterangan ? keterangan.trim() : null, is_active !== false]
    );
    return res.rows[0];
  }

  async updateJenisDokumen(id, { nama, keterangan, is_active }) {
    let query = 'UPDATE master_jenis_dokumen SET updated_at = NOW()';
    const params = [];

    if (nama !== undefined) {
      params.push(nama.trim());
      query += `, nama = $${params.length}`;
    }
    if (keterangan !== undefined) {
      params.push(keterangan ? keterangan.trim() : null);
      query += `, keterangan = $${params.length}`;
    }
    if (is_active !== undefined) {
      params.push(Boolean(is_active));
      query += `, is_active = $${params.length}`;
    }

    params.push(id);
    query += ` WHERE id = $${params.length} RETURNING *`;

    const res = await db.query(query, params);
    return res.rows[0];
  }

  async deleteJenisDokumen(id) {
    const res = await db.query('DELETE FROM master_jenis_dokumen WHERE id = $1 RETURNING *', [id]);
    return res.rows[0] || null;
  }
}

module.exports = new MasterRepository();
