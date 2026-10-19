const AuditTrail = require('../models/audit.model');
const db = require('../config/db');

class AuditRepository {
  async findAll({ document_id } = {}) {
    let query = `SELECT * FROM audit_trails`;
    const params = [];

    if (document_id) {
      params.push(document_id);
      query += ` WHERE document_id = $1`;
    }

    query += ` ORDER BY created_at DESC`;

    const res = await db.query(query, params);
    return res.rows.map(row => new AuditTrail(row));
  }

  async create(auditData) {
    try {
      const query = `
        INSERT INTO audit_trails (
          document_id, user_name, user_role, action, description,
          previous_status, new_status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;

      const res = await db.query(query, [
        auditData.document_id ? parseInt(auditData.document_id) : null,
        auditData.user_name || 'System',
        auditData.user_role || 'system',
        auditData.action,
        auditData.description,
        auditData.previous_status || '-',
        auditData.new_status || '-',
      ]);

      return new AuditTrail(res.rows[0]);
    } catch (err) {
      console.warn('⚠️ [AuditRepository Warning]: Gagal mencatat audit log:', err.message);
      // Fallback: catat tanpa document_id jika ada relasi yang tidak valid
      try {
        const fallbackQuery = `
          INSERT INTO audit_trails (
            document_id, user_name, user_role, action, description,
            previous_status, new_status
          ) VALUES (NULL, $1, $2, $3, $4, $5, $6)
          RETURNING *
        `;
        const res = await db.query(fallbackQuery, [
          auditData.user_name || 'System',
          auditData.user_role || 'system',
          auditData.action,
          `${auditData.description} (Ref No: ${auditData.nomor_surat || '-'})`,
          auditData.previous_status || '-',
          auditData.new_status || '-',
        ]);
        return new AuditTrail(res.rows[0]);
      } catch (fallbackErr) {
        console.error('❌ [AuditRepository Error]: Fallback audit log gagal:', fallbackErr.message);
        return new AuditTrail(auditData);
      }
    }
  }
}

module.exports = new AuditRepository();
