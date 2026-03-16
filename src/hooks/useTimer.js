import { useRef, useCallback, useEffect } from 'react';
import useTimerStore from '../stores/useTimerStore';

export default function useTimer() {
  const { running, setElapsedMs } = useTimerStore();
  const startTimeRef = useRef(null);
  const baseElapsedRef = useRef(0);
  const rafRef = useRef(null);

  const tick = useCallback(() => {
    if (startTimeRef.current !== null) {
      const now = performance.now();
      const elapsed = baseElapsedRef.current + (now - startTimeRef.current);
      setElapsedMs(elapsed);
    }
    rafRef.current = requestAnimationFrame(tick);
  }, [setElapsedMs]);

  useEffect(() => {
    if (running) {
      startTimeRef.current = performance.now();
      rafRef.current = requestAnimationFrame(tick);
    } else {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      if (startTimeRef.current !== null) {
        const now = performance.now();
        baseElapsedRef.current += now - startTimeRef.current;
        startTimeRef.current = null;
      }
    }

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [running, tick]);

  const reset = useCallback(() => {
    startTimeRef.current = null;
    baseElapsedRef.current = 0;
    setElapsedMs(0);
  }, [setElapsedMs]);

  return { reset };
}
