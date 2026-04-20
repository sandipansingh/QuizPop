import { createClient } from 'redis';
import { env } from '../config/env.js';

const buildRedisUrl = () => {
  if (env.REDIS_URL) {
    return env.REDIS_URL;
  }

  if (!env.REDIS_PASSWORD) {
    return `redis://${env.REDIS_HOST}:${env.REDIS_PORT}`;
  }

  const encodedUser = encodeURIComponent(env.REDIS_USER || 'default');
  const encodedPassword = encodeURIComponent(env.REDIS_PASSWORD);

  return `redis://${encodedUser}:${encodedPassword}@${env.REDIS_HOST}:${env.REDIS_PORT}`;
};

const buildRedisCredentials = () => {
  if (!env.REDIS_PASSWORD) {
    return {};
  }

  return {
    username: env.REDIS_USER || 'default',
    password: env.REDIS_PASSWORD,
  };
};

let redisClient;
let isConnecting = false;
let isRedisUnavailable = false;
let hasLoggedFallback = false;

export const getRedisClient = () => redisClient;

export const isRedisReady = () => Boolean(redisClient?.isOpen);

export const initializeRedis = async () => {
  if (redisClient?.isOpen || isConnecting || isRedisUnavailable) {
    return redisClient;
  }

  isConnecting = true;

  const client = createClient({
    url: buildRedisUrl(),
    ...buildRedisCredentials(),
    socket: {
      reconnectStrategy: (retries) => {
        if (isRedisUnavailable || retries > 10) {
          return false;
        }

        const jitter = Math.floor(Math.random() * 100);
        const delay = Math.min(Math.pow(2, retries) * 50, 3000);
        return delay + jitter;
      },
    },
  });

  client.on('error', (error) => {
    if (isRedisUnavailable && error?.code === 'ECONNREFUSED') {
      return;
    }

    console.error('Redis client error:', error.message);
  });

  try {
    await client.connect();
    await client.ping();
    redisClient = client;
    isRedisUnavailable = false;
    hasLoggedFallback = false;
    console.log('Redis connected successfully');
    return redisClient;
  } catch (error) {
    isRedisUnavailable = true;
    if (!hasLoggedFallback) {
      console.warn(
        `Redis unavailable, falling back to in-memory mode: ${error.message}`
      );
      hasLoggedFallback = true;
    }

    try {
      client.removeAllListeners('error');
      if (client.isOpen) {
        await client.disconnect();
      }
    } catch {
      // no-op
    }

    redisClient = null;
    return null;
  } finally {
    isConnecting = false;
  }
};

export const closeRedis = async () => {
  if (!redisClient?.isOpen) {
    return;
  }

  await redisClient.quit();
  redisClient = null;
};
