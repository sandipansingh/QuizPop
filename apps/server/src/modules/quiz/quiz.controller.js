import { ApiError } from '../../shared/utils/api-error.js';
import { sendSuccess } from '../../shared/utils/http-response.js';
import { quizService } from './quiz.service.js';

export const quizController = {
  getQuestions: async (req, res) => {
    const requestedUserId = req.validated.query.userId || req.user.id;

    if (
      req.validated.query.userId &&
      req.validated.query.userId !== req.user.id
    ) {
      throw new ApiError(
        403,
        'You can only load questions for your own account'
      );
    }

    const questions = await quizService.getQuestions({
      ...req.validated.query,
      userId: requestedUserId,
    });
    sendSuccess(res, { message: 'Questions fetched', data: questions });
  },

  submitQuiz: async (req, res) => {
    const result = await quizService.submitQuiz(
      req.user.id,
      req.validated.body
    );
    sendSuccess(res, { message: 'Quiz submitted', data: result });
  },
};
