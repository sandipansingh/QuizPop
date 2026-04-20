import { env } from '../config/env.js';
import { ApiError } from '../utils/api-error.js';
import { calculateAnswerScore } from './scoring.service.js';
import { questionService } from './question.service.js';

const UNANSWERED = 'UNANSWERED';

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const getStreakBonus = (isCorrect, nextStreak) => {
  if (!isCorrect || nextStreak < 3) {
    return 0;
  }

  return Math.min(100, (nextStreak - 2) * 10);
};

export const roomGameService = {
  fetchRaceQuestions: async ({
    players,
    limit = env.ROOM_QUESTION_COUNT,
    roomId = null,
  } = {}) => questionService.getQuestionsForRoom(players, { limit, roomId }),

  evaluateSubmission: ({
    roomState,
    player,
    questionIndex,
    selectedAnswer,
    timeTaken,
    questionTimeLimitMs,
  }) => {
    if (!roomState || roomState.status !== 'active') {
      throw new ApiError(409, 'Game is not active');
    }

    if (!player || player.is_spectator) {
      throw new ApiError(403, 'You are not an active player in this room');
    }

    if (player.finished) {
      throw new ApiError(409, 'Race already completed for this player');
    }

    const safeQuestionIndex = Number(questionIndex);
    if (!Number.isInteger(safeQuestionIndex) || safeQuestionIndex < 0) {
      throw new ApiError(400, 'Invalid question index');
    }

    if (safeQuestionIndex !== player.current_question_index) {
      throw new ApiError(409, 'Out-of-order submission rejected');
    }

    const duplicate = player.answers.some(
      (item) => item.question_index === safeQuestionIndex
    );
    if (duplicate) {
      throw new ApiError(409, 'Duplicate submission for this question');
    }

    const question = roomState.questions[safeQuestionIndex];
    if (!question) {
      throw new ApiError(404, 'Question does not exist in current race');
    }

    const normalizedAnswer = String(selectedAnswer || UNANSWERED);
    const isKnownAnswer =
      normalizedAnswer === UNANSWERED ||
      question.options.includes(normalizedAnswer);
    if (!isKnownAnswer) {
      throw new ApiError(400, 'Answer option is invalid');
    }

    const safeTimeTakenMs = clamp(
      Number(timeTaken || 0),
      0,
      questionTimeLimitMs
    );
    const isCorrect = question.correct_answer === normalizedAnswer;

    const basePoints = calculateAnswerScore({
      isCorrect,
      timeTakenMs: safeTimeTakenMs,
      questionTimeLimitMs,
    });

    const nextStreak = isCorrect ? player.correct_streak + 1 : 0;
    const streakBonus = getStreakBonus(isCorrect, nextStreak);
    const points = basePoints + streakBonus;

    const updatedPlayer = {
      ...player,
      score: player.score + points,
      correct_streak: nextStreak,
      answers: [
        ...player.answers,
        {
          question_index: safeQuestionIndex,
          selected_answer: normalizedAnswer,
          is_correct: isCorrect,
          points,
          streak_bonus: streakBonus,
          time_taken: safeTimeTakenMs,
          submitted_at: new Date().toISOString(),
        },
      ],
      current_question_index: player.current_question_index + 1,
    };

    if (updatedPlayer.current_question_index >= roomState.questions.length) {
      updatedPlayer.finished = true;
      updatedPlayer.finish_time = new Date().toISOString();
    }

    return {
      player: updatedPlayer,
      result: {
        question_index: safeQuestionIndex,
        is_correct: isCorrect,
        points,
        streak_bonus: streakBonus,
        score: updatedPlayer.score,
        next_question_index: updatedPlayer.current_question_index,
        finished: updatedPlayer.finished,
        finish_time: updatedPlayer.finish_time,
      },
    };
  },
};
