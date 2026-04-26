export const upsertCategoryStats = async ({ tx, userId, categoryStats }) => {
  await Promise.all(
    categoryStats.map(async (stats) => {
      const existing = await tx.userCategoryPerformance.findUnique({
        where: {
          user_id_category: { user_id: userId, category: stats.category },
        },
        select: {
          total_attempts: true,
          correct_answers: true,
          wrong_answers: true,
        },
      });
      const nextTotal = (existing?.total_attempts || 0) + stats.total_attempts;
      const nextCorrect =
        (existing?.correct_answers || 0) + stats.correct_answers;
      const nextWrong = (existing?.wrong_answers || 0) + stats.wrong_answers;
      const nextAccuracy = Number(
        ((nextCorrect / Math.max(1, nextTotal)) * 100).toFixed(2)
      );
      await tx.userCategoryPerformance.upsert({
        where: {
          user_id_category: { user_id: userId, category: stats.category },
        },
        create: {
          user_id: userId,
          category: stats.category,
          total_attempts: nextTotal,
          correct_answers: nextCorrect,
          wrong_answers: nextWrong,
          accuracy: nextAccuracy,
        },
        update: {
          total_attempts: nextTotal,
          correct_answers: nextCorrect,
          wrong_answers: nextWrong,
          accuracy: nextAccuracy,
        },
      });
    })
  );
};
