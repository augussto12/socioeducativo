const prisma = require('../config/database');

const requireProjectMember = (paramName = 'projectId') => async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Autenticacion requerida' });
    }

    if (req.user.role === 'ADMIN') {
      return next();
    }

    const projectId = req.params[paramName];
    const membership = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId: req.user.id,
        },
      },
      include: {
        project: { select: { deletedAt: true } },
      },
    });

    if (!membership || membership.project.deletedAt) {
      return res.status(403).json({ error: 'No tenes acceso a este proyecto' });
    }

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { requireProjectMember };
