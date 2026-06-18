const healthService = require('./health.service');

function health(req, res) {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
}

async function ready(req, res, next) {
  try {
    const result = await healthService.readiness();
    res.status(result.status === 'ready' ? 200 : 503).json(result);
  } catch (error) {
    next(error);
  }
}

module.exports = { health, ready };
