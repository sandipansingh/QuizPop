import { prisma } from '../../db/connection.js';
import { cacheKeys, cacheService } from '../../cache/cache.service.js';

const HISTORY_CACHE_TTL_MS = 30 * 1000;
const historyCache = new Map();

const buildHistoryCacheKey = ({ userIds, lookbackCount }) => {
  const normalizedUserIds = [
    ...new Set((userIds || []).filter(Boolean)),
  ].sort();
  return `${normalizedUserIds.join(',')}::${lookbackCount}`;
};

const readCachedHistory = (cacheKey) => {
  const cached = historyCache.get(cacheKey);
  if (!cached) return null;
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

const dedupePreservingOrder = (values = []) => {
  const result = [];
  const seen = new Set();
  for (const value of values) {
    if (!value || seen.has(value)) continue;
    seen.add(value);
    result.push(value);
  }
  return result;
};

export const getRecentQuestionIdsForUsers = async (userIds, lookbackCount) => {
  const normalizedUserIds = [...new Set((userIds || []).filter(Boolean))];
  if (!normalizedUserIds.length) return [];

  const cacheKey = buildHistoryCacheKey({
    userIds: normalizedUserIds,
    lookbackCount,
  });
  const cached = readCachedHistory(cacheKey);
  if (cached) return cached;

  const recentEntries = await prisma.userQuestionHistory.findMany({
    where: { user_id: { in: normalizedUserIds } },
    orderBy: { seen_at: 'desc' },
    take: lookbackCount,
    select: { question_id: true },
  });

  const questionIds = dedupePreservingOrder(
    recentEntries.map((e) => e.question_id)
  );
  writeCachedHistory(cacheKey, questionIds);
  return questionIds;
};

export const clearHistoryCacheForUsers = (userIds = []) => {
  const normalizedUserIds = [...new Set(userIds.filter(Boolean))];
  if (!normalizedUserIds.length) return;
  for (const cacheKey of historyCache.keys()) {
    const [idsSegment] = cacheKey.split('::');
    if (!idsSegment) continue;
    const keyUserIds = idsSegment.split(',').filter(Boolean);
    if (normalizedUserIds.some((userId) => keyUserIds.includes(userId))) {
      historyCache.delete(cacheKey);
    }
  }
};

export const recordQuestionHistory = async ({
  userIds,
  questions,
  roomId = null,
  mode,
}) => {
  if (!userIds?.length || !questions?.length) return;
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

export const calculateHistoryCoverageRatio = async (userId) => {
  if (!userId) return 0;
  const [totalQuestions, distinctSeenRows] = await Promise.all([
    prisma.question.count(),
    prisma.$queryRaw`
      SELECT COUNT(DISTINCT question_id)::int AS count
      FROM user_question_history
      WHERE user_id = CAST(${userId} AS UUID)
    `,
  ]);
  const distinctSeenCount = Number(distinctSeenRows?.[0]?.count || 0);
  if (!totalQuestions) return 0;
  return distinctSeenCount / totalQuestions;
};
