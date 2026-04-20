import validator from 'validator';

const sanitizeValue = (value) => {
  if (typeof value === 'string') {
    return validator.trim(value).split('\0').join('');
  }

  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }

  if (value && typeof value === 'object') {
    return Object.entries(value).reduce((acc, [key, nestedValue]) => {
      acc[key] = sanitizeValue(nestedValue);
      return acc;
    }, {});
  }

  return value;
};

export const sanitizeRequest = (req, _res, next) => {
  if (req.body) {
    req.body = sanitizeValue(req.body);
  }

  if (req.query) {
    req.sanitizedQuery = sanitizeValue(req.query);
  }

  next();
};
