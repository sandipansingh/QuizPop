import { useQuizStore } from '../../app/store/quiz.store.js';

export const quizPageService = {
  loadQuestions: async (params) => {
    return useQuizStore.getState().loadQuestions(params);
  },
  saveCurrentAnswer: ({ selectedAnswer, timeTakenMs }) => {
    useQuizStore
      .getState()
      .answerCurrentQuestion({ selectedAnswer, timeTakenMs });
  },
  nextQuestion: () => {
    return useQuizStore.getState().nextQuestion();
  },
  submitQuiz: async ({ roomId } = {}) => {
    return useQuizStore.getState().submitQuiz({ roomId });
  },
  resetQuiz: () => {
    useQuizStore.getState().resetQuiz();
  },
};
