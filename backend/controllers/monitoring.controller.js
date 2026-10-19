const monitoringService = require('../services/monitoring.service');
const { successResponse, errorResponse } = require('../utils/response.util');

class MonitoringController {
  async getStats(req, res) {
    try {
      const stats = await monitoringService.getStats();
      return successResponse(res, 'Berhasil memuat statistik monitoring', stats);
    } catch (err) {
      return errorResponse(res, err.message, 500);
    }
  }
}

module.exports = new MonitoringController();
