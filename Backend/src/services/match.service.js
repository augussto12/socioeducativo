const prisma = require('../config/database');
const standingsService = require('./standings.service');

class MatchService {
  /**
   * Get matches for a tournament with filters.
   */
  async getByTournament(tournamentId, { round, status, page = 1, limit = 50 }) {
    const where = { tournamentId };
    if (round) where.round = parseInt(round);
    if (status) where.status = status;

    const skip = (page - 1) * limit;

    const [matches, total] = await Promise.all([
      prisma.match.findMany({
        where,
        include: {
          homeTeam: { select: { id: true, name: true, shieldUrl: true } },
          awayTeam: { select: { id: true, name: true, shieldUrl: true } },
          result: true,
        },
        orderBy: [{ round: 'asc' }, { matchOrder: 'asc' }],
        skip,
        take: limit,
      }),
      prisma.match.count({ where }),
    ]);

    return {
      matches,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Get a single match by ID.
   */
  async getById(id) {
    const match = await prisma.match.findUnique({
      where: { id },
      include: {
        homeTeam: { select: { id: true, name: true, shieldUrl: true } },
        awayTeam: { select: { id: true, name: true, shieldUrl: true } },
        result: {
          include: {
            recorder: { select: { id: true, username: true } },
          },
        },
        tournament: {
          include: { gameType: true },
        },
      },
    });

    if (!match) {
      throw Object.assign(new Error('Partido no encontrado'), { statusCode: 404 });
    }

    return match;
  }

  /**
   * Update match details (date, location, notes).
   */
  async update(id, data) {
    const match = await prisma.match.update({
      where: { id },
      data: {
        ...(data.scheduledAt !== undefined && { scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null }),
        ...(data.location !== undefined && { location: data.location }),
        ...(data.notes !== undefined && { notes: data.notes }),
      },
      include: {
        homeTeam: { select: { id: true, name: true, shieldUrl: true } },
        awayTeam: { select: { id: true, name: true, shieldUrl: true } },
      },
    });
    return match;
  }

  /**
   * Change match status (postpone, etc.).
   */
  async changeStatus(id, status) {
    const validStatuses = ['PENDING', 'PLAYED', 'POSTPONED'];
    if (!validStatuses.includes(status)) {
      throw Object.assign(new Error(`Estado inválido. Opciones: ${validStatuses.join(', ')}`), { statusCode: 400 });
    }

    const match = await prisma.match.update({
      where: { id },
      data: { status },
    });

    return match;
  }

  /**
   * Record a match result.
   */
  async recordResult(matchId, { homeScore, awayScore, extraData }, recordedBy) {
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: { result: true, tournament: true },
    });

    if (!match) {
      throw Object.assign(new Error('Partido no encontrado'), { statusCode: 404 });
    }

    if (match.result) {
      throw Object.assign(new Error('Este partido ya tiene resultado. Usá la edición.'), { statusCode: 400 });
    }

    if (homeScore < 0 || awayScore < 0) {
      throw Object.assign(new Error('Los puntajes no pueden ser negativos'), { statusCode: 400 });
    }

    // Create result and update match status in transaction
    const result = await prisma.$transaction(async (tx) => {
      const matchResult = await tx.matchResult.create({
        data: {
          matchId,
          homeScore,
          awayScore,
          extraData: extraData || null,
          recordedBy,
        },
      });

      await tx.match.update({
        where: { id: matchId },
        data: { status: 'PLAYED' },
      });

      return matchResult;
    });

    // Recalculate standings
    if (match.tournament.format === 'ROUND_ROBIN') {
      await standingsService.recalculate(match.tournamentId);
    }

    // For elimination, advance winner to next round
    if (match.tournament.format === 'SINGLE_ELIMINATION' && match.bracketRound) {
      await this._advanceWinner(match, homeScore, awayScore);
    }

    // Check if tournament is finished
    await this._checkTournamentCompletion(match.tournamentId);

    return result;
  }

  /**
   * Edit an existing match result (recalculates standings).
   */
  async editResult(matchId, { homeScore, awayScore, extraData }, recordedBy) {
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: { result: true, tournament: true },
    });

    if (!match) {
      throw Object.assign(new Error('Partido no encontrado'), { statusCode: 404 });
    }

    if (!match.result) {
      throw Object.assign(new Error('Este partido no tiene resultado para editar'), { statusCode: 400 });
    }

    const result = await prisma.matchResult.update({
      where: { id: match.result.id },
      data: {
        homeScore,
        awayScore,
        extraData: extraData || null,
        recordedBy,
      },
    });

    // Recalculate standings
    if (match.tournament.format === 'ROUND_ROBIN') {
      await standingsService.recalculate(match.tournamentId);
    }

    return result;
  }

  /**
   * Advance winner in elimination bracket.
   */
  async _advanceWinner(match, homeScore, awayScore) {
    if (homeScore === awayScore) {
      // Draws not allowed in elimination - need extra handling
      return;
    }

    const winnerId = homeScore > awayScore ? match.homeTeamId : match.awayTeamId;
    const nextPosition = Math.ceil(match.bracketPosition / 2);
    const nextRound = match.bracketRound + 1;

    const nextMatch = await prisma.match.findFirst({
      where: {
        tournamentId: match.tournamentId,
        bracketRound: nextRound,
        bracketPosition: nextPosition,
      },
    });

    if (nextMatch) {
      const isHome = match.bracketPosition % 2 !== 0;
      await prisma.match.update({
        where: { id: nextMatch.id },
        data: isHome ? { homeTeamId: winnerId } : { awayTeamId: winnerId },
      });
    }
  }

  /**
   * Check if all matches are played and update tournament status.
   */
  async _checkTournamentCompletion(tournamentId) {
    const pendingCount = await prisma.match.count({
      where: {
        tournamentId,
        status: { in: ['PENDING', 'POSTPONED'] },
      },
    });

    if (pendingCount === 0) {
      await prisma.tournament.update({
        where: { id: tournamentId },
        data: { status: 'FINISHED' },
      });
    }
  }

  /**
   * Get matches for a specific team across all tournaments.
   */
  async getByTeam(teamId, { limit = 10, status }) {
    const where = {
      OR: [{ homeTeamId: teamId }, { awayTeamId: teamId }],
    };
    if (status) where.status = status;

    const matches = await prisma.match.findMany({
      where,
      include: {
        homeTeam: { select: { id: true, name: true, shieldUrl: true } },
        awayTeam: { select: { id: true, name: true, shieldUrl: true } },
        result: true,
        tournament: {
          include: { gameType: true },
        },
      },
      orderBy: [{ scheduledAt: 'asc' }, { round: 'asc' }],
      take: limit,
    });

    return matches;
  }

  /**
   * Get next upcoming match for a team.
   */
  async getNextMatch(teamId) {
    const match = await prisma.match.findFirst({
      where: {
        OR: [{ homeTeamId: teamId }, { awayTeamId: teamId }],
        status: 'PENDING',
      },
      include: {
        homeTeam: { select: { id: true, name: true, shieldUrl: true } },
        awayTeam: { select: { id: true, name: true, shieldUrl: true } },
        tournament: {
          include: { gameType: true },
        },
      },
      orderBy: [{ scheduledAt: 'asc' }, { round: 'asc' }],
    });

    return match;
  }

  /**
   * Get recent results for a team.
   */
  async getRecentResults(teamId, limit = 5) {
    const matches = await prisma.match.findMany({
      where: {
        OR: [{ homeTeamId: teamId }, { awayTeamId: teamId }],
        status: 'PLAYED',
      },
      include: {
        homeTeam: { select: { id: true, name: true, shieldUrl: true } },
        awayTeam: { select: { id: true, name: true, shieldUrl: true } },
        result: true,
        tournament: {
          include: { gameType: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: limit,
    });

    // Add W/L/D indicator
    return matches.map(m => {
      let outcome = 'D'; // Draw
      if (m.result) {
        const isHome = m.homeTeamId === teamId;
        const teamScore = isHome ? m.result.homeScore : m.result.awayScore;
        const opponentScore = isHome ? m.result.awayScore : m.result.homeScore;
        if (teamScore > opponentScore) outcome = 'W';
        else if (teamScore < opponentScore) outcome = 'L';
      }
      return { ...m, outcome };
    });
  }
}

module.exports = new MatchService();
