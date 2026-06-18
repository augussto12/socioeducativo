const prisma = require('../../config/database');
const { createUniqueSlug } = require('../../utils/slug');
const { auditLogStrict } = require('../../utils/audit');

const PROJECT_STATUSES = ['DRAFT', 'ACTIVE', 'PAUSED', 'FINISHED', 'ARCHIVED'];
const VISIBILITIES = ['PUBLIC', 'PRIVATE'];

function hasText(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function assertProjectInput(data, { partial = false } = {}) {
  const requiredFields = [
    'name',
    'description',
    'curricularContents',
    'methodology',
    'duration',
    'pedagogicalFoundation',
  ];

  if (!partial) {
    for (const field of requiredFields) {
      if (!hasText(data[field])) {
        throw Object.assign(new Error(`Campo requerido: ${field}`), { statusCode: 400 });
      }
    }
  }

  for (const field of requiredFields) {
    if (data[field] !== undefined && !hasText(data[field])) {
      throw Object.assign(new Error(`Campo requerido: ${field}`), { statusCode: 400 });
    }
  }

  if (data.status && !PROJECT_STATUSES.includes(data.status)) {
    throw Object.assign(new Error('Estado de proyecto invalido'), { statusCode: 400 });
  }

  if (data.visibility && !VISIBILITIES.includes(data.visibility)) {
    throw Object.assign(new Error('Visibilidad invalida'), { statusCode: 400 });
  }

  if (data.displayOrder !== undefined && Number.isNaN(Number(data.displayOrder))) {
    throw Object.assign(new Error('displayOrder debe ser numerico'), { statusCode: 400 });
  }
}

const projectInclude = {
  category: true,
  members: {
    include: {
      user: {
        select: { id: true, name: true, email: true, role: true, isActive: true },
      },
    },
  },
};

const publicCategorySelect = {
  id: true,
  name: true,
  slug: true,
};

const publicProjectSelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
  curricularContents: true,
  methodology: true,
  duration: true,
  pedagogicalFoundation: true,
  status: true,
  coverImageUrl: true,
  category: { select: publicCategorySelect },
};

class ProjectsService {
  async getPublicProjects() {
    return prisma.pedagogicalProject.findMany({
      where: { visibility: 'PUBLIC', status: 'ACTIVE', deletedAt: null },
      select: publicProjectSelect,
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async getPublicBySlug(slug) {
    const project = await prisma.pedagogicalProject.findFirst({
      where: { slug, visibility: 'PUBLIC', status: 'ACTIVE', deletedAt: null },
      select: publicProjectSelect,
    });

    if (!project) {
      throw Object.assign(new Error('Proyecto no encontrado'), { statusCode: 404 });
    }

    return project;
  }

  async getAssignedProjects(userId) {
    const memberships = await prisma.projectMember.findMany({
      where: {
        userId,
        project: { deletedAt: null },
      },
      include: {
        project: {
          include: {
            category: true,
            _count: { select: { records: { where: { deletedAt: null } } } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return memberships.map((membership) => ({
      ...membership.project,
      roleInProject: membership.roleInProject,
    }));
  }

  async getAssignedProject(userId, projectId) {
    const membership = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: { projectId, userId },
      },
      include: {
        project: {
          include: {
            category: true,
            _count: { select: { records: { where: { deletedAt: null } } } },
          },
        },
      },
    });

    if (!membership || membership.project.deletedAt) {
      throw Object.assign(new Error('Proyecto no encontrado'), { statusCode: 404 });
    }

    return {
      ...membership.project,
      roleInProject: membership.roleInProject,
    };
  }

  async getAdminProjects() {
    return prisma.pedagogicalProject.findMany({
      where: { deletedAt: null },
      include: { category: true, _count: { select: { members: true, records: true } } },
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async getAdminProject(id) {
    const project = await prisma.pedagogicalProject.findFirst({
      where: { id, deletedAt: null },
      include: {
        ...projectInclude,
        records: {
          where: { deletedAt: null },
          orderBy: { recordDate: 'desc' },
        },
      },
    });

    if (!project) {
      throw Object.assign(new Error('Proyecto no encontrado'), { statusCode: 404 });
    }

    return project;
  }

  async create(data, userId) {
    assertProjectInput(data);
    const slug = await createUniqueSlug('pedagogicalProject', data.slug || data.name);

    return prisma.$transaction(async (tx) => {
      const project = await tx.pedagogicalProject.create({
        data: {
          name: data.name.trim(),
          slug,
          description: data.description.trim(),
          curricularContents: data.curricularContents.trim(),
          methodology: data.methodology.trim(),
          duration: data.duration.trim(),
          pedagogicalFoundation: data.pedagogicalFoundation.trim(),
          status: data.status || 'DRAFT',
          visibility: data.visibility || 'PRIVATE',
          coverImageUrl: data.coverImageUrl || null,
          displayOrder: Number(data.displayOrder || 0),
          categoryId: data.categoryId || null,
        },
        include: { category: true },
      });

      await auditLogStrict(tx, {
        userId,
        action: 'project.created',
        entityType: 'PedagogicalProject',
        entityId: project.id,
        metadata: { slug: project.slug },
      });

      return project;
    });
  }

  async update(id, data, userId) {
    assertProjectInput(data, { partial: true });
    const existing = await this.getAdminProject(id);
    const shouldUpdateSlug = data.name && data.name.trim() !== existing.name;

    const nextSlug = shouldUpdateSlug
      ? await createUniqueSlug('pedagogicalProject', data.name, id)
      : undefined;

    return prisma.$transaction(async (tx) => {
      const project = await tx.pedagogicalProject.update({
        where: { id },
        data: {
          ...(data.name !== undefined && { name: data.name.trim() }),
          ...(nextSlug && { slug: nextSlug }),
          ...(data.description !== undefined && { description: data.description.trim() }),
          ...(data.curricularContents !== undefined && { curricularContents: data.curricularContents.trim() }),
          ...(data.methodology !== undefined && { methodology: data.methodology.trim() }),
          ...(data.duration !== undefined && { duration: data.duration.trim() }),
          ...(data.pedagogicalFoundation !== undefined && { pedagogicalFoundation: data.pedagogicalFoundation.trim() }),
          ...(data.status !== undefined && { status: data.status }),
          ...(data.visibility !== undefined && { visibility: data.visibility }),
          ...(data.coverImageUrl !== undefined && { coverImageUrl: data.coverImageUrl || null }),
          ...(data.displayOrder !== undefined && { displayOrder: Number(data.displayOrder) }),
          ...(data.categoryId !== undefined && { categoryId: data.categoryId || null }),
        },
        include: { category: true },
      });

      await auditLogStrict(tx, {
        userId,
        action: 'project.updated',
        entityType: 'PedagogicalProject',
        entityId: project.id,
        metadata: { slug: project.slug },
      });

      return project;
    });
  }

  async remove(id, userId) {
    await this.getAdminProject(id);
    return prisma.$transaction(async (tx) => {
      const project = await tx.pedagogicalProject.update({
        where: { id },
        data: { deletedAt: new Date() },
      });

      await auditLogStrict(tx, {
        userId,
        action: 'project.deleted',
        entityType: 'PedagogicalProject',
        entityId: id,
      });

      return project;
    });
  }

  async addMember(projectId, { userId, roleInProject }, actorId) {
    await this.getAdminProject(projectId);
    const user = await prisma.user.findFirst({
      where: { id: userId, deletedAt: null, isActive: true },
    });

    if (!user) {
      throw Object.assign(new Error('Usuario no encontrado'), { statusCode: 404 });
    }

    return prisma.$transaction(async (tx) => {
      const membership = await tx.projectMember.upsert({
        where: { projectId_userId: { projectId, userId } },
        update: { roleInProject: roleInProject || null },
        create: { projectId, userId, roleInProject: roleInProject || null },
      });

      await auditLogStrict(tx, {
        userId: actorId,
        action: 'project.member_added',
        entityType: 'ProjectMember',
        entityId: membership.id,
        metadata: { projectId, userId },
      });

      return membership;
    });
  }

  async removeMember(projectId, userId, actorId) {
    await prisma.$transaction(async (tx) => {
      await tx.projectMember.delete({
        where: { projectId_userId: { projectId, userId } },
      });

      await auditLogStrict(tx, {
        userId: actorId,
        action: 'project.member_removed',
        entityType: 'ProjectMember',
        metadata: { projectId, userId },
      });
    });

    return { message: 'Miembro removido del proyecto' };
  }
}

module.exports = new ProjectsService();
module.exports.PROJECT_STATUSES = PROJECT_STATUSES;
module.exports.VISIBILITIES = VISIBILITIES;
