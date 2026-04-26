import { Save } from 'lucide-react';
import { useState } from 'react';
import { usePageMeta } from '../../shared/hooks/usePageMeta';
import { RouteSpinner } from '../_shared/components/RouteSpinner';
import { Button } from '../_shared/components/Button';
import { Card } from '../_shared/components/Card';
import { FormMessage } from '../_shared/components/FormMessage';
import { InputField } from '../_shared/components/InputField';
import { ProfilePasswordForm } from './components/ProfilePasswordForm';
import { ProfileAvatarCard } from './components/ProfileAvatarCard';
import { ProfileStatsCard } from './components/ProfileStatsCard';
import { useProfileData } from './components/useProfileData';

export default function ProfilePage() {
  const [isPasswordEditorOpen, setIsPasswordEditorOpen] = useState(false);

  usePageMeta({
    title: 'My Profile',
    description:
      'Manage your QuizPop profile, avatar, password, and performance stats from one place.',
  });

  const {
    profile,
    profileForm,
    errorMessage,
    isLoading,
    isSaving,
    isUploadingAvatar,
    isRemovingAvatar,
    selectedAvatarFile,
    safeOverview,
    authUser,
    setSelectedAvatarFile,
    onFieldChange,
    handleSave,
    handleUploadAvatar,
    handleRemoveAvatar,
    setErrorMessage,
  } = useProfileData();

  if (isLoading) return <RouteSpinner label="Loading your profile..." />;

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

      <ProfileStatsCard overview={safeOverview} />
    </section>
  );
}
