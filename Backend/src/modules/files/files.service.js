const fs = require('fs/promises');
const path = require('path');
const prisma = require('../../config/database');
const { UPLOAD_PRIVATE_DIR } = require('../../config/env');
const { assertAllowedFile } = require('../../utils/fileType');
const { createSafeFilename } = require('../../utils/safeFilename');
const { auditLog } = require('../../utils/audit');

class FilesService {
  async uploadToRecord(user, recordId, file, body = {}) {
    if (!file) {
      throw Object.assign(new Error('Archivo requerido'), { statusCode: 400 });
    }

    let fullPath;
    let movedToFinalPath = false;

    try {
      const record = await prisma.projectRecord.findUnique({
        where: { id: recordId },
        include: {
          project: { include: { members: true } },
        },
      });

      if (!record || record.deletedAt || record.project.deletedAt) {
        throw Object.assign(new Error('Registro no encontrado'), { statusCode: 404 });
      }

      const isAdmin = user.role === 'ADMIN';
      const isAuthor = record.createdBy === user.id;
      if (!isAdmin && !isAuthor) {
        throw Object.assign(new Error('No tenes acceso a este registro'), { statusCode: 403 });
      }

      if (!isAdmin && record.status === 'PUBLISHED') {
        throw Object.assign(new Error('No se pueden agregar archivos a un registro publicado'), { statusCode: 403 });
      }

      const type = await assertAllowedFile(file);
      const requestedVisibility = body.visibility === 'PUBLIC' ? 'PUBLIC' : 'PRIVATE';
      const canBePublic = record.visibility === 'PUBLIC' && record.status === 'PUBLISHED';
      const visibility = canBePublic && requestedVisibility === 'PUBLIC' ? 'PUBLIC' : 'PRIVATE';

      const targetDir = path.resolve(process.cwd(), UPLOAD_PRIVATE_DIR, 'records', recordId);
      await fs.mkdir(targetDir, { recursive: true });

      const fileName = createSafeFilename(file.originalname);
      fullPath = path.join(targetDir, fileName);
      await fs.rename(file.path, fullPath);
      movedToFinalPath = true;

      const storagePath = path.relative(process.cwd(), fullPath).replace(/\\/g, '/');
      const created = await prisma.recordFile.create({
        data: {
          recordId,
          fileName,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: BigInt(file.size),
          storagePath,
          publicUrl: null,
          type,
          visibility,
          uploadedBy: user.id,
        },
      });

      await auditLog({
        userId: user.id,
        action: 'file.uploaded',
        entityType: 'RecordFile',
        entityId: created.id,
        metadata: { recordId, type, visibility },
      });

      return created;
    } catch (error) {
      const cleanupPath = movedToFinalPath ? fullPath : file.path;
      if (cleanupPath) await fs.unlink(cleanupPath).catch(() => {});
      throw error;
    }
  }

  async getFileForDownload(fileId, user) {
    const file = await prisma.recordFile.findUnique({
      where: { id: fileId },
      include: {
        record: {
          include: {
            project: { include: { members: true } },
          },
        },
      },
    });

    if (!file || file.record.deletedAt || file.record.project.deletedAt) {
      throw Object.assign(new Error('Archivo no encontrado'), { statusCode: 404 });
    }

    if (file.visibility === 'PUBLIC') {
      const publicAllowed = file.record.visibility === 'PUBLIC' &&
        file.record.status === 'PUBLISHED' &&
        file.record.project.visibility === 'PUBLIC' &&
        file.record.project.status === 'ACTIVE';
      if (publicAllowed) return file;
    }

    if (!user) {
      throw Object.assign(new Error('Autenticacion requerida'), { statusCode: 401 });
    }

    if (user.role === 'ADMIN') return file;
    if (file.record.createdBy === user.id) return file;

    const isMember = file.record.project.members.some((member) => member.userId === user.id);
    if (!isMember) {
      throw Object.assign(new Error('No tenes acceso a este archivo'), { statusCode: 403 });
    }

    return file;
  }

  async deleteFile(fileId, user) {
    const file = await this.getFileForDownload(fileId, user);

    if (user.role !== 'ADMIN' && file.uploadedBy !== user.id) {
      throw Object.assign(new Error('Solo podes eliminar archivos propios'), { statusCode: 403 });
    }

    await prisma.recordFile.delete({ where: { id: fileId } });

    const fullPath = path.resolve(process.cwd(), file.storagePath);
    await fs.unlink(fullPath).catch(() => {});

    await auditLog({
      userId: user.id,
      action: 'file.deleted',
      entityType: 'RecordFile',
      entityId: fileId,
      metadata: { recordId: file.recordId },
    });

    return { message: 'Archivo eliminado' };
  }
}

module.exports = new FilesService();
