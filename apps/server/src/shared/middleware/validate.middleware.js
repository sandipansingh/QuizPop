import { ApiError } from '../utils/api-error.js';

export const validate = (schema) => (req, _res, next) => {
  const result = schema.safeParse({
    body: req.body,
    params: req.params,
    query: req.sanitizedQuery ?? req.query,
  });

  if (!result.success) {
    return next(new ApiError(400, 'Validation error', result.error.flatten()));
  }

  req.validated = result.data;
  return next();
};
