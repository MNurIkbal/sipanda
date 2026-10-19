const auditService = require('../services/audit.service');
const { successResponse, errorResponse } = require('../utils/response.util');

class AuditController {
  async getAuditLogs(req, res) {
    try {
      const { document_id } = req.query;
      const logs = await auditService.getLogs({ document_id });
      return successResponse(res, 'Berhasil memuat audit trail', logs);
    } catch (err) {
      return errorResponse(res, err.message, 500);
    }
  }
}

module.exports = new AuditController();
