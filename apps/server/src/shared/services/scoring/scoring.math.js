import {
  BASE_CORRECT_POINTS,
  SPEED_BONUS_PER_SECOND,
  rankThresholds,
} from './scoring.constants.js';

export const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
export const round2 = (value) => Number(value.toFixed(2));
export const safeMs = (value, maxMs) =>
  clamp(Number.isFinite(Number(value)) ? Number(value) : 0, 0, maxMs);

export const getRankForRating = (ratingPoints) => {
  const normalizedRating = Math.max(0, Number(ratingPoints) || 0);
  const matchedTier = rankThresholds.find(
    (tier) => normalizedRating >= tier.min
  );
  return matchedTier?.rank || 'Bronze';
};

export const applyScoreInfluence = ({
  score,
  maxPossibleScore,
  cap,
  difficultyMultiplier = 1,
  easyRepeatMultiplier = 1,
}) => {
  if (!maxPossibleScore || maxPossibleScore <= 0 || cap <= 0) return 0;
  const normalizedScore = clamp(score / maxPossibleScore, 0, 1);
  const weightedScore = clamp(normalizedScore * difficultyMultiplier, 0, 1.2);
  const influencedScore = weightedScore * cap * easyRepeatMultiplier;
  return Math.round(Math.min(cap, influencedScore));
};

export const getMaxPossibleScore = ({
  totalQuestions,
  questionTimeLimitMs,
}) => {
  const perQuestionMax =
    BASE_CORRECT_POINTS +
    Math.round((questionTimeLimitMs / 1000) * SPEED_BONUS_PER_SECOND);
  return totalQuestions * perQuestionMax + 350;
};

export {
  calculateAnswerScore,
  calculateScore,
  calculateXpEarned,
} from './scoring.score.js';
