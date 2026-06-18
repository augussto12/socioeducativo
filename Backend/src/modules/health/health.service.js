const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');
const prisma = require('../../config/database');
const { UPLOAD_PRIVATE_DIR, UPLOAD_PUBLIC_DIR } = require('../../config/env');

async function checkDatabase() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { status: 'ok' };
  } catch {
    return { status: 'error' };
  }
}

async function checkDirectoryWritable(directory) {
  const resolved = path.resolve(process.cwd(), directory);

  try {
    await fsp.access(resolved, fs.constants.W_OK);
    return { status: 'ok' };
  } catch {
    return { status: 'error' };
  }
}

async function readiness() {
  const [database, publicUploads, privateUploads] = await Promise.all([
    checkDatabase(),
    checkDirectoryWritable(UPLOAD_PUBLIC_DIR),
    checkDirectoryWritable(UPLOAD_PRIVATE_DIR),
  ]);

  const checks = {
    database,
    publicUploads,
    privateUploads,
  };
  const ready = Object.values(checks).every((check) => check.status === 'ok');

  return {
    status: ready ? 'ready' : 'not_ready',
    checks,
    timestamp: new Date().toISOString(),
  };
}

module.exports = {
  checkDatabase,
  checkDirectoryWritable,
  readiness,
};
