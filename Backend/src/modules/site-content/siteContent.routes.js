const router = require('express').Router();
const controller = require('./siteContent.controller');

router.get('/', controller.getAll);
router.get('/:key', controller.getByKey);

module.exports = router;
