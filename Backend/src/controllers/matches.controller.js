const matchService = require('../services/match.service');

const getByTournament = async (req, res, next) => {
  try {
    const { round, status, page = 1, limit = 50 } = req.query;
    const result = await matchService.getByTournament(req.params.id, {
      round,
      status,
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
    const match = await matchService.getById(req.params.id);
    res.json(match);
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const match = await matchService.update(req.params.id, req.body);
    res.json(match);
  } catch (error) {
    next(error);
  }
};

const changeStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Estado es requerido' });
    }

    const match = await matchService.changeStatus(req.params.id, status);
    res.json(match);
  } catch (error) {
    next(error);
  }
};

const recordResult = async (req, res, next) => {
  try {
    const { homeScore, awayScore, extraData } = req.body;

    if (homeScore === undefined || awayScore === undefined) {
      return res.status(400).json({ error: 'Puntaje local y visitante son requeridos' });
    }

    const result = await matchService.recordResult(
      req.params.id,
      { homeScore: parseInt(homeScore), awayScore: parseInt(awayScore), extraData },
      req.user.id
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const editResult = async (req, res, next) => {
  try {
    const { homeScore, awayScore, extraData } = req.body;

    if (homeScore === undefined || awayScore === undefined) {
      return res.status(400).json({ error: 'Puntaje local y visitante son requeridos' });
    }

    const result = await matchService.editResult(
      req.params.id,
      { homeScore: parseInt(homeScore), awayScore: parseInt(awayScore), extraData },
      req.user.id
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const getByTeam = async (req, res, next) => {
  try {
    const { limit = 10, status } = req.query;
    const matches = await matchService.getByTeam(req.params.teamId, {
      limit: parseInt(limit),
      status,
    });
    res.json(matches);
  } catch (error) {
    next(error);
  }
};

const getNextMatch = async (req, res, next) => {
  try {
    const match = await matchService.getNextMatch(req.params.teamId);
    res.json(match);
  } catch (error) {
    next(error);
  }
};

const getRecentResults = async (req, res, next) => {
  try {
    const { limit = 5 } = req.query;
    const results = await matchService.getRecentResults(req.params.teamId, parseInt(limit));
    res.json(results);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getByTournament, getById, update, changeStatus,
  recordResult, editResult, getByTeam, getNextMatch, getRecentResults,
};
