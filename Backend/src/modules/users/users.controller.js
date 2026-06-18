const usersService = require('./users.service');

const getAll = async (req, res, next) => {
  try { res.json(await usersService.getAll(req.query)); } catch (error) { next(error); }
};

const getById = async (req, res, next) => {
  try { res.json(await usersService.getById(req.params.id)); } catch (error) { next(error); }
};

const create = async (req, res, next) => {
  try { res.status(201).json(await usersService.create(req.body, req.user.id)); } catch (error) { next(error); }
};

const update = async (req, res, next) => {
  try { res.json(await usersService.update(req.params.id, req.body, req.user.id)); } catch (error) { next(error); }
};

const disable = async (req, res, next) => {
  try { res.json(await usersService.setActive(req.params.id, false, req.user.id)); } catch (error) { next(error); }
};

const enable = async (req, res, next) => {
  try { res.json(await usersService.setActive(req.params.id, true, req.user.id)); } catch (error) { next(error); }
};

const remove = async (req, res, next) => {
  try { res.json(await usersService.remove(req.params.id, req.user.id)); } catch (error) { next(error); }
};

module.exports = { getAll, getById, create, update, disable, enable, remove };
