const express = require('express');
const documentController = require('../controllers/document.controller');
const { upload } = require('../config/multer.config');

const router = express.Router();

// List & Detail
router.get('/', (req, res) => documentController.getAllDocuments(req, res));
router.get('/:id', (req, res) => documentController.getDocumentById(req, res));

// Upload multiple berkas (Petugas)
router.post('/', upload.array('files', 10), (req, res) => documentController.createDocument(req, res));

// Verifikasi Biro 01 (Setujui / Tolak dengan pesan)
router.post('/:id/verify', (req, res) => documentController.verifyDocument(req, res));

// Revisi Dokumen & Re-upload berkas (Petugas)
router.put('/:id/revisi', upload.array('files', 10), (req, res) => documentController.reviseDocument(req, res));

// Update tahapan alur pembayaran (KPPN / Dana Cair)
router.post('/:id/stage', (req, res) => documentController.updateStage(req, res));

// Simpan hasil Generate Dokumen Resmi (BAST, BAP, BAPP)
router.post('/:id/generate-official', (req, res) => documentController.saveOfficialDoc(req, res));

// Reset hasil Generate Dokumen Resmi (hanya jika masih draft)
router.post('/:id/reset-official', (req, res) => documentController.resetOfficialDocs(req, res));

// Kirim dokumen dari PPK ke Biro 01
router.post('/:id/submit-to-biro', (req, res) => documentController.submitToBiro(req, res));

// Tandai status Review saat Biro 01 melihat dokumen / berkas
router.post('/:id/review', (req, res) => documentController.markAsReview(req, res));

// Edit Data Dokumen
router.put('/:id', upload.array('files', 10), (req, res) => documentController.editDocument(req, res));

// Delete Dokumen (Biro 01 / Admin)
router.delete('/:id', (req, res) => documentController.deleteDocument(req, res));

// Delete Dokumen Pendukung / Attachment Tunggal dari Database
router.delete('/attachments/:attachmentId', (req, res) => documentController.deleteAttachment(req, res));

// VeriText OCR & Metadata Extraction
router.post('/extract-veritext', upload.single('file'), (req, res) => documentController.extractDocumentMetadata(req, res));

module.exports = router;
