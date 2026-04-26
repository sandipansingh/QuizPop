import { z } from 'zod';

export const usernameSchema = z
  .string()
  .min(3, 'Username must be at least 3 characters.')
  .max(30, 'Username must be 30 characters or less.')
  .regex(
    /^[a-zA-Z0-9_]+$/,
    'Username can only contain letters, numbers, and underscores.'
  );

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters.')
  .max(128, 'Password is too long.');

export const emailSchema = z.string().email('Enter a valid email address.');

export const refreshTokenBodySchema = z.object({
  refresh_token: z.string().min(20).optional(),
  refreshToken: z.string().min(20).optional(),
});
