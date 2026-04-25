import { Award } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { useAuthStore } from '../../app/store/auth.store';
import { usePageMeta } from '../../shared/hooks/usePageMeta';
import { RouteSpinner } from '../_shared/components/RouteSpinner';
import { Card } from '../_shared/components/Card';
import { FormMessage } from '../_shared/components/FormMessage';
import { ProfileAvatarBlock } from '../_shared/components/ProfileAvatarBlock';
import { userService } from '../../shared/services/user.service';
import { formatPercentage } from '../../shared/utils/formatters';
import { normalizeOverviewStats } from '../../shared/utils/profile.utils';
import type { PublicProfilePayload } from '../../shared/types';

export default function PlayerProfilePage() {
  const { username } = useParams<{ username: string }>();
  const currentUsername = useAuthStore((state) => state.user?.username);

  const [profilePayload, setProfilePayload] =
    useState<PublicProfilePayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  usePageMeta({
    title: profilePayload?.profile?.username
      ? `${profilePayload.profile.username} Profile`
      : 'Player Profile',
    description:
      'View a QuizPop player profile, including rank, quiz accuracy, and achievement progress.',
  });

  useEffect(() => {
    const fetchPlayerProfile = async () => {
      setIsLoading(true);
      setErrorMessage('');
      try {
        const data = await userService.getPublicProfileByUsername(
          username ?? ''
        );
        setProfilePayload(data);
      } catch (err) {
        setErrorMessage(
          (err as { message?: string }).message ??
            'Failed to load player profile.'
        );
      } finally {
        setIsLoading(false);
      }
    };
    void fetchPlayerProfile();
  }, [username]);

  const profile = profilePayload?.profile ?? null;
  const overview = useMemo(
    () => normalizeOverviewStats(profilePayload?.overview),
    [profilePayload]
  );

  if (currentUsername && username === currentUsername)
    return <Navigate to="/profile" replace />;
  if (isLoading) return <RouteSpinner label="Loading player profile..." />;

  return (
    <section className="grid gap-4">
      <div className="grid grid-cols-[1fr_1.2fr] gap-4 max-[960px]:grid-cols-1">
        <Card accent="pink" className="grid gap-2.5 content-start">
          <p className="inline-flex items-center gap-2 text-[0.78rem] uppercase tracking-[0.16em] font-bold text-muted-fg">
            Player Profile
          </p>
          <ProfileAvatarBlock
            avatarUrl={profile?.avatar_url}
            username={profile?.username ?? 'Player'}
          />
          <h2 className="text-2xl font-heading">
            {profile?.username ?? 'Player'}
          </h2>
          <p className="text-muted-fg">
            {profile?.bio ?? 'No bio shared yet.'}
          </p>
          <p className="text-muted-fg">
            Rank: <strong>{overview.rank}</strong>
          </p>
          <p className="text-muted-fg">
            Level: <strong>{profile?.level ?? 1}</strong>
          </p>
          <Link
            className="no-underline border-2 border-foreground rounded-full px-3.5 py-[7px] font-semibold w-fit bg-[color-mix(in_srgb,var(--color-tertiary)_80%,#fff)]"
            to="/home"
          >
            Back To Home
          </Link>
        </Card>

        <Card accent="mint">
          <h2 className="text-2xl font-heading">Competitive Stats</h2>
          <div className="mt-3.5 grid grid-cols-2 gap-3">
            {[
              { label: 'Quizzes', value: overview.total_quizzes_played },
              { label: 'Total Score', value: overview.total_score },
              {
                label: 'Accuracy',
                value: formatPercentage(overview.accuracy_percentage),
              },
              {
                label: 'Current Streak',
                value: `${overview.current_streak} days`,
              },
              {
                label: 'Longest Streak',
                value: `${overview.longest_streak} days`,
              },
              { label: 'Rating', value: profile?.rating_points ?? 0 },
            ].map(({ label, value }) => (
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
      </div>

      <Card accent="yellow">
        <h2 className="flex items-center gap-2 text-2xl font-heading">
          <Award size={18} /> Achievements
        </h2>
        <FormMessage message={errorMessage} tone="error" />
        {!profilePayload?.achievements?.length ? (
          <p className="text-muted-fg mt-3">No achievements unlocked yet.</p>
        ) : (
          <ul className="mt-3.5 p-0 list-none grid gap-2">
            {profilePayload.achievements.map((item) => (
              <li
                key={`${item.code}-${item.unlocked_at}`}
                className="border-2 border-border rounded-md px-3 py-2.5 bg-muted flex justify-between items-center"
              >
                <span>{item.title}</span>
                <strong>+{item.xp_reward} XP</strong>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </section>
  );
}
