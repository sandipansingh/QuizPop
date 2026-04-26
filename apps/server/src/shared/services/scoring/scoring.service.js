export {
  BASE_CORRECT_POINTS,
  SPEED_BONUS_PER_SECOND,
  SOLO_QUESTION_TIME_LIMIT_MS,
  ROOM_QUESTION_TIME_LIMIT_MS,
  MIN_GAMES_FOR_LEADERBOARD,
} from './scoring.constants.js';

export {
  getRankForRating,
  calculateAnswerScore,
  calculateScore,
  applyScoreInfluence,
} from './scoring.math.js';

export { calculateSoloRating } from './scoring.rating.js';
export { calculateMultiplayerRating } from './scoring.rating.js';
export { updateUserRanking } from './scoring.persist.js';
export { updateUserStats } from './scoring.solo.js';
export { updateMultipleUsersRanking } from './scoring.multi.js';

import {
  getRankForRating,
  calculateAnswerScore,
  calculateScore,
  applyScoreInfluence,
} from './scoring.math.js';
import {
  calculateSoloRating,
  calculateMultiplayerRating,
} from './scoring.rating.js';
import { updateUserRanking } from './scoring.persist.js';
import { updateUserStats } from './scoring.solo.js';
import { updateMultipleUsersRanking } from './scoring.multi.js';

export const scoringService = {
  calculateAnswerScore,
  calculateScore,
  calculateSoloRating,
  calculateMultiplayerRating,
  applyScoreInfluence,
  getRankForRating,
  updateUserRanking,
  updateUserStats,
  updateMultipleUsersRanking,
  updateMultipleUsers: (payload) => updateMultipleUsersRanking(payload),
};
