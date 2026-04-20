import { Router } from 'express';
import { authController } from './auth.controller.js';
import {
  loginSchema,
  logoutSchema,
  refreshTokenSchema,
  registerSchema,
} from './auth.validation.js';
import { asyncHandler } from '../../shared/utils/async-handler.js';
import {
  authLoginLimiter,
  authRegisterLimiter,
  authTokenLimiter,
} from '../../shared/middleware/rate-limit.middleware.js';
import { validate } from '../../shared/middleware/validate.middleware.js';

const router = Router();

router.post(
  '/register',
  authRegisterLimiter,
  validate(registerSchema),
  asyncHandler(authController.register)
);
router.post(
  '/login',
  authLoginLimiter,
  validate(loginSchema),
  asyncHandler(authController.login)
);
router.post(
  '/refresh',
  authTokenLimiter,
  validate(refreshTokenSchema),
  asyncHandler(authController.refreshToken)
);
router.post(
  '/logout',
  authTokenLimiter,
  validate(logoutSchema),
  asyncHandler(authController.logout)
);

export const authRoutes = router;
