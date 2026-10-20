const masterService = require('../services/master.service');
const { successResponse, errorResponse } = require('../utils/response.util');

class MasterController {
  // ===================== UNITS =====================
  async getUnits(req, res) {
    try {
      const { search } = req.query;
      const units = await masterService.getAllUnits({ search });
      return successResponse(res, 'Data unit berhasil diambil.', units);
    } catch (err) {
      return errorResponse(res, err.message, 500);
    }
  }

  async createUnit(req, res) {
    try {
      const { nama, keterangan, is_active } = req.body;
      const newUnit = await masterService.createUnit({ nama, keterangan, is_active });
      return successResponse(res, 'Unit berhasil ditambahkan.', newUnit, 201);
    } catch (err) {
      return errorResponse(res, err.message, 400);
    }
  }

  async updateUnit(req, res) {
    try {
      const { id } = req.params;
      const { nama, keterangan, is_active } = req.body;
      const updatedUnit = await masterService.updateUnit(parseInt(id, 10), { nama, keterangan, is_active });
      return successResponse(res, 'Unit berhasil diperbarui.', updatedUnit);
    } catch (err) {
      return errorResponse(res, err.message, 400);
    }
  }

  async deleteUnit(req, res) {
    try {
      const { id } = req.params;
      await masterService.deleteUnit(parseInt(id, 10));
      return successResponse(res, 'Unit berhasil dihapus.');
    } catch (err) {
      return errorResponse(res, err.message, 400);
    }
  }

  // ===================== JENIS DOKUMEN =====================
  async getJenisDokumen(req, res) {
    try {
      const { search } = req.query;
      const docs = await masterService.getAllJenisDokumen({ search });
      return successResponse(res, 'Data jenis dokumen berhasil diambil.', docs);
    } catch (err) {
      return errorResponse(res, err.message, 500);
    }
  }

  async createJenisDokumen(req, res) {
    try {
      const { nama, keterangan, is_active } = req.body;
      const newDoc = await masterService.createJenisDokumen({ nama, keterangan, is_active });
      return successResponse(res, 'Jenis dokumen berhasil ditambahkan.', newDoc, 201);
    } catch (err) {
      return errorResponse(res, err.message, 400);
    }
  }

  async updateJenisDokumen(req, res) {
    try {
      const { id } = req.params;
      const { nama, keterangan, is_active } = req.body;
      const updatedDoc = await masterService.updateJenisDokumen(parseInt(id, 10), { nama, keterangan, is_active });
      return successResponse(res, 'Jenis dokumen berhasil diperbarui.', updatedDoc);
    } catch (err) {
      return errorResponse(res, err.message, 400);
    }
  }

  async deleteJenisDokumen(req, res) {
    try {
      const { id } = req.params;
      await masterService.deleteJenisDokumen(parseInt(id, 10));
      return successResponse(res, 'Jenis dokumen berhasil dihapus.');
    } catch (err) {
      return errorResponse(res, err.message, 400);
    }
  }
}

module.exports = new MasterController();
