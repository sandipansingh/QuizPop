import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save } from 'lucide-react';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { usePageMeta } from '../../shared/hooks/usePageMeta';
import { RouteSpinner } from '../_shared/components/RouteSpinner';
import { Button } from '../_shared/components/Button';
import { Card } from '../_shared/components/Card';
import { FormMessage } from '../_shared/components/FormMessage';
import { InputField } from '../_shared/components/InputField';
import { ProfilePasswordForm } from './components/ProfilePasswordForm';
import { ProfileAvatarCard } from './components/ProfileAvatarCard';
import { ProfileStatsCard } from './components/ProfileStatsCard';
import { useProfileData } from './hooks/useProfileData';
import {
  updateProfileSchema,
  type UpdateProfileFormData,
} from '../../shared/validation/user.schemas';
import { userService } from '../../shared/services/user.service';
import { useAuthStore } from '../../app/store/auth.store';
import { getGeneralErrorMessage } from '../../shared/utils/error-mapper';
import type { ApiError } from '../../shared/api/response';

export default function ProfilePage() {
  const [isPasswordEditorOpen, setIsPasswordEditorOpen] = useState(false);
  const setAuthUser = useAuthStore((state) => state.setUser);

  usePageMeta({
    title: 'My Profile',
    description:
      'Manage your QuizPop profile, avatar, password, and performance stats from one place.',
  });

  const {
    profile,
    isLoading,
    safeOverview,
    authUser,
    isUploadingAvatar,
    isRemovingAvatar,
    selectedAvatarFile,
    setSelectedAvatarFile,
    handleUploadAvatar,
    handleRemoveAvatar,
    avatarError,
  } = useProfileData();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    reset,
  } = useForm<UpdateProfileFormData>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      username: '',
      email: '',
      bio: '',
    },
  });

  useEffect(() => {
    if (profile) {
      reset({
        username: profile.username ?? '',
        email: profile.email ?? '',
        bio: profile.bio ?? '',
      });
    }
  }, [profile, reset]);

  if (isLoading) return <RouteSpinner label="Loading your profile..." />;

  const onSubmit = async (data: UpdateProfileFormData) => {
    try {
      const updated = await userService.updateMyProfile({
        username: data.username.trim(),
        email: data.email.trim(),
        bio: data.bio?.trim() || null,
      });
      setAuthUser(updated);
      toast.success('Profile updated successfully.');
    } catch (err) {
      const apiError = err as ApiError;
      setError('root', {
        message: getGeneralErrorMessage(apiError),
      });
      toast.error('Could not update profile.');
    }
  };

  return (
    <section className="grid gap-4">
      <div className="grid grid-cols-[1fr_1.2fr] gap-4 max-[960px]:grid-cols-1">
        <ProfileAvatarCard
          profile={profile}
          authUsername={authUser?.username}
          selectedAvatarFile={selectedAvatarFile}
          isUploadingAvatar={isUploadingAvatar}
          isRemovingAvatar={isRemovingAvatar}
          onFileChange={setSelectedAvatarFile}
          onUpload={handleUploadAvatar}
          onRemove={handleRemoveAvatar}
        />

        <Card accent="yellow">
          {isPasswordEditorOpen ? (
            <ProfilePasswordForm
              onBack={() => setIsPasswordEditorOpen(false)}
            />
          ) : (
            <>
              <h2 className="text-2xl font-heading">Edit Profile</h2>
              <form
                className="mt-2.5 grid gap-3"
                onSubmit={handleSubmit(onSubmit)}
              >
                <InputField
                  id="profile-username"
                  label="Username"
                  maxLength={30}
                  error={errors.username?.message}
                  {...register('username')}
                />
                <InputField
                  id="profile-email"
                  type="email"
                  label="Email"
                  error={errors.email?.message}
                  {...register('email')}
                />
                <InputField
                  id="profile-bio"
                  label="Bio"
                  maxLength={280}
                  placeholder="Share your quiz superpower"
                  error={errors.bio?.message}
                  {...register('bio')}
                />
                <FormMessage
                  message={errors.root?.message || avatarError}
                  tone="error"
                />
                <Button
                  type="submit"
                  loading={isSubmitting}
                  icon={<Save size={16} />}
                >
                  Save Changes
                </Button>
                <button
                  type="button"
                  className="border-0 bg-transparent text-accent font-body font-bold text-[0.92rem] cursor-pointer p-0 w-fit underline underline-offset-[3px] hover:text-[color-mix(in_srgb,var(--color-accent)_80%,#0f172a)]"
                  onClick={() => setIsPasswordEditorOpen(true)}
                >
                  Change password
                </button>
              </form>
            </>
          )}
        </Card>
      </div>

      <ProfileStatsCard overview={safeOverview} />
    </section>
  );
}
