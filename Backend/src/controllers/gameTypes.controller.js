const prisma = require('../config/database');

const getAll = async (req, res, next) => {
  try {
    const gameTypes = await prisma.gameType.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
    res.json(gameTypes);
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const gameType = await prisma.gameType.findUnique({
      where: { id: req.params.id },
      include: {
        tournaments: {
          select: { id: true, name: true, status: true, format: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!gameType) {
      return res.status(404).json({ error: 'Tipo de juego no encontrado' });
    }

    res.json(gameType);
  } catch (error) {
    next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const { name, icon, description, rulesMd } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'El nombre del juego es requerido' });
    }

    const gameType = await prisma.gameType.create({
      data: {
        name: name.trim(),
        icon: icon || '🎮',
        description: description?.trim() || null,
        rulesMd: rulesMd?.trim() || null,
      },
    });

    res.status(201).json(gameType);
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const { name, icon, description, rulesMd } = req.body;

    const gameType = await prisma.gameType.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name: name.trim() }),
        ...(icon !== undefined && { icon }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(rulesMd !== undefined && { rulesMd: rulesMd?.trim() || null }),
      },
    });

    res.json(gameType);
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    // Soft delete
    await prisma.gameType.update({
      where: { id: req.params.id },
      data: { isActive: false },
    });
    res.json({ message: 'Tipo de juego eliminado' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAll, getById, create, update, remove };
