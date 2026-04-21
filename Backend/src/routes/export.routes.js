const router = require('express').Router();
const exportController = require('../controllers/export.controller');

router.get('/standings/:tournamentId', exportController.exportStandings);

module.exports = router;
