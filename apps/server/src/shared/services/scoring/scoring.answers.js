import { ApiError } from '../../utils/api-error.js';

export const buildSoloAnswers = ({ submittedAnswers, questionMap }) => {
  const seen = new Set();
  return submittedAnswers.map((answer) => {
    const questionId = answer.question_id;
    if (seen.has(questionId))
      throw new ApiError(409, 'Duplicate question submission detected');
    seen.add(questionId);
    const question = questionMap.get(questionId);
    if (!question) throw new ApiError(400, 'One or more questions are invalid');
    return {
      question_id: question.id,
      category: question.category,
      difficulty: question.difficulty,
      selected_answer: answer.selected_answer,
      is_correct: question.correct_answer === answer.selected_answer,
      time_taken: answer.time_taken,
    };
  });
};

export const buildRoomAnswers = ({
  questions,
  answers,
  questionTimeLimitMs,
}) => {
  const answerByIndex = new Map();
  answers.forEach((answer) => {
    const index = Number(answer.question_index);
    if (!Number.isInteger(index) || index < 0 || index >= questions.length)
      return;
    if (!answerByIndex.has(index)) answerByIndex.set(index, answer);
  });

  return questions.map((question, index) => {
    const answer = answerByIndex.get(index);
    if (!answer) {
      return {
        question_id: question.id,
        category: question.category,
        difficulty: question.difficulty,
        selected_answer: 'UNANSWERED',
        is_correct: false,
        time_taken: questionTimeLimitMs,
      };
    }
    const normalizedAnswer = String(answer.selected_answer || 'UNANSWERED');
    const isCorrect =
      typeof answer.is_correct === 'boolean'
        ? answer.is_correct
        : normalizedAnswer === question.correct_answer;
    return {
      question_id: question.id,
      category: question.category,
      difficulty: question.difficulty,
      selected_answer: normalizedAnswer,
      is_correct: isCorrect,
      time_taken: answer.time_taken,
    };
  });
};

const toFinishSortValue = (finishTime) =>
  finishTime ? new Date(finishTime).getTime() : Number.MAX_SAFE_INTEGER;

export const sortRankedPlayers = (players) =>
  [...players].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return toFinishSortValue(a.finish_time) - toFinishSortValue(b.finish_time);
  });

export const calculatePlacementScores = (rankedPlayers) => {
  const totalPlayers = rankedPlayers.length;
  const placementScoreByUserId = new Map();
  if (!totalPlayers) return placementScoreByUserId;
  if (totalPlayers === 1) {
    placementScoreByUserId.set(rankedPlayers[0].user_id, 0.5);
    return placementScoreByUserId;
  }

  let index = 0;
  while (index < totalPlayers) {
    const current = rankedPlayers[index];
    let tieEnd = index;
    while (tieEnd + 1 < totalPlayers) {
      const candidate = rankedPlayers[tieEnd + 1];
      const isTie =
        candidate.score === current.score &&
        toFinishSortValue(candidate.finish_time) ===
          toFinishSortValue(current.finish_time);
      if (!isTie) break;
      tieEnd += 1;
    }
    const averagePlacement = (index + 1 + (tieEnd + 1)) / 2;
    const placementScore =
      (totalPlayers - averagePlacement) / Math.max(1, totalPlayers - 1);
    for (let i = index; i <= tieEnd; i += 1) {
      placementScoreByUserId.set(rankedPlayers[i].user_id, placementScore);
    }
    index = tieEnd + 1;
  }
  return placementScoreByUserId;
};

export const toResultTag = ({
  placement,
  totalPlayers,
  completionRatio,
  connected,
}) => {
  if (!connected && completionRatio < 1) return 'disconnect';
  if (placement <= 1) return 'win';
  if (placement >= totalPlayers) return 'loss';
  return 'draw';
};
