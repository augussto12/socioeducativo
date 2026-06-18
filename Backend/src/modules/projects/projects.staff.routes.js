const router = require('express').Router();
const controller = require('./projects.controller');
const { authenticate } = require('../../middleware/auth');
const { requireRole } = require('../../middleware/roleGuard');

router.use(authenticate, requireRole('STAFF', 'ADMIN'));
router.get('/', controller.getAssignedProjects);
router.get('/:id', controller.getAssignedProject);

module.exports = router;
