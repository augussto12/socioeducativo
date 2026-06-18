const path = require('path');
const { randomUUID } = require('crypto');

function createSafeFilename(originalName) {
  const ext = path.extname(originalName || '').toLowerCase();
  return `${randomUUID()}${ext}`;
}

module.exports = { createSafeFilename };
