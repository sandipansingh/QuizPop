import type { FieldErrors } from 'react-hook-form';

export const getFieldError = (
  errors: FieldErrors,
  fieldName: string
): string | undefined => {
  const error = errors[fieldName];
  return error?.message as string | undefined;
};

export const hasErrors = (errors: FieldErrors): boolean => {
  return Object.keys(errors).length > 0;
};

export interface ApiError {
  status: number;
  message: string;
  details?: {
    fieldErrors?: Record<string, string[]>;
  };
}

export const mapServerErrorsToForm = (
  apiError: ApiError
): Record<string, string> => {
  const fieldErrors = apiError.details?.fieldErrors || {};
  return Object.entries(fieldErrors).reduce(
    (acc, [field, messages]) => {
      acc[field] = Array.isArray(messages) ? messages[0] : messages;
      return acc;
    },
    {} as Record<string, string>
  );
};
