import type { ApiError } from '../api/response';

export interface FormError {
  field?: string;
  message: string;
}

export const extractFormErrors = (
  apiError: ApiError
): Record<string, string> => {
  const errors: Record<string, string> = {};

  if (apiError.details) {
    const details = apiError.details as Record<string, unknown>;

    if (details.fieldErrors && typeof details.fieldErrors === 'object') {
      const fieldErrors = details.fieldErrors as Record<string, string[]>;
      Object.entries(fieldErrors).forEach(([field, messages]) => {
        if (Array.isArray(messages) && messages.length > 0) {
          errors[field] = messages[0];
        }
      });
    }

    if (details.formErrors && Array.isArray(details.formErrors)) {
      const formErrors = details.formErrors as string[];
      if (formErrors.length > 0) {
        errors._form = formErrors[0];
      }
    }
  }

  return errors;
};

export const getGeneralErrorMessage = (apiError: ApiError): string => {
  return apiError.message || 'Something went wrong. Please try again.';
};
