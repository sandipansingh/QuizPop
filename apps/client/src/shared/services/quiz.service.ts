import { api } from '../api/api';
import { apiPaths } from '../api/endpoints';
import { parseApiResponse } from '../api/response';
import type { Question, QuizAnswer, QuizSubmitResult } from '../types';

export interface GetQuestionsParams {
  limit?: number;
  difficulty?: string;
}

export interface SubmitQuizPayload {
  answers: QuizAnswer[];
  total_time_taken: number;
  room_id?: string;
}

export const quizService = {
  getQuestions: async (params?: GetQuestionsParams): Promise<Question[]> => {
    const response = await api.get(apiPaths.quiz.questions, { params });
    return parseApiResponse<Question[]>(response).data ?? [];
  },

  submitQuiz: async (payload: SubmitQuizPayload): Promise<QuizSubmitResult> => {
    const response = await api.post(apiPaths.quiz.submit, payload);
    return parseApiResponse<QuizSubmitResult>(response).data;
  },
};
