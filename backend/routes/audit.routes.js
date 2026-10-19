const express = require('express');
const auditController = require('../controllers/audit.controller');

const router = express.Router();

router.get('/', (req, res) => auditController.getAuditLogs(req, res));

module.exports = router;
