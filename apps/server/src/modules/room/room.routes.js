import { Router } from 'express';
import { roomController } from './room.controller.js';
import { createRoomSchema, joinRoomSchema } from './room.validation.js';
import { requireAuth } from '../../shared/middleware/auth.middleware.js';
import { sensitiveWriteLimiter } from '../../shared/middleware/rate-limit.middleware.js';
import { validate } from '../../shared/middleware/validate.middleware.js';
import { asyncHandler } from '../../shared/utils/async-handler.js';

const router = Router();

router.post(
  '/create',
  requireAuth,
  sensitiveWriteLimiter,
  validate(createRoomSchema),
  asyncHandler(roomController.createRoom)
);
router.post(
  '/join',
  requireAuth,
  sensitiveWriteLimiter,
  validate(joinRoomSchema),
  asyncHandler(roomController.joinRoom)
);

export const roomRoutes = router;
