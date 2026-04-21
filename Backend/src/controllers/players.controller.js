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
    const { firstName, lastName, nickname, birthDate, position, notes } = req.body;

    if (!firstName || !lastName) {
      return res.status(400).json({ error: 'Nombre y apellido son requeridos' });
    }

    // Check team exists
    const team = await prisma.team.findUnique({ where: { id: req.params.teamId } });
    if (!team) {
      return res.status(404).json({ error: 'Equipo no encontrado' });
    }

    // Check player limit (max 20)
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
        position: position?.trim() || null,
        notes: notes?.trim() || null,
      },
    });

    res.status(201).json(player);
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const { firstName, lastName, nickname, birthDate, position, notes } = req.body;

    const player = await prisma.player.update({
      where: { id: req.params.id },
      data: {
        ...(firstName && { firstName: firstName.trim() }),
        ...(lastName && { lastName: lastName.trim() }),
        ...(nickname !== undefined && { nickname: nickname?.trim() || null }),
        ...(birthDate !== undefined && { birthDate: birthDate ? new Date(birthDate) : null }),
        ...(position !== undefined && { position: position?.trim() || null }),
        ...(notes !== undefined && { notes: notes?.trim() || null }),
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

module.exports = { getByTeam, create, update, remove };
