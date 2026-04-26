import { Prisma } from '@prisma/client';
import {
  cacheKeys,
  cacheService,
  cacheTtls,
} from '../../cache/cache.service.js';
import { prisma } from '../../db/connection.js';
import { shuffleArray } from './question.profiles.js';

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

export const buildQuestionQuery = async ({
  limit,
  category,
  difficulties,
  excludedQuestionIds = [],
}) => {
  const normalizedLimit = clamp(Number(limit) || 0, 0, 1000);
  if (!normalizedLimit) return [];

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
          where: { difficulty, ...(category ? { category } : {}) },
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
    SELECT q.id, q.question_text, q.options, q.correct_answer, q.difficulty, q.category, q.tags
    FROM questions q
    WHERE 1 = 1 ${categoryClause} ${difficultyClause} ${exclusionClause}
    ORDER BY RANDOM() LIMIT ${normalizedLimit}
  `;
};

export const buildOldestHistoryQuestionQuery = async ({
  userIds,
  limit,
  category,
  difficulties,
  excludedQuestionIds = [],
}) => {
  const normalizedLimit = clamp(Number(limit) || 0, 0, 1000);
  if (!normalizedLimit || !userIds?.length) return [];

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
    SELECT q.id, q.question_text, q.options, q.correct_answer, q.difficulty, q.category, q.tags, MIN(h.seen_at) AS first_seen_at
    FROM user_question_history h
    JOIN questions q ON q.id = h.question_id
    WHERE h.user_id = ANY(${toUuidArraySql(userIds)}) ${categoryClause} ${difficultyClause} ${exclusionClause}
    GROUP BY q.id, q.question_text, q.options, q.correct_answer, q.difficulty, q.category, q.tags
    ORDER BY MIN(h.seen_at) ASC LIMIT ${normalizedLimit}
  `;
};
