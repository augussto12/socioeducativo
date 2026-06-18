const { CORS_ORIGIN, NODE_ENV, splitList } = require('../config/env');

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
const allowedOrigins = new Set(splitList(CORS_ORIGIN));

function header(req, name) {
  if (typeof req.get === 'function') return req.get(name);
  return req.headers?.[name.toLowerCase()];
}

function requestOrigin(req) {
  const origin = header(req, 'origin');
  if (origin) return origin;

  const referer = header(req, 'referer');
  if (!referer) return null;

  try {
    return new URL(referer).origin;
  } catch {
    return null;
  }
}

function sameOrigin(req) {
  const host = header(req, 'host');
  if (!host) return null;

  const forwardedProto = header(req, 'x-forwarded-proto');
  const protocol = String(forwardedProto || req.protocol || (req.secure ? 'https' : 'http'))
    .split(',')[0]
    .trim();
  return `${protocol}://${host}`;
}

function hasRefreshCookie(req) {
  if (req.cookies?.refreshToken) return true;
  return /(?:^|;\s*)refreshToken=/.test(header(req, 'cookie') || '');
}

function isAllowedCsrfOrigin(req, origin) {
  if (!origin || origin === 'null') return false;
  return allowedOrigins.has(origin) || origin === sameOrigin(req);
}

function csrfProtection(req, res, next) {
  if (SAFE_METHODS.has(req.method)) return next();
  if (!hasRefreshCookie(req)) return next();

  const origin = requestOrigin(req);
  if (!origin && NODE_ENV !== 'production') return next();
  if (isAllowedCsrfOrigin(req, origin)) return next();

  return res.status(403).json({ error: 'Solicitud rechazada por proteccion CSRF' });
}

module.exports = {
  csrfProtection,
  hasRefreshCookie,
  isAllowedCsrfOrigin,
  requestOrigin,
};
