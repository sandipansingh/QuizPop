import { create } from 'zustand';
import { quizService } from '../../shared/services/quiz.service.js';

const initialState = {
  questions: [],
  currentQuestionIndex: 0,
  answers: [],
  totalTimeTakenMs: 0,
  submitResult: null,
  isLoadingQuestions: false,
  isSubmittingQuiz: false,
  errorMessage: null,
};

export const useQuizStore = create((set, get) => ({
  ...initialState,
  resetQuiz: () => {
    set({
      ...initialState,
    });
  },
  loadQuestions: async (params = {}) => {
    set({ isLoadingQuestions: true, errorMessage: null, submitResult: null });

    try {
      const questions = await quizService.getQuestions(params);
      set({
        questions,
        currentQuestionIndex: 0,
        answers: [],
        totalTimeTakenMs: 0,
        submitResult: null,
        isLoadingQuestions: false,
      });

      return questions;
    } catch (error) {
      set({
        questions: [],
        isLoadingQuestions: false,
        errorMessage: error.message || 'Failed to fetch quiz questions.',
      });
      throw error;
    }
  },
  answerCurrentQuestion: ({ selectedAnswer, timeTakenMs }) => {
    const state = get();
    const question = state.questions[state.currentQuestionIndex];

    if (!question) {
      return;
    }

    const clampedTime = Math.max(0, Math.min(60000, Number(timeTakenMs) || 0));
    const nextAnswer = {
      question_id: question.id,
      selected_answer: String(selectedAnswer || 'UNANSWERED'),
      time_taken: clampedTime,
    };

    const existingIndex = state.answers.findIndex(
      (item) => item.question_id === question.id
    );

    const answers = [...state.answers];
    if (existingIndex === -1) {
      answers.push(nextAnswer);
    } else {
      answers[existingIndex] = nextAnswer;
    }

    const totalTimeTakenMs = answers.reduce(
      (total, answer) => total + answer.time_taken,
      0
    );

    set({ answers, totalTimeTakenMs });
  },
  nextQuestion: () => {
    const state = get();
    const nextIndex = Math.min(
      state.questions.length - 1,
      state.currentQuestionIndex + 1
    );
    set({ currentQuestionIndex: nextIndex });
    return nextIndex;
  },
  submitQuiz: async ({ roomId } = {}) => {
    const state = get();

    if (!state.answers.length) {
      throw new Error('Cannot submit quiz without answers.');
    }

    set({ isSubmittingQuiz: true, errorMessage: null });

    try {
      const result = await quizService.submitQuiz({
        answers: state.answers,
        total_time_taken: Math.max(1, state.totalTimeTakenMs),
        room_id: roomId,
      });

      set({ submitResult: result, isSubmittingQuiz: false });
      return result;
    } catch (error) {
      set({
        isSubmittingQuiz: false,
        errorMessage: error.message || 'Quiz submission failed.',
      });
      throw error;
    }
  },
  setSubmitResult: (submitResult) => {
    set({ submitResult });
  },
}));
