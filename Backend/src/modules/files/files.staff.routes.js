const router = require('express').Router();
const controller = require('./files.controller');
const { authenticate } = require('../../middleware/auth');
const { requireRole } = require('../../middleware/roleGuard');
const upload = require('../../middleware/upload');

router.post('/:recordId/files', authenticate, requireRole('STAFF', 'ADMIN'), upload.single('file'), controller.uploadToRecord);

module.exports = router;
