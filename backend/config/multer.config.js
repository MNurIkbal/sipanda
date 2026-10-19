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
  limits: { fileSize: config.maxFileSize }
});

module.exports = {
  upload,
  uploadDirectory
};
