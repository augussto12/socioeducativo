const router = require('express').Router();
const controller = require('./users.controller');
const { authenticate } = require('../../middleware/auth');
const { requireRole } = require('../../middleware/roleGuard');
const { validateBody, required, isEmail, oneOf } = require('../../middleware/validateRequest');
const { USER_ROLES } = require('./users.service');

router.use(authenticate, requireRole('ADMIN'));

router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.post(
  '/',
  validateBody({
    name: [required('Nombre')],
    email: [required('Email'), isEmail()],
    role: [oneOf(USER_ROLES, 'Rol')],
  }),
  controller.create
);
router.put(
  '/:id',
  validateBody({
    email: [isEmail()],
    role: [oneOf(USER_ROLES, 'Rol')],
  }),
  controller.update
);
router.patch('/:id/disable', controller.disable);
router.patch('/:id/enable', controller.enable);
router.delete('/:id', controller.remove);

module.exports = router;
