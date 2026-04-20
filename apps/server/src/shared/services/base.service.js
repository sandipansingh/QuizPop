import { ApiError } from '../utils/api-error.js';

const toBoundedInteger = (value, { fallback, min, max }) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  const asInt = Math.floor(parsed);
  return Math.min(max, Math.max(min, asInt));
};

export const baseService = {
  ensureFound: (value, message = 'Resource not found') => {
    if (!value) {
      throw new ApiError(404, message);
    }

    return value;
  },

  parsePagination: ({ page = 1, limit = 20, maxLimit = 100 } = {}) => {
    const safePage = toBoundedInteger(page, {
      fallback: 1,
      min: 1,
      max: Number.MAX_SAFE_INTEGER,
    });
    const safeLimit = toBoundedInteger(limit, {
      fallback: 20,
      min: 1,
      max: maxLimit,
    });

    return {
      page: safePage,
      limit: safeLimit,
      skip: (safePage - 1) * safeLimit,
    };
  },
};
