export interface OverviewStats {
  total_quizzes_played: number;
  total_score: number;
  accuracy_percentage: number;
  current_streak: number;
  longest_streak: number;
  rank: string;
}

export const DEFAULT_OVERVIEW_STATS: OverviewStats = {
  total_quizzes_played: 0,
  total_score: 0,
  accuracy_percentage: 0,
  current_streak: 0,
  longest_streak: 0,
  rank: 'Unranked',
};

export const normalizeOverviewStats = (
  overview: Partial<OverviewStats> | null | undefined
): OverviewStats => ({
  ...DEFAULT_OVERVIEW_STATS,
  ...(overview ?? {}),
});
