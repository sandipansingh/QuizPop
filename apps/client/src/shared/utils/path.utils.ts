interface BuildProfilePathParams {
  userId: string | undefined;
  username: string | undefined;
  currentUserId: string | undefined;
  currentUsername: string | undefined;
}

export const buildProfilePath = ({
  userId,
  username,
  currentUserId,
  currentUsername,
}: BuildProfilePathParams): string => {
  if (userId === currentUserId || username === currentUsername) {
    return '/profile';
  }

  return `/players/${encodeURIComponent(username ?? '')}`;
};

export const createProfilePathBuilder =
  ({
    currentUserId,
    currentUsername,
  }: {
    currentUserId: string | undefined;
    currentUsername: string | undefined;
  }) =>
  (userId: string | undefined, username: string | undefined): string =>
    buildProfilePath({ userId, username, currentUserId, currentUsername });
