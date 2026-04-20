import { ActivityType } from '@prisma/client';
import { refreshLeaderboard } from '../../modules/leaderboard/leaderboard.service.js';
import { cacheKeys, cacheService } from '../cache/cache.service.js';
import { env } from '../config/env.js';
import { prisma } from '../db/connection.js';
import { ApiError } from '../utils/api-error.js';
import { calculateStreakUpdate } from '../utils/streak.js';

export const BASE_CORRECT_POINTS = 100;
export const SPEED_BONUS_PER_SECOND = 5;
export const SOLO_QUESTION_TIME_LIMIT_MS = env.SOLO_QUESTION_TIME_LIMIT_MS;
export const ROOM_QUESTION_TIME_LIMIT_MS = env.ROOM_QUESTION_TIME_LIMIT_MS;
export const MIN_GAMES_FOR_LEADERBOARD = env.LEADERBOARD_MIN_GAMES_FOR_RANKING;

const MIN_RATING_POINTS = 0;
const SOLO_MAX_GAIN = 35;
const SOLO_MAX_LOSS = -25;
const MULTI_MAX_GAIN = 40;
const MULTI_MAX_LOSS = -25;
const SCORE_INFLUENCE_CAP_SOLO = 10;
const SCORE_INFLUENCE_CAP_MULTI = 8;
const XP_ACCURACY_BONUS_THRESHOLD = 85;

const rankThresholds = [
  { rank: 'Diamond', min: 1600 },
  { rank: 'Platinum', min: 1400 },
  { rank: 'Gold', min: 1200 },
  { rank: 'Silver', min: 1000 },
  { rank: 'Bronze', min: 0 },
];

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const round2 = (value) => Number(value.toFixed(2));

const safeMs = (value, maxMs) =>
  clamp(Number.isFinite(Number(value)) ? Number(value) : 0, 0, maxMs);

const toFinishSortValue = (finishTime) => {
  if (!finishTime) {
    return Number.MAX_SAFE_INTEGER;
  }

  return new Date(finishTime).getTime();
};

const getDifficultyWeight = (difficulty) => {
  switch (difficulty) {
    case 'hard':
      return 1.15;
    case 'medium':
      return 1;
    case 'easy':
    default:
      return 0.85;
  }
};

const calculateDifficultyMultiplier = (questions) => {
  if (!questions?.length) {
    return 1;
  }

  const total = questions.reduce(
    (sum, question) => sum + getDifficultyWeight(question.difficulty),
    0
  );

  return clamp(total / questions.length, 0.8, 1.2);
};

const calculateEasyQuestionRatio = (questions) => {
  if (!questions?.length) {
    return 0;
  }

  const easyCount = questions.filter(
    (question) => question.difficulty === 'easy'
  ).length;

  return easyCount / questions.length;
};

const calculateEasyRepeatMultiplier = ({
  easyQuestionRatio,
  recentEasyStreak,
}) => {
  if (easyQuestionRatio < 0.7) {
    return 1;
  }

  if (recentEasyStreak <= 0) {
    return 0.9;
  }

  const reduced = 0.9 - recentEasyStreak * 0.1;
  return clamp(reduced, 0.45, 0.9);
};

const invalidateScoreRelatedCaches = async (userIds = []) => {
  const normalizedUserIds = [...new Set(userIds.filter(Boolean))];

  await Promise.all([
    cacheService.invalidatePattern('leaderboard:*'),
    ...normalizedUserIds.map((userId) =>
      cacheService.invalidatePattern(`${cacheKeys.user(userId)}*`)
    ),
  ]);
};

const calculateAccuracyScoreBonus = ({
  accuracyPercentage,
  totalQuestions,
}) => {
  if (!totalQuestions || accuracyPercentage < 60) {
    return 0;
  }

  if (accuracyPercentage >= 100) {
    return 350;
  }

  if (accuracyPercentage >= 90) {
    return 220;
  }

  if (accuracyPercentage >= 80) {
    return 130;
  }

  if (accuracyPercentage >= 70) {
    return 70;
  }

  return 30;
};

export const getRankForRating = (ratingPoints) => {
  const normalizedRating = Math.max(0, Number(ratingPoints) || 0);
  const matchedTier = rankThresholds.find(
    (tier) => normalizedRating >= tier.min
  );
  return matchedTier?.rank || 'Bronze';
};

export const calculateAnswerScore = ({
  isCorrect,
  timeTakenMs,
  questionTimeLimitMs = SOLO_QUESTION_TIME_LIMIT_MS,
}) => {
  if (!isCorrect) {
    return 0;
  }

  const boundedTime = safeMs(timeTakenMs, questionTimeLimitMs);
  const remainingMs = Math.max(0, questionTimeLimitMs - boundedTime);
  const speedBonus = Math.round((remainingMs / 1000) * SPEED_BONUS_PER_SECOND);
  return BASE_CORRECT_POINTS + speedBonus;
};

const calculateStreakBonus = ({ isCorrect, nextStreak }) => {
  if (!isCorrect || nextStreak < 3) {
    return 0;
  }

  return Math.min(120, (nextStreak - 2) * 10);
};

const calculateXpEarned = ({
  correctAnswers,
  totalQuestions,
  avgResponseMs,
  questionTimeLimitMs,
  accuracyPercentage,
}) => {
  const completionXp = totalQuestions * 5;
  const correctnessXp = correctAnswers * 15;

  const boundedAverage = safeMs(avgResponseMs, questionTimeLimitMs);
  const speedFactor =
    questionTimeLimitMs > 0
      ? (questionTimeLimitMs - boundedAverage) / questionTimeLimitMs
      : 0;
  const speedXp = Math.max(0, Math.round(speedFactor * 20));
  const accuracyXp =
    accuracyPercentage >= XP_ACCURACY_BONUS_THRESHOLD
      ? Math.round((accuracyPercentage - XP_ACCURACY_BONUS_THRESHOLD) * 1.5)
      : 0;

  return completionXp + correctnessXp + speedXp + accuracyXp;
};

const calculateExpectedAgainstRating = (playerRating, opponentRating) =>
  1 / (1 + 10 ** ((opponentRating - playerRating) / 400));

const calculatePlacementScores = (rankedPlayers) => {
  const totalPlayers = rankedPlayers.length;
  const placementScoreByUserId = new Map();

  if (!totalPlayers) {
    return placementScoreByUserId;
  }

  if (totalPlayers === 1) {
    placementScoreByUserId.set(rankedPlayers[0].user_id, 0.5);
    return placementScoreByUserId;
  }

  let index = 0;
  while (index < totalPlayers) {
    const current = rankedPlayers[index];
    let tieEnd = index;

    while (tieEnd + 1 < totalPlayers) {
      const candidate = rankedPlayers[tieEnd + 1];
      const isTie =
        candidate.score === current.score &&
        toFinishSortValue(candidate.finish_time) ===
          toFinishSortValue(current.finish_time);

      if (!isTie) {
        break;
      }

      tieEnd += 1;
    }

    const averagePlacement = (index + 1 + (tieEnd + 1)) / 2;
    const placementScore =
      (totalPlayers - averagePlacement) / Math.max(1, totalPlayers - 1);

    for (let i = index; i <= tieEnd; i += 1) {
      placementScoreByUserId.set(rankedPlayers[i].user_id, placementScore);
    }

    index = tieEnd + 1;
  }

  return placementScoreByUserId;
};

const aggregateCategoryStats = (answers) => {
  const categoryStatsMap = new Map();

  answers.forEach((answer) => {
    if (!answer.category) {
      return;
    }

    const current = categoryStatsMap.get(answer.category) || {
      category: answer.category,
      total_attempts: 0,
      correct_answers: 0,
      wrong_answers: 0,
    };

    current.total_attempts += 1;
    if (answer.is_correct) {
      current.correct_answers += 1;
    } else {
      current.wrong_answers += 1;
    }

    categoryStatsMap.set(answer.category, current);
  });

  return Array.from(categoryStatsMap.values());
};

export const calculateScore = ({
  answers,
  totalQuestions,
  questionTimeLimitMs,
  applyStreakBonus,
}) => {
  let score = 0;
  let correctAnswers = 0;
  let wrongAnswers = 0;
  let totalTimeTaken = 0;
  let streak = 0;

  const normalizedAnswers = answers.map((answer) => {
    const timeTaken = safeMs(answer.time_taken, questionTimeLimitMs);
    const isCorrect = Boolean(answer.is_correct);

    if (isCorrect) {
      correctAnswers += 1;
      streak += 1;
    } else {
      wrongAnswers += 1;
      streak = 0;
    }

    const basePoints = calculateAnswerScore({
      isCorrect,
      timeTakenMs: timeTaken,
      questionTimeLimitMs,
    });
    const streakBonus = applyStreakBonus
      ? calculateStreakBonus({ isCorrect, nextStreak: streak })
      : 0;
    const points = basePoints + streakBonus;

    score += points;
    totalTimeTaken += timeTaken;

    return {
      question_id: answer.question_id,
      category: answer.category,
      difficulty: answer.difficulty,
      selected_answer: answer.selected_answer,
      is_correct: isCorrect,
      time_taken: timeTaken,
      points,
      streak_bonus: streakBonus,
    };
  });

  const unansweredCount = Math.max(
    0,
    totalQuestions - normalizedAnswers.length
  );
  if (unansweredCount > 0) {
    wrongAnswers += unansweredCount;
    totalTimeTaken += unansweredCount * questionTimeLimitMs;
  }

  const denominator = Math.max(1, totalQuestions);
  const accuracyPercentage = round2((correctAnswers / denominator) * 100);
  const averageResponseMs = Math.round(totalTimeTaken / denominator);
  const accuracyBonus = calculateAccuracyScoreBonus({
    accuracyPercentage,
    totalQuestions,
  });

  return {
    score: score + accuracyBonus,
    raw_score: score,
    accuracy_bonus: accuracyBonus,
    correct_answers: correctAnswers,
    wrong_answers: wrongAnswers,
    total_questions: totalQuestions,
    time_taken: totalTimeTaken,
    average_response: averageResponseMs,
    completion_ratio: totalQuestions
      ? normalizedAnswers.length / totalQuestions
      : 0,
    accuracy_percentage: accuracyPercentage,
    answers: normalizedAnswers,
    category_stats: aggregateCategoryStats(normalizedAnswers),
  };
};

export const applyScoreInfluence = ({
  score,
  maxPossibleScore,
  cap,
  difficultyMultiplier = 1,
  easyRepeatMultiplier = 1,
}) => {
  if (!maxPossibleScore || maxPossibleScore <= 0 || cap <= 0) {
    return 0;
  }

  const normalizedScore = clamp(score / maxPossibleScore, 0, 1);
  const weightedScore = clamp(normalizedScore * difficultyMultiplier, 0, 1.2);
  const influencedScore = weightedScore * cap * easyRepeatMultiplier;

  return Math.round(Math.min(cap, influencedScore));
};

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
  if (!totalPlayers) {
    return 0;
  }

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
          (sum, opponentRating) =>
            sum + calculateExpectedAgainstRating(playerRating, opponentRating),
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

const upsertCategoryStats = async ({ tx, userId, categoryStats }) => {
  await Promise.all(
    categoryStats.map(async (stats) => {
      const existing = await tx.userCategoryPerformance.findUnique({
        where: {
          user_id_category: {
            user_id: userId,
            category: stats.category,
          },
        },
        select: {
          total_attempts: true,
          correct_answers: true,
          wrong_answers: true,
        },
      });

      const nextTotalAttempts =
        (existing?.total_attempts || 0) + stats.total_attempts;
      const nextCorrect =
        (existing?.correct_answers || 0) + stats.correct_answers;
      const nextWrong = (existing?.wrong_answers || 0) + stats.wrong_answers;
      const nextAccuracy = round2(
        (nextCorrect / Math.max(1, nextTotalAttempts)) * 100
      );

      await tx.userCategoryPerformance.upsert({
        where: {
          user_id_category: {
            user_id: userId,
            category: stats.category,
          },
        },
        create: {
          user_id: userId,
          category: stats.category,
          total_attempts: nextTotalAttempts,
          correct_answers: nextCorrect,
          wrong_answers: nextWrong,
          accuracy: nextAccuracy,
        },
        update: {
          total_attempts: nextTotalAttempts,
          correct_answers: nextCorrect,
          wrong_answers: nextWrong,
          accuracy: nextAccuracy,
        },
      });
    })
  );
};

const calculateNextAverages = ({
  previousCorrect,
  previousWrong,
  previousAverage,
  attemptAverage,
  attemptQuestions,
  nextTotalAnswers,
}) => {
  const previousAnswered = Math.max(0, previousCorrect + previousWrong);
  const weightedTotal =
    previousAverage * previousAnswered + attemptAverage * attemptQuestions;
  return round2(weightedTotal / Math.max(1, nextTotalAnswers));
};

const buildUserUpdatePayload = ({
  user,
  attemptMetrics,
  ratingDelta,
  xpEarned,
}) => {
  const nextRatingPoints = Math.max(
    MIN_RATING_POINTS,
    user.rating_points + ratingDelta
  );
  const nextRank = getRankForRating(nextRatingPoints);

  const nextTotalCorrect =
    user.total_correct_answers + attemptMetrics.correct_answers;
  const nextTotalWrong =
    user.total_wrong_answers + attemptMetrics.wrong_answers;
  const nextTotalAnswers = nextTotalCorrect + nextTotalWrong;
  const nextAccuracy = round2(
    (nextTotalCorrect / Math.max(1, nextTotalAnswers)) * 100
  );

  const previousAvgTime = Number(user.average_time_per_question || 0);
  const nextAvgTime = calculateNextAverages({
    previousCorrect: user.total_correct_answers,
    previousWrong: user.total_wrong_answers,
    previousAverage: previousAvgTime,
    attemptAverage: attemptMetrics.average_response,
    attemptQuestions: attemptMetrics.total_questions,
    nextTotalAnswers,
  });

  const streakUpdate = calculateStreakUpdate({
    lastStreakDate: user.last_streak_date,
    currentStreak: user.current_streak,
    longestStreak: user.longest_streak,
  });

  const nextXpPoints = user.xp_points + xpEarned;
  const nextLevel = Math.max(1, Math.floor(nextXpPoints / 500) + 1);

  return {
    data: {
      total_score: { increment: attemptMetrics.score },
      total_quizzes_played: { increment: 1 },
      total_correct_answers: { increment: attemptMetrics.correct_answers },
      total_wrong_answers: { increment: attemptMetrics.wrong_answers },
      accuracy_percentage: nextAccuracy,
      average_time_per_question: nextAvgTime,
      rank: nextRank,
      rating_points: nextRatingPoints,
      xp_points: nextXpPoints,
      level: nextLevel,
      current_streak: streakUpdate.currentStreak,
      longest_streak: streakUpdate.longestStreak,
      last_streak_date: new Date(),
      last_active_at: new Date(),
    },
    summary: {
      rating_points: nextRatingPoints,
      rank: nextRank,
      accuracy_percentage: nextAccuracy,
      average_time_per_question: nextAvgTime,
      xp_points: nextXpPoints,
      level: nextLevel,
      current_streak: streakUpdate.currentStreak,
      longest_streak: streakUpdate.longestStreak,
    },
  };
};

const persistAttemptForUser = async ({
  tx,
  user,
  userId,
  roomId,
  mode,
  resultTag,
  attemptMetrics,
  ratingDelta,
  xpEarned,
}) => {
  const { data: userUpdateData, summary } = buildUserUpdatePayload({
    user,
    attemptMetrics,
    ratingDelta,
    xpEarned,
  });

  const attempt = await tx.quizAttempt.create({
    data: {
      user_id: userId,
      room_id: roomId || null,
      score: attemptMetrics.score,
      total_questions: attemptMetrics.total_questions,
      correct_answers: attemptMetrics.correct_answers,
      wrong_answers: attemptMetrics.wrong_answers,
      time_taken: attemptMetrics.time_taken,
      rating_change: ratingDelta,
      xp_earned: xpEarned,
      average_response: attemptMetrics.average_response,
    },
  });

  if (attemptMetrics.answers.length) {
    await tx.answer.createMany({
      data: attemptMetrics.answers.map((answer) => ({
        attempt_id: attempt.id,
        question_id: answer.question_id,
        selected_answer: answer.selected_answer,
        is_correct: answer.is_correct,
        time_taken: answer.time_taken,
      })),
    });
  }

  await tx.user.update({
    where: { id: userId },
    data: userUpdateData,
  });

  if (attemptMetrics.category_stats.length) {
    await upsertCategoryStats({
      tx,
      userId,
      categoryStats: attemptMetrics.category_stats,
    });
  }

  await tx.activityLog.create({
    data: {
      user_id: userId,
      type: ActivityType.QUIZ_PLAYED,
      description: `Completed ${mode} quiz with score ${attemptMetrics.score}`,
      metadata: {
        attempt_id: attempt.id,
        mode,
        correct_answers: attemptMetrics.correct_answers,
        total_questions: attemptMetrics.total_questions,
        rating_change: ratingDelta,
        xp_earned: xpEarned,
      },
    },
  });

  await tx.matchHistory.create({
    data: {
      user_id: userId,
      room_id: roomId || null,
      score: attemptMetrics.score,
      result: resultTag,
    },
  });

  return {
    user_id: userId,
    attempt_id: attempt.id,
    score: attemptMetrics.score,
    total_questions: attemptMetrics.total_questions,
    correct_answers: attemptMetrics.correct_answers,
    wrong_answers: attemptMetrics.wrong_answers,
    average_response: attemptMetrics.average_response,
    rating_change: ratingDelta,
    xp_earned: xpEarned,
    updated_profile: summary,
  };
};

const getRecentEasyQuizStreak = async (userId) => {
  const recentAttempts = await prisma.quizAttempt.findMany({
    where: { user_id: userId },
    take: 5,
    orderBy: { created_at: 'desc' },
    include: {
      answers: {
        select: {
          question: {
            select: {
              difficulty: true,
            },
          },
        },
      },
    },
  });

  let streak = 0;

  for (const attempt of recentAttempts) {
    const answerCount = attempt.answers.length;
    if (!answerCount) {
      break;
    }

    const easyCount = attempt.answers.filter(
      (answer) => answer.question?.difficulty === 'easy'
    ).length;

    const easyRatio = easyCount / answerCount;
    if (easyRatio >= 0.8) {
      streak += 1;
      continue;
    }

    break;
  }

  return streak;
};

const buildSoloAnswers = ({ submittedAnswers, questionMap }) => {
  const seen = new Set();

  return submittedAnswers.map((answer) => {
    const questionId = answer.question_id;
    if (seen.has(questionId)) {
      throw new ApiError(409, 'Duplicate question submission detected');
    }
    seen.add(questionId);

    const question = questionMap.get(questionId);
    if (!question) {
      throw new ApiError(400, 'One or more questions are invalid');
    }

    return {
      question_id: question.id,
      category: question.category,
      difficulty: question.difficulty,
      selected_answer: answer.selected_answer,
      is_correct: question.correct_answer === answer.selected_answer,
      time_taken: answer.time_taken,
    };
  });
};

const buildRoomAnswers = ({ questions, answers, questionTimeLimitMs }) => {
  const answerByIndex = new Map();

  answers.forEach((answer) => {
    const index = Number(answer.question_index);
    if (!Number.isInteger(index) || index < 0 || index >= questions.length) {
      return;
    }

    if (!answerByIndex.has(index)) {
      answerByIndex.set(index, answer);
    }
  });

  return questions.map((question, index) => {
    const answer = answerByIndex.get(index);

    if (!answer) {
      return {
        question_id: question.id,
        category: question.category,
        difficulty: question.difficulty,
        selected_answer: 'UNANSWERED',
        is_correct: false,
        time_taken: questionTimeLimitMs,
      };
    }

    const normalizedAnswer = String(answer.selected_answer || 'UNANSWERED');
    const isCorrect =
      typeof answer.is_correct === 'boolean'
        ? answer.is_correct
        : normalizedAnswer === question.correct_answer;

    return {
      question_id: question.id,
      category: question.category,
      difficulty: question.difficulty,
      selected_answer: normalizedAnswer,
      is_correct: isCorrect,
      time_taken: answer.time_taken,
    };
  });
};

const sortRankedPlayers = (players) =>
  [...players].sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }

    return toFinishSortValue(a.finish_time) - toFinishSortValue(b.finish_time);
  });

const toResultTag = ({
  placement,
  totalPlayers,
  completionRatio,
  connected,
}) => {
  if (!connected && completionRatio < 1) {
    return 'disconnect';
  }

  if (placement <= 1) {
    return 'win';
  }

  if (placement >= totalPlayers) {
    return 'loss';
  }

  return 'draw';
};

const getMaxPossibleScore = ({ totalQuestions, questionTimeLimitMs }) => {
  const perQuestionMax =
    BASE_CORRECT_POINTS +
    Math.round((questionTimeLimitMs / 1000) * SPEED_BONUS_PER_SECOND);
  const maxAccuracyBonus = 350;
  return totalQuestions * perQuestionMax + maxAccuracyBonus;
};

const computePerformanceContext = ({
  questions,
  userId,
  totalQuestions,
  questionTimeLimitMs,
}) => {
  const difficultyMultiplier = calculateDifficultyMultiplier(questions);
  const easyQuestionRatio = calculateEasyQuestionRatio(questions);

  return getRecentEasyQuizStreak(userId).then((recentEasyStreak) => {
    const easyRepeatMultiplier = calculateEasyRepeatMultiplier({
      easyQuestionRatio,
      recentEasyStreak,
    });

    return {
      difficultyMultiplier,
      easyQuestionRatio,
      recentEasyStreak,
      easyRepeatMultiplier,
      maxPossibleScore: getMaxPossibleScore({
        totalQuestions,
        questionTimeLimitMs,
      }),
    };
  });
};

const updateUserRanking = async ({ userId, tx = prisma }) => {
  const user = await tx.user.findUnique({
    where: { id: userId },
    select: {
      rating_points: true,
    },
  });

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  const rank = getRankForRating(user.rating_points);
  return tx.user.update({
    where: { id: userId },
    data: { rank },
    select: {
      id: true,
      rating_points: true,
      rank: true,
    },
  });
};

const syncMultipleUsersRank = async ({ userIds, tx = prisma }) => {
  const uniqueUserIds = [...new Set(userIds)];
  if (!uniqueUserIds.length) {
    return [];
  }

  const users = await tx.user.findMany({
    where: { id: { in: uniqueUserIds } },
    select: {
      id: true,
      rating_points: true,
    },
  });

  await Promise.all(
    users.map((user) =>
      tx.user.update({
        where: { id: user.id },
        data: {
          rank: getRankForRating(user.rating_points),
        },
      })
    )
  );

  return users.map((user) => ({
    user_id: user.id,
    rating_points: user.rating_points,
    rank: getRankForRating(user.rating_points),
  }));
};

export const scoringService = {
  calculateAnswerScore,
  calculateScore,
  calculateSoloRating,
  calculateMultiplayerRating,
  applyScoreInfluence,
  getRankForRating,
  updateUserRanking,

  updateUserStats: async ({
    userId,
    mode,
    roomId,
    submittedAnswers,
    questions,
    totalTimeTaken,
    questionTimeLimitMs = SOLO_QUESTION_TIME_LIMIT_MS,
  }) => {
    const questionMap = new Map(
      questions.map((question) => [question.id, question])
    );
    const normalizedAnswers = buildSoloAnswers({
      submittedAnswers,
      questionMap,
    });

    const totalQuestions = questions.length;
    const metrics = calculateScore({
      answers: normalizedAnswers,
      totalQuestions,
      questionTimeLimitMs,
      applyStreakBonus: true,
    });

    if (Number.isFinite(Number(totalTimeTaken)) && Number(totalTimeTaken) > 0) {
      metrics.time_taken = Math.round(Number(totalTimeTaken));
      metrics.average_response = Math.round(
        metrics.time_taken / Math.max(1, metrics.total_questions)
      );
    }

    const [performanceContext, user] = await Promise.all([
      computePerformanceContext({
        questions,
        userId,
        totalQuestions,
        questionTimeLimitMs,
      }),
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          total_correct_answers: true,
          total_wrong_answers: true,
          total_quizzes_played: true,
          rating_points: true,
          xp_points: true,
          average_time_per_question: true,
          current_streak: true,
          longest_streak: true,
          last_streak_date: true,
        },
      }),
    ]);

    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    const ratingDelta = calculateSoloRating({
      score: metrics.score,
      maxPossibleScore: performanceContext.maxPossibleScore,
      accuracyPercentage: metrics.accuracy_percentage,
      averageResponseMs: metrics.average_response,
      questionTimeLimitMs,
      completionRatio: metrics.completion_ratio,
      difficultyMultiplier: performanceContext.difficultyMultiplier,
      easyRepeatMultiplier: performanceContext.easyRepeatMultiplier,
      partialCompletion: metrics.completion_ratio < 1,
    });

    const xpEarned = calculateXpEarned({
      correctAnswers: metrics.correct_answers,
      totalQuestions: metrics.total_questions,
      avgResponseMs: metrics.average_response,
      questionTimeLimitMs,
      accuracyPercentage: metrics.accuracy_percentage,
    });

    const result = await prisma.$transaction(async (tx) => {
      const persisted = await persistAttemptForUser({
        tx,
        user,
        userId,
        roomId,
        mode,
        resultTag:
          metrics.correct_answers >= metrics.wrong_answers ? 'win' : 'loss',
        attemptMetrics: metrics,
        ratingDelta,
        xpEarned,
      });

      await updateUserRanking({ userId, tx });
      return persisted;
    });

    await refreshLeaderboard();
    await invalidateScoreRelatedCaches([userId]);

    return {
      ...result,
      score_breakdown: {
        raw_score: metrics.raw_score,
        accuracy_bonus: metrics.accuracy_bonus,
        final_score: metrics.score,
        max_possible_score: performanceContext.maxPossibleScore,
      },
    };
  },

  updateMultipleUsersRanking: async ({
    roomId,
    players,
    questions,
    questionTimeLimitMs = ROOM_QUESTION_TIME_LIMIT_MS,
  }) => {
    if (!players.length) {
      return { leaderboard: [], updates: [] };
    }

    const totalQuestions = questions.length;

    const preparedPlayers = players.map((player) => {
      const normalizedAnswers = buildRoomAnswers({
        questions,
        answers: player.answers || [],
        questionTimeLimitMs,
      });

      const metrics = calculateScore({
        answers: normalizedAnswers,
        totalQuestions,
        questionTimeLimitMs,
        applyStreakBonus: true,
      });

      return {
        user_id: player.user_id,
        finish_time: player.finish_time || null,
        connected: player.connected !== false,
        metrics,
      };
    });

    const rankedPlayers = sortRankedPlayers(
      preparedPlayers.map((player) => ({
        user_id: player.user_id,
        score: player.metrics.score,
        finish_time: player.finish_time,
      }))
    );

    const placementByUserId = new Map(
      rankedPlayers.map((player, index) => [player.user_id, index + 1])
    );
    const placementScoreByUserId = calculatePlacementScores(rankedPlayers);
    const userIds = preparedPlayers.map((player) => player.user_id);

    const [users, performanceContexts] = await Promise.all([
      prisma.user.findMany({
        where: { id: { in: userIds } },
        select: {
          id: true,
          total_correct_answers: true,
          total_wrong_answers: true,
          total_quizzes_played: true,
          rating_points: true,
          xp_points: true,
          average_time_per_question: true,
          current_streak: true,
          longest_streak: true,
          last_streak_date: true,
        },
      }),
      Promise.all(
        userIds.map((userId) =>
          computePerformanceContext({
            questions,
            userId,
            totalQuestions,
            questionTimeLimitMs,
          })
        )
      ),
    ]);

    const performanceByUserId = new Map(
      userIds.map((userId, index) => [userId, performanceContexts[index]])
    );

    const userById = new Map(users.map((user) => [user.id, user]));

    if (userById.size !== userIds.length) {
      throw new ApiError(404, 'One or more room players do not exist');
    }

    const updates = await prisma.$transaction(
      async (tx) => {
        const persisted = await Promise.all(
          preparedPlayers.map((player) => {
            const user = userById.get(player.user_id);
            const placement = placementByUserId.get(player.user_id) || 1;
            const placementScore =
              placementScoreByUserId.get(player.user_id) || 0;
            const opponentRatings = preparedPlayers
              .filter((item) => item.user_id !== player.user_id)
              .map((item) => userById.get(item.user_id).rating_points);
            const performance = performanceByUserId.get(player.user_id);

            const ratingDelta = calculateMultiplayerRating({
              placement,
              placementScore,
              totalPlayers: preparedPlayers.length,
              score: player.metrics.score,
              maxPossibleScore: performance.maxPossibleScore,
              accuracyPercentage: player.metrics.accuracy_percentage,
              completionRatio: player.metrics.completion_ratio,
              averageResponseMs: player.metrics.average_response,
              questionTimeLimitMs,
              playerRating: user.rating_points,
              opponentRatings,
              difficultyMultiplier: performance.difficultyMultiplier,
              easyRepeatMultiplier: performance.easyRepeatMultiplier,
              connected: player.connected,
            });

            const xpEarned = calculateXpEarned({
              correctAnswers: player.metrics.correct_answers,
              totalQuestions: player.metrics.total_questions,
              avgResponseMs: player.metrics.average_response,
              questionTimeLimitMs,
              accuracyPercentage: player.metrics.accuracy_percentage,
            });

            return persistAttemptForUser({
              tx,
              user,
              userId: player.user_id,
              roomId,
              mode: 'multiplayer',
              resultTag: toResultTag({
                placement,
                totalPlayers: preparedPlayers.length,
                completionRatio: player.metrics.completion_ratio,
                connected: player.connected,
              }),
              attemptMetrics: player.metrics,
              ratingDelta,
              xpEarned,
              placementScore,
            });
          })
        );

        await syncMultipleUsersRank({ userIds, tx });
        return persisted;
      },
      { isolationLevel: 'Serializable' }
    );

    await refreshLeaderboard();
    await invalidateScoreRelatedCaches(userIds);

    const updateByUserId = new Map(
      updates.map((update) => [update.user_id, update])
    );

    const leaderboard = rankedPlayers.map((player, index) => {
      const update = updateByUserId.get(player.user_id);

      return {
        rank: index + 1,
        user_id: player.user_id,
        score: player.score,
        finish_time: player.finish_time,
        rating_change: update?.rating_change || 0,
      };
    });

    return {
      leaderboard,
      updates,
    };
  },

  updateMultipleUsers: async (payload) =>
    scoringService.updateMultipleUsersRanking(payload),
};
