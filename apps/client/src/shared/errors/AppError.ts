import { ErrorCode, ErrorCodes, ErrorMessages } from './error-codes';

export interface ErrorDetails {
  fieldErrors?: Record<string, string[]>;
  formErrors?: string[];
  [key: string]: unknown;
}

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly details?: ErrorDetails;
  public readonly timestamp: string;
  public readonly isOperational: boolean;

  constructor(
    code: ErrorCode,
    message?: string,
    statusCode = 500,
    details?: ErrorDetails
  ) {
    super(
      message || ErrorMessages[code] || ErrorMessages[ErrorCodes.UNKNOWN_ERROR]
    );
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.timestamp = new Date().toISOString();
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      details: this.details,
      timestamp: this.timestamp,
    };
  }

  static fromApiError(apiError: {
    status: number;
    message: string;
    details?: unknown;
    code?: string;
  }): AppError {
    const code = (apiError.code as ErrorCode) || ErrorCodes.UNKNOWN_ERROR;
    const details = apiError.details as ErrorDetails | undefined;
    return new AppError(code, apiError.message, apiError.status, details);
  }

  static networkError(): AppError {
    return new AppError(ErrorCodes.NETWORK_ERROR, undefined, 0);
  }

  static networkTimeout(): AppError {
    return new AppError(ErrorCodes.NETWORK_TIMEOUT, undefined, 0);
  }

  static networkOffline(): AppError {
    return new AppError(ErrorCodes.NETWORK_OFFLINE, undefined, 0);
  }

  static unknownError(message?: string): AppError {
    return new AppError(ErrorCodes.UNKNOWN_ERROR, message);
  }
}
