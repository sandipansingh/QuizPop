import { ApiError } from '../../shared/utils/api-error.js';
import { cacheKeys, cacheService } from '../../shared/cache/cache.service.js';
import { env } from '../../shared/config/env.js';
import { scoringService } from '../../shared/services/scoring.service.js';
import { questionService } from '../../shared/services/question.service.js';
import { quizModel } from './quiz.model.js';
import { unlockAchievements } from './quiz.achievements.js';

const USER_QUESTION_SET_CACHE_SECONDS = 30;

export const quizService = {
  getQuestions: async ({
    limit = env.QUIZ_DEFAULT_QUESTION_LIMIT,
    category,
    userId,
  }) => {
    const cacheKey = cacheKeys.questionsUser(userId);
    const cachedQuestions = await cacheService.get(cacheKey);
    if (Array.isArray(cachedQuestions) && cachedQuestions.length > 0)
      return cachedQuestions;

    const questions = await questionService.getQuestionsForUser(userId, {
      limit: Number(limit),
      category,
    });
    await cacheService.set(
      cacheKey,
      questions,
      USER_QUESTION_SET_CACHE_SECONDS
    );
    return questions;
  },

  submitQuiz: async (userId, payload) => {
    const questionIds = payload.answers.map((answer) => answer.question_id);
    const uniqueQuestionIds = new Set(questionIds);
    if (uniqueQuestionIds.size !== questionIds.length) {
      throw new ApiError(409, 'Duplicate question submission detected');
    }

    const questions = await quizModel.findQuestionsByIds(questionIds);
    if (questions.length !== questionIds.length) {
      throw new ApiError(400, 'One or more questions are invalid');
    }

    const result = await scoringService.updateUserStats({
      userId,
      mode: 'solo',
      roomId: payload.room_id,
      submittedAnswers: payload.answers,
      questions,
      totalTimeTaken: payload.total_time_taken,
    });

    const updatedProfile = await quizModel.findUserById(userId);
    if (updatedProfile)
      await unlockAchievements({ userId, profile: updatedProfile });

    await cacheService.del(cacheKeys.questionsUser(userId));
    return result;
  },
};
