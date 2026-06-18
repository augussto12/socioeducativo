const recordsService = require('./records.service');
const { serialize } = require('../../utils/serialize');

const send = (res, data, status = 200) => res.status(status).json(serialize(data));

const getPublicByProjectSlug = async (req, res, next) => {
  try { send(res, await recordsService.getPublicByProjectSlug(req.params.slug)); } catch (error) { next(error); }
};

const getPublicRecord = async (req, res, next) => {
  try { send(res, await recordsService.getPublicRecord(req.params.id)); } catch (error) { next(error); }
};

const getMyRecords = async (req, res, next) => {
  try { send(res, await recordsService.getMyRecords(req.user.id, req.query)); } catch (error) { next(error); }
};

const getMyProjectRecords = async (req, res, next) => {
  try { send(res, await recordsService.getMyProjectRecords(req.user.id, req.params.projectId, req.query)); } catch (error) { next(error); }
};

const createStaffRecord = async (req, res, next) => {
  try { send(res, await recordsService.createStaffRecord(req.user.id, req.params.projectId, req.body), 201); } catch (error) { next(error); }
};

const getMyRecord = async (req, res, next) => {
  try { send(res, await recordsService.getMyRecord(req.user.id, req.params.id)); } catch (error) { next(error); }
};

const updateStaffRecord = async (req, res, next) => {
  try { send(res, await recordsService.updateStaffRecord(req.user.id, req.params.id, req.body)); } catch (error) { next(error); }
};

const deleteStaffRecord = async (req, res, next) => {
  try { send(res, await recordsService.deleteStaffRecord(req.user.id, req.params.id)); } catch (error) { next(error); }
};

const getAdminRecords = async (req, res, next) => {
  try { send(res, await recordsService.getAdminRecords(req.query)); } catch (error) { next(error); }
};

const getAdminRecord = async (req, res, next) => {
  try { send(res, await recordsService.getAdminRecord(req.params.id)); } catch (error) { next(error); }
};

const updateAdminRecord = async (req, res, next) => {
  try { send(res, await recordsService.updateAdminRecord(req.params.id, req.body, req.user.id)); } catch (error) { next(error); }
};

const changeStatus = async (req, res, next) => {
  try { send(res, await recordsService.changeStatus(req.params.id, req.body, req.user.id)); } catch (error) { next(error); }
};

const deleteAdminRecord = async (req, res, next) => {
  try { send(res, await recordsService.deleteAdminRecord(req.params.id, req.user.id)); } catch (error) { next(error); }
};

module.exports = {
  getPublicByProjectSlug,
  getPublicRecord,
  getMyRecords,
  getMyProjectRecords,
  createStaffRecord,
  getMyRecord,
  updateStaffRecord,
  deleteStaffRecord,
  getAdminRecords,
  getAdminRecord,
  updateAdminRecord,
  changeStatus,
  deleteAdminRecord,
};
