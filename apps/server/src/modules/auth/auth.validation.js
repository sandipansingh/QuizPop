import { z } from 'zod';
import {
  passwordSchema,
  refreshTokenBodySchema,
  usernameSchema,
} from '../../shared/validation/auth.schemas.js';

export const registerSchema = z.object({
  body: z.object({
    username: usernameSchema,
    email: z.string().email(),
    password: passwordSchema,
    avatar_url: z.string().url().optional(),
    bio: z.string().max(280).optional(),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: passwordSchema,
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

export const refreshTokenSchema = z.object({
  body: refreshTokenBodySchema,
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

export const logoutSchema = z.object({
  body: refreshTokenBodySchema,
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});
