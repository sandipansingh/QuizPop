import { ApiError } from '../utils/api-error.js';
import { apiResponse } from '../utils/api-response.js';
import { logger } from '../utils/logger.js';

export const notFoundHandler = (req, _res, next) => {
  next(new ApiError(404, `Route not found: ${req.originalUrl}`));
};

export const errorHandler = (err, _req, res, _next) => {
  void _next;

  if (err?.name === 'MulterError') {
    const message =
      err.code === 'LIMIT_FILE_SIZE'
        ? 'Avatar file is too large. Maximum allowed size is 5MB.'
        : 'Invalid avatar upload payload.';

    const payload = apiResponse({
      success: false,
      message,
      data: null,
      meta: null,
    });

    return res.status(400).json(payload);
  }

  const statusCode = err?.statusCode || 500;
  const message = err?.message || 'Internal Server Error';

  const payload = apiResponse({
    success: false,
    message,
    data: null,
    meta: err?.details ? { details: err.details } : null,
  });

  if (statusCode >= 500) {
    logger.error('Unhandled server error', {
      statusCode,
      path: _req.originalUrl,
      method: _req.method,
      errorName: err?.name,
      stack: err?.stack,
    });
  }

  res.status(statusCode).json(payload);
};
