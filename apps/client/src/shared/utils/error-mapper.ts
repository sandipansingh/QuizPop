import { AppError } from '../errors/AppError';
import type { ApiError } from '../api/response';

export interface FormError {
  field?: string;
  message: string;
}

export const extractFormErrors = (
  error: AppError | ApiError
): Record<string, string> => {
  const errors: Record<string, string> = {};

  const details = 'details' in error ? error.details : undefined;

  if (details && typeof details === 'object') {
    const detailsObj = details as Record<string, unknown>;

    if (detailsObj.fieldErrors && typeof detailsObj.fieldErrors === 'object') {
      const fieldErrors = detailsObj.fieldErrors as Record<string, string[]>;
      Object.entries(fieldErrors).forEach(([field, messages]) => {
        if (Array.isArray(messages) && messages.length > 0) {
          errors[field] = messages[0];
        }
      });
    }

    if (detailsObj.formErrors && Array.isArray(detailsObj.formErrors)) {
      const formErrors = detailsObj.formErrors as string[];
      if (formErrors.length > 0) {
        errors._form = formErrors[0];
      }
    }
  }

  return errors;
};

export const getGeneralErrorMessage = (error: AppError | ApiError): string => {
  return error.message || 'Something went wrong. Please try again.';
};
