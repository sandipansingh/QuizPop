import { ApiError } from '../shared/utils/api-error.js';

const toSocketError = (error) => {
  if (error instanceof ApiError) {
    return error;
  }

  return new ApiError(400, error?.message || 'Socket request failed');
};

export const withSocketAck =
  (handler) =>
  async (...args) => {
    const ack = typeof args.at(-1) === 'function' ? args.at(-1) : null;

    try {
      const data = await handler(...args);
      ack?.({ success: true, data: data ?? null });
    } catch (error) {
      const normalized = toSocketError(error);
      ack?.({
        success: false,
        message: normalized.message,
        meta: normalized.details ? { details: normalized.details } : null,
      });
    }
  };
