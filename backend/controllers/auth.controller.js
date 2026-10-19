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
}

module.exports = new AuthController();
