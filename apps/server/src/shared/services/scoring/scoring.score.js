import {
  BASE_CORRECT_POINTS,
  SPEED_BONUS_PER_SECOND,
  XP_ACCURACY_BONUS_THRESHOLD,
} from './scoring.constants.js';
import { safeMs, round2 } from './scoring.math.js';

export const calculateAnswerScore = ({
  isCorrect,
  timeTakenMs,
  questionTimeLimitMs,
}) => {
  if (!isCorrect) return 0;
  const boundedTime = safeMs(timeTakenMs, questionTimeLimitMs);
  const remainingMs = Math.max(0, questionTimeLimitMs - boundedTime);
  return (
    BASE_CORRECT_POINTS +
    Math.round((remainingMs / 1000) * SPEED_BONUS_PER_SECOND)
  );
};

const calculateStreakBonus = ({ isCorrect, nextStreak }) => {
  if (!isCorrect || nextStreak < 3) return 0;
  return Math.min(120, (nextStreak - 2) * 10);
};

const calculateAccuracyScoreBonus = ({
  accuracyPercentage,
  totalQuestions,
}) => {
  if (!totalQuestions || accuracyPercentage < 60) return 0;
  if (accuracyPercentage >= 100) return 350;
  if (accuracyPercentage >= 90) return 220;
  if (accuracyPercentage >= 80) return 130;
  if (accuracyPercentage >= 70) return 70;
  return 30;
};

const aggregateCategoryStats = (answers) => {
  const map = new Map();
  for (const answer of answers) {
    if (!answer.category) continue;
    const current = map.get(answer.category) || {
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
    map.set(answer.category, current);
  }
  return Array.from(map.values());
};

const processAnswer = (
  answer,
  questionTimeLimitMs,
  streak,
  applyStreakBonus
) => {
  const timeTaken = safeMs(answer.time_taken, questionTimeLimitMs);
  const isCorrect = Boolean(answer.is_correct);
  const nextStreak = isCorrect ? streak + 1 : 0;
  const basePoints = calculateAnswerScore({
    isCorrect,
    timeTakenMs: timeTaken,
    questionTimeLimitMs,
  });
  const streakBonus = applyStreakBonus
    ? calculateStreakBonus({ isCorrect, nextStreak })
    : 0;
  return {
    normalized: {
      question_id: answer.question_id,
      category: answer.category,
      difficulty: answer.difficulty,
      selected_answer: answer.selected_answer,
      is_correct: isCorrect,
      time_taken: timeTaken,
      points: basePoints + streakBonus,
      streak_bonus: streakBonus,
    },
    timeTaken,
    isCorrect,
    nextStreak,
    points: basePoints + streakBonus,
  };
};

export const calculateScore = ({
  answers,
  totalQuestions,
  questionTimeLimitMs,
  applyStreakBonus,
}) => {
  let score = 0,
    correctAnswers = 0,
    wrongAnswers = 0,
    totalTimeTaken = 0,
    streak = 0;
  const normalizedAnswers = answers.map((answer) => {
    const result = processAnswer(
      answer,
      questionTimeLimitMs,
      streak,
      applyStreakBonus
    );
    streak = result.nextStreak;
    if (result.isCorrect) {
      correctAnswers += 1;
    } else {
      wrongAnswers += 1;
    }
    score += result.points;
    totalTimeTaken += result.timeTaken;
    return result.normalized;
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

export const calculateXpEarned = ({
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
