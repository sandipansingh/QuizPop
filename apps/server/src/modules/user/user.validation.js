import { z } from 'zod';
import {
  usernameSchema,
  emailSchema,
} from '../../shared/validation/auth.schemas.js';
import {
  bioSchema,
  changePasswordSchema as changePasswordBodySchema,
} from '../../shared/validation/user.schemas.js';

export const emptySchema = z.object({
  body: z.object({}).optional(),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

export const updateProfileSchema = z.object({
  body: z.object({
    username: usernameSchema,
    email: emailSchema,
    bio: bioSchema,
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
  body: changePasswordBodySchema,
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});
