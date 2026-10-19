const express = require('express');
const monitoringController = require('../controllers/monitoring.controller');

const router = express.Router();

router.get('/stats', (req, res) => monitoringController.getStats(req, res));

module.exports = router;
