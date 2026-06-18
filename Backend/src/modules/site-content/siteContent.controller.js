const siteContentService = require('./siteContent.service');

const getAll = async (req, res, next) => {
  try {
    res.json(await siteContentService.getAll());
  } catch (error) {
    next(error);
  }
};

const getByKey = async (req, res, next) => {
  try {
    res.json(await siteContentService.getByKey(req.params.key));
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    res.json(await siteContentService.update(req.params.key, req.body, req.user.id));
  } catch (error) {
    next(error);
  }
};

module.exports = { getAll, getByKey, update };
