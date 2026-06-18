const jwt = require('jsonwebtoken');
const { JWT_ACCESS_SECRET } = require('../config/env');
const prisma = require('../config/database');

const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  isActive: true,
  mustChangePassword: true,
  deletedAt: true,
};

const PASSWORD_CHANGE_ALLOWED_PATHS = new Set([
  '/api/auth/change-password',
  '/api/auth/logout',
  '/api/auth/me',
]);

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token de acceso requerido' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_ACCESS_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: userSelect,
    });

    if (!user) {
      return res.status(401).json({ error: 'Usuario no encontrado' });
    }

    if (!user.isActive || user.deletedAt) {
      return res.status(403).json({ error: 'Usuario desactivado' });
    }

    req.user = user;

    if (user.mustChangePassword && !PASSWORD_CHANGE_ALLOWED_PATHS.has(req.originalUrl.split('?')[0])) {
      return res.status(403).json({
        error: 'Debes cambiar tu contrasena antes de continuar',
        code: 'PASSWORD_CHANGE_REQUIRED',
      });
    }

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expirado', code: 'TOKEN_EXPIRED' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Token invalido' });
    }
    next(error);
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_ACCESS_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: userSelect,
    });

    if (user && user.isActive) {
      req.user = user;
    }
    next();
  } catch {
    next();
  }
};

module.exports = { authenticate, optionalAuth };
