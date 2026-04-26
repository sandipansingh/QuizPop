import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../../app/store/auth.store';
import { userService } from '../../../shared/services/user.service';
import { normalizeOverviewStats } from '../../../shared/utils/profile.utils';
import { isEmail } from '../../../shared/utils/validators';
import { useAvatarActions } from './useAvatarActions';
import type { User, UserStats } from '../../../shared/types';

interface ProfileForm {
  username: string;
  email: string;
  bio: string;
}
const DEFAULT_FORM: ProfileForm = { username: '', email: '', bio: '' };

export function useProfileData() {
  const setAuthUser = useAuthStore((state) => state.setUser);
  const authUser = useAuthStore((state) => state.user);
  const [profile, setProfile] = useState<User | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [profileForm, setProfileForm] = useState<ProfileForm>(DEFAULT_FORM);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

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

  const avatarActions = useAvatarActions(loadProfileData);

  const onFieldChange =
    (field: keyof ProfileForm) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setProfileForm((c) => ({ ...c, [field]: e.target.value }));
      setErrorMessage('');
    };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !profileForm.username.trim() ||
      profileForm.username.trim().length < 3
    ) {
      setErrorMessage('Username must be at least 3 characters.');
      return;
    }
    if (!isEmail(profileForm.email)) {
      setErrorMessage('Enter a valid email address.');
      return;
    }
    if (profileForm.bio.length > 280) {
      setErrorMessage('Bio must be 280 characters or less.');
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

  return {
    profile,
    stats,
    profileForm,
    errorMessage: errorMessage || avatarActions.avatarError,
    isLoading,
    isSaving,
    safeOverview,
    authUser,
    onFieldChange,
    handleSave,
    setErrorMessage,
    isUploadingAvatar: avatarActions.isUploadingAvatar,
    isRemovingAvatar: avatarActions.isRemovingAvatar,
    selectedAvatarFile: avatarActions.selectedAvatarFile,
    setSelectedAvatarFile: avatarActions.setSelectedAvatarFile,
    handleUploadAvatar: avatarActions.handleUploadAvatar,
    handleRemoveAvatar: avatarActions.handleRemoveAvatar,
  };
}
