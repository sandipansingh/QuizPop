import { z } from 'zod';
import { env } from '../../shared/config/env.js';

export const getQuestionsSchema = z.object({
  query: z.object({
    userId: z.string().uuid().optional(),
    limit: z.coerce
      .number()
      .int()
      .positive()
      .max(env.QUIZ_MAX_QUESTION_LIMIT)
      .optional(),
    category: z.string().min(1).max(100).optional(),
    difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  }),
  body: z.object({}).optional(),
  params: z.object({}).optional(),
});

export const submitQuizSchema = z.object({
  body: z.object({
    answers: z
      .array(
        z.object({
          question_id: z.string().uuid(),
          selected_answer: z.string().min(1),
          time_taken: z.coerce.number().int().min(0).max(60000),
        })
      )
      .min(1)
      .max(100),
    total_time_taken: z.coerce
      .number()
      .int()
      .min(1)
      .max(60 * 60 * 1000),
    room_id: z.string().optional(),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});
