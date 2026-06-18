const prisma = require('../config/database');

async function canUserAccessRecord(user, recordId) {
  const record = await prisma.projectRecord.findUnique({
    where: { id: recordId },
    include: {
      project: true,
      files: true,
    },
  });

  if (!record || record.deletedAt || record.project.deletedAt) {
    return { allowed: false, record: null };
  }

  if (!user) {
    const allowed = record.visibility === 'PUBLIC' &&
      record.status === 'PUBLISHED' &&
      record.project.visibility === 'PUBLIC' &&
      record.project.status === 'ACTIVE';
    return { allowed, record };
  }

  if (user.role === 'ADMIN') {
    return { allowed: true, record };
  }

  if (record.createdBy === user.id) {
    return { allowed: true, record };
  }

  const membership = await prisma.projectMember.findUnique({
    where: {
      projectId_userId: {
        projectId: record.projectId,
        userId: user.id,
      },
    },
  });

  return { allowed: !!membership, record };
}

const requireRecordAccess = (paramName = 'id') => async (req, res, next) => {
  try {
    const { allowed, record } = await canUserAccessRecord(req.user, req.params[paramName]);
    if (!record) {
      return res.status(404).json({ error: 'Registro no encontrado' });
    }
    if (!allowed) {
      return res.status(403).json({ error: 'No tenes acceso a este registro' });
    }
    req.record = record;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { canUserAccessRecord, requireRecordAccess };
