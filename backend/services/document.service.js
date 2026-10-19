const documentRepository = require('../repositories/document.repository');
const auditService = require('./audit.service');
const { getLegendForStatus } = require('../utils/status.util');

class DocumentService {
  async getAllDocuments(filters) {
    return documentRepository.findAll(filters);
  }

  async getDocumentById(id) {
    const doc = await documentRepository.findById(id);
    if (!doc) throw new Error('Dokumen tidak ditemukan!');
    return doc;
  }

  async createDocument(data, files = []) {
    const {
      nomor_surat,
      nomor_agenda,
      nama_kegiatan,
      kategori,
      ppk_name,
      unit_kerja,
      nilai_pembayaran,
      user_name,
      user_role,
      user_id,
      jenis_dokumen,
      perihal,
      tanggal_dokumen,
      tanggal_diterima,
      pihak_eksternal,
      keterangan,
      status, // 'draft' | 'menunggu_verifikasi'
    } = data;

    if (!nomor_surat) {
      throw new Error('Nomor Surat / Nomor Dokumen wajib diisi!');
    }

    const existing = await documentRepository.findByNomorSurat(nomor_surat);
    if (existing) {
      throw new Error(`Nomor Surat "${nomor_surat}" sudah terdaftar di database!`);
    }

    // Parse attachments dari metadata request form
    let attachmentMeta = [];
    try {
      if (data.attachment_meta) {
        attachmentMeta = JSON.parse(data.attachment_meta);
      }
    } catch (e) {
      attachmentMeta = [];
    }

    const attachments = files.map((file, idx) => {
      const meta = attachmentMeta[idx] || {};
      return {
        file_name: file.originalname,
        file_path: `/uploads/${file.filename}`,
        file_size: file.size,
        mime_type: file.mimetype,
        document_type: meta.document_type || data[`doc_type_${idx}`] || 'Dokumen Pendukung',
        nomor_dokumen: meta.nomor_dokumen || data[`doc_num_${idx}`] || '',
        tanggal_dokumen: meta.tanggal_dokumen || data[`doc_date_${idx}`] || null,
        uploaded_by_id: user_id ? parseInt(user_id) : null,
      };
    });

    const docStatus = status === 'draft' ? 'draft' : 'menunggu_verifikasi';

    const newDoc = await documentRepository.create({
      nomor_surat,
      nomor_agenda: nomor_agenda || `AGD-${Date.now().toString().slice(-4)}`,
      nama_kegiatan: perihal || nama_kegiatan || jenis_dokumen || 'Pengajuan Pembayaran',
      kategori: jenis_dokumen || kategori || 'LS-Kontraktual',
      ppk_name: ppk_name || 'Petugas Pengadaan',
      unit_kerja: unit_kerja || 'PPK Kegiatan Operasional',
      nilai_pembayaran: Number(nilai_pembayaran) || 0,
      jenis_dokumen: jenis_dokumen || '',
      perihal: perihal || '',
      tanggal_dokumen: tanggal_dokumen || null,
      tanggal_diterima: tanggal_diterima || new Date(),
      pihak_eksternal: pihak_eksternal || '',
      keterangan: keterangan || '',
      attachments,
      status: docStatus,
      created_by_id: user_id ? parseInt(user_id) : null,
    });

    await auditService.log({
      document_id: newDoc.id,
      nomor_surat: newDoc.nomor_surat,
      user_name: user_name || ppk_name || 'Petugas',
      user_role: user_role || 'petugas',
      action: docStatus === 'draft' ? 'SAVE_DRAFT' : 'CREATE_DOCUMENT',
      description: `Mendaftarkan dokumen ${newDoc.nomor_surat} (${newDoc.jenis_dokumen || newDoc.nama_kegiatan}) dengan ${attachments.length} dokumen pendukung`,
      previous_status: '-',
      new_status: docStatus,
    });

    return newDoc;
  }

  async verifyDocument(id, { action, pesan, verifier_name, verifier_role, verifier_id }) {
    const doc = await documentRepository.findById(id);
    if (!doc) throw new Error('Dokumen tidak ditemukan!');

    const prevStatus = doc.status;

    if (action === 'approve') {
      const updated = await documentRepository.update(id, {
        status: 'lengkap_valid',
        legend_status: 'Lengkap / Valid (Disetujui)',
        legend_color: 'emerald',
        catatan_verifikasi: pesan || 'Dokumen telah diverifikasi dan dinyatakan lengkap serta sah.',
        tanggal_verifikasi: new Date(),
        verified_by_id: verifier_id ? parseInt(verifier_id) : null,
      });

      await auditService.log({
        document_id: doc.id,
        nomor_surat: doc.nomor_surat,
        user_name: verifier_name || 'Biro 01 Keuangan',
        user_role: verifier_role || 'biro_01',
        action: 'VERIFY_APPROVE',
        description: `Menyetujui verifikasi dokumen ${doc.nomor_surat}. Legend: Lengkap / Valid. Catatan: ${pesan || 'Lengkap & Valid'}`,
        previous_status: prevStatus,
        new_status: 'lengkap_valid',
      });

      return updated;
    } else if (action === 'reject') {
      if (!pesan || pesan.trim() === '') {
        throw new Error('Pesan alasan penolakan/revisi wajib diisi!');
      }

      const updated = await documentRepository.update(id, {
        status: 'dikembalikan',
        legend_status: 'Dikembalikan untuk Perbaikan',
        legend_color: 'red',
        catatan_revisi: pesan,
        catatan_verifikasi: 'Dikembalikan oleh Biro 01',
        tanggal_verifikasi: new Date(),
        verified_by_id: verifier_id ? parseInt(verifier_id) : null,
      });

      await auditService.log({
        document_id: doc.id,
        nomor_surat: doc.nomor_surat,
        user_name: verifier_name || 'Biro 01 Keuangan',
        user_role: verifier_role || 'biro_01',
        action: 'VERIFY_REJECT',
        description: `Mengembalikan dokumen ${doc.nomor_surat}. Alasan Revisi: ${pesan}`,
        previous_status: prevStatus,
        new_status: 'dikembalikan',
      });

      return updated;
    } else if (action === 'process') {
      const updated = await documentRepository.update(id, {
        status: 'sedang_diverifikasi',
        legend_status: 'Sedang Diverifikasi',
        legend_color: 'blue',
      });

      await auditService.log({
        document_id: doc.id,
        nomor_surat: doc.nomor_surat,
        user_name: verifier_name || 'Biro 01 Keuangan',
        user_role: verifier_role || 'biro_01',
        action: 'PROCESS_VERIFICATION',
        description: `Membuka dan memproses verifikasi berkas ${doc.nomor_surat}`,
        previous_status: prevStatus,
        new_status: 'sedang_diverifikasi',
      });

      return updated;
    }

    throw new Error('Aksi verifikasi tidak valid!');
  }

  async reviseDocument(id, { nama_kegiatan, kategori, nilai_pembayaran, catatan_perbaikan, user_name, user_role }, files = []) {
    const doc = await documentRepository.findById(id);
    if (!doc) throw new Error('Dokumen tidak ditemukan!');

    const prevStatus = doc.status;

    const newAttachments = files.map((file) => ({
      file_name: file.originalname,
      file_path: `/uploads/${file.filename}`,
      file_size: file.size,
      mime_type: file.mimetype,
      document_type: 'File Revisi',
    }));

    if (newAttachments.length > 0) {
      await documentRepository.addAttachments(id, newAttachments);
    }

    const updateData = {
      nama_kegiatan: nama_kegiatan || doc.nama_kegiatan,
      kategori: kategori || doc.kategori,
      status: 'menunggu_verifikasi_ulang',
      legend_status: 'Menunggu Verifikasi Ulang',
      legend_color: 'orange',
    };

    if (nilai_pembayaran) {
      updateData.nilai_pembayaran = Number(nilai_pembayaran);
    }

    const updated = await documentRepository.update(id, updateData);

    await auditService.log({
      document_id: doc.id,
      nomor_surat: doc.nomor_surat,
      user_name: user_name || doc.ppk_name,
      user_role: user_role || 'petugas',
      action: 'REVISE_DOCUMENT',
      description: `Petugas memperbarui dokumen dan mengunggah ${newAttachments.length} file revisi baru. Catatan: ${catatan_perbaikan || 'Sudah disesuaikan.'}`,
      previous_status: prevStatus,
      new_status: 'menunggu_verifikasi_ulang',
    });

    return updated;
  }

  async updateStage(id, { next_stage, user_name, user_role, note }) {
    const doc = await documentRepository.findById(id);
    if (!doc) throw new Error('Dokumen tidak ditemukan!');

    const legend = getLegendForStatus(next_stage);
    const prevStatus = doc.status;

    const updated = await documentRepository.update(id, {
      status: next_stage,
      legend_status: legend.label,
      legend_color: legend.color,
    });

    await auditService.log({
      document_id: doc.id,
      nomor_surat: doc.nomor_surat,
      user_name: user_name || 'Biro 01 Keuangan',
      user_role: user_role || 'biro_01',
      action: `STAGE_${next_stage.toUpperCase()}`,
      description: note || `Tahapan diperbarui menjadi ${legend.label}`,
      previous_status: prevStatus,
      new_status: next_stage,
    });

    return updated;
  }

  async editDocument(id, bodyData, files = []) {
    const doc = await documentRepository.findById(id);
    if (!doc) throw new Error('Dokumen tidak ditemukan!');

    const {
      nomor_surat,
      jenis_dokumen,
      perihal,
      tanggal_dokumen,
      tanggal_diterima,
      pihak_eksternal,
      unit_kerja,
      ppk_name,
      nilai_pembayaran,
      keterangan,
      attachment_meta,
      user_name,
      user_role,
    } = bodyData;

    const updatePayload = {};
    if (nomor_surat) updatePayload.nomor_surat = nomor_surat.trim();
    if (jenis_dokumen) updatePayload.jenis_dokumen = jenis_dokumen.trim();
    if (perihal) {
      updatePayload.perihal = perihal.trim();
      updatePayload.nama_kegiatan = perihal.trim();
    }
    if (tanggal_dokumen) updatePayload.tanggal_dokumen = tanggal_dokumen;
    if (tanggal_diterima) updatePayload.tanggal_diterima = tanggal_diterima;
    if (pihak_eksternal !== undefined) updatePayload.pihak_eksternal = pihak_eksternal.trim();
    if (unit_kerja) updatePayload.unit_kerja = unit_kerja.trim();
    if (ppk_name) updatePayload.ppk_name = ppk_name.trim();
    if (nilai_pembayaran !== undefined) updatePayload.nilai_pembayaran = Number(nilai_pembayaran) || 0;
    if (keterangan !== undefined) updatePayload.keterangan = keterangan.trim();

    // Update metadata dokumen pendukung yang sudah ada di database
    if (bodyData.existing_attachments) {
      let existingList = [];
      try {
        existingList = typeof bodyData.existing_attachments === 'string'
          ? JSON.parse(bodyData.existing_attachments)
          : bodyData.existing_attachments;
      } catch (e) {}

      if (Array.isArray(existingList)) {
        for (const item of existingList) {
          if (item && item.id) {
            await documentRepository.updateAttachment(Number(item.id), {
              document_type: item.document_type || item.jenis_dokumen,
              nomor_dokumen: item.nomor_dokumen,
              tanggal_dokumen: item.tanggal_dokumen || item.tanggal,
            });
          }
        }
      }
    }

    // Tambah berkas baru jika ada yang diupload saat edit
    if (files && files.length > 0) {
      let metaList = [];
      try {
        if (attachment_meta) {
          metaList = typeof attachment_meta === 'string' ? JSON.parse(attachment_meta) : attachment_meta;
        }
      } catch (e) {}

      const newAttachments = files.map((file, idx) => {
        const meta = metaList[idx] || {};
        return {
          file_name: file.originalname,
          file_path: `/uploads/${file.filename}`,
          file_size: file.size,
          mime_type: file.mimetype,
          document_type: meta.document_type || meta.jenis_dokumen || 'Dokumen Pendukung Tambahan',
          nomor_dokumen: meta.nomor_dokumen || '-',
          tanggal_dokumen: meta.tanggal_dokumen || meta.tanggal || null,
        };
      });

      await documentRepository.addAttachments(id, newAttachments);
    }

    const updated = await documentRepository.update(id, updatePayload);

    await auditService.log({
      document_id: doc.id,
      nomor_surat: updated.nomor_surat,
      user_name: user_name || ppk_name || 'Petugas',
      user_role: user_role || 'ppk',
      action: 'EDIT_DOCUMENT',
      description: `Memperbarui data dokumen ${updated.nomor_surat}`,
      previous_status: doc.status,
      new_status: updated.status,
    });

    return updated;
  }

  async deleteAttachment(attachmentId, { user_name, user_role } = {}) {
    const deleted = await documentRepository.deleteAttachment(attachmentId);
    if (!deleted) throw new Error('Dokumen pendukung tidak ditemukan atau telah dihapus!');

    await auditService.log({
      document_id: deleted.document_id,
      user_name: user_name || 'Petugas',
      user_role: user_role || 'ppk',
      action: 'DELETE_ATTACHMENT',
      description: `Menghapus berkas dokumen pendukung ${deleted.file_name} (${deleted.document_type || 'Lampiran'}) dari database`,
    });

    return deleted;
  }

  async deleteDocument(id, { user_name, user_role } = {}) {
    const doc = await documentRepository.findById(id);
    if (!doc) throw new Error('Dokumen tidak ditemukan atau gagal dihapus!');

    await auditService.log({
      document_id: doc.id,
      nomor_surat: doc.nomor_surat,
      user_name: user_name || 'Admin',
      user_role: user_role || 'admin',
      action: 'DELETE_DOCUMENT',
      description: `Menghapus dokumen permohonan pembayaran ${doc.nomor_surat} (${doc.nama_kegiatan}) dari database`,
      previous_status: doc.status,
      new_status: 'DIHAPUS',
    });

    const deleted = await documentRepository.delete(id);
    return deleted;
  }
}

module.exports = new DocumentService();
