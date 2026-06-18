const adminService = require('./admin.service');

const getDashboard = async (req, res, next) => {
  try { res.json(await adminService.getDashboard()); } catch (error) { next(error); }
};

const getAuditLogs = async (req, res, next) => {
  try { res.json(await adminService.getAuditLogs(req.query)); } catch (error) { next(error); }
};

module.exports = { getDashboard, getAuditLogs };
