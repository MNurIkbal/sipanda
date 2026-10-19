const documentService = require('../services/document.service');
const { successResponse, errorResponse } = require('../utils/response.util');

class DocumentController {
  async getAllDocuments(req, res) {
    try {
      const { status, search, page, limit } = req.query;
      const documents = await documentService.getAllDocuments({ status, search, page, limit });
      return successResponse(res, 'Berhasil memuat daftar dokumen', documents);
    } catch (err) {
      return errorResponse(res, err.message, 500);
    }
  }

  async getDocumentById(req, res) {
    try {
      const doc = await documentService.getDocumentById(req.params.id);
      return successResponse(res, 'Berhasil memuat detail dokumen', doc);
    } catch (err) {
      return errorResponse(res, err.message, 404);
    }
  }

  async createDocument(req, res) {
    try {
      const doc = await documentService.createDocument(req.body, req.files || []);
      return successResponse(res, 'Dokumen berhasil disimpan dan diajukan ke Biro 01!', doc, 201);
    } catch (err) {
      return errorResponse(res, err.message, 400);
    }
  }

  async verifyDocument(req, res) {
    try {
      const { action, pesan, verifier_name, verifier_role, verifier_id } = req.body;
      const doc = await documentService.verifyDocument(req.params.id, {
        action,
        pesan,
        verifier_name,
        verifier_role,
        verifier_id,
      });

      const message =
        action === 'approve'
          ? 'Dokumen berhasil disetujui (Lengkap/Valid)!'
          : action === 'reject'
          ? 'Dokumen dikembalikan ke petugas dengan catatan revisi!'
          : 'Status dokumen berhasil diperbarui';

      return successResponse(res, message, doc);
    } catch (err) {
      return errorResponse(res, err.message, 400);
    }
  }

  async reviseDocument(req, res) {
    try {
      const doc = await documentService.reviseDocument(req.params.id, req.body, req.files || []);
      return successResponse(res, 'Revisi berhasil disimpan dan diteruskan ke Biro 01!', doc);
    } catch (err) {
      return errorResponse(res, err.message, 400);
    }
  }

  async editDocument(req, res) {
    try {
      const doc = await documentService.editDocument(req.params.id, req.body, req.files || []);
      return successResponse(res, 'Perubahan data dokumen berhasil disimpan!', doc);
    } catch (err) {
      return errorResponse(res, err.message, 400);
    }
  }

  async updateStage(req, res) {
    try {
      const doc = await documentService.updateStage(req.params.id, req.body);
      return successResponse(res, 'Tahapan pembayaran berhasil diperbarui!', doc);
    } catch (err) {
      return errorResponse(res, err.message, 400);
    }
  }

  async deleteDocument(req, res) {
    try {
      const { user_name, user_role } = req.query;
      const doc = await documentService.deleteDocument(req.params.id, { user_name, user_role });
      return successResponse(res, `Dokumen ${doc.nomor_surat} berhasil dihapus dari database!`, doc);
    } catch (err) {
      return errorResponse(res, err.message, 400);
    }
  }

  async deleteAttachment(req, res) {
    try {
      const { user_name, user_role } = req.query;
      const deleted = await documentService.deleteAttachment(req.params.attachmentId, { user_name, user_role });
      return successResponse(res, `Berkas lampiran ${deleted.file_name} berhasil dihapus dari database!`, deleted);
    } catch (err) {
      return errorResponse(res, err.message, 400);
    }
  }
}

module.exports = new DocumentController();
