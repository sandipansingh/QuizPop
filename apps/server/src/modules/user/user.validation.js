import { z } from 'zod';
import {
  passwordSchema,
  usernameSchema,
} from '../../shared/validation/auth.schemas.js';

export const emptySchema = z.object({
  body: z.object({}).optional(),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

export const updateProfileSchema = z.object({
  body: z.object({
    username: usernameSchema,
    email: z.string().email(),
    bio: z.string().max(280).nullable().optional(),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

export const getPublicProfileSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({
    userId: z.string().uuid(),
  }),
  query: z.object({}).optional(),
});

export const getPublicProfileByUsernameSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({
    username: usernameSchema,
  }),
  query: z.object({}).optional(),
});

export const getUserAvatarViewSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({
    userId: z.string().uuid(),
  }),
  query: z.object({}).optional(),
});

export const getAvatarObjectViewSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({}).optional(),
  query: z.object({
    key: z.string().min(10).max(500),
  }),
});

export const changePasswordSchema = z.object({
  body: z.object({
    current_password: passwordSchema,
    new_password: passwordSchema,
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});
