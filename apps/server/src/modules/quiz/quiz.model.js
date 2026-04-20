import { prisma } from '../../shared/db/connection.js';

export const quizModel = {
  findQuestions: ({ limit, category, difficulty }) =>
    prisma.question.findMany({
      where: {
        ...(category ? { category } : {}),
        ...(difficulty ? { difficulty } : {}),
      },
      take: limit,
      orderBy: { created_at: 'desc' },
      select: {
        id: true,
        question_text: true,
        options: true,
        difficulty: true,
        category: true,
        tags: true,
      },
    }),

  findQuestionsByIds: (questionIds) =>
    prisma.question.findMany({
      where: { id: { in: questionIds } },
      select: {
        id: true,
        category: true,
        difficulty: true,
        correct_answer: true,
      },
    }),

  findUserById: (userId) =>
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        total_score: true,
        total_quizzes_played: true,
        total_correct_answers: true,
        total_wrong_answers: true,
        average_time_per_question: true,
        rating_points: true,
        xp_points: true,
        current_streak: true,
        longest_streak: true,
        last_streak_date: true,
      },
    }),

  executeTransaction: (handler) => prisma.$transaction(handler),
};
