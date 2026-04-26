import { z } from 'zod';
import { env } from '../../shared/config/env.js';
import {
  getQuestionsQuerySchema,
  submitQuizBodySchema,
} from '../../shared/validation/quiz.schemas.js';

export const getQuestionsSchema = z.object({
  query: getQuestionsQuerySchema.extend({
    limit: z.coerce
      .number()
      .int()
      .positive()
      .max(env.QUIZ_MAX_QUESTION_LIMIT)
      .optional(),
  }),
  body: z.object({}).optional(),
  params: z.object({}).optional(),
});

export const submitQuizSchema = z.object({
  body: submitQuizBodySchema,
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});
