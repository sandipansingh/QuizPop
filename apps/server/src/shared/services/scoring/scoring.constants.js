import { env } from '../../config/env.js';

export const BASE_CORRECT_POINTS = 100;
export const SPEED_BONUS_PER_SECOND = 5;
export const SOLO_QUESTION_TIME_LIMIT_MS = env.SOLO_QUESTION_TIME_LIMIT_MS;
export const ROOM_QUESTION_TIME_LIMIT_MS = env.ROOM_QUESTION_TIME_LIMIT_MS;
export const MIN_GAMES_FOR_LEADERBOARD = env.LEADERBOARD_MIN_GAMES_FOR_RANKING;

export const MIN_RATING_POINTS = 0;
export const SOLO_MAX_GAIN = 35;
export const SOLO_MAX_LOSS = -25;
export const MULTI_MAX_GAIN = 40;
export const MULTI_MAX_LOSS = -25;
export const SCORE_INFLUENCE_CAP_SOLO = 10;
export const SCORE_INFLUENCE_CAP_MULTI = 8;
export const XP_ACCURACY_BONUS_THRESHOLD = 85;

export const rankThresholds = [
  { rank: 'Diamond', min: 1600 },
  { rank: 'Platinum', min: 1400 },
  { rank: 'Gold', min: 1200 },
  { rank: 'Silver', min: 1000 },
  { rank: 'Bronze', min: 0 },
];
