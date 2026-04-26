import { Card } from '../../_shared/components/Card';
import { formatPercentage } from '../../../shared/utils/formatters';

interface OverviewStats {
  total_quizzes_played: number;
  total_score: number;
  accuracy_percentage: number;
  rank: string;
  current_streak: number;
  longest_streak: number;
}

interface Props {
  overview: OverviewStats;
}

export function ProfileStatsCard({ overview }: Props) {
  const stats = [
    { label: 'Quizzes', value: overview.total_quizzes_played },
    { label: 'Total Score', value: overview.total_score },
    {
      label: 'Accuracy',
      value: formatPercentage(overview.accuracy_percentage),
    },
    { label: 'Rank', value: overview.rank },
    { label: 'Current Streak', value: `${overview.current_streak} days` },
    { label: 'Longest Streak', value: `${overview.longest_streak} days` },
  ];

  return (
    <Card accent="violet">
      <h2 className="text-2xl font-heading">Performance Snapshot</h2>
      <div className="mt-3.5 grid grid-cols-3 gap-3 max-[960px]:grid-cols-2">
        {stats.map(({ label, value }) => (
          <div
            key={label}
            className="border-2 border-border rounded-md p-2.5 bg-muted"
          >
            <span className="block text-[0.75rem] uppercase tracking-[0.08em] text-muted-fg">
              {label}
            </span>
            <strong className="text-[1.1rem] font-heading">{value}</strong>
          </div>
        ))}
      </div>
    </Card>
  );
}
