import { useQuizStore } from '../../app/store/quiz.store';
import type { GetQuestionsParams } from '../../shared/services/quiz.service';
import type { Question, QuizSubmitResult } from '../../shared/types';

export const quizPageService = {
  loadQuestions: async (params?: GetQuestionsParams): Promise<Question[]> => {
    return useQuizStore.getState().loadQuestions(params);
  },

  saveCurrentAnswer: ({
    selectedAnswer,
    timeTakenMs,
  }: {
    selectedAnswer: string;
    timeTakenMs: number;
  }): void => {
    useQuizStore
      .getState()
      .answerCurrentQuestion({ selectedAnswer, timeTakenMs });
  },

  nextQuestion: (): number => {
    return useQuizStore.getState().nextQuestion();
  },

  submitQuiz: async ({
    roomId,
  }: { roomId?: string } = {}): Promise<QuizSubmitResult> => {
    return useQuizStore.getState().submitQuiz({ roomId });
  },

  resetQuiz: (): void => {
    useQuizStore.getState().resetQuiz();
  },
};
