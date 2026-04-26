import { randomInt } from 'node:crypto';

export const QUESTION_DIFFICULTIES = ['easy', 'medium', 'hard'];

export const QUESTION_PROFILES = {
  Bronze: {
    weights: { easy: 0.7, medium: 0.3, hard: 0 },
    priority: ['easy', 'medium', 'hard'],
  },
  Silver: {
    weights: { easy: 0.5, medium: 0.5, hard: 0 },
    priority: ['easy', 'medium', 'hard'],
  },
  Gold: {
    weights: { easy: 0, medium: 0.5, hard: 0.5 },
    priority: ['medium', 'hard', 'easy'],
  },
  Platinum: {
    weights: { easy: 0, medium: 0.4, hard: 0.6 },
    priority: ['medium', 'hard', 'easy'],
  },
  Diamond: {
    weights: { easy: 0, medium: 0.2, hard: 0.8 },
    priority: ['hard', 'medium', 'easy'],
  },
};

export const DEFAULT_PROFILE = QUESTION_PROFILES.Silver;

export const getRatingTier = (ratingPoints) => {
  const normalizedRating = Math.max(0, Number(ratingPoints) || 0);
  if (normalizedRating >= 1600) return 'Diamond';
  if (normalizedRating >= 1400) return 'Platinum';
  if (normalizedRating >= 1200) return 'Gold';
  if (normalizedRating >= 1000) return 'Silver';
  return 'Bronze';
};

export const buildQuestionProfile = (ratingPoints) => {
  const tier = getRatingTier(ratingPoints);
  return QUESTION_PROFILES[tier] || DEFAULT_PROFILE;
};

export const allocateDifficultyCounts = (limit, weights) => {
  const requestedLimit = Math.max(0, Math.floor(Number(limit) || 0));
  const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);
  if (!requestedLimit || totalWeight <= 0)
    return { easy: 0, medium: 0, hard: 0 };

  const projected = QUESTION_DIFFICULTIES.map((difficulty) => {
    const exactCount = (requestedLimit * weights[difficulty]) / totalWeight;
    const baseCount = Math.floor(exactCount);
    return { difficulty, count: baseCount, remainder: exactCount - baseCount };
  });

  let remaining =
    requestedLimit - projected.reduce((sum, item) => sum + item.count, 0);
  projected
    .sort((left, right) => right.remainder - left.remainder)
    .forEach((item) => {
      if (remaining <= 0 || weights[item.difficulty] <= 0) return;
      item.count += 1;
      remaining -= 1;
    });

  return projected.reduce(
    (counts, item) => ({ ...counts, [item.difficulty]: item.count }),
    { easy: 0, medium: 0, hard: 0 }
  );
};

export const getDifficultySelectionPlan = (profile, normalizedLimit) => {
  const counts = allocateDifficultyCounts(normalizedLimit, profile.weights);
  return profile.priority.map((difficulty) => ({
    difficulty,
    count: counts[difficulty],
  }));
};

export const shuffleArray = (values = []) => {
  const shuffled = [...values];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = randomInt(index + 1);
    [shuffled[index], shuffled[swapIndex]] = [
      shuffled[swapIndex],
      shuffled[index],
    ];
  }
  return shuffled;
};
