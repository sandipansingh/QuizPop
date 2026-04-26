import { useCallback, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useQuizStore } from '../../../app/store/quiz.store';
import { clientEnv } from '../../../shared/config/env';
import { useCountdown } from '../../../shared/hooks/useCountdown';
import { quizPageService } from '../service';
import { useQuizPageStore } from '../store';

const QUESTION_TIME_LIMIT_MS = clientEnv.quizQuestionTimeLimitMs;
const DEFAULT_QUESTION_LIMIT = clientEnv.defaultQuestionLimit;

export function useQuizPage() {
  const navigate = useNavigate();
  const hasInitializedRef = useRef(false);

  const questions = useQuizStore((state) => state.questions);
  const currentQuestionIndex = useQuizStore(
    (state) => state.currentQuestionIndex
  );
  const isLoadingQuestions = useQuizStore((state) => state.isLoadingQuestions);
  const isSubmittingQuiz = useQuizStore((state) => state.isSubmittingQuiz);
  const errorMessage = useQuizStore((state) => state.errorMessage);
  const selectedAnswer = useQuizPageStore((state) => state.selectedAnswer);
  const isLocked = useQuizPageStore((state) => state.isLocked);
  const notice = useQuizPageStore((state) => state.notice);
  const chooseAnswer = useQuizPageStore((state) => state.chooseAnswer);
  const lockAnswer = useQuizPageStore((state) => state.lockAnswer);
  const resetForNextQuestion = useQuizPageStore(
    (state) => state.resetForNextQuestion
  );

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex >= questions.length - 1;

  useEffect(() => {
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;
    quizPageService.resetQuiz();
    resetForNextQuestion();
    void quizPageService.loadQuestions({
      limit: DEFAULT_QUESTION_LIMIT,
      difficulty: undefined,
    });
  }, [resetForNextQuestion]);

  const handleAutoExpire = useCallback(() => {
    if (!currentQuestion || isLocked) return;
    lockAnswer({ timeTakenMs: QUESTION_TIME_LIMIT_MS });
    toast.error('Time is up for this question.');
  }, [currentQuestion, isLocked, lockAnswer]);

  const { timeLeftMs } = useCountdown({
    durationMs: QUESTION_TIME_LIMIT_MS,
    isActive: Boolean(currentQuestion) && !isLocked,
    resetKey: currentQuestion?.id ?? 'quiz-empty',
    onExpire: handleAutoExpire,
  });

  const lockCurrentAnswer = () => {
    if (isLocked) return;
    lockAnswer({ timeTakenMs: QUESTION_TIME_LIMIT_MS - timeLeftMs });
  };

  const submitQuiz = async () => {
    if (!isLocked) lockCurrentAnswer();
    try {
      const result = await quizPageService.submitQuiz();
      toast.success('Quiz submitted successfully.');
      navigate('/result', { state: { mode: 'solo', soloResult: result } });
    } catch {
      toast.error('Quiz submission failed.');
    }
  };

  return {
    questions,
    currentQuestion,
    currentQuestionIndex,
    isLastQuestion,
    isLoadingQuestions,
    isSubmittingQuiz,
    errorMessage,
    selectedAnswer,
    isLocked,
    notice,
    chooseAnswer,
    timeLeftMs,
    lockCurrentAnswer,
    submitQuiz,
    resetForNextQuestion,
    DEFAULT_QUESTION_LIMIT,
  };
}
