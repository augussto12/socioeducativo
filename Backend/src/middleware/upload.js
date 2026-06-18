const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');
const { MAX_VIDEO_SIZE } = require('../config/env');
const { getFileType } = require('../utils/fileType');

const tempDir = path.resolve(process.cwd(), 'uploads', 'tmp');
fs.mkdirSync(tempDir, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, callback) => {
      callback(null, tempDir);
    },
    filename: (req, file, callback) => {
      const ext = path.extname(file.originalname || '').toLowerCase();
      callback(null, `${randomUUID()}${ext}.tmp`);
    },
  }),
  limits: {
    fileSize: MAX_VIDEO_SIZE,
  },
  fileFilter: (req, file, callback) => {
    if (!getFileType(file)) {
      const error = new Error('Tipo de archivo no permitido');
      error.statusCode = 400;
      return callback(error);
    }
    callback(null, true);
  },
});

module.exports = upload;
