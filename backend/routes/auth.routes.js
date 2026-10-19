const express = require('express');
const authController = require('../controllers/auth.controller');

const router = express.Router();

router.post('/login', (req, res) => authController.login(req, res));

module.exports = router;
