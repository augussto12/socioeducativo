const tournamentService = require('../services/tournament.service');

const getAll = async (req, res, next) => {
  try {
    const { status, gameTypeId, page = 1, limit = 20 } = req.query;
    const result = await tournamentService.getAll({
      status,
      gameTypeId,
      page: parseInt(page),
      limit: parseInt(limit),
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const tournament = await tournamentService.getById(req.params.id);
    res.json(tournament);
  } catch (error) {
    next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const { name, gameTypeId, format } = req.body;

    if (!name || !gameTypeId || !format) {
      return res.status(400).json({ error: 'Nombre, tipo de juego y formato son requeridos' });
    }

    if (!['ROUND_ROBIN', 'SINGLE_ELIMINATION'].includes(format)) {
      return res.status(400).json({ error: 'Formato inválido. Opciones: ROUND_ROBIN, SINGLE_ELIMINATION' });
    }

    const tournament = await tournamentService.create(req.body);
    res.status(201).json(tournament);
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const tournament = await tournamentService.update(req.params.id, req.body);
    res.json(tournament);
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    const result = await tournamentService.delete(req.params.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const enrollTeams = async (req, res, next) => {
  try {
    const { teamIds } = req.body;

    if (!teamIds || !Array.isArray(teamIds) || teamIds.length === 0) {
      return res.status(400).json({ error: 'Se requiere un array de IDs de equipos' });
    }

    const result = await tournamentService.enrollTeams(req.params.id, teamIds);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const unenrollTeam = async (req, res, next) => {
  try {
    const result = await tournamentService.unenrollTeam(req.params.id, req.params.teamId);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const generateFixture = async (req, res, next) => {
  try {
    const result = await tournamentService.generateFixturePreview(req.params.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const confirmFixture = async (req, res, next) => {
  try {
    const result = await tournamentService.confirmFixture(req.params.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const getStandings = async (req, res, next) => {
  try {
    const standingsService = require('../services/standings.service');
    const standings = await standingsService.getStandings(req.params.id);
    res.json(standings);
  } catch (error) {
    next(error);
  }
};

const getByTeam = async (req, res, next) => {
  try {
    const tournaments = await tournamentService.getByTeam(req.params.teamId);
    res.json(tournaments);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAll, getById, create, update, remove,
  enrollTeams, unenrollTeam, generateFixture, confirmFixture,
  getStandings, getByTeam,
};
