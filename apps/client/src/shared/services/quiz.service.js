import { api } from '../api/api.js';
import { apiPaths } from '../api/endpoints.js';
import { parseApiResponse } from '../api/response.js';

export const quizService = {
  getQuestions: async (params) => {
    const response = await api.get(apiPaths.quiz.questions, { params });
    return parseApiResponse(response).data || [];
  },
  submitQuiz: async (payload) => {
    const response = await api.post(apiPaths.quiz.submit, payload);
    return parseApiResponse(response).data;
  },
};
