import { useCallback, useRef } from 'react';

let audioCtx = null;

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
}

export default function useSound() {
  const lastPlayedRef = useRef(0);

  const playTone = useCallback((frequency, duration, type = 'sine', volume = 0.15) => {
    const now = Date.now();
    if (now - lastPlayedRef.current < 100) return;
    lastPlayedRef.current = now;

    try {
      const ctx = getAudioContext();
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();

      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
      gain.gain.setValueAtTime(volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

      oscillator.connect(gain);
      gain.connect(ctx.destination);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + duration);
    } catch (e) {
      // Audio may not be available
    }
  }, []);

  const playSuccess = useCallback(() => {
    playTone(880, 0.15, 'sine', 0.12);
    setTimeout(() => playTone(1100, 0.2, 'sine', 0.1), 100);
  }, [playTone]);

  const playFail = useCallback(() => {
    playTone(220, 0.3, 'sawtooth', 0.08);
  }, [playTone]);

  const playNewBest = useCallback(() => {
    playTone(660, 0.1, 'sine', 0.12);
    setTimeout(() => playTone(880, 0.1, 'sine', 0.12), 100);
    setTimeout(() => playTone(1100, 0.15, 'sine', 0.12), 200);
    setTimeout(() => playTone(1320, 0.3, 'sine', 0.15), 300);
  }, [playTone]);

  return { playSuccess, playFail, playNewBest };
}
