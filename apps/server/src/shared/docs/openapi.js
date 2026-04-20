const buildJsonContent = (schemaRef) => ({
  'application/json': {
    schema: { $ref: schemaRef },
  },
});

const buildStandardErrorResponses = () => ({
  400: { $ref: '#/components/responses/BadRequest' },
  401: { $ref: '#/components/responses/Unauthorized' },
  403: { $ref: '#/components/responses/Forbidden' },
  404: { $ref: '#/components/responses/NotFound' },
  429: { $ref: '#/components/responses/TooManyRequests' },
  500: { $ref: '#/components/responses/InternalServerError' },
});

export const buildOpenApiDocument = ({ serverBaseUrl }) => ({
  openapi: '3.1.0',
  info: {
    title: 'QuizPop API',
    version: '1.0.0',
    description:
      'Production API contract for auth, quiz, room, leaderboard, and user profile/avatar operations.',
  },
  servers: [
    {
      url: serverBaseUrl,
      description: 'Configured API base URL',
    },
  ],
  tags: [
    { name: 'System', description: 'Health and system endpoints' },
    { name: 'Auth', description: 'Authentication and token lifecycle' },
    { name: 'Quiz', description: 'Quiz question and submission flows' },
    { name: 'Room', description: 'Multiplayer room operations' },
    { name: 'Leaderboard', description: 'Global rankings' },
    { name: 'User', description: 'User profile, stats, and avatar endpoints' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      ApiResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          message: { type: 'string' },
          data: {
            oneOf: [
              { type: 'object', additionalProperties: true },
              {
                type: 'array',
                items: { type: 'object', additionalProperties: true },
              },
              { type: 'string' },
              { type: 'number' },
              { type: 'boolean' },
              { type: 'null' },
            ],
          },
          meta: {
            oneOf: [
              { type: 'object', additionalProperties: true },
              { type: 'null' },
            ],
          },
        },
        required: ['success', 'message', 'data', 'meta'],
      },
      RegisterRequest: {
        type: 'object',
        additionalProperties: false,
        required: ['username', 'email', 'password'],
        properties: {
          username: {
            type: 'string',
            minLength: 3,
            maxLength: 30,
            pattern: '^[a-zA-Z0-9_]+$',
          },
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 8, maxLength: 128 },
          avatar_url: { type: 'string', format: 'uri' },
          bio: { type: 'string', maxLength: 280 },
        },
      },
      LoginRequest: {
        type: 'object',
        additionalProperties: false,
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 8, maxLength: 128 },
        },
      },
      RefreshTokenRequest: {
        type: 'object',
        additionalProperties: false,
        properties: {
          refresh_token: { type: 'string', minLength: 20 },
          refreshToken: { type: 'string', minLength: 20 },
        },
        anyOf: [
          { required: ['refresh_token'] },
          { required: ['refreshToken'] },
        ],
      },
      SubmitQuizRequest: {
        type: 'object',
        additionalProperties: false,
        required: ['answers', 'total_time_taken'],
        properties: {
          answers: {
            type: 'array',
            minItems: 1,
            maxItems: 100,
            items: {
              type: 'object',
              additionalProperties: false,
              required: ['question_id', 'selected_answer', 'time_taken'],
              properties: {
                question_id: { type: 'string', format: 'uuid' },
                selected_answer: { type: 'string', minLength: 1 },
                time_taken: { type: 'integer', minimum: 0, maximum: 60000 },
              },
            },
          },
          total_time_taken: { type: 'integer', minimum: 1, maximum: 3600000 },
          room_id: { type: 'string', minLength: 1 },
        },
      },
      JoinRoomRequest: {
        type: 'object',
        additionalProperties: false,
        required: ['room_id'],
        properties: {
          room_id: { type: 'string', minLength: 1 },
        },
      },
      UpdateProfileRequest: {
        type: 'object',
        additionalProperties: false,
        required: ['username', 'email'],
        properties: {
          username: {
            type: 'string',
            minLength: 3,
            maxLength: 30,
            pattern: '^[a-zA-Z0-9_]+$',
          },
          email: { type: 'string', format: 'email' },
          bio: {
            oneOf: [{ type: 'string', maxLength: 280 }, { type: 'null' }],
          },
        },
      },
      ChangePasswordRequest: {
        type: 'object',
        additionalProperties: false,
        required: ['current_password', 'new_password'],
        properties: {
          current_password: { type: 'string', minLength: 8, maxLength: 128 },
          new_password: { type: 'string', minLength: 8, maxLength: 128 },
        },
      },
      AvatarUploadRequest: {
        type: 'object',
        required: ['avatar'],
        properties: {
          avatar: {
            type: 'string',
            format: 'binary',
            description: 'PNG, JPEG, or WEBP image; max 5MB',
          },
        },
      },
    },
    responses: {
      BadRequest: {
        description: 'Validation or malformed request error',
        content: buildJsonContent('#/components/schemas/ApiResponse'),
      },
      Unauthorized: {
        description: 'Missing, invalid, or expired authentication token',
        content: buildJsonContent('#/components/schemas/ApiResponse'),
      },
      Forbidden: {
        description: 'Authenticated user is not allowed to access resource',
        content: buildJsonContent('#/components/schemas/ApiResponse'),
      },
      NotFound: {
        description: 'Resource not found',
        content: buildJsonContent('#/components/schemas/ApiResponse'),
      },
      TooManyRequests: {
        description: 'Rate limit exceeded',
        content: buildJsonContent('#/components/schemas/ApiResponse'),
      },
      InternalServerError: {
        description: 'Unexpected server-side error',
        content: buildJsonContent('#/components/schemas/ApiResponse'),
      },
    },
  },
  paths: {
    '/api/health': {
      get: {
        tags: ['System'],
        summary: 'Health check',
        operationId: 'getHealth',
        responses: {
          200: {
            description: 'Service is healthy',
            content: buildJsonContent('#/components/schemas/ApiResponse'),
          },
          500: { $ref: '#/components/responses/InternalServerError' },
        },
      },
    },
    '/api/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register user',
        operationId: 'registerUser',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RegisterRequest' },
            },
          },
        },
        responses: {
          201: {
            description: 'User registered',
            content: buildJsonContent('#/components/schemas/ApiResponse'),
          },
          400: { $ref: '#/components/responses/BadRequest' },
          429: { $ref: '#/components/responses/TooManyRequests' },
          500: { $ref: '#/components/responses/InternalServerError' },
        },
      },
    },
    '/api/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login user',
        operationId: 'loginUser',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/LoginRequest' },
            },
          },
        },
        responses: {
          200: {
            description: 'Login successful',
            content: buildJsonContent('#/components/schemas/ApiResponse'),
          },
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          429: { $ref: '#/components/responses/TooManyRequests' },
          500: { $ref: '#/components/responses/InternalServerError' },
        },
      },
    },
    '/api/auth/refresh': {
      post: {
        tags: ['Auth'],
        summary: 'Refresh access token',
        operationId: 'refreshAuthToken',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RefreshTokenRequest' },
            },
          },
        },
        responses: {
          200: {
            description: 'Token refreshed',
            content: buildJsonContent('#/components/schemas/ApiResponse'),
          },
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          429: { $ref: '#/components/responses/TooManyRequests' },
          500: { $ref: '#/components/responses/InternalServerError' },
        },
      },
    },
    '/api/auth/logout': {
      post: {
        tags: ['Auth'],
        summary: 'Logout user',
        operationId: 'logoutUser',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RefreshTokenRequest' },
            },
          },
        },
        responses: {
          200: {
            description: 'Logout successful',
            content: buildJsonContent('#/components/schemas/ApiResponse'),
          },
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          429: { $ref: '#/components/responses/TooManyRequests' },
          500: { $ref: '#/components/responses/InternalServerError' },
        },
      },
    },
    '/api/quiz/questions': {
      get: {
        tags: ['Quiz'],
        summary: 'Get quiz questions',
        operationId: 'getQuizQuestions',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'userId',
            in: 'query',
            required: false,
            description: 'Must match authenticated user if provided',
            schema: { type: 'string', format: 'uuid' },
          },
          {
            name: 'limit',
            in: 'query',
            required: false,
            schema: { type: 'integer', minimum: 1, maximum: 50 },
          },
          {
            name: 'category',
            in: 'query',
            required: false,
            schema: { type: 'string', minLength: 1, maxLength: 100 },
          },
          {
            name: 'difficulty',
            in: 'query',
            required: false,
            schema: { type: 'string', enum: ['easy', 'medium', 'hard'] },
          },
        ],
        responses: {
          200: {
            description: 'Questions fetched',
            content: buildJsonContent('#/components/schemas/ApiResponse'),
          },
          ...buildStandardErrorResponses(),
        },
      },
    },
    '/api/quiz/submit': {
      post: {
        tags: ['Quiz'],
        summary: 'Submit quiz answers',
        operationId: 'submitQuiz',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SubmitQuizRequest' },
            },
          },
        },
        responses: {
          200: {
            description: 'Quiz submitted',
            content: buildJsonContent('#/components/schemas/ApiResponse'),
          },
          ...buildStandardErrorResponses(),
        },
      },
    },
    '/api/room/create': {
      post: {
        tags: ['Room'],
        summary: 'Create room',
        operationId: 'createRoom',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: false,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                additionalProperties: false,
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Room created',
            content: buildJsonContent('#/components/schemas/ApiResponse'),
          },
          ...buildStandardErrorResponses(),
        },
      },
    },
    '/api/room/join': {
      post: {
        tags: ['Room'],
        summary: 'Join room',
        operationId: 'joinRoom',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/JoinRoomRequest' },
            },
          },
        },
        responses: {
          200: {
            description: 'Joined room',
            content: buildJsonContent('#/components/schemas/ApiResponse'),
          },
          ...buildStandardErrorResponses(),
        },
      },
    },
    '/api/leaderboard': {
      get: {
        tags: ['Leaderboard'],
        summary: 'Get leaderboard',
        operationId: 'getLeaderboard',
        parameters: [
          {
            name: 'page',
            in: 'query',
            required: false,
            schema: { type: 'integer', minimum: 1 },
          },
          {
            name: 'limit',
            in: 'query',
            required: false,
            schema: { type: 'integer', minimum: 1, maximum: 100 },
          },
        ],
        responses: {
          200: {
            description: 'Leaderboard fetched',
            content: buildJsonContent('#/components/schemas/ApiResponse'),
          },
          400: { $ref: '#/components/responses/BadRequest' },
          429: { $ref: '#/components/responses/TooManyRequests' },
          500: { $ref: '#/components/responses/InternalServerError' },
        },
      },
    },
    '/api/user/profile': {
      get: {
        tags: ['User'],
        summary: 'Get current user profile',
        operationId: 'getMyProfile',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Profile fetched',
            content: buildJsonContent('#/components/schemas/ApiResponse'),
          },
          ...buildStandardErrorResponses(),
        },
      },
      patch: {
        tags: ['User'],
        summary: 'Update current user profile',
        operationId: 'updateMyProfile',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateProfileRequest' },
            },
          },
        },
        responses: {
          200: {
            description: 'Profile updated',
            content: buildJsonContent('#/components/schemas/ApiResponse'),
          },
          ...buildStandardErrorResponses(),
        },
      },
    },
    '/api/user/stats': {
      get: {
        tags: ['User'],
        summary: 'Get current user stats',
        operationId: 'getMyStats',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Stats fetched',
            content: buildJsonContent('#/components/schemas/ApiResponse'),
          },
          ...buildStandardErrorResponses(),
        },
      },
    },
    '/api/user/change-password': {
      post: {
        tags: ['User'],
        summary: 'Change current user password',
        operationId: 'changeMyPassword',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ChangePasswordRequest',
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Password changed',
            content: buildJsonContent('#/components/schemas/ApiResponse'),
          },
          ...buildStandardErrorResponses(),
        },
      },
    },
    '/api/user/avatar': {
      post: {
        tags: ['User'],
        summary: 'Upload avatar for current user',
        operationId: 'uploadMyAvatar',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: { $ref: '#/components/schemas/AvatarUploadRequest' },
            },
          },
        },
        responses: {
          200: {
            description: 'Avatar updated',
            content: buildJsonContent('#/components/schemas/ApiResponse'),
          },
          ...buildStandardErrorResponses(),
        },
      },
      delete: {
        tags: ['User'],
        summary: 'Delete avatar for current user',
        operationId: 'deleteMyAvatar',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Avatar removed',
            content: buildJsonContent('#/components/schemas/ApiResponse'),
          },
          ...buildStandardErrorResponses(),
        },
      },
    },
    '/api/user/avatar/object': {
      get: {
        tags: ['User'],
        summary: 'Get avatar by object key',
        operationId: 'viewAvatarObject',
        parameters: [
          {
            name: 'key',
            in: 'query',
            required: true,
            schema: { type: 'string', minLength: 10, maxLength: 500 },
          },
        ],
        responses: {
          200: {
            description: 'Avatar image stream',
            content: {
              'image/png': { schema: { type: 'string', format: 'binary' } },
              'image/jpeg': { schema: { type: 'string', format: 'binary' } },
              'image/webp': { schema: { type: 'string', format: 'binary' } },
            },
          },
          400: { $ref: '#/components/responses/BadRequest' },
          404: { $ref: '#/components/responses/NotFound' },
          500: { $ref: '#/components/responses/InternalServerError' },
        },
      },
    },
    '/api/user/avatar/view/{userId}': {
      get: {
        tags: ['User'],
        summary: 'Get avatar by user id',
        operationId: 'viewUserAvatar',
        parameters: [
          {
            name: 'userId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          200: {
            description: 'Avatar image stream',
            content: {
              'image/png': { schema: { type: 'string', format: 'binary' } },
              'image/jpeg': { schema: { type: 'string', format: 'binary' } },
              'image/webp': { schema: { type: 'string', format: 'binary' } },
            },
          },
          400: { $ref: '#/components/responses/BadRequest' },
          404: { $ref: '#/components/responses/NotFound' },
          500: { $ref: '#/components/responses/InternalServerError' },
        },
      },
    },
    '/api/user/profile/{userId}': {
      get: {
        tags: ['User'],
        summary: 'Get public profile by user id',
        operationId: 'getPublicProfileById',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'userId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          200: {
            description: 'Public profile fetched',
            content: buildJsonContent('#/components/schemas/ApiResponse'),
          },
          ...buildStandardErrorResponses(),
        },
      },
    },
    '/api/user/profile/username/{username}': {
      get: {
        tags: ['User'],
        summary: 'Get public profile by username',
        operationId: 'getPublicProfileByUsername',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'username',
            in: 'path',
            required: true,
            schema: {
              type: 'string',
              minLength: 3,
              maxLength: 30,
              pattern: '^[a-zA-Z0-9_]+$',
            },
          },
        ],
        responses: {
          200: {
            description: 'Public profile fetched',
            content: buildJsonContent('#/components/schemas/ApiResponse'),
          },
          ...buildStandardErrorResponses(),
        },
      },
    },
  },
});
