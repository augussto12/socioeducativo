const prisma = require('../../config/database');
const { auditLog, auditLogStrict } = require('../../utils/audit');
const { getPagination, paginatedResponse } = require('../../utils/pagination');

const RECORD_STATUSES = ['DRAFT', 'PENDING_REVIEW', 'PUBLISHED', 'REJECTED', 'ARCHIVED'];
const RECORD_TYPES = ['ACTIVITY', 'EVIDENCE', 'PLANNING', 'REFLECTION', 'EVALUATION', 'OTHER'];
const VISIBILITIES = ['PUBLIC', 'PRIVATE'];

function hasText(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isDateOnly(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value))) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  const [year, month, day] = String(value).split('-').map(Number);
  return parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() + 1 === month &&
    parsed.getUTCDate() === day;
}

function toDateOnly(value) {
  return new Date(`${value}T00:00:00.000Z`);
}

function assertRecordInput(data, { partial = false, admin = false } = {}) {
  if (!partial) {
    if (!hasText(data.title)) throw Object.assign(new Error('Titulo requerido'), { statusCode: 400 });
    if (!data.type) throw Object.assign(new Error('Tipo requerido'), { statusCode: 400 });
    if (!data.recordDate) throw Object.assign(new Error('Fecha requerida'), { statusCode: 400 });
  }

  if (data.title !== undefined && !hasText(data.title)) {
    throw Object.assign(new Error('Titulo requerido'), { statusCode: 400 });
  }

  if (data.type && !RECORD_TYPES.includes(data.type)) {
    throw Object.assign(new Error('Tipo de registro invalido'), { statusCode: 400 });
  }

  if (data.recordDate && !isDateOnly(data.recordDate)) {
    throw Object.assign(new Error('Fecha invalida'), { statusCode: 400 });
  }

  if (data.visibility && !VISIBILITIES.includes(data.visibility)) {
    throw Object.assign(new Error('Visibilidad invalida'), { statusCode: 400 });
  }

  if (data.status && (!admin || !RECORD_STATUSES.includes(data.status))) {
    throw Object.assign(new Error('Estado invalido'), { statusCode: 400 });
  }
}

const recordInclude = {
  project: {
    include: { category: true },
  },
  author: {
    select: { id: true, name: true, email: true },
  },
  reviewer: {
    select: { id: true, name: true, email: true },
  },
  files: true,
  tags: { include: { tag: true } },
};

const publicFileSelect = {
  id: true,
  fileName: true,
  originalName: true,
  mimeType: true,
  size: true,
  publicUrl: true,
  type: true,
};

const publicFilesInclude = {
  where: { visibility: 'PUBLIC' },
  select: publicFileSelect,
  orderBy: { createdAt: 'asc' },
};

function publicFileVisibilityForRecord(status, visibility) {
  return status === 'PUBLISHED' && visibility === 'PUBLIC' ? 'PUBLIC' : 'PRIVATE';
}

class RecordsService {
  async getPublicByProjectSlug(slug) {
    const project = await prisma.pedagogicalProject.findFirst({
      where: { slug, visibility: 'PUBLIC', status: 'ACTIVE', deletedAt: null },
      select: { id: true },
    });

    if (!project) {
      throw Object.assign(new Error('Proyecto no encontrado'), { statusCode: 404 });
    }

    return prisma.projectRecord.findMany({
      where: {
        projectId: project.id,
        visibility: 'PUBLIC',
        status: 'PUBLISHED',
        deletedAt: null,
      },
      select: {
        id: true,
        title: true,
        description: true,
        recordDate: true,
        type: true,
        files: publicFilesInclude,
      },
      orderBy: { recordDate: 'desc' },
    });
  }

  async getPublicRecord(id) {
    const record = await prisma.projectRecord.findFirst({
      where: {
        id,
        visibility: 'PUBLIC',
        status: 'PUBLISHED',
        deletedAt: null,
        project: { visibility: 'PUBLIC', status: 'ACTIVE', deletedAt: null },
      },
      select: {
        id: true,
        title: true,
        description: true,
        recordDate: true,
        type: true,
        project: {
          select: {
            name: true,
            slug: true,
          },
        },
        files: publicFilesInclude,
      },
    });

    if (!record) {
      throw Object.assign(new Error('Registro no encontrado'), { statusCode: 404 });
    }

    return record;
  }

  async getMyRecords(userId, query = {}) {
    const pagination = getPagination(query);
    const where = {
      deletedAt: null,
      ...(query.status && RECORD_STATUSES.includes(query.status) ? { status: query.status } : {}),
      OR: [
        { createdBy: userId },
        { project: { members: { some: { userId } } } },
      ],
    };

    const [items, total] = await prisma.$transaction([
      prisma.projectRecord.findMany({
        where,
        include: recordInclude,
        orderBy: { recordDate: 'desc' },
        skip: pagination.skip,
        take: pagination.take,
      }),
      prisma.projectRecord.count({ where }),
    ]);

    return paginatedResponse(items, total, pagination);
  }

  async getMyProjectRecords(userId, projectId, query = {}) {
    await this.assertProjectMember(userId, projectId);
    const pagination = getPagination(query);
    const where = { projectId, deletedAt: null };

    const [items, total] = await prisma.$transaction([
      prisma.projectRecord.findMany({
        where,
        include: recordInclude,
        orderBy: { recordDate: 'desc' },
        skip: pagination.skip,
        take: pagination.take,
      }),
      prisma.projectRecord.count({ where }),
    ]);

    return paginatedResponse(items, total, pagination);
  }

  async createStaffRecord(userId, projectId, data) {
    await this.assertProjectMember(userId, projectId);
    assertRecordInput(data);

    const record = await prisma.projectRecord.create({
      data: {
        projectId,
        title: data.title.trim(),
        description: data.description?.trim() || null,
        recordDate: toDateOnly(data.recordDate),
        type: data.type,
        visibility: 'PRIVATE',
        status: 'PENDING_REVIEW',
        createdBy: userId,
      },
      include: recordInclude,
    });

    await auditLog({
      userId,
      action: 'record.created',
      entityType: 'ProjectRecord',
      entityId: record.id,
      metadata: { projectId },
    });

    return record;
  }

  async getMyRecord(userId, id) {
    const record = await prisma.projectRecord.findFirst({
      where: {
        id,
        deletedAt: null,
        OR: [
          { createdBy: userId },
          { project: { members: { some: { userId } } } },
        ],
      },
      include: recordInclude,
    });

    if (!record) {
      throw Object.assign(new Error('Registro no encontrado'), { statusCode: 404 });
    }

    return record;
  }

  async updateStaffRecord(userId, id, data) {
    const record = await this.getMyRecord(userId, id);

    if (record.createdBy !== userId) {
      throw Object.assign(new Error('Solo podes editar registros propios'), { statusCode: 403 });
    }

    if (record.status === 'PUBLISHED') {
      throw Object.assign(new Error('No se puede editar un registro publicado'), { statusCode: 400 });
    }

    assertRecordInput(data, { partial: true });

    const updated = await prisma.projectRecord.update({
      where: { id },
      data: {
        ...(data.title !== undefined && { title: data.title.trim() }),
        ...(data.description !== undefined && { description: data.description?.trim() || null }),
        ...(data.recordDate !== undefined && { recordDate: toDateOnly(data.recordDate) }),
        ...(data.type !== undefined && { type: data.type }),
        status: 'PENDING_REVIEW',
        visibility: 'PRIVATE',
      },
      include: recordInclude,
    });

    await auditLog({
      userId,
      action: 'record.updated',
      entityType: 'ProjectRecord',
      entityId: id,
    });

    return updated;
  }

  async deleteStaffRecord(userId, id) {
    const record = await this.getMyRecord(userId, id);

    if (record.createdBy !== userId) {
      throw Object.assign(new Error('Solo podes eliminar registros propios'), { statusCode: 403 });
    }

    if (record.status === 'PUBLISHED') {
      throw Object.assign(new Error('No se puede eliminar un registro publicado'), { statusCode: 400 });
    }

    const deleted = await prisma.projectRecord.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await auditLog({
      userId,
      action: 'record.deleted',
      entityType: 'ProjectRecord',
      entityId: id,
    });

    return deleted;
  }

  async getAdminRecords(query = {}) {
    const pagination = getPagination(query);
    const where = {
      deletedAt: null,
      ...(query.status && RECORD_STATUSES.includes(query.status) ? { status: query.status } : {}),
    };

    const [items, total] = await prisma.$transaction([
      prisma.projectRecord.findMany({
        where,
        include: recordInclude,
        orderBy: { createdAt: 'desc' },
        skip: pagination.skip,
        take: pagination.take,
      }),
      prisma.projectRecord.count({ where }),
    ]);

    return paginatedResponse(items, total, pagination);
  }

  async getAdminRecord(id) {
    const record = await prisma.projectRecord.findFirst({
      where: { id, deletedAt: null },
      include: recordInclude,
    });

    if (!record) {
      throw Object.assign(new Error('Registro no encontrado'), { statusCode: 404 });
    }

    return record;
  }

  async updateAdminRecord(id, data, userId) {
    const existing = await this.getAdminRecord(id);
    assertRecordInput(data, { partial: true, admin: true });
    const nextStatus = data.status !== undefined ? data.status : existing.status;
    const nextVisibility = data.visibility !== undefined ? data.visibility : existing.visibility;

    const updated = await prisma.$transaction(async (tx) => {
      await tx.projectRecord.update({
        where: { id },
        data: {
          ...(data.title !== undefined && { title: data.title.trim() }),
          ...(data.description !== undefined && { description: data.description?.trim() || null }),
          ...(data.recordDate !== undefined && { recordDate: toDateOnly(data.recordDate) }),
          ...(data.type !== undefined && { type: data.type }),
          ...(data.visibility !== undefined && { visibility: data.visibility }),
          ...(data.status !== undefined && { status: data.status }),
        },
      });

      await tx.recordFile.updateMany({
        where: { recordId: id },
        data: { visibility: publicFileVisibilityForRecord(nextStatus, nextVisibility) },
      });

      await auditLogStrict(tx, {
        userId,
        action: 'record.admin_updated',
        entityType: 'ProjectRecord',
        entityId: id,
      });

      return tx.projectRecord.findFirst({
        where: { id, deletedAt: null },
        include: recordInclude,
      });
    });

    return updated;
  }

  async changeStatus(id, { status, reviewComment, visibility }, userId) {
    if (!RECORD_STATUSES.includes(status)) {
      throw Object.assign(new Error('Estado invalido'), { statusCode: 400 });
    }
    if (visibility !== undefined && !VISIBILITIES.includes(visibility)) {
      throw Object.assign(new Error('Visibilidad invalida'), { statusCode: 400 });
    }

    const existing = await this.getAdminRecord(id);
    const nextVisibility = visibility !== undefined ? visibility : existing.visibility;

    const updated = await prisma.$transaction(async (tx) => {
      await tx.projectRecord.update({
        where: { id },
        data: {
          status,
          ...(visibility !== undefined && { visibility }),
          reviewedBy: userId,
          reviewedAt: new Date(),
          reviewComment: reviewComment || null,
        },
      });

      await tx.recordFile.updateMany({
        where: { recordId: id },
        data: { visibility: publicFileVisibilityForRecord(status, nextVisibility) },
      });

      await auditLogStrict(tx, {
        userId,
        action: 'record.status_changed',
        entityType: 'ProjectRecord',
        entityId: id,
        metadata: { status, visibility },
      });

      return tx.projectRecord.findFirst({
        where: { id, deletedAt: null },
        include: recordInclude,
      });
    });

    return updated;
  }

  async deleteAdminRecord(id, userId) {
    await this.getAdminRecord(id);
    const deletedAt = new Date();
    const deleted = await prisma.$transaction(async (tx) => {
      const deletedRecord = await tx.projectRecord.update({
        where: { id },
        data: { deletedAt },
      });

      await tx.recordFile.updateMany({
        where: { recordId: id },
        data: { visibility: 'PRIVATE' },
      });

      await auditLogStrict(tx, {
        userId,
        action: 'record.admin_deleted',
        entityType: 'ProjectRecord',
        entityId: id,
      });

      return deletedRecord;
    });

    return deleted;
  }

  async assertProjectMember(userId, projectId) {
    const membership = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
      include: { project: true },
    });

    if (!membership || membership.project.deletedAt) {
      throw Object.assign(new Error('No tenes acceso a este proyecto'), { statusCode: 403 });
    }

    return membership;
  }
}

module.exports = new RecordsService();
module.exports.RECORD_STATUSES = RECORD_STATUSES;
module.exports.RECORD_TYPES = RECORD_TYPES;
module.exports.VISIBILITIES = VISIBILITIES;
