import { emitWithAck } from '../../shared/realtime/socket';
import { socketEvents } from '../../shared/realtime/socket-events';
import { logger } from '../../shared/utils/logger';
import type { Socket } from 'socket.io-client';

type SetFn = (partial: Record<string, unknown>) => void;
type GetFn = () => Record<string, unknown>;

export const createGameActions = (set: SetFn, get: GetFn) => ({
  startGame: async (): Promise<void> => {
    const state = get() as {
      roomId: string | null;
      connect: () => Promise<Socket>;
    };
    if (!state.roomId) throw new Error('Room not selected.');
    set({ isStarting: true, errorMessage: null });
    try {
      const socket = await state.connect();
      await emitWithAck(socket, socketEvents.startGame, {
        room_id: state.roomId,
      });
      set({ isStarting: false });
    } catch (error) {
      const err = error as { message?: string };
      set({
        isStarting: false,
        errorMessage: err.message ?? 'Failed to start game.',
      });
      throw error;
    }
  },

  submitAnswer: async ({
    questionIndex,
    selectedAnswer,
    timeTaken,
  }: {
    questionIndex: number;
    selectedAnswer: string;
    timeTaken: number;
  }): Promise<{ success: boolean }> => {
    const state = get() as {
      roomId: string | null;
      totalQuestions: number;
      questions: unknown[];
      connect: () => Promise<Socket>;
    };
    if (!state.roomId || !Number.isInteger(questionIndex) || questionIndex < 0)
      throw new Error('Question payload is incomplete.');
    const nextIndex = questionIndex + 1;
    const isFinished = nextIndex >= state.totalQuestions;
    const nextQuestion = isFinished
      ? null
      : (state.questions as { id: string }[])[nextIndex];
    logger.debug('Advancing local question index', { nextIndex });
    set({
      currentQuestionIndex: nextIndex,
      currentQuestion: nextQuestion ?? null,
      errorMessage: null,
    });
    try {
      const socket = await state.connect();
      void emitWithAck(socket, socketEvents.submitAnswer, {
        room_id: state.roomId,
        question_index: questionIndex,
        selected_answer: selectedAnswer,
        time_taken: timeTaken,
      })
        .then((result) => {
          set({ lastAnswerResult: result });
          logger.debug('Submit answer acknowledged', result);
        })
        .catch((error: unknown) => {
          logger.error('Submit answer failed', error);
        });
      return { success: true };
    } catch (error) {
      const err = error as { message?: string };
      set({ errorMessage: err.message ?? 'Failed to submit answer.' });
      throw error;
    }
  },

  endGame: async (): Promise<void> => {
    const state = get() as {
      roomId: string | null;
      connect: () => Promise<Socket>;
    };
    if (!state.roomId) throw new Error('Room not selected.');
    set({ isEnding: true, errorMessage: null });
    try {
      const socket = await state.connect();
      await emitWithAck(socket, socketEvents.endGame, {
        room_id: state.roomId,
      });
      set({ isEnding: false });
    } catch (error) {
      const err = error as { message?: string };
      set({
        isEnding: false,
        errorMessage: err.message ?? 'Failed to end game.',
      });
      throw error;
    }
  },
});
