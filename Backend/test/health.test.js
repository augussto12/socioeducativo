const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs/promises');
const os = require('os');
const path = require('path');

const root = path.resolve(__dirname, '..');

function modulePath(relativePath) {
  return path.join(root, relativePath);
}

function mockModule(relativePath, exports) {
  const filename = modulePath(relativePath);
  require.cache[filename] = {
    id: filename,
    filename,
    loaded: true,
    exports,
  };
}

function clearModule(relativePath) {
  delete require.cache[modulePath(relativePath)];
}

async function tempUploadDirs() {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'socio-ready-test-'));
  const publicDir = path.join(tempDir, 'public');
  const privateDir = path.join(tempDir, 'private');
  await fs.mkdir(publicDir);
  await fs.mkdir(privateDir);
  return { tempDir, publicDir, privateDir };
}

test('readiness reports ready when database and upload directories are available', async () => {
  const { tempDir, publicDir, privateDir } = await tempUploadDirs();

  clearModule('src/modules/health/health.service.js');
  mockModule('src/config/database.js', { $queryRaw: async () => [{ ok: 1 }] });
  mockModule('src/config/env.js', {
    UPLOAD_PUBLIC_DIR: publicDir,
    UPLOAD_PRIVATE_DIR: privateDir,
  });

  const healthService = require(modulePath('src/modules/health/health.service.js'));
  const result = await healthService.readiness();

  assert.equal(result.status, 'ready');
  assert.equal(result.checks.database.status, 'ok');
  assert.equal(result.checks.publicUploads.status, 'ok');
  assert.equal(result.checks.privateUploads.status, 'ok');

  await fs.rm(tempDir, { recursive: true, force: true });
});

test('readiness reports not_ready when the database check fails', async () => {
  const { tempDir, publicDir, privateDir } = await tempUploadDirs();

  clearModule('src/modules/health/health.service.js');
  mockModule('src/config/database.js', {
    $queryRaw: async () => {
      throw new Error('database unavailable');
    },
  });
  mockModule('src/config/env.js', {
    UPLOAD_PUBLIC_DIR: publicDir,
    UPLOAD_PRIVATE_DIR: privateDir,
  });

  const healthService = require(modulePath('src/modules/health/health.service.js'));
  const result = await healthService.readiness();

  assert.equal(result.status, 'not_ready');
  assert.equal(result.checks.database.status, 'error');
  assert.equal(result.checks.publicUploads.status, 'ok');
  assert.equal(result.checks.privateUploads.status, 'ok');

  await fs.rm(tempDir, { recursive: true, force: true });
});

test('health endpoint payload does not expose environment details', () => {
  clearModule('src/modules/health/health.controller.js');
  mockModule('src/modules/health/health.service.js', {});

  const { health } = require(modulePath('src/modules/health/health.controller.js'));
  const res = {
    payload: null,
    json(payload) {
      this.payload = payload;
    },
  };

  health({}, res);

  assert.equal(res.payload.status, 'ok');
  assert.equal(Object.hasOwn(res.payload, 'env'), false);
});
