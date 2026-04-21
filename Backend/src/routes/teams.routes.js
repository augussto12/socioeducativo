const router = require('express').Router();
const teamsController = require('../controllers/teams.controller');
const { authenticate } = require('../middleware/auth');
const { roleGuard, ownTeamOnly } = require('../middleware/roleGuard');
const upload = require('../middleware/upload');

// Public
router.get('/', teamsController.getAll);
router.get('/:id', teamsController.getById);

// Admin only
router.post('/', authenticate, roleGuard('ADMIN'), teamsController.create);
router.put('/:id', authenticate, roleGuard('ADMIN'), teamsController.update);
router.delete('/:id', authenticate, roleGuard('ADMIN'), teamsController.remove);
router.post('/:id/reset-password', authenticate, roleGuard('ADMIN'), teamsController.resetPassword);
router.patch('/:id/toggle-active', authenticate, roleGuard('ADMIN'), teamsController.toggleActive);

// Team user (own team only)
router.patch('/:id/profile', authenticate, ownTeamOnly(), upload.single('shield'), teamsController.updateProfile);

module.exports = router;
