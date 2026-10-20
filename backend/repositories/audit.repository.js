const AuditTrail = require('../models/audit.model');
const db = require('../config/db');

class AuditRepository {
  async findAll({ document_id, search, page, limit } = {}) {
    let baseWhere = `WHERE 1=1`;
    const params = [];

    if (document_id) {
      params.push(document_id);
      baseWhere += ` AND a.document_id = $${params.length}`;
    }

    if (search) {
      params.push(`%${search.toLowerCase()}%`);
      baseWhere += ` AND (
        LOWER(a.user_name) LIKE $${params.length} OR
        LOWER(a.user_role) LIKE $${params.length} OR
        LOWER(a.action) LIKE $${params.length} OR
        LOWER(a.description) LIKE $${params.length} OR
        LOWER(COALESCE(d.nomor_surat, substring(a.description from 'Ref No: ([^\\)]+)'), '')) LIKE $${params.length}
      )`;
    }

    // Hitung total log sesuai filter
    const countQuery = `
      SELECT COUNT(a.id) as total 
      FROM audit_trails a 
      LEFT JOIN payment_documents d ON a.document_id = d.id 
      ${baseWhere}
    `;
    const countRes = await db.query(countQuery, params);
    const total = parseInt(countRes.rows[0].total, 10);

    let query = `
      SELECT 
        a.*,
        COALESCE(d.nomor_surat, substring(a.description from 'Ref No: ([^\\)]+)'), '-') as nomor_surat
      FROM audit_trails a
      LEFT JOIN payment_documents d ON a.document_id = d.id
      ${baseWhere}
      ORDER BY a.created_at DESC
    `;

    if (limit && page) {
      const pageNum = parseInt(page, 10) || 1;
      const limitNum = parseInt(limit, 10) || 10;
      const offset = (pageNum - 1) * limitNum;

      params.push(limitNum);
      query += ` LIMIT $${params.length}`;

      params.push(offset);
      query += ` OFFSET $${params.length}`;
    }

    const res = await db.query(query, params);
    const logs = res.rows.map(row => new AuditTrail(row));

    if (page || limit) {
      return {
        logs,
        total,
        page: parseInt(page, 10) || 1,
        limit: parseInt(limit, 10) || 10,
      };
    }

    return logs;
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
