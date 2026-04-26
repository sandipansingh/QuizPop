import { z } from 'zod';
import { usernameSchema, emailSchema, passwordSchema } from './auth.schemas';

export const updateProfileSchema = z.object({
  username: usernameSchema,
  email: emailSchema,
  bio: z.string().max(280, 'Bio must be 280 characters or less.').optional(),
});

export const changePasswordSchema = z
  .object({
    currentPassword: passwordSchema,
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your new password.'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'New password and confirmation must match.',
    path: ['confirmPassword'],
  });

export type UpdateProfileFormData = z.infer<typeof updateProfileSchema>;
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;
