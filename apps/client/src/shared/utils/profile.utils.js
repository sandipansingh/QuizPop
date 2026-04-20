export const DEFAULT_OVERVIEW_STATS = {
  total_quizzes_played: 0,
  total_score: 0,
  accuracy_percentage: 0,
  current_streak: 0,
  longest_streak: 0,
  rank: 'Unranked',
};

export const normalizeOverviewStats = (overview) => ({
  ...DEFAULT_OVERVIEW_STATS,
  ...(overview || {}),
});
