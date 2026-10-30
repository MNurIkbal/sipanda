const multer = require('multer');
const path = require('path');
const fs = require('fs');
const config = require('./app.config');

const uploadDirectory = path.join(__dirname, '..', config.uploadDir);

// Pastikan folder upload ada
if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDirectory);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // Maksimal 10 MB per dokumen
  fileFilter: function (req, file, cb) {
    const allowedExts = /\.(pdf|docx|doc)$/i;
    const isExtAllowed = allowedExts.test(file.originalname);
    const isMimeAllowed = 
      file.mimetype === 'application/pdf' ||
      file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      file.mimetype === 'application/msword' ||
      file.mimetype === 'application/octet-stream';

    if (isExtAllowed || isMimeAllowed) {
      cb(null, true);
    } else {
      cb(new Error('Hanya berkas format PDF (.pdf) dan Word (.docx, .doc) yang diperbolehkan!'));
    }
  }
});

module.exports = {
  upload,
  uploadDirectory
};
