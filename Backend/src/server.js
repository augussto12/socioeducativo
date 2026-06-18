const app = require('./app');
const prisma = require('./config/database');
const { PORT, NODE_ENV } = require('./config/env');

let shuttingDown = false;

const server = app.listen(PORT, () => {
  console.log(`Socioeducativo API running on port ${PORT}`);
  console.log(`Environment: ${NODE_ENV}`);
  console.log(`Health: http://localhost:${PORT}/api/health`);
  console.log(`Readiness: http://localhost:${PORT}/api/ready`);
});

server.on('error', (error) => {
  console.error('HTTP server error:', error);
  process.exit(1);
});

async function shutdown(signal, exitCode = 0) {
  if (shuttingDown) return;
  shuttingDown = true;

  console.log(`${signal} received. Closing HTTP server...`);

  const forceExit = setTimeout(() => {
    console.error('Graceful shutdown timed out.');
    process.exit(1);
  }, 10000);
  forceExit.unref();

  server.close(async (error) => {
    if (error) {
      console.error('Error while closing HTTP server:', error);
      exitCode = 1;
    }

    try {
      await prisma.$disconnect();
    } catch (disconnectError) {
      console.error('Error while disconnecting Prisma:', disconnectError);
      exitCode = 1;
    }

    clearTimeout(forceExit);
    process.exit(exitCode);
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled promise rejection:', reason);
  shutdown('unhandledRejection', 1);
});
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  shutdown('uncaughtException', 1);
});

module.exports = { server, shutdown };
