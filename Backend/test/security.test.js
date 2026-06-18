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

function splitList(value) {
  return String(value || '').split(',').map((item) => item.trim()).filter(Boolean);
}

function runMiddleware(middleware, req) {
  return new Promise((resolve, reject) => {
    const res = {
      statusCode: 200,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(payload) {
        resolve({ next: false, statusCode: this.statusCode, body: payload });
      },
    };

    middleware(req, res, (error) => {
      if (error) reject(error);
      else resolve({ next: true, statusCode: res.statusCode });
    });
  });
}

function controllerResponse() {
  return {
    statusCode: 200,
    payload: null,
    cookies: [],
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.payload = payload;
      return this;
    },
    cookie(name, value, options) {
      this.cookies.push({ name, value, options });
      return this;
    },
    clearCookie(name, options) {
      this.cookies.push({ name, value: '', options, cleared: true });
      return this;
    },
  };
}

test('admin user updates reject empty and whitespace-only passwords before touching the DB', async () => {
  const prisma = {
    user: {
      findFirst: async () => {
        throw new Error('DB should not be reached for invalid password');
      },
      update: async () => {
        throw new Error('DB should not be reached for invalid password');
      },
    },
  };

  clearModule('src/modules/users/users.service.js');
  mockModule('src/config/database.js', prisma);
  mockModule('src/utils/audit.js', { auditLog: async () => {} });

  const usersService = require(modulePath('src/modules/users/users.service.js'));

  await assert.rejects(
    () => usersService.update('target-user', { password: '' }, 'admin-user'),
    /contrasena debe tener al menos 8 caracteres/
  );

  await assert.rejects(
    () => usersService.update('target-user', { password: '        ' }, 'admin-user'),
    /contrasena debe tener al menos 8 caracteres/
  );
});

test('staff project members cannot upload files to records they do not own', async () => {
  const prisma = {
    projectRecord: {
      findUnique: async () => ({
        id: 'record-1',
        createdBy: 'author-user',
        status: 'PENDING_REVIEW',
        visibility: 'PRIVATE',
        deletedAt: null,
        project: {
          deletedAt: null,
          members: [{ userId: 'member-user' }],
        },
      }),
    },
  };

  clearModule('src/modules/files/files.service.js');
  mockModule('src/config/database.js', prisma);
  mockModule('src/utils/audit.js', { auditLog: async () => {} });

  const filesService = require(modulePath('src/modules/files/files.service.js'));

  await assert.rejects(
    () => filesService.uploadToRecord(
      { id: 'member-user', role: 'STAFF' },
      'record-1',
      { path: null, originalname: 'evidencia.pdf', mimetype: 'application/pdf', size: 100 },
      {}
    ),
    /No tenes acceso a este registro/
  );
});

test('critical user changes fail when strict audit logging fails', async () => {
  let userUpdateCalled = false;
  let auditLogCalled = false;

  const tx = {
    user: {
      update: async () => {
        userUpdateCalled = true;
        return {
          id: 'target-user',
          name: 'Nuevo nombre',
          email: 'target@example.org',
          role: 'STAFF',
          isActive: true,
          mustChangePassword: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      },
    },
    auditLog: {
      create: async () => {
        auditLogCalled = true;
        throw new Error('audit insert failed');
      },
    },
  };

  const prisma = {
    user: {
      findFirst: async () => ({
        id: 'target-user',
        name: 'Viejo nombre',
        email: 'target@example.org',
        role: 'STAFF',
        isActive: true,
        mustChangePassword: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    },
    $transaction: async (callback) => callback(tx),
  };

  clearModule('src/modules/users/users.service.js');
  clearModule('src/utils/audit.js');
  mockModule('src/config/database.js', prisma);

  const usersService = require(modulePath('src/modules/users/users.service.js'));

  await assert.rejects(
    () => usersService.update('target-user', { name: 'Nuevo nombre' }, 'admin-user'),
    /audit insert failed/
  );

  assert.equal(userUpdateCalled, true);
  assert.equal(auditLogCalled, true);
});

test('public file download requires the owning project to remain active and public', async () => {
  const prisma = {
    recordFile: {
      findUnique: async () => ({
        id: 'file-1',
        visibility: 'PUBLIC',
        record: {
          deletedAt: null,
          visibility: 'PUBLIC',
          status: 'PUBLISHED',
          project: {
            deletedAt: null,
            visibility: 'PUBLIC',
            status: 'PAUSED',
            members: [],
          },
        },
      }),
    },
  };

  clearModule('src/modules/files/files.service.js');
  mockModule('src/config/database.js', prisma);
  mockModule('src/utils/audit.js', { auditLog: async () => {} });

  const filesService = require(modulePath('src/modules/files/files.service.js'));

  await assert.rejects(
    () => filesService.getFileForDownload('file-1', null),
    /Autenticacion requerida/
  );
});

test('file validation rejects metadata-only PDF spoofing', async () => {
  clearModule('src/utils/fileType.js');
  const { assertAllowedFile } = require(modulePath('src/utils/fileType.js'));
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'socio-file-test-'));
  const fakePdf = path.join(tempDir, 'fake.pdf');
  const realPdf = path.join(tempDir, 'real.pdf');

  await fs.writeFile(fakePdf, 'not a pdf');
  await fs.writeFile(realPdf, '%PDF-1.7\n%test\n');

  await assert.rejects(
    () => assertAllowedFile({
      path: fakePdf,
      originalname: 'fake.pdf',
      mimetype: 'application/pdf',
      size: 9,
    }),
    /contenido del archivo no coincide/i
  );

  const type = await assertAllowedFile({
    path: realPdf,
    originalname: 'real.pdf',
    mimetype: 'application/pdf',
    size: 15,
  });
  assert.equal(type, 'PDF');

  await fs.rm(tempDir, { recursive: true, force: true });
});

test('CSRF protection rejects cross-site refresh-cookie mutations', async () => {
  clearModule('src/middleware/csrfProtection.js');
  mockModule('src/config/env.js', {
    CORS_ORIGIN: 'https://app.example.test',
    NODE_ENV: 'production',
    splitList,
  });

  const { csrfProtection } = require(modulePath('src/middleware/csrfProtection.js'));

  const result = await runMiddleware(csrfProtection, {
    method: 'POST',
    protocol: 'https',
    headers: {
      origin: 'https://evil.example.test',
      host: 'app.example.test',
      cookie: 'refreshToken=abc',
    },
  });

  assert.equal(result.next, false);
  assert.equal(result.statusCode, 403);
});

test('CSRF protection allows configured origins with refresh cookies', async () => {
  clearModule('src/middleware/csrfProtection.js');
  mockModule('src/config/env.js', {
    CORS_ORIGIN: 'https://app.example.test',
    NODE_ENV: 'production',
    splitList,
  });

  const { csrfProtection } = require(modulePath('src/middleware/csrfProtection.js'));

  const result = await runMiddleware(csrfProtection, {
    method: 'POST',
    protocol: 'https',
    headers: {
      origin: 'https://app.example.test',
      host: 'app.example.test',
      cookie: 'refreshToken=abc',
    },
  });

  assert.equal(result.next, true);
});

test('auth refresh accepts refresh tokens only from cookies', async () => {
  let refreshCalled = false;

  clearModule('src/modules/auth/auth.controller.js');
  mockModule('src/modules/auth/auth.service.js', {
    refresh: async () => {
      refreshCalled = true;
      throw new Error('Body refresh token should not be used');
    },
  });
  mockModule('src/config/database.js', {});
  mockModule('src/config/env.js', {
    COOKIE_DOMAIN: undefined,
    COOKIE_SECURE: false,
    COOKIE_SAME_SITE: 'lax',
    REFRESH_COOKIE_MAX_AGE_MS: 7 * 24 * 60 * 60 * 1000,
  });

  const { refresh } = require(modulePath('src/modules/auth/auth.controller.js'));
  const res = controllerResponse();
  let nextError = null;

  await refresh(
    { cookies: {}, body: { refreshToken: 'body-token' } },
    res,
    (error) => {
      nextError = error;
    }
  );

  assert.equal(nextError, null);
  assert.equal(refreshCalled, false);
  assert.equal(res.statusCode, 401);
  assert.deepEqual(res.payload, { error: 'Refresh token requerido' });
});

test('refresh cookie max age follows duration config parsing', () => {
  clearModule('src/config/env.js');
  const { parseDurationMs } = require(modulePath('src/config/env.js'));

  assert.equal(parseDurationMs('15m'), 15 * 60 * 1000);
  assert.equal(parseDurationMs('7d'), 7 * 24 * 60 * 60 * 1000);
  assert.equal(parseDurationMs('bad-value', 1234), 1234);
});
