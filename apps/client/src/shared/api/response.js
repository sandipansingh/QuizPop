export const normalizeApiError = (error) => {
  const status = error?.response?.status || error?.status || 500;
  const details = error?.response?.data?.meta?.details || null;
  const message =
    error?.response?.data?.message ||
    error?.message ||
    'Something went wrong. Please try again.';

  return {
    status,
    message,
    details,
    raw: error,
  };
};

export const parseApiResponse = (response) => {
  const payload = response?.data;

  if (!payload) {
    throw {
      status: 500,
      message: 'Invalid API response payload.',
    };
  }

  if (payload.success === false) {
    throw {
      status: response.status,
      message: payload.message || 'Request failed.',
      details: payload.meta?.details || null,
    };
  }

  return {
    message: payload.message || 'OK',
    data: payload.data,
    meta: payload.meta,
  };
};
