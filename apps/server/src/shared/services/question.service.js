import { Prisma } from '@prisma/client';
import { randomInt } from 'node:crypto';
import { cacheKeys, cacheService, cacheTtls } from '../cache/cache.service.js';
import { env } from '../config/env.js';
import { prisma } from '../db/connection.js';
import { ApiError } from '../utils/api-error.js';

const QUESTION_HISTORY_LOOKBACK_COUNT = env.QUESTION_HISTORY_LOOKBACK_COUNT;
const QUESTION_DIFFICULTIES = ['easy', 'medium', 'hard'];
const HISTORY_CACHE_TTL_MS = 30 * 1000;
const SOLO_HISTORY_RESET_THRESHOLD = 0.8;

const QUESTION_PROFILES = {
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

const DEFAULT_PROFILE = QUESTION_PROFILES.Silver;
const historyCache = new Map();
const QUESTION_SELECT = {
  id: true,
  question_text: true,
  options: true,
  correct_answer: true,
  difficulty: true,
  category: true,
  tags: true,
};

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const toUuidArraySql = (values = []) =>
  Prisma.sql`ARRAY[${Prisma.join(values)}]::uuid[]`;

const toDifficultyArraySql = (values = []) =>
  Prisma.sql`ARRAY[${Prisma.join(values)}]::"Difficulty"[]`;

const shuffleArray = (values = []) => {
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

const getRatingTier = (ratingPoints) => {
  const normalizedRating = Math.max(0, Number(ratingPoints) || 0);

  if (normalizedRating >= 1600) {
    return 'Diamond';
  }

  if (normalizedRating >= 1400) {
    return 'Platinum';
  }

  if (normalizedRating >= 1200) {
    return 'Gold';
  }

  if (normalizedRating >= 1000) {
    return 'Silver';
  }

  return 'Bronze';
};

const buildQuestionProfile = (ratingPoints) => {
  const tier = getRatingTier(ratingPoints);
  return QUESTION_PROFILES[tier] || DEFAULT_PROFILE;
};

const allocateDifficultyCounts = (limit, weights) => {
  const requestedLimit = Math.max(0, Math.floor(Number(limit) || 0));
  const totalWeight = Object.values(weights).reduce(
    (sum, weight) => sum + weight,
    0
  );

  if (!requestedLimit || totalWeight <= 0) {
    return { easy: 0, medium: 0, hard: 0 };
  }

  const projected = QUESTION_DIFFICULTIES.map((difficulty) => {
    const exactCount = (requestedLimit * weights[difficulty]) / totalWeight;
    const baseCount = Math.floor(exactCount);

    return {
      difficulty,
      count: baseCount,
      remainder: exactCount - baseCount,
    };
  });

  let remaining =
    requestedLimit - projected.reduce((sum, item) => sum + item.count, 0);

  projected
    .sort((left, right) => right.remainder - left.remainder)
    .forEach((item) => {
      if (remaining <= 0 || weights[item.difficulty] <= 0) {
        return;
      }

      item.count += 1;
      remaining -= 1;
    });

  return projected.reduce(
    (counts, item) => ({
      ...counts,
      [item.difficulty]: item.count,
    }),
    { easy: 0, medium: 0, hard: 0 }
  );
};

const buildQuestionQuery = async ({
  limit,
  category,
  difficulties,
  excludedQuestionIds = [],
}) => {
  const normalizedLimit = clamp(Number(limit) || 0, 0, 1000);
  if (!normalizedLimit) {
    return [];
  }

  if (
    !excludedQuestionIds.length &&
    Array.isArray(difficulties) &&
    difficulties.length === 1
  ) {
    const difficulty = difficulties[0];
    const cacheKey = cacheKeys.questionsDifficulty({
      level: difficulty,
      category: category || 'all',
      limit: normalizedLimit,
    });

    const cachedPool = await cacheService.getWithStaleWhileRevalidate({
      key: cacheKey,
      ttlSeconds: cacheTtls.questionPoolSeconds,
      staleTtlSeconds: cacheTtls.questionPoolStaleSeconds,
      loader: () =>
        prisma.question.findMany({
          where: {
            difficulty,
            ...(category ? { category } : {}),
          },
          take: normalizedLimit,
          orderBy: { created_at: 'desc' },
          select: QUESTION_SELECT,
        }),
    });

    return shuffleArray(cachedPool).slice(0, normalizedLimit);
  }

  const difficultyClause = difficulties?.length
    ? Prisma.sql`AND q.difficulty = ANY(${toDifficultyArraySql(difficulties)})`
    : Prisma.empty;
  const categoryClause = category
    ? Prisma.sql`AND q.category = ${category}`
    : Prisma.empty;
  const exclusionClause = excludedQuestionIds?.length
    ? Prisma.sql`AND q.id <> ALL(${toUuidArraySql(excludedQuestionIds)})`
    : Prisma.empty;

  return prisma.$queryRaw`
    SELECT
      q.id,
      q.question_text,
      q.options,
      q.correct_answer,
      q.difficulty,
      q.category,
      q.tags
    FROM questions q
    WHERE 1 = 1
      ${categoryClause}
      ${difficultyClause}
      ${exclusionClause}
    ORDER BY RANDOM()
    LIMIT ${normalizedLimit}
  `;
};

const buildOldestHistoryQuestionQuery = async ({
  userIds,
  limit,
  category,
  difficulties,
  excludedQuestionIds = [],
}) => {
  const normalizedLimit = clamp(Number(limit) || 0, 0, 1000);
  if (!normalizedLimit || !userIds?.length) {
    return [];
  }

  const categoryClause = category
    ? Prisma.sql`AND q.category = ${category}`
    : Prisma.empty;
  const difficultyClause = difficulties?.length
    ? Prisma.sql`AND q.difficulty = ANY(${toDifficultyArraySql(difficulties)})`
    : Prisma.empty;
  const exclusionClause = excludedQuestionIds?.length
    ? Prisma.sql`AND q.id <> ALL(${toUuidArraySql(excludedQuestionIds)})`
    : Prisma.empty;

  return prisma.$queryRaw`
    SELECT
      q.id,
      q.question_text,
      q.options,
      q.correct_answer,
      q.difficulty,
      q.category,
      q.tags,
      MIN(h.seen_at) AS first_seen_at
    FROM user_question_history h
    JOIN questions q ON q.id = h.question_id
    WHERE h.user_id = ANY(${toUuidArraySql(userIds)})
      ${categoryClause}
      ${difficultyClause}
      ${exclusionClause}
    GROUP BY
      q.id,
      q.question_text,
      q.options,
      q.correct_answer,
      q.difficulty,
      q.category,
      q.tags
    ORDER BY MIN(h.seen_at) ASC
    LIMIT ${normalizedLimit}
  `;
};

const normalizeQuestion = (question, { includeCorrectAnswer = false } = {}) => {
  const options = Array.isArray(question.options) ? question.options : [];

  return {
    id: question.id,
    question_text: question.question_text,
    options: shuffleArray(options),
    difficulty: question.difficulty,
    category: question.category,
    tags: Array.isArray(question.tags) ? question.tags : [],
    ...(includeCorrectAnswer
      ? { correct_answer: question.correct_answer }
      : {}),
  };
};

const dedupePreservingOrder = (values = []) => {
  const result = [];
  const seen = new Set();

  for (const value of values) {
    if (!value || seen.has(value)) {
      continue;
    }

    seen.add(value);
    result.push(value);
  }

  return result;
};

const buildHistoryCacheKey = ({ userIds, lookbackCount }) => {
  const normalizedUserIds = [
    ...new Set((userIds || []).filter(Boolean)),
  ].sort();
  return `${normalizedUserIds.join(',')}::${lookbackCount}`;
};

const readCachedHistory = (cacheKey) => {
  const cached = historyCache.get(cacheKey);
  if (!cached) {
    return null;
  }

  if (cached.expiresAt <= Date.now()) {
    historyCache.delete(cacheKey);
    return null;
  }

  return cached.questionIds;
};

const writeCachedHistory = (cacheKey, questionIds) => {
  historyCache.set(cacheKey, {
    questionIds,
    expiresAt: Date.now() + HISTORY_CACHE_TTL_MS,
  });
};

const getRecentQuestionIdsForUsers = async (userIds, lookbackCount) => {
  const normalizedUserIds = [...new Set((userIds || []).filter(Boolean))];
  if (!normalizedUserIds.length) {
    return [];
  }

  const cacheKey = buildHistoryCacheKey({
    userIds: normalizedUserIds,
    lookbackCount,
  });
  const cached = readCachedHistory(cacheKey);
  if (cached) {
    return cached;
  }

  const recentEntries = await prisma.userQuestionHistory.findMany({
    where: {
      user_id: {
        in: normalizedUserIds,
      },
    },
    orderBy: { seen_at: 'desc' },
    take: lookbackCount,
    select: { question_id: true },
  });

  const questionIds = dedupePreservingOrder(
    recentEntries.map((entry) => entry.question_id)
  );

  writeCachedHistory(cacheKey, questionIds);
  return questionIds;
};

const clearHistoryCacheForUsers = (userIds = []) => {
  const normalizedUserIds = [...new Set(userIds.filter(Boolean))];
  if (!normalizedUserIds.length) {
    return;
  }

  for (const cacheKey of historyCache.keys()) {
    const [idsSegment] = cacheKey.split('::');
    if (!idsSegment) {
      continue;
    }

    const keyUserIds = idsSegment.split(',').filter(Boolean);
    const intersects = normalizedUserIds.some((userId) =>
      keyUserIds.includes(userId)
    );

    if (intersects) {
      historyCache.delete(cacheKey);
    }
  }
};

const recordQuestionHistory = async ({
  userIds,
  questions,
  roomId = null,
  mode,
}) => {
  if (!userIds?.length || !questions?.length) {
    return;
  }

  await prisma.userQuestionHistory.createMany({
    data: userIds.flatMap((userId) =>
      questions.map((question) => ({
        user_id: userId,
        question_id: question.id,
        room_id: roomId,
        mode,
      }))
    ),
  });

  await Promise.all(
    userIds.map((userId) => cacheService.del(cacheKeys.questionsUser(userId)))
  );

  clearHistoryCacheForUsers(userIds);
};

const calculateHistoryCoverageRatio = async (userId) => {
  if (!userId) {
    return 0;
  }

  const [totalQuestions, distinctSeenRows] = await Promise.all([
    prisma.question.count(),
    prisma.$queryRaw`
      SELECT COUNT(DISTINCT question_id)::int AS count
      FROM user_question_history
      WHERE user_id = CAST(${userId} AS UUID)
    `,
  ]);

  const distinctSeenCount = Number(distinctSeenRows?.[0]?.count || 0);
  if (!totalQuestions) {
    return 0;
  }

  return distinctSeenCount / totalQuestions;
};

const getDifficultySelectionPlan = (profile, normalizedLimit) => {
  const counts = allocateDifficultyCounts(normalizedLimit, profile.weights);

  return profile.priority.map((difficulty) => ({
    difficulty,
    count: counts[difficulty],
  }));
};

const selectAdaptiveQuestions = async ({
  ratingPoints,
  limit,
  category,
  excludedQuestionIds = [],
  historyUserIds = [],
  includeCorrectAnswer = false,
}) => {
  const normalizedLimit = Math.max(0, Math.floor(Number(limit) || 0));
  if (!normalizedLimit) {
    return [];
  }

  const profile = buildQuestionProfile(ratingPoints);
  const selectionPlan = getDifficultySelectionPlan(profile, normalizedLimit);
  const selectedQuestions = [];
  const historyExcludedIds = [...new Set(excludedQuestionIds.filter(Boolean))];
  const historyUserIdsSafe = [...new Set(historyUserIds.filter(Boolean))];

  const pushUniqueQuestions = (questionRows = []) => {
    const selectedIds = new Set(
      selectedQuestions.map((question) => question.id)
    );

    for (const question of questionRows) {
      if (selectedIds.has(question.id)) {
        continue;
      }

      selectedQuestions.push(
        normalizeQuestion(question, { includeCorrectAnswer })
      );
      selectedIds.add(question.id);

      if (selectedQuestions.length >= normalizedLimit) {
        break;
      }
    }
  };

  const runStrictPass = async () => {
    for (const planItem of selectionPlan) {
      if (selectedQuestions.length >= normalizedLimit) {
        break;
      }

      const questionRows = await buildQuestionQuery({
        limit: planItem.count,
        category,
        difficulties: [planItem.difficulty],
        excludedQuestionIds: [
          ...historyExcludedIds,
          ...selectedQuestions.map((question) => question.id),
        ],
      });

      pushUniqueQuestions(questionRows);
    }
  };

  const runRelaxedPass = async () => {
    if (
      !historyUserIdsSafe.length ||
      selectedQuestions.length >= normalizedLimit
    ) {
      return;
    }

    for (const planItem of selectionPlan) {
      if (selectedQuestions.length >= normalizedLimit) {
        break;
      }

      const questionRows = await buildOldestHistoryQuestionQuery({
        userIds: historyUserIdsSafe,
        limit: Math.max(
          planItem.count,
          normalizedLimit - selectedQuestions.length
        ),
        category,
        difficulties: [planItem.difficulty],
        excludedQuestionIds: selectedQuestions.map((question) => question.id),
      });

      pushUniqueQuestions(questionRows);
    }
  };

  const runFallbackPass = async () => {
    if (selectedQuestions.length >= normalizedLimit) {
      return;
    }

    const questionRows = await buildQuestionQuery({
      limit: normalizedLimit - selectedQuestions.length,
      category,
      difficulties: QUESTION_DIFFICULTIES,
      excludedQuestionIds: selectedQuestions.map((question) => question.id),
    });

    pushUniqueQuestions(questionRows);
  };

  await runStrictPass();
  await runRelaxedPass();
  await runFallbackPass();

  return selectedQuestions.slice(0, normalizedLimit);
};

const getUserRatingPoints = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, rating_points: true },
  });

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  return user.rating_points;
};

const getHighestRatingPoints = (players = []) => {
  const ratings = players
    .map((player) =>
      Number(player?.user?.rating_points ?? player?.rating_points ?? 1000)
    )
    .filter((rating) => Number.isFinite(rating));

  if (!ratings.length) {
    return 1000;
  }

  return Math.max(...ratings);
};

export const questionService = {
  invalidateQuestionCaches: async () => {
    await cacheService.invalidatePattern('questions:*');
  },

  getQuestionsForUser: async (
    userId,
    { limit = env.QUIZ_DEFAULT_QUESTION_LIMIT, category } = {}
  ) => {
    const ratingPoints = await getUserRatingPoints(userId);
    const [recentQuestionIds, historyCoverageRatio] = await Promise.all([
      getRecentQuestionIdsForUsers([userId], QUESTION_HISTORY_LOOKBACK_COUNT),
      calculateHistoryCoverageRatio(userId),
    ]);

    const shouldResetCycle =
      historyCoverageRatio >= SOLO_HISTORY_RESET_THRESHOLD;

    const questions = await selectAdaptiveQuestions({
      ratingPoints,
      limit,
      category,
      excludedQuestionIds: shouldResetCycle ? [] : recentQuestionIds,
      historyUserIds: [userId],
      includeCorrectAnswer: false,
    });

    if (!questions.length) {
      throw new ApiError(
        404,
        'No questions available for the requested criteria'
      );
    }

    await recordQuestionHistory({
      userIds: [userId],
      questions,
      mode: 'solo',
    });

    return questions;
  },

  getQuestionsForRoom: async (
    players,
    { limit = env.ROOM_QUESTION_COUNT, category, roomId = null } = {}
  ) => {
    if (!Array.isArray(players) || !players.length) {
      throw new ApiError(
        400,
        'At least one player is required to build room questions'
      );
    }

    const userIds = players
      .map((player) => player?.user?.id || player?.user_id)
      .filter(Boolean);

    const [recentQuestionIds, ratingPoints] = await Promise.all([
      getRecentQuestionIdsForUsers(userIds, QUESTION_HISTORY_LOOKBACK_COUNT),
      Promise.resolve(getHighestRatingPoints(players)),
    ]);

    const questions = await selectAdaptiveQuestions({
      ratingPoints,
      limit,
      category,
      excludedQuestionIds: recentQuestionIds,
      historyUserIds: userIds,
      includeCorrectAnswer: true,
    });

    if (!questions.length) {
      throw new ApiError(404, 'No questions available for this room');
    }

    await recordQuestionHistory({
      userIds,
      questions,
      roomId,
      mode: 'room',
    });

    return questions;
  },
};
