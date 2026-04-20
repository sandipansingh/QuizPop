import { create } from 'zustand';
import { quizPageService } from './service.js';

const initialState = {
  selectedAnswer: '',
  isLocked: false,
  notice: '',
};

export const useQuizPageStore = create((set, get) => ({
  ...initialState,
  chooseAnswer: (selectedAnswer) => {
    if (get().isLocked) {
      return;
    }

    set({ selectedAnswer, notice: '' });
  },
  lockAnswer: ({ timeTakenMs }) => {
    const selectedAnswer = get().selectedAnswer || 'UNANSWERED';
    quizPageService.saveCurrentAnswer({ selectedAnswer, timeTakenMs });
    set({
      isLocked: true,
      notice:
        selectedAnswer === 'UNANSWERED'
          ? 'Time up. Marked as unanswered.'
          : 'Answer locked. Continue when ready.',
    });
    return selectedAnswer;
  },
  resetForNextQuestion: () => {
    set({ ...initialState });
  },
}));
