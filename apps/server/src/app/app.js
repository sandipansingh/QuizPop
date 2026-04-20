import cors from 'cors';
import cookieParser from 'cookie-parser';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { apiReference } from '@scalar/express-api-reference';
import { registerRoutes } from './routes.js';
import { env } from '../shared/config/env.js';
import { buildOpenApiDocument } from '../shared/docs/openapi.js';
import {
  errorHandler,
  notFoundHandler,
} from '../shared/middleware/error.middleware.js';
import { apiLimiter } from '../shared/middleware/rate-limit.middleware.js';
import { sanitizeRequest } from '../shared/middleware/sanitize.middleware.js';
import {
  attachCsrfToken,
  requireCsrfProtection,
} from '../shared/middleware/csrf.middleware.js';

export const createApp = () => {
  const app = express();
  const openApiDocument = buildOpenApiDocument({ port: env.PORT });
  const allowedOrigins = env.CORS_ORIGIN.split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  const isProduction = env.NODE_ENV === 'production';
  const scalarDocsCsp = [
    "default-src 'self'",
    "base-uri 'self'",
    "font-src 'self' https: data:",
    "img-src 'self' https: data:",
    "style-src 'self' https: 'unsafe-inline'",
    "script-src 'self' https://cdn.jsdelivr.net 'unsafe-inline'",
    "connect-src 'self' https:",
    "object-src 'none'",
    "frame-ancestors 'self'",
  ].join(';');

  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  app.use(
    cors({
      origin(origin, callback) {
        if (!origin) {
          return callback(null, true);
        }

        if (allowedOrigins.includes(origin)) {
          return callback(null, true);
        }

        return callback(new Error('CORS origin is not allowed'));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-CSRF-Token',
        'X-Requested-With',
      ],
      exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining'],
      maxAge: 24 * 60 * 60,
    })
  );
  app.use(
    helmet({
      crossOriginEmbedderPolicy: false,
      frameguard: {
        action: 'deny',
      },
      hsts: isProduction
        ? {
            maxAge: 31536000,
            includeSubDomains: true,
            preload: true,
          }
        : false,
      noSniff: true,
      referrerPolicy: {
        policy: 'no-referrer',
      },
      contentSecurityPolicy: {
        useDefaults: false,
        directives: {
          defaultSrc: ["'self'"],
          baseUri: ["'self'"],
          fontSrc: ["'self'", 'https:', 'data:'],
          imgSrc: ["'self'", 'data:', 'https:'],
          objectSrc: ["'none'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", 'https:'],
          connectSrc: ["'self'", 'https:', 'ws:', 'wss:'],
          frameAncestors: ["'none'"],
        },
      },
    })
  );
  app.use((_req, res, next) => {
    res.setHeader(
      'Permissions-Policy',
      'camera=(), microphone=(), geolocation=()'
    );
    next();
  });
  app.use(morgan(isProduction ? 'combined' : 'dev'));
  app.use(cookieParser());
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));

  app.get('/openapi.json', (_req, res) => {
    res.status(200).json(openApiDocument);
  });
  app.use(
    '/docs',
    (_req, res, next) => {
      res.setHeader('Content-Security-Policy', scalarDocsCsp);
      next();
    },
    apiReference({
      url: '/openapi.json',
      theme: 'saturn',
    })
  );

  app.use(sanitizeRequest);
  app.use(attachCsrfToken);
  app.use(requireCsrfProtection);
  app.use(apiLimiter);

  registerRoutes(app);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
