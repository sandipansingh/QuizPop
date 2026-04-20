import { asyncHandler } from '../../shared/utils/async-handler.js';
import { sendSuccess } from '../../shared/utils/http-response.js';
import { leaderboardService } from './leaderboard.service.js';

const getLeaderboard = asyncHandler(async (req, res) => {
  const result = await leaderboardService.getLeaderboard(req.validated.query);
  sendSuccess(res, {
    message: 'Leaderboard fetched',
    data: result.data,
    meta: result.meta,
  });
});

export const leaderboardController = {
  getLeaderboard,
};
