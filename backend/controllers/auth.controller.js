const userService = require('../services/user.service');
const { successResponse, errorResponse } = require('../utils/response.util');

class AuthController {
  async login(req, res) {
    try {
      const { email, username, password } = req.body;
      const loginIdentifier = email || username;
      const result = await userService.authenticate(loginIdentifier, password);
      return successResponse(res, 'Login berhasil!', result);
    } catch (err) {
      return errorResponse(res, err.message, 401);
    }
  }

  async forgotPassword(req, res) {
    try {
      const { email } = req.body;
      const result = await userService.requestPasswordReset(email);
      return successResponse(
        res,
        'Tautan reset password berhasil dikirim ke alamat email Gmail Anda!',
        result
      );
    } catch (err) {
      return errorResponse(res, err.message, 400);
    }
  }

  async verifyResetToken(req, res) {
    try {
      const { token, email } = req.query;
      const result = await userService.verifyResetToken(token, email);
      return successResponse(res, 'Token reset password valid.', result);
    } catch (err) {
      return errorResponse(res, err.message, 400);
    }
  }

  async resetPassword(req, res) {
    try {
      const { token, email, newPassword } = req.body;
      const result = await userService.resetPasswordWithToken(token, email, newPassword);
      return successResponse(
        res,
        'Password berhasil diperbarui! Silakan login dengan password baru Anda.',
        result
      );
    } catch (err) {
      return errorResponse(res, err.message, 400);
    }
  }
}

module.exports = new AuthController();
