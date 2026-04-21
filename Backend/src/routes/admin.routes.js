const router = require('express').Router();
const adminController = require('../controllers/admin.controller');
const { authenticate } = require('../middleware/auth');
const { roleGuard } = require('../middleware/roleGuard');

// All admin routes require ADMIN role
router.use(authenticate, roleGuard('ADMIN'));

router.get('/stats', adminController.getStats);
router.get('/users', adminController.getUsers);

module.exports = router;
