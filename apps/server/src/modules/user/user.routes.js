import { Router } from 'express';
import { userController } from './user.controller.js';
import {
  changePasswordSchema,
  getAvatarObjectViewSchema,
  getPublicProfileSchema,
  getPublicProfileByUsernameSchema,
  getUserAvatarViewSchema,
  updateProfileSchema,
} from './user.validation.js';
import { requireAuth } from '../../shared/middleware/auth.middleware.js';
import { sensitiveWriteLimiter } from '../../shared/middleware/rate-limit.middleware.js';
import { uploadSingleAvatarImage } from '../../shared/middleware/upload.middleware.js';
import { validate } from '../../shared/middleware/validate.middleware.js';
import { asyncHandler } from '../../shared/utils/async-handler.js';

const router = Router();

router.get('/profile', requireAuth, asyncHandler(userController.getProfile));
router.get(
  '/avatar/object',
  validate(getAvatarObjectViewSchema),
  asyncHandler(userController.viewAvatarObject)
);
router.get(
  '/avatar/view/:userId',
  validate(getUserAvatarViewSchema),
  asyncHandler(userController.viewUserAvatar)
);
router.post(
  '/change-password',
  requireAuth,
  sensitiveWriteLimiter,
  validate(changePasswordSchema),
  asyncHandler(userController.changePassword)
);
router.patch(
  '/profile',
  requireAuth,
  sensitiveWriteLimiter,
  validate(updateProfileSchema),
  asyncHandler(userController.updateProfile)
);
router.get(
  '/profile/username/:username',
  requireAuth,
  validate(getPublicProfileByUsernameSchema),
  asyncHandler(userController.getPublicProfileByUsername)
);
router.get(
  '/profile/:userId',
  requireAuth,
  validate(getPublicProfileSchema),
  asyncHandler(userController.getPublicProfile)
);
router.get('/stats', requireAuth, asyncHandler(userController.getStats));
router.post(
  '/avatar',
  requireAuth,
  sensitiveWriteLimiter,
  uploadSingleAvatarImage,
  asyncHandler(userController.uploadMyAvatar)
);
router.delete(
  '/avatar',
  requireAuth,
  sensitiveWriteLimiter,
  asyncHandler(userController.deleteMyAvatar)
);

export const userRoutes = router;
