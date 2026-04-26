import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '../../../app/store/auth.store';
import { userService } from '../../../shared/services/user.service';
import { normalizeOverviewStats } from '../../../shared/utils/profile.utils';
import { useAvatarActions } from './useAvatarActions';
import type { User, UserStats } from '../../../shared/types';

export function useProfileData() {
  const setAuthUser = useAuthStore((state) => state.setUser);
  const authUser = useAuthStore((state) => state.user);
  const [profile, setProfile] = useState<User | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
        setAuthUser(profilePayload);
      } catch (err) {
        console.error('Failed to load profile:', err);
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

  return {
    profile,
    stats,
    isLoading,
    safeOverview,
    authUser,
    isUploadingAvatar: avatarActions.isUploadingAvatar,
    isRemovingAvatar: avatarActions.isRemovingAvatar,
    selectedAvatarFile: avatarActions.selectedAvatarFile,
    setSelectedAvatarFile: avatarActions.setSelectedAvatarFile,
    handleUploadAvatar: avatarActions.handleUploadAvatar,
    handleRemoveAvatar: avatarActions.handleRemoveAvatar,
    avatarError: avatarActions.avatarError,
  };
}
