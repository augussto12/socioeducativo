const router = require('express').Router();
const tournamentsController = require('../controllers/tournaments.controller');
const matchesController = require('../controllers/matches.controller');
const { authenticate } = require('../middleware/auth');
const { roleGuard } = require('../middleware/roleGuard');

// Public
router.get('/', tournamentsController.getAll);
router.get('/team/:teamId', tournamentsController.getByTeam);
router.get('/:id', tournamentsController.getById);
router.get('/:id/standings', tournamentsController.getStandings);
router.get('/:id/matches', matchesController.getByTournament);

// Admin only
router.post('/', authenticate, roleGuard('ADMIN'), tournamentsController.create);
router.put('/:id', authenticate, roleGuard('ADMIN'), tournamentsController.update);
router.delete('/:id', authenticate, roleGuard('ADMIN'), tournamentsController.remove);
router.post('/:id/enroll', authenticate, roleGuard('ADMIN'), tournamentsController.enrollTeams);
router.delete('/:id/enroll/:teamId', authenticate, roleGuard('ADMIN'), tournamentsController.unenrollTeam);
router.post('/:id/generate-fixture', authenticate, roleGuard('ADMIN'), tournamentsController.generateFixture);
router.post('/:id/confirm-fixture', authenticate, roleGuard('ADMIN'), tournamentsController.confirmFixture);

module.exports = router;
