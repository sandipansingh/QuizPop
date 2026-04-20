import { Router } from 'express';
import { leaderboardController } from './leaderboard.controller.js';
import { getLeaderboardSchema } from './leaderboard.validation.js';
import { validate } from '../../shared/middleware/validate.middleware.js';

const router = Router();

router.get(
  '/',
  validate(getLeaderboardSchema),
  leaderboardController.getLeaderboard
);

export const leaderboardRoutes = router;
