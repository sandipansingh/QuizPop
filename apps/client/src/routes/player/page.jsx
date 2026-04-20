import { Award } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { useAuthStore } from '../../app/store/auth.store.js';
import { usePageMeta } from '../../shared/hooks/usePageMeta.js';
import { RouteSpinner } from '../_shared/components/RouteSpinner.jsx';
import { Card } from '../_shared/components/Card.jsx';
import { FormMessage } from '../_shared/components/FormMessage.jsx';
import { ProfileAvatarBlock } from '../_shared/components/ProfileAvatarBlock.jsx';
import { userService } from '../../shared/services/user.service.js';
import { formatPercentage } from '../../shared/utils/formatters.js';
import { normalizeOverviewStats } from '../../shared/utils/profile.utils.js';

export default function PlayerProfilePage() {
  const { username } = useParams();
  const currentUsername = useAuthStore((state) => state.user?.username);

  const [profilePayload, setProfilePayload] = useState(null);
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
        const data = await userService.getPublicProfileByUsername(username);
        setProfilePayload(data);
      } catch (loadError) {
        setErrorMessage(loadError.message || 'Failed to load player profile.');
      } finally {
        setIsLoading(false);
      }
    };

    void fetchPlayerProfile();
  }, [username]);

  const profile = profilePayload?.profile || null;
  const overview = useMemo(
    () => normalizeOverviewStats(profilePayload?.overview),
    [profilePayload]
  );

  if (currentUsername && username === currentUsername) {
    return <Navigate to="/profile" replace />;
  }

  if (isLoading) {
    return <RouteSpinner label="Loading player profile..." />;
  }

  return (
    <section className="profile-page">
      <div className="profile-grid">
        <Card accent="pink" className="profile-card profile-card--identity">
          <p className="eyebrow">Player Profile</p>
          <ProfileAvatarBlock
            avatarUrl={profile?.avatar_url}
            username={profile?.username || 'Player'}
          />
          <h2>{profile?.username || 'Player'}</h2>
          <p className="muted">{profile?.bio || 'No bio shared yet.'}</p>
          <p className="muted">
            Rank: <strong>{overview.rank}</strong>
          </p>
          <p className="muted">
            Level: <strong>{profile?.level || 1}</strong>
          </p>
          <Link className="top-nav__link top-nav__link--active" to="/home">
            Back To Home
          </Link>
        </Card>

        <Card accent="mint" className="profile-card">
          <h2>Competitive Stats</h2>
          <div className="stats-grid">
            <div>
              <span>Quizzes</span>
              <strong>{overview.total_quizzes_played}</strong>
            </div>
            <div>
              <span>Total Score</span>
              <strong>{overview.total_score}</strong>
            </div>
            <div>
              <span>Accuracy</span>
              <strong>{formatPercentage(overview.accuracy_percentage)}</strong>
            </div>
            <div>
              <span>Current Streak</span>
              <strong>{overview.current_streak} days</strong>
            </div>
            <div>
              <span>Longest Streak</span>
              <strong>{overview.longest_streak} days</strong>
            </div>
            <div>
              <span>Rating</span>
              <strong>{profile?.rating_points || 0}</strong>
            </div>
          </div>
        </Card>
      </div>

      <Card accent="yellow" className="profile-card">
        <h2>
          <Award size={18} /> Achievements
        </h2>
        <FormMessage message={errorMessage} tone="error" />
        {!profilePayload?.achievements?.length ? (
          <p className="muted">No achievements unlocked yet.</p>
        ) : (
          <ul className="achievement-list">
            {profilePayload.achievements.map((item) => (
              <li key={`${item.code}-${item.unlocked_at}`}>
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
