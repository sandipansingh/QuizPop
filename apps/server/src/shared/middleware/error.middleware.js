import { ApiError } from '../utils/api-error.js';
import { apiResponse } from '../utils/api-response.js';
import { logger } from '../utils/logger.js';
import { ErrorCodes } from '../utils/error-codes.js';

const isDevelopment = process.env.NODE_ENV === 'development';

export const notFoundHandler = (req, _res, next) => {
  next(
    new ApiError(
      404,
      `Route not found: ${req.originalUrl}`,
      null,
      ErrorCodes.NOT_FOUND
    )
  );
};

const formatZodErrors = (zodError) => {
  const fieldErrors = {};
  const formErrors = [];

  if (zodError.fieldErrors) {
    for (const [field, errors] of Object.entries(zodError.fieldErrors)) {
      if (Array.isArray(errors) && errors.length > 0) {
        fieldErrors[field] = errors;
      }
    }
  }

  if (Array.isArray(zodError.formErrors)) {
    formErrors.push(...zodError.formErrors);
  }

  return { fieldErrors, formErrors };
};

const buildMeta = (code, req, extra = {}) => ({
  code,
  timestamp: new Date().toISOString(),
  path: req.originalUrl,
  ...extra,
});

const sendError = (res, status, message, code, req, metaExtra = {}) =>
  res
    .status(status)
    .json(
      apiResponse({
        success: false,
        message,
        data: null,
        meta: buildMeta(code, req, metaExtra),
      })
    );

const handleKnownError = (err, req, res) => {
  switch (err?.name) {
    case 'MulterError': {
      const isFileSizeError = err.code === 'LIMIT_FILE_SIZE';
      return sendError(
        res,
        400,
        isFileSizeError
          ? 'Avatar file is too large. Maximum allowed size is 5MB.'
          : 'Invalid avatar upload payload.',
        isFileSizeError
          ? ErrorCodes.FILE_TOO_LARGE
          : ErrorCodes.FILE_UPLOAD_FAILED,
        req
      );
    }
    case 'UnauthorizedError':
      return sendError(
        res,
        401,
        'Invalid or expired token.',
        ErrorCodes.AUTH_TOKEN_INVALID,
        req
      );
    default:
      break;
  }

  switch (err?.code) {
    case 'P2002': {
      const field = err?.meta?.target?.[0] || 'field';
      return sendError(
        res,
        409,
        `This ${field} is already taken.`,
        ErrorCodes.USER_ALREADY_EXISTS,
        req,
        { details: { field } }
      );
    }
    case 'P2025':
      return sendError(
        res,
        404,
        'Record not found.',
        ErrorCodes.NOT_FOUND,
        req
      );
    default:
      return null;
  }
};

const resolveDetails = (err) => {
  if (!err?.details) return null;
  return err.details.fieldErrors || err.details.formErrors
    ? formatZodErrors(err.details)
    : err.details;
};

const buildErrorResponse = (err, req) => {
  const statusCode = err?.statusCode || 500;
  const message = err?.message || 'Internal Server Error';
  const code = err?.code || ErrorCodes.INTERNAL_SERVER_ERROR;
  const details = resolveDetails(err);

  const meta = buildMeta(code, req, {
    ...(details && { details }),
    ...(isDevelopment &&
      statusCode >= 500 && { stack: err?.stack, errorName: err?.name }),
  });

  return {
    statusCode,
    response: apiResponse({ success: false, message, data: null, meta }),
  };
};

const logError = (err, req, statusCode, code) => {
  const context = {
    statusCode,
    code,
    path: req.originalUrl,
    method: req.method,
    message: err?.message,
    userId: req.user?.id,
  };

  if (statusCode >= 500) {
    logger.error('Unhandled server error', {
      ...context,
      errorName: err?.name,
      stack: err?.stack,
    });
  } else if (statusCode >= 400) {
    logger.warn('Client error', context);
  }
};

export const errorHandler = (err, req, res, _next) => {
  void _next;

  const handled = handleKnownError(err, req, res);
  if (handled) return handled;

  const { statusCode, response } = buildErrorResponse(err, req);
  logError(err, req, statusCode, response.meta.code);
  res.status(statusCode).json(response);
};
