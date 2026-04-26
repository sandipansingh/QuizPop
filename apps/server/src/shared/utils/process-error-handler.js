import { logger } from './logger.js';

const serializeReason = (reason) => ({
  reason: reason instanceof Error ? reason.message : reason,
  stack: reason instanceof Error ? reason.stack : undefined,
});

const exitWithError = (type, context) => {
  logger.error(type, { type, ...context });
  process.exit(1);
};

const exitGracefully = (signal) => {
  logger.info(`${signal} signal received: closing HTTP server`);
  process.exit(0);
};

export const setupProcessErrorHandlers = () => {
  process.on('uncaughtException', (error) => {
    exitWithError('Uncaught Exception', {
      error: error.message,
      stack: error.stack,
    });
  });

  process.on('unhandledRejection', (reason, promise) => {
    exitWithError('Unhandled Rejection', {
      ...serializeReason(reason),
      promise: promise.toString(),
    });
  });

  process.on('SIGTERM', () => exitGracefully('SIGTERM'));
  process.on('SIGINT', () => exitGracefully('SIGINT'));
};
