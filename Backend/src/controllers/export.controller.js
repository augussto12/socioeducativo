const standingsService = require('../services/standings.service');

const exportStandings = async (req, res, next) => {
  try {
    const standings = await standingsService.getStandings(req.params.tournamentId);
    const prisma = require('../config/database');
    const tournament = await prisma.tournament.findUnique({
      where: { id: req.params.tournamentId },
      include: { gameType: true },
    });

    res.json({
      tournament: {
        name: tournament?.name,
        gameType: tournament?.gameType?.name,
        gameIcon: tournament?.gameType?.icon,
      },
      standings,
      exportedAt: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { exportStandings };
