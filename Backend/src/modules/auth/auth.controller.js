const authService = require('./auth.service');
const prisma = require('../../config/database');
const {
  COOKIE_DOMAIN,
  COOKIE_SECURE,
  COOKIE_SAME_SITE,
  REFRESH_COOKIE_MAX_AGE_MS,
} = require('../../config/env');

function refreshCookieOptions() {
  return {
    httpOnly: true,
    secure: COOKIE_SECURE,
    sameSite: COOKIE_SAME_SITE,
    maxAge: REFRESH_COOKIE_MAX_AGE_MS,
    path: '/api/auth',
    ...(COOKIE_DOMAIN ? { domain: COOKIE_DOMAIN } : {}),
  };
}

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password) {
      return res.status(400).json({ error: 'Email y contrasena son requeridos' });
    }

    const result = await authService.login(email, password);

    res.cookie('refreshToken', result.refreshToken, refreshCookieOptions());

    res.json({
      accessToken: result.accessToken,
      user: result.user,
    });
  } catch (error) {
    next(error);
  }
};

const refresh = async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token requerido' });
    }

    const result = await authService.refresh(refreshToken);
    res.cookie('refreshToken', result.refreshToken, refreshCookieOptions());
    res.json({
      accessToken: result.accessToken,
      user: result.user,
    });
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    await authService.logout(refreshToken);
  } catch (error) {
    return next(error);
  }

  res.clearCookie('refreshToken', refreshCookieOptions());
  res.json({ message: 'Sesion cerrada correctamente' });
};

const me = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        mustChangePassword: true,
      },
    });
    res.json(user);
  } catch (error) {
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (typeof currentPassword !== 'string' || typeof newPassword !== 'string' || !currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Contrasena actual y nueva son requeridas' });
    }

    const result = await authService.changePassword(req.user.id, currentPassword, newPassword);
    res.cookie('refreshToken', result.refreshToken, refreshCookieOptions());
    res.json({
      message: result.message,
      accessToken: result.accessToken,
      user: result.user,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { login, refresh, logout, me, changePassword };
