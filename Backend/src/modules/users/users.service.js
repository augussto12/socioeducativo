const bcrypt = require('bcryptjs');
const prisma = require('../../config/database');
const { generatePassword } = require('../../utils/generatePassword');
const { auditLogStrict } = require('../../utils/audit');
const { getPagination, paginatedResponse } = require('../../utils/pagination');

const USER_ROLES = ['ADMIN', 'STAFF'];

function hasText(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function assertUserInput(data, { partial = false } = {}) {
  if (!partial) {
    if (!hasText(data.name)) throw Object.assign(new Error('Nombre requerido'), { statusCode: 400 });
    if (!hasText(data.email)) throw Object.assign(new Error('Email requerido'), { statusCode: 400 });
  }

  if (data.name !== undefined && !hasText(data.name)) {
    throw Object.assign(new Error('Nombre requerido'), { statusCode: 400 });
  }

  if (data.email !== undefined && !hasText(data.email)) {
    throw Object.assign(new Error('Email requerido'), { statusCode: 400 });
  }

  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) {
    throw Object.assign(new Error('Email invalido'), { statusCode: 400 });
  }

  if (data.role && !USER_ROLES.includes(data.role)) {
    throw Object.assign(new Error('Rol invalido'), { statusCode: 400 });
  }

  if (
    data.password !== undefined &&
    (typeof data.password !== 'string' || data.password.trim().length < 8)
  ) {
    throw Object.assign(new Error('La contrasena debe tener al menos 8 caracteres'), { statusCode: 400 });
  }
}

class UsersService {
  async getAll(query = {}) {
    const pagination = getPagination(query);
    const where = { deletedAt: null };

    const [items, total] = await prisma.$transaction([
      prisma.user.findMany({
        where,
        select: this.safeSelect(),
        orderBy: { createdAt: 'desc' },
        skip: pagination.skip,
        take: pagination.take,
      }),
      prisma.user.count({ where }),
    ]);

    return paginatedResponse(items, total, pagination);
  }

  async getById(id) {
    const user = await prisma.user.findFirst({
      where: { id, deletedAt: null },
      select: {
        ...this.safeSelect(),
        projectMemberships: {
          include: {
            project: { select: { id: true, name: true, slug: true } },
          },
        },
      },
    });

    if (!user) {
      throw Object.assign(new Error('Usuario no encontrado'), { statusCode: 404 });
    }

    return user;
  }

  async create(data, actorId) {
    assertUserInput(data);
    const password = data.password || generatePassword(12);
    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          name: data.name.trim(),
          email: data.email.trim().toLowerCase(),
          passwordHash,
          role: data.role || 'STAFF',
          isActive: true,
          mustChangePassword: true,
        },
        select: this.safeSelect(),
      });

      await auditLogStrict(tx, {
        userId: actorId,
        action: 'user.created',
        entityType: 'User',
        entityId: created.id,
        metadata: { role: created.role },
      });

      return created;
    });

    return { user, initialPassword: password };
  }

  async update(id, data, actorId) {
    assertUserInput(data, { partial: true });
    await this.getById(id);
    const passwordHash = data.password !== undefined ? await bcrypt.hash(data.password, 10) : null;

    return prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id },
        data: {
          ...(data.name !== undefined && { name: data.name.trim() }),
          ...(data.email !== undefined && { email: data.email.trim().toLowerCase() }),
          ...(data.role !== undefined && { role: data.role }),
          ...(data.password !== undefined && {
            passwordHash,
            mustChangePassword: true,
          }),
        },
        select: this.safeSelect(),
      });

      await auditLogStrict(tx, {
        userId: actorId,
        action: 'user.updated',
        entityType: 'User',
        entityId: id,
      });

      return user;
    });
  }

  async setActive(id, isActive, actorId) {
    if (id === actorId && !isActive) {
      throw Object.assign(new Error('No podes desactivar tu propio usuario'), { statusCode: 400 });
    }

    await this.getById(id);

    return prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id },
        data: { isActive },
        select: this.safeSelect(),
      });

      await auditLogStrict(tx, {
        userId: actorId,
        action: isActive ? 'user.enabled' : 'user.disabled',
        entityType: 'User',
        entityId: id,
      });

      return user;
    });
  }

  async remove(id, actorId) {
    if (id === actorId) {
      throw Object.assign(new Error('No podes eliminar tu propio usuario'), { statusCode: 400 });
    }

    await this.getById(id);

    return prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id },
        data: {
          isActive: false,
          deletedAt: new Date(),
        },
        select: this.safeSelect(),
      });

      await auditLogStrict(tx, {
        userId: actorId,
        action: 'user.deleted',
        entityType: 'User',
        entityId: id,
      });

      return user;
    });
  }

  safeSelect() {
    return {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      mustChangePassword: true,
      createdAt: true,
      updatedAt: true,
    };
  }
}

module.exports = new UsersService();
module.exports.USER_ROLES = USER_ROLES;
