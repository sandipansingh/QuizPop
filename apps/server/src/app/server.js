import { createServer } from 'http';
import { createApp } from './app.js';
import { env } from '../shared/config/env.js';
import { prisma } from '../shared/db/connection.js';
import { initializeSocketServer } from '../sockets/index.js';
import { closeRedis, initializeRedis } from '../shared/cache/redis.client.js';

const app = createApp();
const httpServer = createServer(app);

initializeSocketServer(httpServer);

const shutdown = async (signal) => {
  console.log(`Received ${signal}. Shutting down gracefully...`);
  await closeRedis();
  await prisma.$disconnect();
  httpServer.close(() => {
    process.exit(0);
  });
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

const initializeServer = async () => {
  await initializeRedis();

  httpServer.listen(env.PORT, () => {
    console.log(`Server running on port ${env.PORT}`);
  });
};

initializeServer();
