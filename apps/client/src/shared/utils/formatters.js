export const formatSeconds = (ms) => Math.max(0, Math.ceil(ms / 1000));

export const formatDuration = (ms) => {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, '0');
  const seconds = (totalSeconds % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
};

export const formatPercentage = (value) => {
  const numeric = Number(value || 0);
  return `${numeric.toFixed(1)}%`;
};

export const safeNumber = (value, fallback = 0) => {
  const numeric = Number(value);
  if (Number.isNaN(numeric)) {
    return fallback;
  }

  return numeric;
};
