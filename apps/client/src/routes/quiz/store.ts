import { create } from 'zustand';
import { quizPageService } from './service';

interface QuizPageState {
  selectedAnswer: string;
  isLocked: boolean;
  notice: string;
  chooseAnswer: (selectedAnswer: string) => void;
  lockAnswer: (payload: { timeTakenMs: number }) => string;
  resetForNextQuestion: () => void;
}

const initialState = {
  selectedAnswer: '',
  isLocked: false,
  notice: '',
};

export const useQuizPageStore = create<QuizPageState>((set, get) => ({
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
