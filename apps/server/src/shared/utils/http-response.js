import { apiResponse } from './api-response.js';

export const sendSuccess = (
  res,
  { statusCode = 200, message = 'OK', data = null, meta = null }
) => {
  res.status(statusCode).json(
    apiResponse({
      success: true,
      message,
      data,
      meta,
    })
  );
};
