const path = require('path');
const filesService = require('./files.service');
const { UPLOAD_PUBLIC_DIR, UPLOAD_PRIVATE_DIR } = require('../../config/env');
const { serialize } = require('../../utils/serialize');

const uploadRoots = [UPLOAD_PUBLIC_DIR, UPLOAD_PRIVATE_DIR].map((dir) => path.resolve(process.cwd(), dir));

function isInsideAllowedUploadRoot(fullPath) {
  return uploadRoots.some((root) => fullPath === root || fullPath.startsWith(`${root}${path.sep}`));
}

function contentDisposition(filename, disposition = 'inline') {
  const safeName = String(filename || 'archivo').replace(/["\\\r\n]/g, '_');
  return `${disposition}; filename="${safeName}"; filename*=UTF-8''${encodeURIComponent(filename || 'archivo')}`;
}

const uploadToRecord = async (req, res, next) => {
  try {
    const file = await filesService.uploadToRecord(req.user, req.params.recordId, req.file, req.body);
    res.status(201).json(serialize(file));
  } catch (error) {
    next(error);
  }
};

const download = async (req, res, next) => {
  try {
    const file = await filesService.getFileForDownload(req.params.id, req.user);
    const fullPath = path.resolve(process.cwd(), file.storagePath);
    if (!isInsideAllowedUploadRoot(fullPath)) {
      return res.status(404).json({ error: 'Archivo no encontrado' });
    }
    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Disposition', contentDisposition(file.originalName));
    res.sendFile(fullPath, (error) => {
      if (error) next(error);
    });
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    res.json(await filesService.deleteFile(req.params.id, req.user));
  } catch (error) {
    next(error);
  }
};

module.exports = { uploadToRecord, download, remove };
