import {
  cacheKeys,
  cacheService,
  cacheTtls,
} from '../../shared/cache/cache.service.js';
import { ApiError } from '../../shared/utils/api-error.js';
import { userModel } from './user.model.js';

const buildOverview = ({ user, averageResponseTime }) => ({
  total_score: user.total_score,
  total_quizzes_played: user.total_quizzes_played,
  total_correct_answers: user.total_correct_answers,
  total_wrong_answers: user.total_wrong_answers,
  accuracy_percentage: Number(user.accuracy_percentage),
  average_time_per_question: Number(user.average_time_per_question || 0),
  average_response_time: averageResponseTime,
  rank: user.rank,
  rating_points: user.rating_points,
  xp_points: user.xp_points,
  level: user.level,
  current_streak: user.current_streak,
  longest_streak: user.longest_streak,
});

const calculateAverageResponseTime = (attempts = []) =>
  attempts.length
    ? Math.round(
        attempts.reduce((sum, a) => sum + a.average_response, 0) /
          attempts.length
      )
    : 0;

const mapCategoryAccuracy = (categoryPerformance = []) =>
  categoryPerformance.map((entry) => ({
    category: entry.category,
    total_attempts: entry.total_attempts,
    correct_answers: entry.correct_answers,
    wrong_answers: entry.wrong_answers,
    accuracy: Number(entry.accuracy),
  }));

const mapAchievements = (achievements = []) =>
  achievements.map((item) => ({
    unlocked_at: item.unlocked_at,
    ...item.achievement,
  }));

export const getPublicProfileById = async (targetUserId) => {
  const cacheKey = cacheKeys.user(targetUserId);
  const cached = await cacheService.get(cacheKey);
  if (cached) return cached;

  const [profile, statsPayload] = await Promise.all([
    userModel.getUserProfileById(targetUserId),
    userModel.getUserStatsById(targetUserId),
  ]);

  if (!profile || !statsPayload.user)
    throw new ApiError(404, 'User profile not found');

  const { attempts, categoryPerformance, recentActivity, achievements, user } =
    statsPayload;
  const averageResponseTime = calculateAverageResponseTime(attempts);
  const publicProfile = { ...profile };
  delete publicProfile.email;

  const result = {
    profile: {
      ...publicProfile,
      accuracy_percentage: Number(publicProfile.accuracy_percentage),
      average_time_per_question: Number(
        publicProfile.average_time_per_question || 0
      ),
    },
    overview: buildOverview({ user, averageResponseTime }),
    category_accuracy: mapCategoryAccuracy(categoryPerformance),
    recent_activity: recentActivity,
    achievements: mapAchievements(achievements),
  };

  await cacheService.set(cacheKey, result, cacheTtls.userProfileSeconds);
  return result;
};

export const getMyStats = async (userId) => {
  const cacheKey = cacheKeys.userStats(userId);
  const cached = await cacheService.get(cacheKey);
  if (cached) return cached;

  const {
    user,
    attempts,
    categoryPerformance,
    recentActivity,
    matchHistory,
    achievements,
  } = await userModel.getUserStatsById(userId);
  if (!user) throw new ApiError(404, 'User stats not found');

  const averageResponseTime = calculateAverageResponseTime(attempts);
  const performanceOverTime = attempts.map((attempt) => ({
    attempt_id: attempt.id,
    score: attempt.score,
    accuracy: Number(
      (
        (attempt.correct_answers / Math.max(1, attempt.total_questions)) *
        100
      ).toFixed(2)
    ),
    time_taken: attempt.time_taken,
    average_response: attempt.average_response,
    created_at: attempt.created_at,
  }));

  const result = {
    overview: buildOverview({ user, averageResponseTime }),
    category_accuracy: mapCategoryAccuracy(categoryPerformance),
    performance_over_time: performanceOverTime,
    recent_activity: recentActivity,
    match_history: matchHistory,
    achievements: mapAchievements(achievements),
  };

  await cacheService.set(cacheKey, result, cacheTtls.userProfileSeconds);
  return result;
};
