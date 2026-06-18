const router = require('express').Router();
const controller = require('./admin.controller');
const { authenticate } = require('../../middleware/auth');
const { requireRole } = require('../../middleware/roleGuard');

router.use(authenticate, requireRole('ADMIN'));

router.get('/dashboard', controller.getDashboard);
router.get('/audit-logs', controller.getAuditLogs);

module.exports = router;
