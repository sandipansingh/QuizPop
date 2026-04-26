import { z } from 'zod';
import {
  uuidSchema,
  difficultySchema,
  categorySchema,
  roomIdSchema,
} from './common.schemas.js';

export const questionAnswerSchema = z.object({
  question_id: uuidSchema,
  selected_answer: z.string().min(1, 'Answer cannot be empty.'),
  time_taken: z.coerce
    .number()
    .int()
    .min(0, 'Time taken cannot be negative.')
    .max(60000, 'Time taken is too large.'),
});

export const submitQuizBodySchema = z.object({
  answers: z
    .array(questionAnswerSchema)
    .min(1, 'At least one answer is required.')
    .max(100, 'Too many answers.'),
  total_time_taken: z.coerce
    .number()
    .int()
    .min(1, 'Total time must be at least 1ms.')
    .max(60 * 60 * 1000, 'Total time is too large.'),
  room_id: roomIdSchema.optional(),
});

export const getQuestionsQuerySchema = z.object({
  userId: uuidSchema.optional(),
  limit: z.coerce.number().int().positive().optional(),
  category: categorySchema.optional(),
  difficulty: difficultySchema.optional(),
});
