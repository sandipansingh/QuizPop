import { UserCircle2 } from 'lucide-react';

interface ProfileAvatarBlockProps {
  avatarUrl?: string | null;
  username?: string;
}

export function ProfileAvatarBlock({
  avatarUrl,
  username,
}: ProfileAvatarBlockProps) {
  return (
    <div className="flex justify-start">
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={`${username ?? 'User'} avatar`}
          className="w-28 h-28 rounded-full border-2 border-foreground object-cover bg-muted"
        />
      ) : (
        <div className="w-28 h-28 rounded-full border-2 border-foreground bg-muted grid place-items-center">
          <UserCircle2 size={54} />
        </div>
      )}
    </div>
  );
}
