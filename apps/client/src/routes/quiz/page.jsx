import { CircleCheckBig, Timer } from 'lucide-react';
import { useCallback, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useQuizStore } from '../../app/store/quiz.store.js';
import { clientEnv } from '../../shared/config/env.js';
import { useCountdown } from '../../shared/hooks/useCountdown.js';
import { usePageMeta } from '../../shared/hooks/usePageMeta.js';
import { formatSeconds } from '../../shared/utils/formatters.js';
import { Button } from '../_shared/components/Button.jsx';
import { Card } from '../_shared/components/Card.jsx';
import { FormMessage } from '../_shared/components/FormMessage.jsx';
import { RouteSpinner } from '../_shared/components/RouteSpinner.jsx';
import { quizPageService } from './service.js';
import { useQuizPageStore } from './store.js';

const QUESTION_TIME_LIMIT_MS = clientEnv.quizQuestionTimeLimitMs;
const DEFAULT_QUESTION_LIMIT = clientEnv.defaultQuestionLimit;

export default function QuizPage() {
  const navigate = useNavigate();
  const hasInitializedRef = useRef(false);

  usePageMeta({
    title: 'Solo Quiz',
    description:
      'Play QuizPop solo mode with timed questions, instant feedback, and score-based progression.',
  });

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
    if (hasInitializedRef.current) {
      return;
    }

    hasInitializedRef.current = true;
    quizPageService.resetQuiz();
    resetForNextQuestion();
    void quizPageService.loadQuestions({
      limit: DEFAULT_QUESTION_LIMIT,
      difficulty: undefined,
    });
  }, [resetForNextQuestion]);

  const handleAutoExpire = useCallback(() => {
    if (!currentQuestion || isLocked) {
      return;
    }

    lockAnswer({ timeTakenMs: QUESTION_TIME_LIMIT_MS });
    toast.error('Time is up for this question.');
  }, [currentQuestion, isLocked, lockAnswer]);

  const { timeLeftMs } = useCountdown({
    durationMs: QUESTION_TIME_LIMIT_MS,
    isActive: Boolean(currentQuestion) && !isLocked,
    resetKey: currentQuestion?.id || 'quiz-empty',
    onExpire: handleAutoExpire,
  });

  const lockCurrentAnswer = () => {
    if (isLocked) {
      return;
    }

    const timeTakenMs = QUESTION_TIME_LIMIT_MS - timeLeftMs;
    lockAnswer({ timeTakenMs });
  };

  const goToNext = () => {
    quizPageService.nextQuestion();
    resetForNextQuestion();
  };

  const submitQuiz = async () => {
    if (!isLocked) {
      lockCurrentAnswer();
    }

    try {
      const result = await quizPageService.submitQuiz();
      toast.success('Quiz submitted successfully.');
      navigate('/result', { state: { mode: 'solo', soloResult: result } });
    } catch {
      toast.error('Quiz submission failed.');
    }
  };

  if (isLoadingQuestions && !questions.length) {
    return <RouteSpinner label="Preparing your quiz deck..." />;
  }

  if (!isLoadingQuestions && !questions.length) {
    return (
      <section className="quiz-page">
        <Card>
          <h1>No Questions Available</h1>
          <p className="lede">Try again in a moment or change your filters.</p>
          <Button
            onClick={() =>
              quizPageService.loadQuestions({ limit: DEFAULT_QUESTION_LIMIT })
            }
          >
            Retry
          </Button>
        </Card>
      </section>
    );
  }

  return (
    <section className="quiz-page">
      <Card className="quiz-card" accent="violet">
        <div className="quiz-card__header">
          <p className="eyebrow">Solo Quiz Mode</p>
          <p className="timer-pill">
            <Timer size={16} /> {formatSeconds(timeLeftMs)}s
          </p>
        </div>

        <div className="quiz-progress">
          <div
            className="quiz-progress__bar"
            style={{
              width: `${((currentQuestionIndex + 1) / Math.max(1, questions.length)) * 100}%`,
            }}
          />
        </div>

        <p className="muted">
          Question {currentQuestionIndex + 1} / {questions.length}
        </p>
        <h1>{currentQuestion.question_text}</h1>
        <div
          className="option-grid"
          role="radiogroup"
          aria-label="Question options"
        >
          {currentQuestion.options.map((option) => (
            <button
              key={option}
              type="button"
              className={`option-tile ${selectedAnswer === option ? 'option-tile--selected' : ''} ${
                isLocked ? 'option-tile--locked' : ''
              }`}
              onClick={() => chooseAnswer(option)}
              disabled={isLocked}
            >
              <span>{option}</span>
              {selectedAnswer === option ? <CircleCheckBig size={18} /> : null}
            </button>
          ))}
        </div>

        <FormMessage
          message={notice || errorMessage}
          tone={errorMessage ? 'error' : 'success'}
        />

        <div className="quiz-actions">
          {!isLocked ? (
            <Button
              onClick={lockCurrentAnswer}
              disabled={!selectedAnswer && timeLeftMs > 0}
            >
              Lock Answer
            </Button>
          ) : null}

          {isLocked && !isLastQuestion ? (
            <Button variant="secondary" onClick={goToNext}>
              Next Question
            </Button>
          ) : null}

          {isLocked && isLastQuestion ? (
            <Button loading={isSubmittingQuiz} onClick={submitQuiz}>
              Submit Quiz
            </Button>
          ) : null}
        </div>
      </Card>
    </section>
  );
}
