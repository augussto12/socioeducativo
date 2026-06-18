const router = require('express').Router();
const controller = require('./projects.controller');
const recordsController = require('../records/records.controller');

router.get('/public', controller.getPublicProjects);
router.get('/public/:slug/records', recordsController.getPublicByProjectSlug);
router.get('/public/:slug', controller.getPublicBySlug);

module.exports = router;
