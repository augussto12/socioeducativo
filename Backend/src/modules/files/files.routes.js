const router = require('express').Router();
const controller = require('./files.controller');
const { authenticate, optionalAuth } = require('../../middleware/auth');

router.get('/:id', optionalAuth, controller.download);
router.delete('/:id', authenticate, controller.remove);

module.exports = router;
