export const buildProfilePath = ({
  userId,
  username,
  currentUserId,
  currentUsername,
}) => {
  if (userId === currentUserId || username === currentUsername) {
    return '/profile';
  }

  return `/players/${encodeURIComponent(username)}`;
};

export const createProfilePathBuilder =
  ({ currentUserId, currentUsername }) =>
  (userId, username) =>
    buildProfilePath({
      userId,
      username,
      currentUserId,
      currentUsername,
    });
