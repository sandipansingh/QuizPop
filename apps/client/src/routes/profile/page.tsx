import { Camera, Save, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../app/store/auth.store';
import { usePageMeta } from '../../shared/hooks/usePageMeta';
import { RouteSpinner } from '../_shared/components/RouteSpinner';
import { Button } from '../_shared/components/Button';
import { Card } from '../_shared/components/Card';
import { FormMessage } from '../_shared/components/FormMessage';
import { InputField } from '../_shared/components/InputField';
import { ProfileAvatarBlock } from '../_shared/components/ProfileAvatarBlock';
import { userService } from '../../shared/services/user.service';
import { formatPercentage } from '../../shared/utils/formatters';
import { normalizeOverviewStats } from '../../shared/utils/profile.utils';
import { isEmail } from '../../shared/utils/validators';
import type { User, UserStats } from '../../shared/types';

interface ProfileForm {
  username: string;
  email: string;
  bio: string;
}
interface PasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const DEFAULT_FORM: ProfileForm = { username: '', email: '', bio: '' };

export default function ProfilePage() {
  const setAuthUser = useAuthStore((state) => state.setUser);
  const authUser = useAuthStore((state) => state.user);

  usePageMeta({
    title: 'My Profile',
    description:
      'Manage your QuizPop profile, avatar, password, and performance stats from one place.',
  });

  const [profile, setProfile] = useState<User | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [profileForm, setProfileForm] = useState<ProfileForm>(DEFAULT_FORM);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isRemovingAvatar, setIsRemovingAvatar] = useState(false);
  const [selectedAvatarFile, setSelectedAvatarFile] = useState<File | null>(
    null
  );
  const [isPasswordEditorOpen, setIsPasswordEditorOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState<PasswordForm>({
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
    async ({ showLoader = true }: { showLoader?: boolean } = {}) => {
      if (showLoader) setIsLoading(true);
      try {
        const [profilePayload, statsPayload] = await Promise.all([
          userService.getMyProfile(),
          userService.getStats(),
        ]);
        setProfile(profilePayload);
        setStats(statsPayload);
        setProfileForm({
          username: profilePayload.username ?? '',
          email: profilePayload.email ?? '',
          bio: profilePayload.bio ?? '',
        });
        setAuthUser(profilePayload);
        setErrorMessage('');
      } catch (err) {
        setErrorMessage(
          (err as { message?: string }).message ??
            'Failed to load your profile.'
        );
      } finally {
        setIsLoading(false);
      }
    },
    [setAuthUser]
  );

  useEffect(() => {
    void loadProfileData({ showLoader: false });
  }, [loadProfileData]);

  const onFieldChange =
    (field: keyof ProfileForm) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setProfileForm((c) => ({ ...c, [field]: e.target.value }));
      setErrorMessage('');
    };

  const validateForm = (): string => {
    if (!profileForm.username.trim() || profileForm.username.trim().length < 3)
      return 'Username must be at least 3 characters.';
    if (!isEmail(profileForm.email)) return 'Enter a valid email address.';
    if (profileForm.bio.length > 280)
      return 'Bio must be 280 characters or less.';
    return '';
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validateForm();
    if (err) {
      setErrorMessage(err);
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
    } catch (saveErr) {
      setErrorMessage(
        (saveErr as { message?: string }).message ?? 'Could not update profile.'
      );
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
    } catch (err) {
      setErrorMessage(
        (err as { message?: string }).message ?? 'Avatar upload failed.'
      );
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
    } catch (err) {
      setErrorMessage(
        (err as { message?: string }).message ?? 'Could not remove avatar.'
      );
    } finally {
      setIsRemovingAvatar(false);
    }
  };

  const onPasswordFieldChange =
    (field: keyof PasswordForm) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setPasswordForm((c) => ({ ...c, [field]: e.target.value }));
      setPasswordErrorMessage('');
    };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
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
    } catch (err) {
      setPasswordErrorMessage(
        (err as { message?: string }).message ?? 'Could not change password.'
      );
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (isLoading) return <RouteSpinner label="Loading your profile..." />;

  return (
    <section className="grid gap-4">
      <div className="grid grid-cols-[1fr_1.2fr] gap-4 max-[960px]:grid-cols-1">
        <Card accent="mint" className="grid gap-2.5 content-start">
          <p className="inline-flex items-center gap-2 text-[0.78rem] uppercase tracking-[0.16em] font-bold text-muted-fg">
            My Profile
          </p>
          <ProfileAvatarBlock
            avatarUrl={profile?.avatar_url}
            username={profile?.username ?? authUser?.username ?? 'Player'}
          />
          <h2 className="text-2xl font-heading">
            {profile?.username ?? authUser?.username ?? 'Player'}
          </h2>
          <p className="text-muted-fg">{profile?.bio ?? 'No bio yet.'}</p>
          <div className="grid gap-2.5">
            <input
              id="avatar-file"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="w-full border-2 border-dashed border-border rounded-md px-3 py-2.5 bg-white font-body text-muted-fg cursor-pointer avatar-file-input focus-visible:outline-none focus-visible:border-ring focus-visible:shadow-[4px_4px_0_0_var(--color-ring)]"
              onChange={(e) =>
                setSelectedAvatarFile(e.target.files?.[0] ?? null)
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

        <Card accent="yellow">
          {isPasswordEditorOpen ? (
            <>
              <h2 className="text-2xl font-heading">Change Password</h2>
              <form
                className="mt-2.5 grid gap-3"
                onSubmit={handleChangePassword}
              >
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
                  className="border-0 bg-transparent text-accent font-body font-bold text-[0.92rem] cursor-pointer p-0 w-fit underline underline-offset-[3px] hover:text-[color-mix(in_srgb,var(--color-accent)_80%,#0f172a)]"
                  onClick={() => {
                    setPasswordErrorMessage('');
                    setIsPasswordEditorOpen(false);
                  }}
                >
                  Back to edit profile
                </button>
              </form>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-heading">Edit Profile</h2>
              <form className="mt-2.5 grid gap-3" onSubmit={handleSave}>
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
                  className="border-0 bg-transparent text-accent font-body font-bold text-[0.92rem] cursor-pointer p-0 w-fit underline underline-offset-[3px] hover:text-[color-mix(in_srgb,var(--color-accent)_80%,#0f172a)]"
                  onClick={() => {
                    setErrorMessage('');
                    setIsPasswordEditorOpen(true);
                  }}
                >
                  Change password
                </button>
              </form>
            </>
          )}
        </Card>
      </div>

      <Card accent="violet">
        <h2 className="text-2xl font-heading">Performance Snapshot</h2>
        <div className="mt-3.5 grid grid-cols-3 gap-3 max-[960px]:grid-cols-2">
          {[
            { label: 'Quizzes', value: safeOverview.total_quizzes_played },
            { label: 'Total Score', value: safeOverview.total_score },
            {
              label: 'Accuracy',
              value: formatPercentage(safeOverview.accuracy_percentage),
            },
            { label: 'Rank', value: safeOverview.rank },
            {
              label: 'Current Streak',
              value: `${safeOverview.current_streak} days`,
            },
            {
              label: 'Longest Streak',
              value: `${safeOverview.longest_streak} days`,
            },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="border-2 border-border rounded-md p-2.5 bg-muted"
            >
              <span className="block text-[0.75rem] uppercase tracking-[0.08em] text-muted-fg">
                {label}
              </span>
              <strong className="text-[1.1rem] font-heading">
                {value}
              </strong>
            </div>
          ))}
        </div>
      </Card>
    </section>
  );
}
