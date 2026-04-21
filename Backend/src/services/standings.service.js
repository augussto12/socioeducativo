const prisma = require('../config/database');

class StandingsService {
  /**
   * Initialize standings for all teams in a tournament.
   */
  async initializeStandings(tournamentId) {
    const tournamentTeams = await prisma.tournamentTeam.findMany({
      where: { tournamentId },
    });

    const standingsData = tournamentTeams.map(tt => ({
      tournamentId,
      teamId: tt.teamId,
      played: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      pointsFor: 0,
      pointsAgainst: 0,
      pointsDiff: 0,
      totalPoints: 0,
      position: 0,
    }));

    // Delete existing standings and recreate
    await prisma.standing.deleteMany({ where: { tournamentId } });
    await prisma.standing.createMany({ data: standingsData });
  }

  /**
   * Recalculate all standings for a tournament from scratch.
   * Uses all PLAYED matches to rebuild the table.
   */
  async recalculate(tournamentId) {
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        tournamentTeams: true,
        matches: {
          where: { status: 'PLAYED' },
          include: { result: true },
        },
      },
    });

    if (!tournament) {
      throw Object.assign(new Error('Torneo no encontrado'), { statusCode: 404 });
    }

    // Initialize counters for each team
    const stats = {};
    for (const tt of tournament.tournamentTeams) {
      stats[tt.teamId] = {
        played: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        pointsFor: 0,
        pointsAgainst: 0,
      };
    }

    // Process all played matches
    for (const match of tournament.matches) {
      if (!match.result || !match.homeTeamId || !match.awayTeamId) continue;

      const { homeScore, awayScore } = match.result;
      const homeId = match.homeTeamId;
      const awayId = match.awayTeamId;

      // Ensure both teams are tracked
      if (!stats[homeId] || !stats[awayId]) continue;

      // Update played
      stats[homeId].played++;
      stats[awayId].played++;

      // Update scores
      stats[homeId].pointsFor += homeScore;
      stats[homeId].pointsAgainst += awayScore;
      stats[awayId].pointsFor += awayScore;
      stats[awayId].pointsAgainst += homeScore;

      // Determine W/D/L
      if (homeScore > awayScore) {
        stats[homeId].wins++;
        stats[awayId].losses++;
      } else if (homeScore < awayScore) {
        stats[awayId].wins++;
        stats[homeId].losses++;
      } else {
        stats[homeId].draws++;
        stats[awayId].draws++;
      }
    }

    // Calculate derived fields and total points
    const standingsArray = Object.entries(stats).map(([teamId, s]) => ({
      teamId,
      ...s,
      pointsDiff: s.pointsFor - s.pointsAgainst,
      totalPoints:
        s.wins * tournament.pointsPerWin +
        s.draws * tournament.pointsPerDraw +
        s.losses * tournament.pointsPerLoss,
    }));

    // Sort by tiebreaker criteria
    const criteria = tournament.tiebreakerCriteria || ['points_diff', 'wins', 'points_for'];
    standingsArray.sort((a, b) => {
      // First sort by total points (always primary)
      if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;

      // Then by tiebreaker criteria
      for (const criterion of criteria) {
        const fieldMap = {
          points_diff: 'pointsDiff',
          wins: 'wins',
          points_for: 'pointsFor',
          points_against: 'pointsAgainst',
          draws: 'draws',
        };
        const field = fieldMap[criterion];
        if (field && b[field] !== a[field]) {
          // For points_against, lower is better
          if (criterion === 'points_against') return a[field] - b[field];
          return b[field] - a[field];
        }
      }

      return 0;
    });

    // Assign positions and update DB
    await prisma.$transaction(
      standingsArray.map((s, index) =>
        prisma.standing.upsert({
          where: {
            tournamentId_teamId: { tournamentId, teamId: s.teamId },
          },
          update: {
            played: s.played,
            wins: s.wins,
            draws: s.draws,
            losses: s.losses,
            pointsFor: s.pointsFor,
            pointsAgainst: s.pointsAgainst,
            pointsDiff: s.pointsDiff,
            totalPoints: s.totalPoints,
            position: index + 1,
          },
          create: {
            tournamentId,
            teamId: s.teamId,
            played: s.played,
            wins: s.wins,
            draws: s.draws,
            losses: s.losses,
            pointsFor: s.pointsFor,
            pointsAgainst: s.pointsAgainst,
            pointsDiff: s.pointsDiff,
            totalPoints: s.totalPoints,
            position: index + 1,
          },
        })
      )
    );

    return this.getStandings(tournamentId);
  }

  /**
   * Get formatted standings for a tournament.
   */
  async getStandings(tournamentId) {
    const standings = await prisma.standing.findMany({
      where: { tournamentId },
      include: {
        team: {
          select: { id: true, name: true, shieldUrl: true },
        },
      },
      orderBy: { position: 'asc' },
    });

    return standings;
  }
}

module.exports = new StandingsService();
