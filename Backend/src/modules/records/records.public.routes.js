const router = require('express').Router();
const controller = require('./records.controller');

router.get('/public/:id', controller.getPublicRecord);

module.exports = router;
