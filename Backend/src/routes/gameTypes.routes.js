const router = require('express').Router();
const gameTypesController = require('../controllers/gameTypes.controller');
const { authenticate } = require('../middleware/auth');
const { roleGuard } = require('../middleware/roleGuard');

// Public
router.get('/', gameTypesController.getAll);
router.get('/:id', gameTypesController.getById);

// Admin only
router.post('/', authenticate, roleGuard('ADMIN'), gameTypesController.create);
router.put('/:id', authenticate, roleGuard('ADMIN'), gameTypesController.update);
router.delete('/:id', authenticate, roleGuard('ADMIN'), gameTypesController.remove);

module.exports = router;
