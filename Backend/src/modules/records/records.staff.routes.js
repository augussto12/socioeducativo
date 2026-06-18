const router = require('express').Router();
const controller = require('./records.controller');
const { authenticate } = require('../../middleware/auth');
const { requireRole } = require('../../middleware/roleGuard');

router.use(authenticate, requireRole('STAFF', 'ADMIN'));

router.get('/', controller.getMyRecords);
router.get('/:id', controller.getMyRecord);
router.put('/:id', controller.updateStaffRecord);
router.delete('/:id', controller.deleteStaffRecord);

module.exports = router;
