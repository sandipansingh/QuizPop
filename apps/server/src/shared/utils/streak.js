const getStartOfDay = (dateValue) => {
  const date = new Date(dateValue);
  date.setHours(0, 0, 0, 0);
  return date;
};

export const calculateStreakUpdate = ({
  lastStreakDate,
  currentStreak,
  longestStreak,
  now = new Date(),
}) => {
  const today = getStartOfDay(now);

  if (!lastStreakDate) {
    return {
      currentStreak: 1,
      longestStreak: Math.max(1, longestStreak),
      changed: true,
    };
  }

  const lastDay = getStartOfDay(lastStreakDate);
  const diffDays = Math.round((today - lastDay) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return { currentStreak, longestStreak, changed: false };
  }

  if (diffDays === 1) {
    const nextStreak = currentStreak + 1;
    return {
      currentStreak: nextStreak,
      longestStreak: Math.max(longestStreak, nextStreak),
      changed: true,
    };
  }

  return {
    currentStreak: 1,
    longestStreak: Math.max(longestStreak, 1),
    changed: true,
  };
};
