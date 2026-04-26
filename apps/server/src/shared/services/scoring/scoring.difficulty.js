import { prisma } from '../../db/connection.js';
import { clamp, getMaxPossibleScore } from './scoring.math.js';

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

export const calculateDifficultyMultiplier = (questions) => {
  if (!questions?.length) return 1;
  const total = questions.reduce(
    (sum, q) => sum + getDifficultyWeight(q.difficulty),
    0
  );
  return clamp(total / questions.length, 0.8, 1.2);
};

export const calculateEasyQuestionRatio = (questions) => {
  if (!questions?.length) return 0;
  const easyCount = questions.filter((q) => q.difficulty === 'easy').length;
  return easyCount / questions.length;
};

export const calculateEasyRepeatMultiplier = ({
  easyQuestionRatio,
  recentEasyStreak,
}) => {
  if (easyQuestionRatio < 0.7) return 1;
  if (recentEasyStreak <= 0) return 0.9;
  const reduced = 0.9 - recentEasyStreak * 0.1;
  return clamp(reduced, 0.45, 0.9);
};

export const getRecentEasyQuizStreak = async (userId) => {
  const recentAttempts = await prisma.quizAttempt.findMany({
    where: { user_id: userId },
    take: 5,
    orderBy: { created_at: 'desc' },
    include: {
      answers: {
        select: { question: { select: { difficulty: true } } },
      },
    },
  });

  let streak = 0;
  for (const attempt of recentAttempts) {
    const answerCount = attempt.answers.length;
    if (!answerCount) break;
    const easyCount = attempt.answers.filter(
      (a) => a.question?.difficulty === 'easy'
    ).length;
    if (easyCount / answerCount >= 0.8) {
      streak += 1;
    } else {
      break;
    }
  }
  return streak;
};

export const computePerformanceContext = async ({
  questions,
  userId,
  totalQuestions,
  questionTimeLimitMs,
}) => {
  const difficultyMultiplier = calculateDifficultyMultiplier(questions);
  const easyQuestionRatio = calculateEasyQuestionRatio(questions);
  const recentEasyStreak = await getRecentEasyQuizStreak(userId);
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
};
