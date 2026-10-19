const userService = require('../services/user.service');
const { successResponse, errorResponse } = require('../utils/response.util');

class UserController {
  async getAllUsers(req, res) {
    try {
      const { search, role, page, limit } = req.query;
      const result = await userService.getAllUsers({ search, role, page, limit });
      return successResponse(res, 'Berhasil memuat data users', result);
    } catch (err) {
      return errorResponse(res, err.message, 500);
    }
  }

  async getUserById(req, res) {
    try {
      const user = await userService.getUserById(req.params.id);
      return successResponse(res, 'Berhasil memuat detail pengguna', user);
    } catch (err) {
      return errorResponse(res, err.message, 404);
    }
  }

  async createUser(req, res) {
    try {
      const newUser = await userService.createUser(req.body);
      return successResponse(res, 'User berhasil ditambahkan!', newUser, 201);
    } catch (err) {
      return errorResponse(res, err.message, 400);
    }
  }

  async updateUser(req, res) {
    try {
      const updated = await userService.updateUser(req.params.id, req.body);
      return successResponse(res, 'Data pengguna berhasil diperbarui!', updated);
    } catch (err) {
      return errorResponse(res, err.message, 400);
    }
  }

  async changePassword(req, res) {
    try {
      const updated = await userService.changePassword(req.params.id, req.body);
      return successResponse(res, 'Password berhasil diperbarui!', updated);
    } catch (err) {
      return errorResponse(res, err.message, 400);
    }
  }

  async deleteUser(req, res) {
    try {
      const deleted = await userService.deleteUser(req.params.id);
      return successResponse(res, `User ${deleted.full_name} berhasil dihapus!`, deleted);
    } catch (err) {
      return errorResponse(res, err.message, 400);
    }
  }
}

module.exports = new UserController();
