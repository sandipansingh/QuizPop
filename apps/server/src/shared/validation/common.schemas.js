import { z } from 'zod';

export const uuidSchema = z.string().uuid('Invalid ID format.');

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
});

export const difficultySchema = z.enum(['easy', 'medium', 'hard'], {
  errorMap: () => ({ message: 'Difficulty must be easy, medium, or hard.' }),
});

export const categorySchema = z
  .string()
  .min(1, 'Category cannot be empty.')
  .max(100, 'Category is too long.');

export const roomIdSchema = z.string().min(1, 'Room ID is required.');
