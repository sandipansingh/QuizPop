import { ApiError } from '../utils/api-error.js';
import { logger } from '../utils/logger.js';

export const validate = (schema) => (req, _res, next) => {
  const result = schema.safeParse({
    body: req.body,
    params: req.params,
    query: req.sanitizedQuery ?? req.query,
  });

  if (!result.success) {
    const flattened = result.error.flatten();

    logger.warn('Validation failed', {
      path: req.originalUrl,
      method: req.method,
      errors: flattened,
    });

    return next(new ApiError(400, 'Validation error', flattened));
  }

  req.validated = result.data;
  return next();
};
