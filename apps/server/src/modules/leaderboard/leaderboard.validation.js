import { z } from 'zod';
import { env } from '../../shared/config/env.js';
import { getLeaderboardQuerySchema } from '../../shared/validation/leaderboard.schemas.js';

export const getLeaderboardSchema = z.object({
  query: getLeaderboardQuerySchema.extend({
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
