const path = require('path');
const fs = require('fs/promises');
const { TextDecoder } = require('util');
const {
  MAX_FILE_SIZE,
  MAX_IMAGE_SIZE,
  MAX_DOCUMENT_SIZE,
  MAX_AUDIO_SIZE,
  MAX_VIDEO_SIZE,
} = require('../config/env');

const allowed = {
  IMAGE: {
    extensions: ['.jpg', '.jpeg', '.png', '.webp'],
    mimes: ['image/jpeg', 'image/png', 'image/webp'],
    maxSize: MAX_IMAGE_SIZE,
  },
  PDF: {
    extensions: ['.pdf'],
    mimes: ['application/pdf'],
    maxSize: MAX_DOCUMENT_SIZE,
  },
  AUDIO: {
    extensions: ['.mp3', '.wav', '.ogg', '.m4a'],
    mimes: ['audio/mpeg', 'audio/wav', 'audio/x-wav', 'audio/ogg', 'audio/mp4', 'audio/x-m4a'],
    maxSize: MAX_AUDIO_SIZE,
  },
  VIDEO: {
    extensions: ['.mp4', '.webm', '.mov'],
    mimes: ['video/mp4', 'video/webm', 'video/quicktime'],
    maxSize: MAX_VIDEO_SIZE,
  },
  DOCUMENT: {
    extensions: ['.doc', '.docx', '.odt', '.txt'],
    mimes: [
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.oasis.opendocument.text',
      'text/plain',
    ],
    maxSize: MAX_DOCUMENT_SIZE,
  },
};

function getFileType(file) {
  const ext = path.extname(file.originalname || '').toLowerCase();
  const mime = file.mimetype;

  for (const [type, config] of Object.entries(allowed)) {
    if (config.extensions.includes(ext) && config.mimes.includes(mime)) {
      return type;
    }
  }

  return null;
}

async function readHeader(filePath, length = 4100) {
  if (!filePath) return Buffer.alloc(0);

  const handle = await fs.open(filePath, 'r');
  try {
    const buffer = Buffer.alloc(length);
    const { bytesRead } = await handle.read(buffer, 0, length, 0);
    return buffer.subarray(0, bytesRead);
  } finally {
    await handle.close();
  }
}

function startsWith(buffer, bytes) {
  if (buffer.length < bytes.length) return false;
  return bytes.every((byte, index) => buffer[index] === byte);
}

function isRiffType(buffer, type) {
  return buffer.length >= 12 &&
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === type;
}

function hasFtypBox(buffer) {
  return buffer.length >= 12 && buffer.toString('ascii', 4, 8) === 'ftyp';
}

function isZip(buffer) {
  return startsWith(buffer, [0x50, 0x4b, 0x03, 0x04]) ||
    startsWith(buffer, [0x50, 0x4b, 0x05, 0x06]) ||
    startsWith(buffer, [0x50, 0x4b, 0x07, 0x08]);
}

function looksLikeUtf8Text(buffer) {
  if (buffer.length === 0) return true;
  if (buffer.includes(0x00)) return false;

  try {
    new TextDecoder('utf-8', { fatal: true }).decode(buffer);
    return true;
  } catch {
    return false;
  }
}

function signatureMatches(file, type, header) {
  if (type === 'IMAGE') {
    if (file.mimetype === 'image/jpeg') return startsWith(header, [0xff, 0xd8, 0xff]);
    if (file.mimetype === 'image/png') return startsWith(header, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    if (file.mimetype === 'image/webp') return isRiffType(header, 'WEBP');
  }

  if (type === 'PDF') {
    return header.toString('ascii', 0, 5) === '%PDF-';
  }

  if (type === 'AUDIO') {
    if (file.mimetype === 'audio/mpeg') {
      return header.toString('ascii', 0, 3) === 'ID3' ||
        (header[0] === 0xff && (header[1] & 0xe0) === 0xe0);
    }
    if (file.mimetype === 'audio/wav' || file.mimetype === 'audio/x-wav') return isRiffType(header, 'WAVE');
    if (file.mimetype === 'audio/ogg') return header.toString('ascii', 0, 4) === 'OggS';
    if (file.mimetype === 'audio/mp4' || file.mimetype === 'audio/x-m4a') return hasFtypBox(header);
  }

  if (type === 'VIDEO') {
    if (file.mimetype === 'video/webm') return startsWith(header, [0x1a, 0x45, 0xdf, 0xa3]);
    if (file.mimetype === 'video/mp4' || file.mimetype === 'video/quicktime') return hasFtypBox(header);
  }

  if (type === 'DOCUMENT') {
    if (file.mimetype === 'text/plain') return looksLikeUtf8Text(header);
    if (file.mimetype === 'application/msword') {
      return startsWith(header, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]);
    }
    return isZip(header);
  }

  return false;
}

async function assertAllowedFile(file) {
  const type = getFileType(file);
  if (!type) {
    const error = new Error('Tipo de archivo no permitido');
    error.statusCode = 400;
    throw error;
  }

  const maxSize = allowed[type].maxSize || MAX_FILE_SIZE;
  if (file.size > maxSize) {
    const error = new Error('El archivo supera el tamano maximo permitido');
    error.statusCode = 400;
    throw error;
  }

  const header = await readHeader(file.path);
  if (!signatureMatches(file, type, header)) {
    const error = new Error('El contenido del archivo no coincide con su tipo declarado');
    error.statusCode = 400;
    throw error;
  }

  return type;
}

module.exports = { assertAllowedFile, getFileType, allowed };
