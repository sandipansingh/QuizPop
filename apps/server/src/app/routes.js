import { Router } from 'express';
import { authRoutes } from '../modules/auth/auth.routes.js';
import { leaderboardRoutes } from '../modules/leaderboard/leaderboard.routes.js';
import { quizRoutes } from '../modules/quiz/quiz.routes.js';
import { roomRoutes } from '../modules/room/room.routes.js';
import { userRoutes } from '../modules/user/user.routes.js';
import { sendSuccess } from '../shared/utils/http-response.js';

export const registerRoutes = (app) => {
  const router = Router();

  router.get('/health', (_, res) => {
    sendSuccess(res, {
      message: 'Service healthy',
      data: { status: 'ok', service: 'quizpop-api' },
    });
  });

  router.use('/auth', authRoutes);
  router.use('/quiz', quizRoutes);
  router.use('/user', userRoutes);
  router.use('/leaderboard', leaderboardRoutes);
  router.use('/room', roomRoutes);

  app.use('/api', router);
};
