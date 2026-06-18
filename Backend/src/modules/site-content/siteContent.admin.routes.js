const router = require('express').Router();
const controller = require('./siteContent.controller');
const { authenticate } = require('../../middleware/auth');
const { requireRole } = require('../../middleware/roleGuard');
const { validateBody, required } = require('../../middleware/validateRequest');

router.put(
  '/:key',
  authenticate,
  requireRole('ADMIN'),
  validateBody({
    title: [required('Titulo')],
    content: [required('Contenido')],
  }),
  controller.update
);

module.exports = router;
