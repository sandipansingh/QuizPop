import { Camera, Save, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../app/store/auth.store.js';
import { usePageMeta } from '../../shared/hooks/usePageMeta.js';
import { RouteSpinner } from '../_shared/components/RouteSpinner.jsx';
import { Button } from '../_shared/components/Button.jsx';
import { Card } from '../_shared/components/Card.jsx';
import { FormMessage } from '../_shared/components/FormMessage.jsx';
import { InputField } from '../_shared/components/InputField.jsx';
import { ProfileAvatarBlock } from '../_shared/components/ProfileAvatarBlock.jsx';
import { userService } from '../../shared/services/user.service.js';
import { formatPercentage } from '../../shared/utils/formatters.js';
import { normalizeOverviewStats } from '../../shared/utils/profile.utils.js';
import { isEmail } from '../../shared/utils/validators.js';

const DEFAULT_FORM = {
  username: '',
  email: '',
  bio: '',
};

export default function ProfilePage() {
  const setAuthUser = useAuthStore((state) => state.setUser);
  const authUser = useAuthStore((state) => state.user);

  usePageMeta({
    title: 'My Profile',
    description:
      'Manage your QuizPop profile, avatar, password, and performance stats from one place.',
  });

  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [profileForm, setProfileForm] = useState(DEFAULT_FORM);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isRemovingAvatar, setIsRemovingAvatar] = useState(false);
  const [selectedAvatarFile, setSelectedAvatarFile] = useState(null);
  const [isPasswordEditorOpen, setIsPasswordEditorOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordErrorMessage, setPasswordErrorMessage] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const safeOverview = useMemo(
    () => normalizeOverviewStats(stats?.overview),
    [stats]
  );

  const loadProfileData = useCallback(
    async ({ showLoader = true } = {}) => {
      if (showLoader) {
        setIsLoading(true);
      }

      try {
        const [profilePayload, statsPayload] = await Promise.all([
          userService.getMyProfile(),
          userService.getStats(),
        ]);

        setProfile(profilePayload);
        setStats(statsPayload);
        setProfileForm({
          username: profilePayload.username || '',
          email: profilePayload.email || '',
          bio: profilePayload.bio || '',
        });
        setAuthUser(profilePayload);
        setErrorMessage('');
      } catch (loadError) {
        setErrorMessage(loadError.message || 'Failed to load your profile.');
      } finally {
        setIsLoading(false);
      }
    },
    [setAuthUser]
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadProfileData({ showLoader: false });
  }, [loadProfileData]);

  const onFieldChange = (field) => (event) => {
    setProfileForm((current) => ({
      ...current,
      [field]: event.target.value,
    }));
    setErrorMessage('');
  };

  const validateForm = () => {
    if (
      !profileForm.username.trim() ||
      profileForm.username.trim().length < 3
    ) {
      return 'Username must be at least 3 characters.';
    }

    if (!isEmail(profileForm.email)) {
      return 'Enter a valid email address.';
    }

    if (profileForm.bio.length > 280) {
      return 'Bio must be 280 characters or less.';
    }

    return '';
  };

  const handleSave = async (event) => {
    event.preventDefault();
    const validationError = validateForm();

    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setIsSaving(true);
    setErrorMessage('');

    try {
      const updated = await userService.updateMyProfile({
        username: profileForm.username.trim(),
        email: profileForm.email.trim(),
        bio: profileForm.bio.trim() || null,
      });

      setProfile(updated);
      setAuthUser(updated);
      toast.success('Profile updated successfully.');
    } catch (saveError) {
      setErrorMessage(saveError.message || 'Could not update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUploadAvatar = async () => {
    if (!selectedAvatarFile) {
      setErrorMessage('Choose an image before uploading.');
      return;
    }

    setIsUploadingAvatar(true);
    setErrorMessage('');

    try {
      await userService.uploadMyAvatar(selectedAvatarFile);
      setSelectedAvatarFile(null);
      await loadProfileData();
      toast.success('Profile picture updated.');
    } catch (uploadError) {
      setErrorMessage(uploadError.message || 'Avatar upload failed.');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleRemoveAvatar = async () => {
    setIsRemovingAvatar(true);
    setErrorMessage('');

    try {
      await userService.deleteMyAvatar();
      await loadProfileData();
      toast.success('Profile picture removed.');
    } catch (removeError) {
      setErrorMessage(removeError.message || 'Could not remove avatar.');
    } finally {
      setIsRemovingAvatar(false);
    }
  };

  const onPasswordFieldChange = (field) => (event) => {
    setPasswordForm((current) => ({
      ...current,
      [field]: event.target.value,
    }));
    setPasswordErrorMessage('');
  };

  const handleChangePassword = async (event) => {
    event.preventDefault();

    if (passwordForm.newPassword.length < 8) {
      setPasswordErrorMessage('New password must be at least 8 characters.');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordErrorMessage('New password and confirmation must match.');
      return;
    }

    setIsChangingPassword(true);
    setPasswordErrorMessage('');

    try {
      await userService.changePassword({
        current_password: passwordForm.currentPassword,
        new_password: passwordForm.newPassword,
      });

      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      toast.success('Password changed successfully.');
    } catch (changeError) {
      setPasswordErrorMessage(
        changeError.message || 'Could not change password.'
      );
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (isLoading) {
    return <RouteSpinner label="Loading your profile..." />;
  }

  const showPasswordEditor = () => {
    setErrorMessage('');
    setIsPasswordEditorOpen(true);
  };

  const showProfileEditor = () => {
    setPasswordErrorMessage('');
    setIsPasswordEditorOpen(false);
  };

  return (
    <section className="profile-page">
      <div className="profile-grid">
        <Card accent="mint" className="profile-card profile-card--identity">
          <p className="eyebrow">My Profile</p>
          <ProfileAvatarBlock
            avatarUrl={profile?.avatar_url}
            username={profile?.username || authUser?.username || 'Player'}
          />

          <h2>{profile?.username || authUser?.username || 'Player'}</h2>
          <p className="muted">{profile?.bio || 'No bio yet.'}</p>

          <div className="profile-avatar-controls">
            <input
              id="avatar-file"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="profile-avatar-input"
              onChange={(event) =>
                setSelectedAvatarFile(event.target.files?.[0] || null)
              }
            />
            <Button
              variant="secondary"
              onClick={handleUploadAvatar}
              loading={isUploadingAvatar}
              disabled={!selectedAvatarFile}
              icon={<Camera size={16} />}
            >
              Upload Picture
            </Button>
            <Button
              variant="ghost"
              onClick={handleRemoveAvatar}
              loading={isRemovingAvatar}
              disabled={!profile?.avatar_url}
              icon={<Trash2 size={16} />}
            >
              Remove Picture
            </Button>
          </div>
        </Card>

        <Card accent="yellow" className="profile-card">
          {isPasswordEditorOpen ? (
            <>
              <h2>Change Password</h2>
              <form className="profile-form" onSubmit={handleChangePassword}>
                <InputField
                  id="current-password"
                  type="password"
                  label="Current Password"
                  value={passwordForm.currentPassword}
                  onChange={onPasswordFieldChange('currentPassword')}
                  autoComplete="current-password"
                />
                <InputField
                  id="new-password"
                  type="password"
                  label="New Password"
                  value={passwordForm.newPassword}
                  onChange={onPasswordFieldChange('newPassword')}
                  autoComplete="new-password"
                />
                <InputField
                  id="confirm-password"
                  type="password"
                  label="Confirm New Password"
                  value={passwordForm.confirmPassword}
                  onChange={onPasswordFieldChange('confirmPassword')}
                  autoComplete="new-password"
                />
                <FormMessage message={passwordErrorMessage} tone="error" />
                <Button type="submit" loading={isChangingPassword}>
                  Update Password
                </Button>
                <button
                  type="button"
                  className="profile-switch-link"
                  onClick={showProfileEditor}
                >
                  Back to edit profile
                </button>
              </form>
            </>
          ) : (
            <>
              <h2>Edit Profile</h2>
              <form className="profile-form" onSubmit={handleSave}>
                <InputField
                  id="profile-username"
                  label="Username"
                  value={profileForm.username}
                  onChange={onFieldChange('username')}
                  maxLength={30}
                />
                <InputField
                  id="profile-email"
                  type="email"
                  label="Email"
                  value={profileForm.email}
                  onChange={onFieldChange('email')}
                />
                <InputField
                  id="profile-bio"
                  label="Bio"
                  value={profileForm.bio}
                  onChange={onFieldChange('bio')}
                  maxLength={280}
                  placeholder="Share your quiz superpower"
                />
                <FormMessage message={errorMessage} tone="error" />
                <Button
                  type="submit"
                  loading={isSaving}
                  icon={<Save size={16} />}
                >
                  Save Changes
                </Button>
                <button
                  type="button"
                  className="profile-switch-link"
                  onClick={showPasswordEditor}
                >
                  Change password
                </button>
              </form>
            </>
          )}
        </Card>
      </div>

      <Card accent="violet" className="profile-card profile-card--stats">
        <h2>Performance Snapshot</h2>
        <div className="stats-grid">
          <div>
            <span>Quizzes</span>
            <strong>{safeOverview.total_quizzes_played}</strong>
          </div>
          <div>
            <span>Total Score</span>
            <strong>{safeOverview.total_score}</strong>
          </div>
          <div>
            <span>Accuracy</span>
            <strong>
              {formatPercentage(safeOverview.accuracy_percentage)}
            </strong>
          </div>
          <div>
            <span>Rank</span>
            <strong>{safeOverview.rank}</strong>
          </div>
          <div>
            <span>Current Streak</span>
            <strong>{safeOverview.current_streak} days</strong>
          </div>
          <div>
            <span>Longest Streak</span>
            <strong>{safeOverview.longest_streak} days</strong>
          </div>
        </div>
      </Card>
    </section>
  );
}
