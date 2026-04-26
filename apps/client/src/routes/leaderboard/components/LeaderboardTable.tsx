import { formatPercentage } from '../../../shared/utils/formatters';
import type { LeaderboardRow } from '../../../shared/types';
import { Link } from 'react-router-dom';

interface Props {
  rows: LeaderboardRow[];
  getProfilePath: (userId: string, username: string) => string;
}

export function LeaderboardTable({ rows, getProfilePath }: Props) {
  return (
    <div
      className="mt-4 overflow-x-auto border-2 border-border rounded-md bg-white"
      role="region"
      aria-label="Top players leaderboard"
    >
      <table className="w-full border-collapse min-w-[680px]">
        <thead>
          <tr>
            {['#', 'Player', 'Score', 'Accuracy', 'Quizzes', 'Rank Tier'].map(
              (h) => (
                <th
                  key={h}
                  scope="col"
                  className="text-left px-3 py-2.5 border-b border-border bg-[color-mix(in_srgb,var(--color-muted)_70%,#ffffff)] text-[0.8rem] uppercase tracking-[0.06em]"
                >
                  {h}
                </th>
              )
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((player) => (
            <tr key={player.user_id}>
              <td className="px-3 py-2.5 border-b border-border">
                {player.global_rank}
              </td>
              <td className="px-3 py-2.5 border-b border-border">
                <Link
                  to={getProfilePath(player.user_id, player.username)}
                  className="font-bold no-underline hover:underline"
                >
                  {player.username}
                </Link>
              </td>
              <td className="px-3 py-2.5 border-b border-border">
                {player.total_score}
              </td>
              <td className="px-3 py-2.5 border-b border-border">
                {formatPercentage(player.accuracy_percentage)}
              </td>
              <td className="px-3 py-2.5 border-b border-border">
                {player.total_quizzes_played}
              </td>
              <td className="px-3 py-2.5 border-b border-border">
                {player.rank}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
