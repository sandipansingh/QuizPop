import { calculateStreakUpdate } from '../../utils/streak.js';
import { round2, getRankForRating } from './scoring.math.js';
import { MIN_RATING_POINTS } from './scoring.constants.js';

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

export const buildUserUpdatePayload = ({
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
