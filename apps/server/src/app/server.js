import { createServer } from 'http';
import { createApp } from './app.js';
import { env } from '../shared/config/env.js';
import { prisma } from '../shared/db/connection.js';
import { initializeSocketServer } from '../sockets/index.js';
import { closeRedis, initializeRedis } from '../shared/cache/redis.client.js';
import { setupProcessErrorHandlers } from '../shared/utils/process-error-handler.js';
import { logger } from '../shared/utils/logger.js';

setupProcessErrorHandlers();

const app = createApp();
const httpServer = createServer(app);

initializeSocketServer(httpServer);

const shutdown = async (signal) => {
  logger.info(`Received ${signal}. Shutting down gracefully...`);
  await closeRedis();
  await prisma.$disconnect();
  httpServer.close(() => {
    process.exit(0);
  });
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

const initializeServer = async () => {
  try {
    await initializeRedis();

    httpServer.listen(env.PORT, () => {
      logger.info(`Server running on port ${env.PORT}`);
    });
  } catch (error) {
    logger.error('Failed to initialize server', {
      error: error.message,
      stack: error.stack,
    });
    process.exit(1);
  }
};

initializeServer();
