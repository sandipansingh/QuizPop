import { ApiError } from './api-error.js';
import { ErrorCodes, ErrorMessages } from './error-codes.js';

const EXACT_STATUS_MAP = {
  [ErrorCodes.USER_NOT_FOUND]: 404,
  [ErrorCodes.USER_ALREADY_EXISTS]: 409,
  [ErrorCodes.USER_EMAIL_EXISTS]: 409,
  [ErrorCodes.USER_USERNAME_EXISTS]: 409,
  [ErrorCodes.QUIZ_NOT_FOUND]: 404,
  [ErrorCodes.ROOM_NOT_FOUND]: 404,
  [ErrorCodes.ROOM_FULL]: 409,
  [ErrorCodes.NOT_FOUND]: 404,
  [ErrorCodes.METHOD_NOT_ALLOWED]: 405,
  [ErrorCodes.SERVICE_UNAVAILABLE]: 503,
};

const PREFIX_STATUS_MAP = {
  AUTH_: 401,
  VAL_: 400,
  USER_: 400,
  QUIZ_: 400,
  ROOM_: 400,
  FILE_: 400,
  RATE_: 429,
  DB_: 500,
  CACHE_: 500,
};

const getStatusCode = (code) => {
  if (EXACT_STATUS_MAP[code] !== undefined) return EXACT_STATUS_MAP[code];

  const prefix = Object.keys(PREFIX_STATUS_MAP).find((p) => code.startsWith(p));
  return prefix ? PREFIX_STATUS_MAP[prefix] : 500;
};

export class ErrorFactory {
  static create(code, customMessage = null, details = null) {
    const message =
      customMessage || ErrorMessages[code] || 'An error occurred.';
    return new ApiError(getStatusCode(code), message, details, code);
  }

  static authInvalidCredentials() {
    return this.create(ErrorCodes.AUTH_INVALID_CREDENTIALS);
  }

  static authTokenExpired() {
    return this.create(ErrorCodes.AUTH_TOKEN_EXPIRED);
  }

  static authTokenInvalid() {
    return this.create(ErrorCodes.AUTH_TOKEN_INVALID);
  }

  static authUnauthorized(message = null) {
    return this.create(ErrorCodes.AUTH_UNAUTHORIZED, message);
  }

  static validationError(details = null) {
    return this.create(ErrorCodes.VALIDATION_ERROR, null, details);
  }

  static userNotFound() {
    return this.create(ErrorCodes.USER_NOT_FOUND);
  }

  static userAlreadyExists() {
    return this.create(ErrorCodes.USER_ALREADY_EXISTS);
  }

  static userEmailExists() {
    return this.create(ErrorCodes.USER_EMAIL_EXISTS);
  }

  static userUsernameExists() {
    return this.create(ErrorCodes.USER_USERNAME_EXISTS);
  }

  static userPasswordIncorrect() {
    return this.create(ErrorCodes.USER_PASSWORD_INCORRECT);
  }

  static quizNotFound() {
    return this.create(ErrorCodes.QUIZ_NOT_FOUND);
  }

  static roomNotFound() {
    return this.create(ErrorCodes.ROOM_NOT_FOUND);
  }

  static roomFull() {
    return this.create(ErrorCodes.ROOM_FULL);
  }

  static fileTooLarge() {
    return this.create(ErrorCodes.FILE_TOO_LARGE);
  }

  static fileInvalidType() {
    return this.create(ErrorCodes.FILE_INVALID_TYPE);
  }

  static rateLimitExceeded() {
    return this.create(ErrorCodes.RATE_LIMIT_EXCEEDED);
  }

  static databaseError(message = null) {
    return this.create(ErrorCodes.DATABASE_ERROR, message);
  }

  static internalServerError(message = null) {
    return this.create(ErrorCodes.INTERNAL_SERVER_ERROR, message);
  }

  static notFound(resource = 'Resource') {
    return this.create(ErrorCodes.NOT_FOUND, `${resource} not found.`);
  }
}
