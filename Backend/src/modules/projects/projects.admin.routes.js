const router = require('express').Router();
const controller = require('./projects.controller');
const { authenticate } = require('../../middleware/auth');
const { requireRole } = require('../../middleware/roleGuard');
const { validateBody, required, oneOf, isNumber } = require('../../middleware/validateRequest');
const { PROJECT_STATUSES, VISIBILITIES } = require('./projects.service');

router.use(authenticate, requireRole('ADMIN'));

router.get('/', controller.getAdminProjects);
router.get('/:id', controller.getAdminProject);
router.post(
  '/',
  validateBody({
    name: [required('Nombre')],
    description: [required('Descripcion')],
    curricularContents: [required('Contenidos curriculares')],
    methodology: [required('Metodologia')],
    duration: [required('Duracion')],
    pedagogicalFoundation: [required('Fundamento pedagogico')],
    status: [oneOf(PROJECT_STATUSES, 'Estado')],
    visibility: [oneOf(VISIBILITIES, 'Visibilidad')],
    displayOrder: [isNumber('Orden')],
  }),
  controller.create
);
router.put(
  '/:id',
  validateBody({
    status: [oneOf(PROJECT_STATUSES, 'Estado')],
    visibility: [oneOf(VISIBILITIES, 'Visibilidad')],
    displayOrder: [isNumber('Orden')],
  }),
  controller.update
);
router.delete('/:id', controller.remove);
router.post('/:id/members', validateBody({ userId: [required('Usuario')] }), controller.addMember);
router.delete('/:id/members/:userId', controller.removeMember);

module.exports = router;
