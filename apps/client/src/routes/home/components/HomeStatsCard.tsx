import { Flag } from 'lucide-react';
import { Card } from '../../_shared/components/Card';
import { formatPercentage } from '../../../shared/utils/formatters';

interface Stats {
  total_quizzes_played: number;
  total_score: number;
  accuracy_percentage: number;
  current_streak: number;
  rank: string;
}

interface Props {
  stats: Stats;
}

export function HomeStatsCard({ stats }: Props) {
  const items = [
    { label: 'Quizzes', value: stats.total_quizzes_played },
    { label: 'Total Score', value: stats.total_score },
    { label: 'Accuracy', value: formatPercentage(stats.accuracy_percentage) },
    { label: 'Current Streak', value: `${stats.current_streak} days` },
  ];

  return (
    <Card accent="mint">
      <h2 className="text-xl font-heading">My Snapshot</h2>
      <div className="mt-3.5 grid grid-cols-2 gap-3">
        {items.map(({ label, value }) => (
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
      <p className="mt-3.5 inline-flex items-center gap-2">
        <Flag size={16} /> Rank: <strong>{stats.rank}</strong>
      </p>
    </Card>
  );
}
