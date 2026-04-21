const prisma = require('../config/database');
const fixtureService = require('./fixture.service');
const standingsService = require('./standings.service');

class TournamentService {
  /**
   * Get all tournaments with filters.
   */
  async getAll({ status, gameTypeId, page = 1, limit = 20 }) {
    const where = {};
    if (status) where.status = status;
    if (gameTypeId) where.gameTypeId = gameTypeId;

    const skip = (page - 1) * limit;

    const [tournaments, total] = await Promise.all([
      prisma.tournament.findMany({
        where,
        include: {
          gameType: true,
          _count: { select: { tournamentTeams: true, matches: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.tournament.count({ where }),
    ]);

    return {
      tournaments,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Get tournament by ID with full details.
   */
  async getById(id) {
    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: {
        gameType: true,
        tournamentTeams: {
          include: {
            team: { select: { id: true, name: true, shieldUrl: true } },
          },
          orderBy: { seed: 'asc' },
        },
        standings: {
          include: {
            team: { select: { id: true, name: true, shieldUrl: true } },
          },
          orderBy: { position: 'asc' },
        },
      },
    });

    if (!tournament) {
      throw Object.assign(new Error('Torneo no encontrado'), { statusCode: 404 });
    }

    return tournament;
  }

  /**
   * Create a tournament.
   */
  async create(data) {
    const tournament = await prisma.tournament.create({
      data: {
        name: data.name,
        gameTypeId: data.gameTypeId,
        format: data.format,
        status: data.status || 'DRAFT',
        roundRobinReturn: data.roundRobinReturn || false,
        tiebreakerCriteria: data.tiebreakerCriteria || ['points_diff', 'wins', 'points_for'],
        pointsPerWin: data.pointsPerWin ?? 3,
        pointsPerDraw: data.pointsPerDraw ?? 1,
        pointsPerLoss: data.pointsPerLoss ?? 0,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        description: data.description,
      },
      include: { gameType: true },
    });

    return tournament;
  }

  /**
   * Update a tournament.
   */
  async update(id, data) {
    const tournament = await prisma.tournament.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.gameTypeId && { gameTypeId: data.gameTypeId }),
        ...(data.format && { format: data.format }),
        ...(data.status && { status: data.status }),
        ...(data.roundRobinReturn !== undefined && { roundRobinReturn: data.roundRobinReturn }),
        ...(data.tiebreakerCriteria && { tiebreakerCriteria: data.tiebreakerCriteria }),
        ...(data.pointsPerWin !== undefined && { pointsPerWin: data.pointsPerWin }),
        ...(data.pointsPerDraw !== undefined && { pointsPerDraw: data.pointsPerDraw }),
        ...(data.pointsPerLoss !== undefined && { pointsPerLoss: data.pointsPerLoss }),
        ...(data.startDate !== undefined && { startDate: data.startDate ? new Date(data.startDate) : null }),
        ...(data.endDate !== undefined && { endDate: data.endDate ? new Date(data.endDate) : null }),
        ...(data.description !== undefined && { description: data.description }),
      },
      include: { gameType: true },
    });

    return tournament;
  }

  /**
   * Delete a tournament and all related data.
   */
  async delete(id) {
    await prisma.tournament.delete({ where: { id } });
    return { message: 'Torneo eliminado correctamente' };
  }

  /**
   * Enroll teams to a tournament.
   */
  async enrollTeams(tournamentId, teamIds) {
    const tournament = await prisma.tournament.findUnique({ where: { id: tournamentId } });
    if (!tournament) {
      throw Object.assign(new Error('Torneo no encontrado'), { statusCode: 404 });
    }

    if (!['DRAFT', 'INSCRIPTIONS_OPEN'].includes(tournament.status)) {
      throw Object.assign(new Error('No se pueden inscribir equipos en este estado'), { statusCode: 400 });
    }

    // Check all teams exist
    const teams = await prisma.team.findMany({
      where: { id: { in: teamIds } },
    });

    if (teams.length !== teamIds.length) {
      throw Object.assign(new Error('Algunos equipos no existen'), { statusCode: 400 });
    }

    // Upsert to avoid duplicates
    const enrolled = await Promise.all(
      teamIds.map((teamId, index) =>
        prisma.tournamentTeam.upsert({
          where: {
            tournamentId_teamId: { tournamentId, teamId },
          },
          update: {},
          create: {
            tournamentId,
            teamId,
            seed: index + 1,
          },
        })
      )
    );

    return enrolled;
  }

  /**
   * Remove a team from a tournament.
   */
  async unenrollTeam(tournamentId, teamId) {
    await prisma.tournamentTeam.delete({
      where: {
        tournamentId_teamId: { tournamentId, teamId },
      },
    });
    return { message: 'Equipo removido del torneo' };
  }

  /**
   * Generate fixture preview (does not save to DB).
   */
  async generateFixturePreview(tournamentId) {
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        tournamentTeams: {
          include: {
            team: { select: { id: true, name: true, shieldUrl: true } },
          },
        },
      },
    });

    if (!tournament) {
      throw Object.assign(new Error('Torneo no encontrado'), { statusCode: 404 });
    }

    const teamIds = tournament.tournamentTeams.map(tt => tt.teamId);

    if (teamIds.length < 2) {
      throw Object.assign(new Error('Se necesitan al menos 2 equipos'), { statusCode: 400 });
    }

    let fixtures;
    if (tournament.format === 'ROUND_ROBIN') {
      fixtures = fixtureService.generateRoundRobin(teamIds, tournament.roundRobinReturn);
    } else {
      fixtures = fixtureService.generateSingleElimination(teamIds);
    }

    // Enrich with team names
    const teamMap = {};
    tournament.tournamentTeams.forEach(tt => {
      teamMap[tt.teamId] = tt.team;
    });

    const enriched = fixtures.map(f => ({
      ...f,
      homeTeam: f.homeTeamId ? teamMap[f.homeTeamId] : null,
      awayTeam: f.awayTeamId ? teamMap[f.awayTeamId] : null,
    }));

    return { tournament, fixtures: enriched };
  }

  /**
   * Confirm fixture and save matches to DB.
   */
  async confirmFixture(tournamentId) {
    const preview = await this.generateFixturePreview(tournamentId);

    // Delete any existing matches
    await prisma.match.deleteMany({ where: { tournamentId } });

    // Create all matches
    const matchesData = preview.fixtures
      .filter(f => !f.isBye) // Skip BYE matches
      .map(f => ({
        tournamentId,
        homeTeamId: f.homeTeamId,
        awayTeamId: f.awayTeamId,
        round: f.round,
        matchOrder: f.matchOrder,
        status: 'PENDING',
        bracketPosition: f.bracketPosition || null,
        bracketRound: f.bracketRound || null,
      }));

    await prisma.match.createMany({ data: matchesData });

    // Update tournament status
    await prisma.tournament.update({
      where: { id: tournamentId },
      data: { status: 'IN_PROGRESS' },
    });

    // Initialize standings for Round Robin
    if (preview.tournament.format === 'ROUND_ROBIN') {
      await standingsService.initializeStandings(tournamentId);
    }

    // For elimination, handle BYE advances
    if (preview.tournament.format === 'SINGLE_ELIMINATION') {
      await this._handleByeAdvances(tournamentId, preview.fixtures);
    }

    return { message: 'Fixture confirmado', matchesCreated: matchesData.length };
  }

  /**
   * Handle BYE advances in elimination bracket.
   */
  async _handleByeAdvances(tournamentId, fixtures) {
    const byeMatches = fixtures.filter(f => f.isBye && f.bracketRound === 1);

    for (const bye of byeMatches) {
      // The non-null team advances
      const advancingTeamId = bye.homeTeamId || bye.awayTeamId;
      if (!advancingTeamId) continue;

      // Find next round match
      const nextPosition = Math.ceil(bye.bracketPosition / 2);
      const nextMatch = await prisma.match.findFirst({
        where: {
          tournamentId,
          bracketRound: 2,
          bracketPosition: nextPosition,
        },
      });

      if (nextMatch) {
        // Place in home or away based on position
        const isHome = bye.bracketPosition % 2 !== 0;
        await prisma.match.update({
          where: { id: nextMatch.id },
          data: isHome ? { homeTeamId: advancingTeamId } : { awayTeamId: advancingTeamId },
        });
      }
    }
  }

  /**
   * Get tournaments for a specific team.
   */
  async getByTeam(teamId) {
    const tournamentTeams = await prisma.tournamentTeam.findMany({
      where: { teamId },
      include: {
        tournament: {
          include: {
            gameType: true,
            standings: {
              include: {
                team: { select: { id: true, name: true, shieldUrl: true } },
              },
              orderBy: { position: 'asc' },
            },
          },
        },
      },
    });

    return tournamentTeams.map(tt => tt.tournament);
  }
}

module.exports = new TournamentService();
