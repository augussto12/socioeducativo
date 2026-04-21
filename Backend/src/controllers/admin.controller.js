const prisma = require('../config/database');

const getStats = async (req, res, next) => {
  try {
    const [
      totalTeams,
      totalTournaments,
      activeTournaments,
      pendingMatches,
      totalPlayers,
      totalPlayedMatches,
    ] = await Promise.all([
      prisma.team.count(),
      prisma.tournament.count(),
      prisma.tournament.count({ where: { status: 'IN_PROGRESS' } }),
      prisma.match.count({ where: { status: 'PENDING' } }),
      prisma.player.count({ where: { isActive: true } }),
      prisma.match.count({ where: { status: 'PLAYED' } }),
    ]);

    res.json({
      totalTeams,
      totalTournaments,
      activeTournaments,
      pendingMatches,
      totalPlayers,
      totalPlayedMatches,
    });
  } catch (error) {
    next(error);
  }
};

const getUsers = async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        role: true,
        isActive: true,
        teamId: true,
        createdAt: true,
        team: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(users);
  } catch (error) {
    next(error);
  }
};

module.exports = { getStats, getUsers };
