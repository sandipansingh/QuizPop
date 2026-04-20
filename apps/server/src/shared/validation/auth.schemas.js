import { z } from 'zod';

export const usernameSchema = z
  .string()
  .min(3)
  .max(30)
  .regex(
    /^[a-zA-Z0-9_]+$/,
    'Username can contain letters, numbers and underscore only'
  );

export const passwordSchema = z.string().min(8).max(128);

export const refreshTokenBodySchema = z.object({
  refresh_token: z.string().min(20).optional(),
  refreshToken: z.string().min(20).optional(),
});
