import { Router } from 'express';
import { quizController } from './quiz.controller.js';
import { getQuestionsSchema, submitQuizSchema } from './quiz.validation.js';
import { requireAuth } from '../../shared/middleware/auth.middleware.js';
import { sensitiveWriteLimiter } from '../../shared/middleware/rate-limit.middleware.js';
import { validate } from '../../shared/middleware/validate.middleware.js';
import { asyncHandler } from '../../shared/utils/async-handler.js';

const router = Router();

router.get(
  '/questions',
  requireAuth,
  validate(getQuestionsSchema),
  asyncHandler(quizController.getQuestions)
);
router.post(
  '/submit',
  requireAuth,
  sensitiveWriteLimiter,
  validate(submitQuizSchema),
  asyncHandler(quizController.submitQuiz)
);

export const quizRoutes = router;
