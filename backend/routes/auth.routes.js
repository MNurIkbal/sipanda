const express = require('express');
const authController = require('../controllers/auth.controller');

const router = express.Router();

router.post('/login', (req, res) => authController.login(req, res));
router.post('/forgot-password', (req, res) => authController.forgotPassword(req, res));
router.get('/verify-reset-token', (req, res) => authController.verifyResetToken(req, res));
router.post('/reset-password', (req, res) => authController.resetPassword(req, res));

module.exports = router;
