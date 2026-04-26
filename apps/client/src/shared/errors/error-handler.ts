import toast from 'react-hot-toast';
import { AppError } from './AppError';
import { ErrorCodes } from './error-codes';

export interface ErrorHandlerOptions {
  showToast?: boolean;
  logToConsole?: boolean;
  rethrow?: boolean;
  customMessage?: string;
}

class ErrorHandler {
  private static instance: ErrorHandler;

  private constructor() {}

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  handle(error: unknown, options: ErrorHandlerOptions = {}): AppError {
    const {
      showToast = true,
      logToConsole = true,
      rethrow = false,
      customMessage,
    } = options;

    const appError = this.normalizeError(error);

    if (logToConsole) {
      this.logError(appError);
    }

    if (showToast) {
      this.showErrorToast(appError, customMessage);
    }

    if (rethrow) {
      throw appError;
    }

    return appError;
  }

  private normalizeError(error: unknown): AppError {
    if (error instanceof AppError) {
      return error;
    }

    if (error && typeof error === 'object') {
      const err = error as Record<string, unknown>;

      if (err.code === 'ERR_NETWORK') {
        return AppError.networkError();
      }

      if (err.code === 'ECONNABORTED') {
        return AppError.networkTimeout();
      }

      if (!navigator.onLine) {
        return AppError.networkOffline();
      }

      if (err.status && err.message) {
        return AppError.fromApiError({
          status: err.status as number,
          message: err.message as string,
          details: err.details,
          code: err.code as string | undefined,
        });
      }
    }

    if (error instanceof Error) {
      return AppError.unknownError(error.message);
    }

    return AppError.unknownError(String(error));
  }

  private logError(error: AppError): void {
    if (import.meta.env.DEV) {
      console.group(`[${error.name}] ${error.code}`);
      console.error('Message:', error.message);
      console.error('Status:', error.statusCode);
      console.error('Timestamp:', error.timestamp);
      if (error.details) {
        console.error('Details:', error.details);
      }
      if (error.stack) {
        console.error('Stack:', error.stack);
      }
      console.groupEnd();
    } else {
      console.error(`[${error.code}] ${error.message}`);
    }
  }

  private showErrorToast(error: AppError, customMessage?: string): void {
    const message = customMessage || error.message;

    if (
      error.code === ErrorCodes.AUTH_TOKEN_EXPIRED ||
      error.code === ErrorCodes.AUTH_SESSION_EXPIRED
    ) {
      toast.error(message, { duration: 5000 });
      return;
    }

    if (error.code === ErrorCodes.NETWORK_OFFLINE) {
      toast.error(message, { duration: 6000 });
      return;
    }

    if (error.code === ErrorCodes.RATE_LIMIT_EXCEEDED) {
      toast.error(message, { duration: 5000 });
      return;
    }

    if (error.statusCode >= 500) {
      toast.error(message, { duration: 4000 });
      return;
    }

    toast.error(message, { duration: 3000 });
  }

  handleAuthError(error: unknown): void {
    const appError = this.normalizeError(error);

    if (
      appError.code === ErrorCodes.AUTH_TOKEN_EXPIRED ||
      appError.code === ErrorCodes.AUTH_SESSION_EXPIRED ||
      appError.code === ErrorCodes.AUTH_TOKEN_INVALID
    ) {
      window.location.href = '/login';
    }

    this.handle(error, { showToast: true });
  }

  handleFormError(error: unknown): {
    message: string;
    fieldErrors: Record<string, string>;
  } {
    const appError = this.normalizeError(error);

    const fieldErrors: Record<string, string> = {};
    if (appError.details?.fieldErrors) {
      Object.entries(appError.details.fieldErrors).forEach(
        ([field, errors]) => {
          if (Array.isArray(errors) && errors.length > 0) {
            fieldErrors[field] = errors[0];
          }
        }
      );
    }

    return {
      message: appError.message,
      fieldErrors,
    };
  }
}

export const errorHandler = ErrorHandler.getInstance();

export const handleError = (
  error: unknown,
  options?: ErrorHandlerOptions
): AppError => {
  return errorHandler.handle(error, options);
};

export const handleAuthError = (error: unknown): void => {
  errorHandler.handleAuthError(error);
};

export const handleFormError = (error: unknown) => {
  return errorHandler.handleFormError(error);
};
