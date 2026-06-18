const prisma = require('../../config/database');
const { serialize } = require('../../utils/serialize');
const { getPagination, paginatedResponse } = require('../../utils/pagination');

class AdminService {
  async getDashboard() {
    const [
      projects,
      publicProjects,
      records,
      recordsPendingReview,
      staffUsers,
      latestRecords,
      latestAuditLogs,
    ] = await Promise.all([
      prisma.pedagogicalProject.count({ where: { deletedAt: null } }),
      prisma.pedagogicalProject.count({ where: { deletedAt: null, visibility: 'PUBLIC', status: 'ACTIVE' } }),
      prisma.projectRecord.count({ where: { deletedAt: null } }),
      prisma.projectRecord.count({ where: { deletedAt: null, status: 'PENDING_REVIEW' } }),
      prisma.user.count({ where: { deletedAt: null, role: 'STAFF' } }),
      prisma.projectRecord.findMany({
        where: { deletedAt: null },
        include: {
          project: { select: { id: true, name: true, slug: true } },
          author: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      prisma.auditLog.findMany({
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ]);

    return serialize({
      projects,
      publicProjects,
      records,
      recordsPendingReview,
      staffUsers,
      latestRecords,
      latestAuditLogs,
    });
  }

  async getAuditLogs({ page = 1, limit = 50 } = {}) {
    const pagination = getPagination({ page, limit }, { defaultLimit: 50, maxLimit: 100 });

    const [items, total] = await Promise.all([
      prisma.auditLog.findMany({
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: 'desc' },
        skip: pagination.skip,
        take: pagination.take,
      }),
      prisma.auditLog.count(),
    ]);

    return serialize(paginatedResponse(items, total, pagination));
  }
}

module.exports = new AdminService();
