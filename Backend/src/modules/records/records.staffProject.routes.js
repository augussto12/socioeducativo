const router = require('express').Router();
const controller = require('./records.controller');
const { authenticate } = require('../../middleware/auth');
const { requireRole } = require('../../middleware/roleGuard');
const { validateBody, required, oneOf, isDate } = require('../../middleware/validateRequest');
const { RECORD_TYPES } = require('./records.service');

router.use(authenticate, requireRole('STAFF', 'ADMIN'));

router.get('/:projectId/records', controller.getMyProjectRecords);
router.post(
  '/:projectId/records',
  validateBody({
    title: [required('Titulo')],
    type: [required('Tipo'), oneOf(RECORD_TYPES, 'Tipo')],
    recordDate: [required('Fecha'), isDate('Fecha')],
  }),
  controller.createStaffRecord
);

module.exports = router;
