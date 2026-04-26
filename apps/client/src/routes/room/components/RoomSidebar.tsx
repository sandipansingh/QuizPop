import { Crown, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useRoomStore } from '../../../app/store/room.store';
import { Card } from '../../_shared/components/Card';

interface Props {
  roomHostId?: string;
  getProfilePath: (userId: string, username: string) => string;
}

export function RoomSidebar({ roomHostId, getProfilePath }: Props) {
  const players = useRoomStore((state) => state.players);
  const leaderboard = useRoomStore((state) => state.leaderboard);

  return (
    <div className="grid gap-3.5">
      <Card accent="pink">
        <h2 className="flex items-center gap-2 text-xl font-heading">
          <Users size={18} /> Players
        </h2>
        <ul className="mt-3 p-0 list-none grid gap-2">
          {players.map((player) => (
            <li
              key={player.user_id}
              className="border-2 border-border rounded-md p-2.5 bg-muted flex justify-between items-center"
            >
              <Link
                to={getProfilePath(player.user_id, player.username)}
                className="no-underline font-semibold hover:underline"
              >
                {player.username}
              </Link>
              {player.user_id === roomHostId ? <Crown size={14} /> : null}
            </li>
          ))}
        </ul>
      </Card>
      <Card accent="violet">
        <h2 className="text-xl font-heading">Live Leaderboard</h2>
        <ol className="mt-3.5 p-0 list-none grid gap-2">
          {leaderboard.map((item) => (
            <li
              key={item.user_id}
              className="flex justify-between items-center border-2 border-border rounded-md px-3 py-2.5 bg-[color-mix(in_srgb,var(--color-muted)_80%,transparent)]"
            >
              <span>
                #{item.rank}{' '}
                <Link
                  to={getProfilePath(item.user_id, item.username)}
                  className="font-bold no-underline hover:underline"
                >
                  {item.username}
                </Link>
              </span>
              <strong className="text-accent">{item.score}</strong>
            </li>
          ))}
        </ol>
      </Card>
    </div>
  );
}
