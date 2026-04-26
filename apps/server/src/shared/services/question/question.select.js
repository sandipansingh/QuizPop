import {
  QUESTION_DIFFICULTIES,
  buildQuestionProfile,
  getDifficultySelectionPlan,
  shuffleArray,
} from './question.profiles.js';
import {
  buildQuestionQuery,
  buildOldestHistoryQuestionQuery,
} from './question.queries.js';

const normalizeQuestion = (
  question,
  { includeCorrectAnswer = false } = {}
) => ({
  id: question.id,
  question_text: question.question_text,
  options: shuffleArray(
    Array.isArray(question.options) ? question.options : []
  ),
  difficulty: question.difficulty,
  category: question.category,
  tags: Array.isArray(question.tags) ? question.tags : [],
  ...(includeCorrectAnswer ? { correct_answer: question.correct_answer } : {}),
});

export const selectAdaptiveQuestions = async ({
  ratingPoints,
  limit,
  category,
  excludedQuestionIds = [],
  historyUserIds = [],
  includeCorrectAnswer = false,
}) => {
  const normalizedLimit = Math.max(0, Math.floor(Number(limit) || 0));
  if (!normalizedLimit) return [];

  const profile = buildQuestionProfile(ratingPoints);
  const selectionPlan = getDifficultySelectionPlan(profile, normalizedLimit);
  const selectedQuestions = [];
  const historyExcludedIds = [...new Set(excludedQuestionIds.filter(Boolean))];
  const historyUserIdsSafe = [...new Set(historyUserIds.filter(Boolean))];

  const pushUniqueQuestions = (questionRows = []) => {
    const selectedIds = new Set(selectedQuestions.map((q) => q.id));
    for (const question of questionRows) {
      if (selectedIds.has(question.id)) continue;
      selectedQuestions.push(
        normalizeQuestion(question, { includeCorrectAnswer })
      );
      selectedIds.add(question.id);
      if (selectedQuestions.length >= normalizedLimit) break;
    }
  };

  for (const planItem of selectionPlan) {
    if (selectedQuestions.length >= normalizedLimit) break;
    const questionRows = await buildQuestionQuery({
      limit: planItem.count,
      category,
      difficulties: [planItem.difficulty],
      excludedQuestionIds: [
        ...historyExcludedIds,
        ...selectedQuestions.map((q) => q.id),
      ],
    });
    pushUniqueQuestions(questionRows);
  }

  if (historyUserIdsSafe.length && selectedQuestions.length < normalizedLimit) {
    for (const planItem of selectionPlan) {
      if (selectedQuestions.length >= normalizedLimit) break;
      const questionRows = await buildOldestHistoryQuestionQuery({
        userIds: historyUserIdsSafe,
        limit: Math.max(
          planItem.count,
          normalizedLimit - selectedQuestions.length
        ),
        category,
        difficulties: [planItem.difficulty],
        excludedQuestionIds: selectedQuestions.map((q) => q.id),
      });
      pushUniqueQuestions(questionRows);
    }
  }

  if (selectedQuestions.length < normalizedLimit) {
    const questionRows = await buildQuestionQuery({
      limit: normalizedLimit - selectedQuestions.length,
      category,
      difficulties: QUESTION_DIFFICULTIES,
      excludedQuestionIds: selectedQuestions.map((q) => q.id),
    });
    pushUniqueQuestions(questionRows);
  }

  return selectedQuestions.slice(0, normalizedLimit);
};
