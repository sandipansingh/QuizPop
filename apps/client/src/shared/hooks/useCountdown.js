import { useCallback, useEffect, useRef, useState } from 'react';

export function useCountdown({
  durationMs,
  isActive,
  resetKey,
  onExpire,
  intervalMs = 250,
}) {
  const [timeLeftMs, setTimeLeftMs] = useState(durationMs);
  const expireRef = useRef(onExpire);

  useEffect(() => {
    expireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    const resetHandle = window.setTimeout(() => {
      setTimeLeftMs(durationMs);
    }, 0);

    return () => {
      window.clearTimeout(resetHandle);
    };
  }, [durationMs, resetKey]);

  useEffect(() => {
    if (!isActive) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setTimeLeftMs((previous) => {
        if (previous <= intervalMs) {
          window.clearInterval(timer);
          expireRef.current?.();
          return 0;
        }

        return previous - intervalMs;
      });
    }, intervalMs);

    return () => {
      window.clearInterval(timer);
    };
  }, [intervalMs, isActive, resetKey]);

  const reset = useCallback(() => {
    setTimeLeftMs(durationMs);
  }, [durationMs]);

  return { timeLeftMs, reset };
}
