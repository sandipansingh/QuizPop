import { useState } from 'react';
import toast from 'react-hot-toast';
import { userService } from '../../../shared/services/user.service';

export function useAvatarActions(onRefresh: () => Promise<void>) {
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isRemovingAvatar, setIsRemovingAvatar] = useState(false);
  const [selectedAvatarFile, setSelectedAvatarFile] = useState<File | null>(
    null
  );
  const [avatarError, setAvatarError] = useState('');

  const handleUploadAvatar = async () => {
    if (!selectedAvatarFile) {
      setAvatarError('Choose an image before uploading.');
      return;
    }
    setIsUploadingAvatar(true);
    setAvatarError('');
    try {
      await userService.uploadMyAvatar(selectedAvatarFile);
      setSelectedAvatarFile(null);
      await onRefresh();
      toast.success('Profile picture updated.');
    } catch (err) {
      setAvatarError(
        (err as { message?: string }).message ?? 'Avatar upload failed.'
      );
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleRemoveAvatar = async () => {
    setIsRemovingAvatar(true);
    setAvatarError('');
    try {
      await userService.deleteMyAvatar();
      await onRefresh();
      toast.success('Profile picture removed.');
    } catch (err) {
      setAvatarError(
        (err as { message?: string }).message ?? 'Could not remove avatar.'
      );
    } finally {
      setIsRemovingAvatar(false);
    }
  };

  return {
    isUploadingAvatar,
    isRemovingAvatar,
    selectedAvatarFile,
    avatarError,
    setSelectedAvatarFile,
    setAvatarError,
    handleUploadAvatar,
    handleRemoveAvatar,
  };
}
