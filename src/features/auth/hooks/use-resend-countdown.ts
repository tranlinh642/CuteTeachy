'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export interface UseResendCountdownOptions {
  readonly initialSeconds?: number;
  readonly autoStart?: boolean;
}

export function useResendCountdown(options: UseResendCountdownOptions = {}) {
  const { initialSeconds = 60, autoStart = false } = options;
  const [secondsLeft, setSecondsLeft] = useState(autoStart ? initialSeconds : 0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const start = useCallback(
    (seconds = initialSeconds) => {
      clearTimer();
      setSecondsLeft(seconds);

      if (seconds <= 0) return;

      timerRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            clearTimer();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    },
    [clearTimer, initialSeconds],
  );

  const reset = useCallback(() => {
    clearTimer();
    setSecondsLeft(0);
  }, [clearTimer]);

  useEffect(() => {
    if (autoStart) {
      start(initialSeconds);
    }
    return () => {
      clearTimer();
    };
  }, [autoStart, clearTimer, initialSeconds, start]);

  return {
    secondsLeft,
    isCounting: secondsLeft > 0,
    canResend: secondsLeft === 0,
    start,
    reset,
  };
}
