require('dotenv').config();

const parseBoolean = (value, fallback = false) => {
  if (value === undefined || value === null || value === '') return fallback;
  const normalized = String(value).toLowerCase();
  if (['true', '1', 'yes', 'on'].includes(normalized)) return true;
  if (['false', '0', 'no', 'off'].includes(normalized)) return false;
  return fallback;
};

const parseInteger = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const parseDurationMs = (value, fallback) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value * 1000;
  if (typeof value !== 'string') return fallback;

  const match = value.trim().match(/^(\d+)(ms|s|m|h|d)$/i);
  if (!match) return fallback;

  const amount = Number.parseInt(match[1], 10);
  const unit = match[2].toLowerCase();
  const multipliers = {
    ms: 1,
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };

  return amount * multipliers[unit];
};

const splitList = (value) => String(value || '')
  .split(',')
  .map((item) => item.trim())
  .filter(Boolean);

const normalizeSameSite = (value) => {
  const normalized = String(value || 'lax').toLowerCase();
  return ['strict', 'lax', 'none'].includes(normalized) ? normalized : 'lax';
};

const isPlaceholder = (value) => (
  !value ||
  value.includes('change-in-production') ||
  value.startsWith('replace-') ||
  value.includes('replace-with')
);

const NODE_ENV = process.env.NODE_ENV || 'development';
const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || 'dev-access-secret-change-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-change-in-production';
const ACCESS_TOKEN_EXPIRES_IN = process.env.ACCESS_TOKEN_EXPIRES_IN || process.env.JWT_EXPIRATION || '15m';
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || process.env.JWT_REFRESH_EXPIRATION || '7d';
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173,http://localhost:5174';
const COOKIE_SECURE = parseBoolean(process.env.COOKIE_SECURE, NODE_ENV === 'production');
const COOKIE_SAME_SITE_RAW = process.env.COOKIE_SAME_SITE || 'lax';
const COOKIE_SAME_SITE = normalizeSameSite(COOKIE_SAME_SITE_RAW);
const REFRESH_COOKIE_MAX_AGE_MS = parseDurationMs(REFRESH_TOKEN_EXPIRES_IN, 7 * 24 * 60 * 60 * 1000);

const assertStrongSecret = (key, value) => {
  if (isPlaceholder(value) || value.length < 32) {
    throw new Error(`Missing secure production environment variable: ${key}`);
  }
};

if (NODE_ENV === 'production') {
  if (!process.env.DATABASE_URL || isPlaceholder(process.env.DATABASE_URL)) {
    throw new Error('Missing secure production environment variable: DATABASE_URL');
  }

  assertStrongSecret('JWT_ACCESS_SECRET', JWT_ACCESS_SECRET);
  assertStrongSecret('JWT_REFRESH_SECRET', JWT_REFRESH_SECRET);

  const allowedOrigins = splitList(CORS_ORIGIN);
  if (allowedOrigins.length === 0 || allowedOrigins.includes('*')) {
    throw new Error('CORS_ORIGIN must list explicit production origins');
  }

  if (!COOKIE_SECURE) {
    throw new Error('COOKIE_SECURE must be true in production');
  }

  if (!['strict', 'lax', 'none'].includes(String(COOKIE_SAME_SITE_RAW).toLowerCase())) {
    throw new Error('COOKIE_SAME_SITE must be strict, lax, or none');
  }

  if (COOKIE_SAME_SITE === 'none' && !COOKIE_SECURE) {
    throw new Error('COOKIE_SAME_SITE=none requires COOKIE_SECURE=true');
  }

  if (!parseDurationMs(REFRESH_TOKEN_EXPIRES_IN, null)) {
    throw new Error('REFRESH_TOKEN_EXPIRES_IN must use a duration like 7d, 12h, 30m, or 900s');
  }
}

module.exports = {
  PORT: process.env.PORT || 3001,
  NODE_ENV,
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_ACCESS_SECRET,
  JWT_SECRET: JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET,
  ACCESS_TOKEN_EXPIRES_IN,
  REFRESH_TOKEN_EXPIRES_IN,
  JWT_EXPIRATION: ACCESS_TOKEN_EXPIRES_IN,
  JWT_REFRESH_EXPIRATION: REFRESH_TOKEN_EXPIRES_IN,
  CORS_ORIGIN,
  COOKIE_DOMAIN: process.env.COOKIE_DOMAIN || undefined,
  COOKIE_SECURE,
  COOKIE_SAME_SITE,
  REFRESH_COOKIE_MAX_AGE_MS,
  UPLOAD_DIR: process.env.UPLOAD_DIR || './uploads',
  UPLOAD_PUBLIC_DIR: process.env.UPLOAD_PUBLIC_DIR || './uploads/public',
  UPLOAD_PRIVATE_DIR: process.env.UPLOAD_PRIVATE_DIR || './uploads/private',
  MAX_FILE_SIZE: parseInteger(process.env.MAX_FILE_SIZE, 5 * 1024 * 1024),
  MAX_IMAGE_SIZE: parseInteger(process.env.MAX_IMAGE_SIZE, 10 * 1024 * 1024),
  MAX_DOCUMENT_SIZE: parseInteger(process.env.MAX_DOCUMENT_SIZE, 25 * 1024 * 1024),
  MAX_AUDIO_SIZE: parseInteger(process.env.MAX_AUDIO_SIZE, 50 * 1024 * 1024),
  MAX_VIDEO_SIZE: parseInteger(process.env.MAX_VIDEO_SIZE, 250 * 1024 * 1024),
  ADMIN_EMAIL: process.env.ADMIN_EMAIL,
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
  parseDurationMs,
  splitList,
};
