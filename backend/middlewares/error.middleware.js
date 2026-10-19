const { errorResponse } = require('../utils/response.util');

function errorHandler(err, req, res, next) {
  console.error('[Error Handler]:', err.stack || err.message);

  if (err.name === 'MulterError') {
    return errorResponse(res, `Upload file error: ${err.message}`, 400);
  }

  return errorResponse(
    res,
    err.message || 'Terjadi kesalahan internal pada server',
    err.statusCode || 500
  );
}

module.exports = errorHandler;
