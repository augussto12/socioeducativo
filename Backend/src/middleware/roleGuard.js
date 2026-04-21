/**
 * Role-based access control middleware.
 * @param  {...string} roles - Allowed roles (e.g., 'ADMIN', 'TEAM')
 */
const roleGuard = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Autenticación requerida' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'No tenés permisos para esta acción' });
    }

    next();
  };
};

/**
 * Middleware to check if the team user is accessing their own data.
 * Param name defaults to 'id' - the team ID in the URL.
 */
const ownTeamOnly = (paramName = 'id') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Autenticación requerida' });
    }

    // Admins can access everything
    if (req.user.role === 'ADMIN') {
      return next();
    }

    const teamId = req.params[paramName];
    if (req.user.teamId !== teamId) {
      return res.status(403).json({ error: 'Solo podés acceder a tu propio equipo' });
    }

    next();
  };
};

module.exports = { roleGuard, ownTeamOnly };
