import { z } from 'zod';
import { usernameSchema, emailSchema, passwordSchema } from './auth.schemas.js';

export const bioSchema = z
  .string()
  .max(280, 'Bio must be 280 characters or less.')
  .nullable()
  .optional();

export const updateProfileSchema = z.object({
  username: usernameSchema,
  email: emailSchema,
  bio: bioSchema,
});

export const changePasswordSchema = z.object({
  current_password: passwordSchema,
  new_password: passwordSchema,
});
