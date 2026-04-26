import { Camera, Trash2 } from 'lucide-react';
import { Button } from '../../_shared/components/Button';
import { Card } from '../../_shared/components/Card';
import { ProfileAvatarBlock } from '../../_shared/components/ProfileAvatarBlock';
import type { User } from '../../../shared/types';

interface Props {
  profile: User | null;
  authUsername?: string;
  selectedAvatarFile: File | null;
  isUploadingAvatar: boolean;
  isRemovingAvatar: boolean;
  onFileChange: (file: File | null) => void;
  onUpload: () => void;
  onRemove: () => void;
}

export function ProfileAvatarCard({
  profile,
  authUsername,
  selectedAvatarFile,
  isUploadingAvatar,
  isRemovingAvatar,
  onFileChange,
  onUpload,
  onRemove,
}: Props) {
  return (
    <Card accent="mint" className="grid gap-2.5 content-start">
      <p className="inline-flex items-center gap-2 text-[0.78rem] uppercase tracking-[0.16em] font-bold text-muted-fg">
        My Profile
      </p>
      <ProfileAvatarBlock
        avatarUrl={profile?.avatar_url}
        username={profile?.username ?? authUsername ?? 'Player'}
      />
      <h2 className="text-2xl font-heading">
        {profile?.username ?? authUsername ?? 'Player'}
      </h2>
      <p className="text-muted-fg">{profile?.bio ?? 'No bio yet.'}</p>
      <div className="grid gap-2.5">
        <input
          id="avatar-file"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="w-full border-2 border-dashed border-border rounded-md px-3 py-2.5 bg-white font-body text-muted-fg cursor-pointer avatar-file-input focus-visible:outline-none focus-visible:border-ring focus-visible:shadow-[4px_4px_0_0_var(--color-ring)]"
          onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
        />
        <Button
          variant="secondary"
          onClick={onUpload}
          loading={isUploadingAvatar}
          disabled={!selectedAvatarFile}
          icon={<Camera size={16} />}
        >
          Upload Picture
        </Button>
        <Button
          variant="ghost"
          onClick={onRemove}
          loading={isRemovingAvatar}
          disabled={!profile?.avatar_url}
          icon={<Trash2 size={16} />}
        >
          Remove Picture
        </Button>
      </div>
    </Card>
  );
}
