const PaymentDocument = require('../models/document.model');
const db = require('../config/db');

class DocumentRepository {
  async findAll({ status, search, unit_kerja, jenis_dokumen, start_date, end_date, page, limit, user_role } = {}) {
    let baseWhere = `WHERE 1=1`;
    const params = [];

    // Filter khusus Biro 01:
    // Biro 01 TIDAK BOLEH melihat dokumen yang masih berstatus 'draft'
    // dan dokumen yang ditolak/dikembalikan ('dikembalikan' / 'ditolak')
    if (user_role === 'biro_01') {
      baseWhere += ` AND d.status NOT IN ('draft', 'dikembalikan', 'ditolak')`;
    }

    if (status && status !== 'ALL') {
      params.push(status);
      baseWhere += ` AND d.status = $${params.length}`;
    }

    if (unit_kerja && unit_kerja !== 'ALL') {
      params.push(unit_kerja.trim());
      baseWhere += ` AND d.unit_kerja = $${params.length}`;
    }

    if (jenis_dokumen && jenis_dokumen !== 'ALL') {
      params.push(jenis_dokumen.trim());
      baseWhere += ` AND d.jenis_dokumen = $${params.length}`;
    }

    // Filter rentang tanggal berdasarkan tanggal_pengajuan atau tanggal_dokumen
    if (start_date && start_date.trim()) {
      params.push(start_date.trim());
      baseWhere += ` AND (COALESCE(d.tanggal_pengajuan, d.tanggal_dokumen, d.created_at::date) >= $${params.length}::date)`;
    }

    if (end_date && end_date.trim()) {
      params.push(end_date.trim());
      baseWhere += ` AND (COALESCE(d.tanggal_pengajuan, d.tanggal_dokumen, d.created_at::date) <= $${params.length}::date)`;
    }

    if (search) {
      params.push(`%${search.toLowerCase()}%`);
      baseWhere += ` AND (
        LOWER(d.nomor_surat) LIKE $${params.length} OR
        LOWER(COALESCE(d.nama_kegiatan, '')) LIKE $${params.length} OR
        LOWER(COALESCE(d.perihal, '')) LIKE $${params.length} OR
        LOWER(COALESCE(d.jenis_dokumen, '')) LIKE $${params.length} OR
        LOWER(COALESCE(d.pihak_eksternal, '')) LIKE $${params.length} OR
        LOWER(d.ppk_name) LIKE $${params.length} OR
        LOWER(d.unit_kerja) LIKE $${params.length} OR
        LOWER(COALESCE(d.nomor_agenda, '')) LIKE $${params.length}
      )`;
    }

    // Hitung total data sesuai filter
    const countQuery = `SELECT COUNT(DISTINCT d.id) as total FROM payment_documents d ${baseWhere}`;
    const countRes = await db.query(countQuery, params);
    const total = parseInt(countRes.rows[0].total, 10);

    let query = `
      SELECT 
        d.*,
        u.full_name as verified_by_name,
        COALESCE(
          json_agg(
            json_build_object(
              'id', a.id,
              'file_name', a.file_name,
              'file_path', a.file_path,
              'file_size', a.file_size,
              'mime_type', a.mime_type,
              'document_type', a.document_type,
              'nomor_dokumen', a.nomor_dokumen,
              'tanggal_dokumen', a.tanggal_dokumen
            )
          ) FILTER (WHERE a.id IS NOT NULL),
          '[]'
        ) as attachments
      FROM payment_documents d
      LEFT JOIN users u ON d.verified_by_id = u.id
      LEFT JOIN document_attachments a ON d.id = a.document_id
      ${baseWhere}
      GROUP BY d.id, u.full_name
      ORDER BY d.id DESC
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
    const documents = res.rows.map(row => new PaymentDocument(row));

    // Jika dipanggil dengan pagination param (page/limit), return objek terstruktur
    if (page || limit) {
      return {
        documents,
        total,
        page: parseInt(page, 10) || 1,
        limit: parseInt(limit, 10) || total,
        totalPages: limit ? Math.ceil(total / parseInt(limit, 10)) : 1,
      };
    }

    // Jika dipanggil tanpa page/limit (misal untuk monitoring dashboard), return array untuk backwards compatibility
    return documents;
  }

  async findById(id) {
    const query = `
      SELECT 
        d.*,
        u.full_name as verified_by_name,
        COALESCE(
          json_agg(
            json_build_object(
              'id', a.id,
              'file_name', a.file_name,
              'file_path', a.file_path,
              'file_size', a.file_size,
              'mime_type', a.mime_type,
              'document_type', a.document_type,
              'nomor_dokumen', a.nomor_dokumen,
              'tanggal_dokumen', a.tanggal_dokumen
            )
          ) FILTER (WHERE a.id IS NOT NULL),
          '[]'
        ) as attachments
      FROM payment_documents d
      LEFT JOIN users u ON d.verified_by_id = u.id
      LEFT JOIN document_attachments a ON d.id = a.document_id
      WHERE d.id = $1
      GROUP BY d.id, u.full_name
    `;

    const res = await db.query(query, [id]);
    if (res.rows.length === 0) return null;
    return new PaymentDocument(res.rows[0]);
  }

  async findByNomorSurat(nomorSurat) {
    const res = await db.query(
      'SELECT * FROM payment_documents WHERE nomor_surat = $1',
      [nomorSurat]
    );
    if (res.rows.length === 0) return null;
    return new PaymentDocument(res.rows[0]);
  }

  async create(docData) {
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');

      const docQuery = `
        INSERT INTO payment_documents (
          nomor_surat, nomor_agenda, nama_kegiatan, kategori,
          ppk_name, unit_kerja, nilai_pembayaran, status,
          legend_status, legend_color, created_by_id,
          jenis_dokumen, perihal, tanggal_dokumen, tanggal_diterima,
          pihak_eksternal, keterangan
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
        RETURNING *
      `;

      const docValues = [
        docData.nomor_surat,
        docData.nomor_agenda,
        docData.nama_kegiatan || docData.perihal || 'Pengajuan Pembayaran',
        docData.kategori || docData.jenis_dokumen || 'LS-Kontraktual',
        docData.ppk_name,
        docData.unit_kerja,
        docData.nilai_pembayaran,
        docData.status || 'menunggu_verifikasi',
        'Menunggu Verifikasi',
        'amber',
        docData.created_by_id || null,
        docData.jenis_dokumen || '',
        docData.perihal || '',
        docData.tanggal_dokumen || null,
        docData.tanggal_diterima || new Date(),
        docData.pihak_eksternal || '',
        docData.keterangan || '',
      ];

      const docRes = await client.query(docQuery, docValues);
      const insertedDoc = docRes.rows[0];

      // Insert Multiple Lampiran Berkas Dokumen Pendukung
      const attachments = [];
      if (docData.attachments && docData.attachments.length > 0) {
        for (const att of docData.attachments) {
          const attQuery = `
            INSERT INTO document_attachments (
              document_id, file_name, file_path, file_size, mime_type,
              document_type, uploaded_by_id, nomor_dokumen, tanggal_dokumen
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING *
          `;
          const attRes = await client.query(attQuery, [
            insertedDoc.id,
            att.file_name,
            att.file_path,
            att.file_size,
            att.mime_type,
            att.document_type || 'Dokumen Pendukung',
            att.uploaded_by_id || null,
            att.nomor_dokumen || '',
            att.tanggal_dokumen || null,
          ]);
          attachments.push(attRes.rows[0]);
        }
      }

      await client.query('COMMIT');
      return new PaymentDocument({ ...insertedDoc, attachments });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async update(id, updateFields) {
    const fields = [];
    const values = [];
    let idx = 1;

    const allowedFields = [
      'nomor_surat',
      'ppk_name',
      'unit_kerja',
      'nama_kegiatan',
      'kategori',
      'nilai_pembayaran',
      'status',
      'catatan_revisi',
      'catatan_verifikasi',
      'tanggal_verifikasi',
      'verified_by_id',
      'legend_status',
      'legend_color',
      'jenis_dokumen',
      'perihal',
      'tanggal_dokumen',
      'tanggal_diterima',
      'pihak_eksternal',
      'keterangan',
      'bast_generated',
      'bap_generated',
      'bapp_generated',
      'official_docs_data',
    ];

    for (const key of allowedFields) {
      if (updateFields[key] !== undefined) {
        fields.push(`${key} = $${idx}`);
        values.push(updateFields[key]);
        idx++;
      }
    }

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const query = `
      UPDATE payment_documents
      SET ${fields.join(', ')}
      WHERE id = $${idx}
      RETURNING *
    `;

    await db.query(query, values);
    return this.findById(id);
  }

  async addAttachments(documentId, attachmentsList) {
    const inserted = [];
    for (const att of attachmentsList) {
      const q = `
        INSERT INTO document_attachments (
          document_id, file_name, file_path, file_size, mime_type,
          document_type, nomor_dokumen, tanggal_dokumen
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `;
      const res = await db.query(q, [
        documentId,
        att.file_name,
        att.file_path,
        att.file_size,
        att.mime_type,
        att.document_type || 'Dokumen Pendukung',
        att.nomor_dokumen || '',
        att.tanggal_dokumen || null,
      ]);
      inserted.push(res.rows[0]);
    }
    return inserted;
  }

  async updateAttachment(attachmentId, { document_type, nomor_dokumen, tanggal_dokumen }) {
    const fields = [];
    const values = [];
    let idx = 1;

    if (document_type !== undefined) {
      fields.push(`document_type = $${idx++}`);
      values.push(document_type);
    }
    if (nomor_dokumen !== undefined) {
      fields.push(`nomor_dokumen = $${idx++}`);
      values.push(nomor_dokumen);
    }
    if (tanggal_dokumen !== undefined) {
      fields.push(`tanggal_dokumen = $${idx++}`);
      values.push(tanggal_dokumen || null);
    }

    if (fields.length === 0) return null;

    values.push(attachmentId);
    const query = `
      UPDATE document_attachments
      SET ${fields.join(', ')}
      WHERE id = $${idx}
      RETURNING *
    `;
    const res = await db.query(query, values);
    return res.rows[0] || null;
  }

  async deleteAttachment(attachmentId) {
    const res = await db.query('DELETE FROM document_attachments WHERE id = $1 RETURNING *', [attachmentId]);
    return res.rows[0] || null;
  }

  async delete(id) {
    const doc = await this.findById(id);
    if (!doc) return null;

    await db.query('DELETE FROM payment_documents WHERE id = $1', [id]);
    return doc;
  }
}

module.exports = new DocumentRepository();
