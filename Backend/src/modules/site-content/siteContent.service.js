const prisma = require('../../config/database');
const { auditLogStrict } = require('../../utils/audit');

class SiteContentService {
  async getAll() {
    return prisma.siteContent.findMany({
      orderBy: { key: 'asc' },
      select: {
        id: true,
        key: true,
        title: true,
        content: true,
        imageUrl: true,
        updatedAt: true,
      },
    });
  }

  async getByKey(key) {
    const content = await prisma.siteContent.findUnique({
      where: { key },
      select: {
        id: true,
        key: true,
        title: true,
        content: true,
        imageUrl: true,
        updatedAt: true,
      },
    });

    if (!content) {
      throw Object.assign(new Error('Contenido no encontrado'), { statusCode: 404 });
    }

    return content;
  }

  async update(key, data, userId) {
    const existing = await prisma.siteContent.findUnique({ where: { key } });
    if (!existing) {
      throw Object.assign(new Error('Contenido no encontrado'), { statusCode: 404 });
    }

    return prisma.$transaction(async (tx) => {
      const updated = await tx.siteContent.update({
        where: { key },
        data: {
          ...(data.title !== undefined && { title: data.title.trim() }),
          ...(data.content !== undefined && { content: data.content.trim() }),
          ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl || null }),
          updatedBy: userId,
        },
      });

      await auditLogStrict(tx, {
        userId,
        action: 'site_content.updated',
        entityType: 'SiteContent',
        entityId: updated.id,
        metadata: { key },
      });

      return updated;
    });
  }
}

module.exports = new SiteContentService();
