import { z } from 'zod';
import { env } from '../../shared/config/env.js';

export const getLeaderboardSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce
      .number()
      .int()
      .positive()
      .max(env.LEADERBOARD_MAX_PAGE_LIMIT)
      .optional(),
  }),
  body: z.object({}).optional(),
  params: z.object({}).optional(),
});
