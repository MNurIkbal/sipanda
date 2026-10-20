const express = require('express');
const masterController = require('../controllers/master.controller');

const router = express.Router();

// Master Units Routes
router.get('/units', (req, res) => masterController.getUnits(req, res));
router.post('/units', (req, res) => masterController.createUnit(req, res));
router.put('/units/:id', (req, res) => masterController.updateUnit(req, res));
router.delete('/units/:id', (req, res) => masterController.deleteUnit(req, res));

// Master Jenis Dokumen Routes
router.get('/jenis-dokumen', (req, res) => masterController.getJenisDokumen(req, res));
router.post('/jenis-dokumen', (req, res) => masterController.createJenisDokumen(req, res));
router.put('/jenis-dokumen/:id', (req, res) => masterController.updateJenisDokumen(req, res));
router.delete('/jenis-dokumen/:id', (req, res) => masterController.deleteJenisDokumen(req, res));

module.exports = router;
