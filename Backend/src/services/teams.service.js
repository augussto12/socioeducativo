const prisma = require('../config/database');
const { generatePassword, generateUsername } = require('../utils/generatePassword');
const authService = require('./auth.service');

class TeamsService {
  /**
   * Get all teams with optional pagination.
   */
  async getAll({ page = 1, limit = 20, search = '' }) {
    const skip = (page - 1) * limit;
    const where = search
      ? { name: { contains: search, mode: 'insensitive' } }
      : {};

    const [teams, total] = await Promise.all([
      prisma.team.findMany({
        where,
        include: {
          _count: { select: { players: true } },
          user: { select: { id: true, username: true, isActive: true } },
        },
        orderBy: { name: 'asc' },
        skip,
        take: limit,
      }),
      prisma.team.count({ where }),
    ]);

    return {
      teams,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Get a single team by ID with players.
   */
  async getById(id) {
    const team = await prisma.team.findUnique({
      where: { id },
      include: {
        players: {
          where: { isActive: true },
          orderBy: { lastName: 'asc' },
        },
        user: { select: { id: true, username: true, isActive: true } },
        tournamentTeams: {
          include: {
            tournament: {
              include: { gameType: true },
            },
          },
        },
      },
    });

    if (!team) {
      throw Object.assign(new Error('Equipo no encontrado'), { statusCode: 404 });
    }

    return team;
  }

  /**
   * Create a team and auto-generate its user account.
   * Returns team + generated credentials.
   */
  async create({ name, shieldUrl, descriptionMd }) {
    // Generate unique username and random password
    let username = generateUsername(name);
    const password = generatePassword();

    // Check username uniqueness, append number if needed
    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) {
      username = `${username}_${Date.now().toString().slice(-4)}`;
    }

    const passwordHash = await authService.hashPassword(password);

    // Create team and user in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const team = await tx.team.create({
        data: {
          name,
          shieldUrl: shieldUrl || null,
          descriptionMd: descriptionMd || null,
        },
      });

      const user = await tx.user.create({
        data: {
          username,
          passwordHash,
          role: 'TEAM',
          teamId: team.id,
        },
      });

      return { team, user };
    });

    return {
      team: result.team,
      credentials: {
        username,
        password, // Plain text, shown only once
        userId: result.user.id,
      },
    };
  }

  /**
   * Update a team (admin).
   */
  async update(id, data) {
    const team = await prisma.team.update({
      where: { id },
      data: {
        name: data.name,
        shieldUrl: data.shieldUrl,
        descriptionMd: data.descriptionMd,
      },
    });
    return team;
  }

  /**
   * Update team profile (team user - only shield and description).
   */
  async updateProfile(id, { shieldUrl, descriptionMd }) {
    const team = await prisma.team.update({
      where: { id },
      data: {
        ...(shieldUrl !== undefined && { shieldUrl }),
        ...(descriptionMd !== undefined && { descriptionMd }),
      },
    });
    return team;
  }

  /**
   * Delete a team (soft: deactivate user).
   */
  async delete(id) {
    await prisma.$transaction(async (tx) => {
      // Deactivate user
      await tx.user.updateMany({
        where: { teamId: id },
        data: { isActive: false },
      });

      // Remove from all tournaments
      await tx.tournamentTeam.deleteMany({ where: { teamId: id } });

      // Delete team
      await tx.team.delete({ where: { id } });
    });

    return { message: 'Equipo eliminado correctamente' };
  }

  /**
   * Reset team user password.
   */
  async resetPassword(teamId) {
    const user = await prisma.user.findFirst({ where: { teamId } });
    if (!user) {
      throw Object.assign(new Error('Usuario del equipo no encontrado'), { statusCode: 404 });
    }

    const newPassword = generatePassword();
    const passwordHash = await authService.hashPassword(newPassword);

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    return { username: user.username, password: newPassword };
  }

  /**
   * Toggle team user active status.
   */
  async toggleActive(teamId) {
    const user = await prisma.user.findFirst({ where: { teamId } });
    if (!user) {
      throw Object.assign(new Error('Usuario del equipo no encontrado'), { statusCode: 404 });
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { isActive: !user.isActive },
    });

    return { isActive: updated.isActive };
  }
}

module.exports = new TeamsService();
