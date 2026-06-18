const projectsService = require('./projects.service');
const { serialize } = require('../../utils/serialize');

const send = (res, data, status = 200) => res.status(status).json(serialize(data));

const getPublicProjects = async (req, res, next) => {
  try { send(res, await projectsService.getPublicProjects()); } catch (error) { next(error); }
};

const getPublicBySlug = async (req, res, next) => {
  try { send(res, await projectsService.getPublicBySlug(req.params.slug)); } catch (error) { next(error); }
};

const getAssignedProjects = async (req, res, next) => {
  try { send(res, await projectsService.getAssignedProjects(req.user.id)); } catch (error) { next(error); }
};

const getAssignedProject = async (req, res, next) => {
  try { send(res, await projectsService.getAssignedProject(req.user.id, req.params.id)); } catch (error) { next(error); }
};

const getAdminProjects = async (req, res, next) => {
  try { send(res, await projectsService.getAdminProjects()); } catch (error) { next(error); }
};

const getAdminProject = async (req, res, next) => {
  try { send(res, await projectsService.getAdminProject(req.params.id)); } catch (error) { next(error); }
};

const create = async (req, res, next) => {
  try { send(res, await projectsService.create(req.body, req.user.id), 201); } catch (error) { next(error); }
};

const update = async (req, res, next) => {
  try { send(res, await projectsService.update(req.params.id, req.body, req.user.id)); } catch (error) { next(error); }
};

const remove = async (req, res, next) => {
  try { send(res, await projectsService.remove(req.params.id, req.user.id)); } catch (error) { next(error); }
};

const addMember = async (req, res, next) => {
  try { send(res, await projectsService.addMember(req.params.id, req.body, req.user.id), 201); } catch (error) { next(error); }
};

const removeMember = async (req, res, next) => {
  try { send(res, await projectsService.removeMember(req.params.id, req.params.userId, req.user.id)); } catch (error) { next(error); }
};

module.exports = {
  getPublicProjects,
  getPublicBySlug,
  getAssignedProjects,
  getAssignedProject,
  getAdminProjects,
  getAdminProject,
  create,
  update,
  remove,
  addMember,
  removeMember,
};
