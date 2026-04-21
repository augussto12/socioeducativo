const router = require('express').Router();
const matchesController = require('../controllers/matches.controller');
const { authenticate } = require('../middleware/auth');
const { roleGuard } = require('../middleware/roleGuard');

// Public
router.get('/team/:teamId', matchesController.getByTeam);
router.get('/team/:teamId/next', matchesController.getNextMatch);
router.get('/team/:teamId/recent', matchesController.getRecentResults);
router.get('/:id', matchesController.getById);

// Admin only
router.put('/:id', authenticate, roleGuard('ADMIN'), matchesController.update);
router.patch('/:id/status', authenticate, roleGuard('ADMIN'), matchesController.changeStatus);
router.post('/:id/result', authenticate, roleGuard('ADMIN'), matchesController.recordResult);
router.put('/:id/result', authenticate, roleGuard('ADMIN'), matchesController.editResult);

module.exports = router;
