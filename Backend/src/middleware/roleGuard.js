const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Autenticacion requerida' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'No tenes permisos para esta accion' });
    }

    next();
  };
};

module.exports = { requireRole, roleGuard: requireRole };
