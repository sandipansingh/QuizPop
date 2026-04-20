import { UserCircle2 } from 'lucide-react';

export function ProfileAvatarBlock({ avatarUrl, username }) {
  return (
    <div className="profile-avatar-wrap">
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={`${username} avatar`}
          className="profile-avatar"
        />
      ) : (
        <div className="profile-avatar profile-avatar--placeholder">
          <UserCircle2 size={54} />
        </div>
      )}
    </div>
  );
}
