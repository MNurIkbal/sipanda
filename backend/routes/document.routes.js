const express = require('express');
const documentController = require('../controllers/document.controller');
const { upload } = require('../config/multer.config');

const router = express.Router();

router.get('/', (req, res) => documentController.getAllDocuments(req, res));
router.get('/:id', (req, res) => documentController.getDocumentById(req, res));

router.post('/', upload.array('files', 10), (req, res) => documentController.createDocument(req, res));

router.post('/:id/verify', (req, res) => documentController.verifyDocument(req, res));

router.put('/:id/revisi', upload.array('files', 10), (req, res) => documentController.reviseDocument(req, res));

router.post('/:id/stage', (req, res) => documentController.updateStage(req, res));

router.post('/:id/generate-official', (req, res) => documentController.saveOfficialDoc(req, res));

router.post('/:id/reset-official', (req, res) => documentController.resetOfficialDocs(req, res));

router.post('/:id/submit-to-biro', (req, res) => documentController.submitToBiro(req, res));

router.post('/:id/review', (req, res) => documentController.markAsReview(req, res));

router.put('/:id', upload.array('files', 10), (req, res) => documentController.editDocument(req, res));

router.delete('/:id', (req, res) => documentController.deleteDocument(req, res));

router.delete('/attachments/:attachmentId', (req, res) => documentController.deleteAttachment(req, res));

router.post('/extract-veritext', upload.single('file'), (req, res) => documentController.extractDocumentMetadata(req, res));

module.exports = router;