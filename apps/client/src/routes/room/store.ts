import { create } from 'zustand';
import { useRoomStore } from '../../app/store/room.store';
import { roomPageService } from './service';

interface RoomPageState {
  selectedAnswer: string;
  isAnswerLocked: boolean;
  notice: string;
  chooseAnswer: (selectedAnswer: string) => void;
  submitCurrentAnswer: (timeTakenMs: number) => Promise<{ success: boolean }>;
  resetForNextQuestion: () => void;
}

const initialState = {
  selectedAnswer: '',
  isAnswerLocked: false,
  notice: '',
};

export const useRoomPageStore = create<RoomPageState>((set, get) => ({
  ...initialState,

  chooseAnswer: (selectedAnswer) => {
    if (get().isAnswerLocked) {
      return;
    }

    set({ selectedAnswer, notice: '' });
  },

  submitCurrentAnswer: async (timeTakenMs) => {
    const { currentQuestion, currentQuestionIndex } = useRoomStore.getState();
    if (!currentQuestion || currentQuestionIndex < 0) {
      throw new Error('No active question to submit.');
    }

    const selectedAnswer = get().selectedAnswer || 'UNANSWERED';
    await roomPageService.submitAnswer({
      questionIndex: currentQuestionIndex,
      selectedAnswer,
      timeTaken: Math.max(0, Math.min(60000, Number(timeTakenMs) || 0)),
    });

    get().resetForNextQuestion();

    return { success: true };
  },

  resetForNextQuestion: () => {
    set({ ...initialState });
  },
}));
