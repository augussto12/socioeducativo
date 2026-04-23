const prisma = require('../config/database');

const getByTeam = async (req, res, next) => {
  try {
    const players = await prisma.player.findMany({
      where: { teamId: req.params.teamId, isActive: true },
      orderBy: { lastName: 'asc' },
    });
    res.json(players);
  } catch (error) {
    next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const { firstName, lastName, nickname, birthDate } = req.body;

    if (!firstName || !lastName) {
      return res.status(400).json({ error: 'Nombre y apellido son requeridos' });
    }

    const team = await prisma.team.findUnique({ where: { id: req.params.teamId } });
    if (!team) {
      return res.status(404).json({ error: 'Equipo no encontrado' });
    }

    const count = await prisma.player.count({
      where: { teamId: req.params.teamId, isActive: true },
    });
    if (count >= 20) {
      return res.status(400).json({ error: 'Máximo 20 jugadores por equipo' });
    }

    const player = await prisma.player.create({
      data: {
        teamId: req.params.teamId,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        nickname: nickname?.trim() || null,
        birthDate: birthDate ? new Date(birthDate) : null,
      },
    });

    res.status(201).json(player);
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const { firstName, lastName, nickname, birthDate } = req.body;

    const player = await prisma.player.update({
      where: { id: req.params.id },
      data: {
        ...(firstName && { firstName: firstName.trim() }),
        ...(lastName && { lastName: lastName.trim() }),
        ...(nickname !== undefined && { nickname: nickname?.trim() || null }),
        ...(birthDate !== undefined && { birthDate: birthDate ? new Date(birthDate) : null }),
      },
    });

    res.json(player);
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    await prisma.player.update({
      where: { id: req.params.id },
      data: { isActive: false },
    });
    res.json({ message: 'Jugador eliminado' });
  } catch (error) {
    next(error);
  }
};

const getBirthdaysToday = async (req, res, next) => {
  try {
    const today = new Date();
    const month = today.getMonth() + 1;
    const day = today.getDate();

    const players = await prisma.player.findMany({
      where: {
        isActive: true,
        birthDate: { not: null },
      },
      include: {
        team: { select: { id: true, name: true, shieldUrl: true } },
      },
      orderBy: { lastName: 'asc' },
    });

    // Filter by month/day match (Prisma doesn't support EXTRACT natively)
    const birthdayPlayers = players.filter((p) => {
      const bd = new Date(p.birthDate);
      return bd.getMonth() + 1 === month && bd.getDate() === day;
    });

    res.json(birthdayPlayers);
  } catch (error) {
    next(error);
  }
};

module.exports = { getByTeam, create, update, remove, getBirthdaysToday };

