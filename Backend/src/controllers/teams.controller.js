const teamsService = require('../services/teams.service');

const getAll = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;
    const result = await teamsService.getAll({
      page: parseInt(page),
      limit: parseInt(limit),
      search,
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const team = await teamsService.getById(req.params.id);
    res.json(team);
  } catch (error) {
    next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const { name, shieldUrl, descriptionMd } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'El nombre del equipo es requerido' });
    }

    const result = await teamsService.create({ name: name.trim(), shieldUrl, descriptionMd });
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const team = await teamsService.update(req.params.id, req.body);
    res.json(team);
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const { shieldUrl, descriptionMd } = req.body;

    // Handle file upload
    let finalShieldUrl = shieldUrl;
    if (req.file) {
      finalShieldUrl = `/uploads/shields/${req.file.filename}`;
    }

    const team = await teamsService.updateProfile(req.params.id, {
      shieldUrl: finalShieldUrl,
      descriptionMd,
    });
    res.json(team);
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    const result = await teamsService.delete(req.params.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const result = await teamsService.resetPassword(req.params.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const toggleActive = async (req, res, next) => {
  try {
    const result = await teamsService.toggleActive(req.params.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = { getAll, getById, create, update, updateProfile, remove, resetPassword, toggleActive };
