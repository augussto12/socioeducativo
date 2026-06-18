const router = require('express').Router();
const controller = require('./records.controller');
const { authenticate } = require('../../middleware/auth');
const { requireRole } = require('../../middleware/roleGuard');
const { validateBody, required, oneOf, isDate } = require('../../middleware/validateRequest');
const { RECORD_STATUSES, RECORD_TYPES, VISIBILITIES } = require('./records.service');

router.use(authenticate, requireRole('ADMIN'));

router.get('/', controller.getAdminRecords);
router.get('/:id', controller.getAdminRecord);
router.put(
  '/:id',
  validateBody({
    type: [oneOf(RECORD_TYPES, 'Tipo')],
    visibility: [oneOf(VISIBILITIES, 'Visibilidad')],
    status: [oneOf(RECORD_STATUSES, 'Estado')],
    recordDate: [isDate('Fecha')],
  }),
  controller.updateAdminRecord
);
router.patch(
  '/:id/status',
  validateBody({
    status: [required('Estado'), oneOf(RECORD_STATUSES, 'Estado')],
    visibility: [oneOf(VISIBILITIES, 'Visibilidad')],
  }),
  controller.changeStatus
);
router.delete('/:id', controller.deleteAdminRecord);

module.exports = router;
