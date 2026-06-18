const test = require('node:test');
const assert = require('node:assert/strict');
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

test('critical project changes fail when strict audit logging fails', async () => {
  let projectUpdateCalled = false;
  let auditLogCalled = false;

  const existingProject = {
    id: 'project-1',
    name: 'Proyecto',
    slug: 'proyecto',
    deletedAt: null,
  };

  const tx = {
    pedagogicalProject: {
      update: async () => {
        projectUpdateCalled = true;
        return {
          ...existingProject,
          status: 'ACTIVE',
          category: null,
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
    pedagogicalProject: {
      findFirst: async () => existingProject,
    },
    $transaction: async (callback) => callback(tx),
  };

  clearModule('src/modules/projects/projects.service.js');
  clearModule('src/utils/audit.js');
  mockModule('src/config/database.js', prisma);

  const projectsService = require(modulePath('src/modules/projects/projects.service.js'));

  await assert.rejects(
    () => projectsService.update('project-1', { status: 'ACTIVE' }, 'admin-user'),
    /audit insert failed/
  );

  assert.equal(projectUpdateCalled, true);
  assert.equal(auditLogCalled, true);
});

test('critical site content changes fail when strict audit logging fails', async () => {
  let contentUpdateCalled = false;
  let auditLogCalled = false;

  const tx = {
    siteContent: {
      update: async () => {
        contentUpdateCalled = true;
        return {
          id: 'content-1',
          key: 'home',
          title: 'Nuevo titulo',
          content: 'Nuevo contenido',
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
    siteContent: {
      findUnique: async () => ({
        id: 'content-1',
        key: 'home',
        title: 'Viejo titulo',
        content: 'Viejo contenido',
      }),
    },
    $transaction: async (callback) => callback(tx),
  };

  clearModule('src/modules/site-content/siteContent.service.js');
  clearModule('src/utils/audit.js');
  mockModule('src/config/database.js', prisma);

  const siteContentService = require(modulePath('src/modules/site-content/siteContent.service.js'));

  await assert.rejects(
    () => siteContentService.update('home', { title: 'Nuevo titulo' }, 'admin-user'),
    /audit insert failed/
  );

  assert.equal(contentUpdateCalled, true);
  assert.equal(auditLogCalled, true);
});
