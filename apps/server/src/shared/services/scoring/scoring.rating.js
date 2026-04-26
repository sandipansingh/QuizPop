import {
  SOLO_MAX_GAIN,
  SOLO_MAX_LOSS,
  MULTI_MAX_GAIN,
  MULTI_MAX_LOSS,
  SCORE_INFLUENCE_CAP_SOLO,
  SCORE_INFLUENCE_CAP_MULTI,
} from './scoring.constants.js';
import { clamp, safeMs, applyScoreInfluence } from './scoring.math.js';

export const calculateSoloRating = ({
  score,
  maxPossibleScore,
  accuracyPercentage,
  averageResponseMs,
  questionTimeLimitMs,
  completionRatio,
  difficultyMultiplier,
  easyRepeatMultiplier,
  partialCompletion,
}) => {
  const safeCompletionRatio = clamp(completionRatio, 0, 1);
  const base = Math.round(5 + safeCompletionRatio * 5);
  const accuracyComponent = accuracyPercentage * 0.2;
  const speedFactor =
    questionTimeLimitMs > 0
      ? (questionTimeLimitMs - safeMs(averageResponseMs, questionTimeLimitMs)) /
        questionTimeLimitMs
      : 0;
  const speedBonus = Math.round(clamp(speedFactor, 0, 1) * 12);
  const scoreInfluence = applyScoreInfluence({
    score,
    maxPossibleScore,
    cap: SCORE_INFLUENCE_CAP_SOLO,
    difficultyMultiplier,
    easyRepeatMultiplier,
  });
  const weakAccuracyPenalty = accuracyPercentage < 40 ? 12 : 0;
  const slowPenalty = speedFactor < 0.2 ? 4 : 0;
  const completionPenalty = safeCompletionRatio < 0.75 ? 8 : 0;
  const partialPenalty = partialCompletion ? 5 : 0;
  const rawRating =
    base +
    accuracyComponent +
    speedBonus +
    scoreInfluence -
    weakAccuracyPenalty -
    slowPenalty -
    completionPenalty -
    partialPenalty;
  return clamp(Math.round(rawRating), SOLO_MAX_LOSS, SOLO_MAX_GAIN);
};

const calculateExpectedAgainstRating = (playerRating, opponentRating) =>
  1 / (1 + 10 ** ((opponentRating - playerRating) / 400));

export const calculateMultiplayerRating = ({
  placement,
  placementScore,
  totalPlayers,
  score,
  maxPossibleScore,
  accuracyPercentage,
  completionRatio,
  averageResponseMs,
  questionTimeLimitMs,
  playerRating,
  opponentRatings,
  difficultyMultiplier,
  easyRepeatMultiplier,
  connected,
}) => {
  if (!totalPlayers) return 0;

  if (totalPlayers === 1) {
    const soloLike = calculateSoloRating({
      score,
      maxPossibleScore,
      accuracyPercentage,
      averageResponseMs,
      questionTimeLimitMs,
      completionRatio,
      difficultyMultiplier,
      easyRepeatMultiplier,
      partialCompletion: completionRatio < 1,
    });
    return clamp(soloLike, -8, 18);
  }

  const safePlacementScore = clamp(placementScore, 0, 1);
  let placementBase = 0;
  if (safePlacementScore >= 0.9) {
    const firstPlaceEdge = clamp((accuracyPercentage - 60) / 40, 0, 1);
    placementBase = 25 + Math.round(firstPlaceEdge * 10);
  } else if (safePlacementScore <= 0.1) {
    const bottomPenaltyFactor = clamp((100 - accuracyPercentage) / 100, 0, 1);
    placementBase = -5 - Math.round(bottomPenaltyFactor * 15);
  } else {
    const middleProgress = clamp((safePlacementScore - 0.1) / 0.8, 0, 1);
    placementBase = 5 + Math.round(clamp(middleProgress, 0, 1) * 10);
  }

  const expectedScore =
    opponentRatings.length > 0
      ? opponentRatings.reduce(
          (sum, r) => sum + calculateExpectedAgainstRating(playerRating, r),
          0
        ) / opponentRatings.length
      : 0.5;
  const actualScore =
    totalPlayers > 1
      ? (totalPlayers - placement) / Math.max(1, totalPlayers - 1)
      : 0.5;
  const relativePerformance = Math.round((actualScore - expectedScore) * 8);

  const speedFactor =
    questionTimeLimitMs > 0
      ? (questionTimeLimitMs - safeMs(averageResponseMs, questionTimeLimitMs)) /
        questionTimeLimitMs
      : 0;
  const speedBonus = Math.round(clamp(speedFactor, 0, 1) * 4);
  const scoreInfluence = applyScoreInfluence({
    score,
    maxPossibleScore,
    cap: SCORE_INFLUENCE_CAP_MULTI,
    difficultyMultiplier,
    easyRepeatMultiplier,
  });
  const completionPenalty = completionRatio < 0.75 ? 8 : 0;
  const disconnectPenalty = !connected ? 6 : 0;
  const raw =
    placementBase +
    relativePerformance +
    speedBonus +
    scoreInfluence -
    completionPenalty -
    disconnectPenalty;
  return clamp(Math.round(raw), MULTI_MAX_LOSS, MULTI_MAX_GAIN);
};
