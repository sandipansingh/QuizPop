import { Link } from 'react-router-dom';
import { Card } from '../../_shared/components/Card';

interface Player {
  user_id: string;
  username: string;
  total_score: number;
}

interface Props {
  players: Player[];
  isLoading: boolean;
  getProfilePath: (userId: string, username: string) => string;
}

export function HomeTopPlayers({ players, isLoading, getProfilePath }: Props) {
  return (
    <Card accent="pink">
      <h2 className="text-xl font-heading">Top Players</h2>
      {isLoading ? (
        <p className="text-muted-fg">Loading leaderboard...</p>
      ) : !players.length ? (
        <p className="text-muted-fg">No leaderboard entries yet.</p>
      ) : (
        <ol className="mt-3.5 p-0 list-none grid gap-2">
          {players.map((player) => (
            <li
              key={player.user_id}
              className="flex justify-between items-center border-2 border-border rounded-md px-3 py-2.5 bg-[color-mix(in_srgb,var(--color-muted)_80%,transparent)]"
            >
              <Link
                to={getProfilePath(player.user_id, player.username)}
                className="no-underline font-bold hover:underline"
              >
                {player.username}
              </Link>
              <strong>{player.total_score}</strong>
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}
