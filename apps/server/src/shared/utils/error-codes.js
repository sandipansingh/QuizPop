export const ErrorCodes = {
  // Authentication & Authorization (1000-1099)
  AUTH_INVALID_CREDENTIALS: 'AUTH_001',
  AUTH_TOKEN_EXPIRED: 'AUTH_002',
  AUTH_TOKEN_INVALID: 'AUTH_003',
  AUTH_TOKEN_MISSING: 'AUTH_004',
  AUTH_REFRESH_TOKEN_INVALID: 'AUTH_005',
  AUTH_UNAUTHORIZED: 'AUTH_006',
  AUTH_SESSION_EXPIRED: 'AUTH_007',

  // Validation (1100-1199)
  VALIDATION_ERROR: 'VAL_001',
  VALIDATION_FIELD_REQUIRED: 'VAL_002',
  VALIDATION_FIELD_INVALID: 'VAL_003',
  VALIDATION_FIELD_TOO_SHORT: 'VAL_004',
  VALIDATION_FIELD_TOO_LONG: 'VAL_005',

  // User (1200-1299)
  USER_NOT_FOUND: 'USER_001',
  USER_ALREADY_EXISTS: 'USER_002',
  USER_EMAIL_EXISTS: 'USER_003',
  USER_USERNAME_EXISTS: 'USER_004',
  USER_PROFILE_UPDATE_FAILED: 'USER_005',
  USER_PASSWORD_INCORRECT: 'USER_006',
  USER_AVATAR_UPLOAD_FAILED: 'USER_007',

  // Quiz (1300-1399)
  QUIZ_NOT_FOUND: 'QUIZ_001',
  QUIZ_ALREADY_SUBMITTED: 'QUIZ_002',
  QUIZ_INVALID_ANSWER: 'QUIZ_003',
  QUIZ_TIME_EXCEEDED: 'QUIZ_004',
  QUIZ_NO_QUESTIONS: 'QUIZ_005',

  // Room (1400-1499)
  ROOM_NOT_FOUND: 'ROOM_001',
  ROOM_FULL: 'ROOM_002',
  ROOM_ALREADY_JOINED: 'ROOM_003',
  ROOM_NOT_JOINED: 'ROOM_004',
  ROOM_GAME_IN_PROGRESS: 'ROOM_005',
  ROOM_GAME_NOT_STARTED: 'ROOM_006',

  // Leaderboard (1500-1599)
  LEADERBOARD_FETCH_FAILED: 'LEAD_001',

  // File Upload (1600-1699)
  FILE_TOO_LARGE: 'FILE_001',
  FILE_INVALID_TYPE: 'FILE_002',
  FILE_UPLOAD_FAILED: 'FILE_003',

  // Rate Limiting (1700-1799)
  RATE_LIMIT_EXCEEDED: 'RATE_001',

  // Database (1800-1899)
  DATABASE_ERROR: 'DB_001',
  DATABASE_CONNECTION_FAILED: 'DB_002',
  DATABASE_QUERY_FAILED: 'DB_003',

  // Cache (1900-1999)
  CACHE_ERROR: 'CACHE_001',
  CACHE_CONNECTION_FAILED: 'CACHE_002',

  // Server (2000-2099)
  INTERNAL_SERVER_ERROR: 'SRV_001',
  SERVICE_UNAVAILABLE: 'SRV_002',
  NOT_FOUND: 'SRV_003',
  METHOD_NOT_ALLOWED: 'SRV_004',
  CORS_ERROR: 'SRV_005',
};

export const ErrorMessages = {
  [ErrorCodes.AUTH_INVALID_CREDENTIALS]: 'Invalid email or password.',
  [ErrorCodes.AUTH_TOKEN_EXPIRED]:
    'Your session has expired. Please sign in again.',
  [ErrorCodes.AUTH_TOKEN_INVALID]: 'Invalid authentication token.',
  [ErrorCodes.AUTH_TOKEN_MISSING]: 'Authentication required.',
  [ErrorCodes.AUTH_REFRESH_TOKEN_INVALID]:
    'Invalid refresh token. Please sign in again.',
  [ErrorCodes.AUTH_UNAUTHORIZED]:
    'You are not authorized to perform this action.',
  [ErrorCodes.AUTH_SESSION_EXPIRED]:
    'Your session has expired. Please sign in again.',

  [ErrorCodes.VALIDATION_ERROR]: 'Validation failed. Please check your input.',
  [ErrorCodes.VALIDATION_FIELD_REQUIRED]: 'This field is required.',
  [ErrorCodes.VALIDATION_FIELD_INVALID]: 'This field contains invalid data.',
  [ErrorCodes.VALIDATION_FIELD_TOO_SHORT]: 'This field is too short.',
  [ErrorCodes.VALIDATION_FIELD_TOO_LONG]: 'This field is too long.',

  [ErrorCodes.USER_NOT_FOUND]: 'User not found.',
  [ErrorCodes.USER_ALREADY_EXISTS]:
    'An account with this email already exists.',
  [ErrorCodes.USER_EMAIL_EXISTS]: 'This email is already registered.',
  [ErrorCodes.USER_USERNAME_EXISTS]: 'This username is already taken.',
  [ErrorCodes.USER_PROFILE_UPDATE_FAILED]:
    'Failed to update profile. Please try again.',
  [ErrorCodes.USER_PASSWORD_INCORRECT]: 'Current password is incorrect.',
  [ErrorCodes.USER_AVATAR_UPLOAD_FAILED]:
    'Failed to upload avatar. Please try again.',

  [ErrorCodes.QUIZ_NOT_FOUND]: 'Quiz not found.',
  [ErrorCodes.QUIZ_ALREADY_SUBMITTED]: 'This quiz has already been submitted.',
  [ErrorCodes.QUIZ_INVALID_ANSWER]: 'Invalid answer format.',
  [ErrorCodes.QUIZ_TIME_EXCEEDED]: 'Time limit exceeded for this quiz.',
  [ErrorCodes.QUIZ_NO_QUESTIONS]: 'No questions available for this quiz.',

  [ErrorCodes.ROOM_NOT_FOUND]: 'Room not found.',
  [ErrorCodes.ROOM_FULL]: 'This room is full.',
  [ErrorCodes.ROOM_ALREADY_JOINED]: 'You have already joined this room.',
  [ErrorCodes.ROOM_NOT_JOINED]: 'You have not joined this room.',
  [ErrorCodes.ROOM_GAME_IN_PROGRESS]: 'Game is already in progress.',
  [ErrorCodes.ROOM_GAME_NOT_STARTED]: 'Game has not started yet.',

  [ErrorCodes.LEADERBOARD_FETCH_FAILED]:
    'Failed to fetch leaderboard. Please try again.',

  [ErrorCodes.FILE_TOO_LARGE]: 'File is too large. Maximum size is 5MB.',
  [ErrorCodes.FILE_INVALID_TYPE]: 'Invalid file type. Only images are allowed.',
  [ErrorCodes.FILE_UPLOAD_FAILED]: 'File upload failed. Please try again.',

  [ErrorCodes.RATE_LIMIT_EXCEEDED]:
    'Too many requests. Please try again later.',

  [ErrorCodes.DATABASE_ERROR]: 'Database error occurred. Please try again.',
  [ErrorCodes.DATABASE_CONNECTION_FAILED]: 'Failed to connect to database.',
  [ErrorCodes.DATABASE_QUERY_FAILED]: 'Database query failed.',

  [ErrorCodes.CACHE_ERROR]: 'Cache error occurred.',
  [ErrorCodes.CACHE_CONNECTION_FAILED]: 'Failed to connect to cache.',

  [ErrorCodes.INTERNAL_SERVER_ERROR]:
    'An unexpected error occurred. Please try again.',
  [ErrorCodes.SERVICE_UNAVAILABLE]:
    'Service is temporarily unavailable. Please try again later.',
  [ErrorCodes.NOT_FOUND]: 'The requested resource was not found.',
  [ErrorCodes.METHOD_NOT_ALLOWED]: 'Method not allowed.',
  [ErrorCodes.CORS_ERROR]: 'CORS policy violation.',
};
