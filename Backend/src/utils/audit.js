const prisma = require('../config/database');

function auditLogData({ userId, action, entityType, entityId, metadata }) {
  return {
    userId: userId || null,
    action,
    entityType,
    entityId: entityId || null,
    metadata: metadata || undefined,
  };
}

async function auditLog({ userId, action, entityType, entityId, metadata }) {
  try {
    await prisma.auditLog.create({
      data: auditLogData({ userId, action, entityType, entityId, metadata }),
    });
  } catch (error) {
    console.error('Audit log error:', error);
  }
}

async function auditLogStrict(client, entry) {
  return client.auditLog.create({ data: auditLogData(entry) });
}

module.exports = { auditLog, auditLogData, auditLogStrict };
