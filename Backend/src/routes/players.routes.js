const router = require('express').Router({ mergeParams: true });
const playersController = require('../controllers/players.controller');
const { authenticate } = require('../middleware/auth');
const { roleGuard } = require('../middleware/roleGuard');

// Public
router.get('/', playersController.getByTeam);

// Admin only
router.post('/', authenticate, roleGuard('ADMIN'), playersController.create);
router.put('/:id', authenticate, roleGuard('ADMIN'), playersController.update);
router.delete('/:id', authenticate, roleGuard('ADMIN'), playersController.remove);

module.exports = router;
