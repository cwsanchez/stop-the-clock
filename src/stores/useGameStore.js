import { create } from 'zustand';

const useGameStore = create((set, get) => ({
  mode: 'classic', // 'classic' | 'weenie' | 'fever' | 'journey'
  score: 0,
  personalBest: 0,
  bestStreak: 0,
  isNewBest: false,
  lastResult: null, // 'success' | 'fail' | null

  // Fever mode state
  currentMultiplier: 1,
  perfectStreak: 0,
  totalHits: 0,
  totalSeconds: 0,
  feverTotal: 0,
  feverRunActive: false,
  feverEnded: false,
  lastHitElapsedMs: 0,
  feverFinalScore: 0,
  feverEfficiency: 0,
  feverStartMs: 0,
  feverMultiplierResetNotified: false,

  setMode: (mode) => set({
    mode,
    score: 0,
    lastResult: null,
    isNewBest: false,
    currentMultiplier: 1,
    perfectStreak: 0,
    totalHits: 0,
    totalSeconds: 0,
    feverTotal: 0,
    feverRunActive: false,
    feverEnded: false,
    feverFinalScore: 0,
    feverEfficiency: 0,
    feverStartMs: 0,
    feverMultiplierResetNotified: false,
  }),

  incrementScore: () => {
    const { score, personalBest } = get();
    const newScore = score + 1;
    const isNewBest = newScore > personalBest;
    set({
      score: newScore,
      lastResult: 'success',
      isNewBest,
      personalBest: isNewBest ? newScore : personalBest,
      bestStreak: isNewBest ? newScore : get().bestStreak,
    });
  },

  failAttempt: () => set({ lastResult: 'fail' }),

  resetGame: () => set({ score: 0, lastResult: null, isNewBest: false }),

  setPersonalBest: (personalBest) => set({ personalBest }),
  setBestStreak: (bestStreak) => set({ bestStreak }),

  clearResult: () => set({ lastResult: null, isNewBest: false }),

  // Fever mode actions
  startFeverRun: (elapsedMs) => set({
    feverRunActive: true,
    feverEnded: false,
    currentMultiplier: 1,
    perfectStreak: 0,
    totalHits: 0,
    feverTotal: 0,
    feverFinalScore: 0,
    feverEfficiency: 0,
    feverStartMs: elapsedMs,
    lastHitElapsedMs: elapsedMs,
    lastResult: null,
    feverMultiplierResetNotified: false,
  }),

  feverHit: (elapsedMs, isPerfect) => {
    const { currentMultiplier, feverTotal, totalHits, perfectStreak } = get();
    const points = 1 * currentMultiplier;
    let newMultiplier = currentMultiplier;
    let newPerfectStreak = isPerfect ? perfectStreak + 1 : 0;

    if (isPerfect) {
      newMultiplier = Math.min(currentMultiplier + 0.5, 5);
    }

    set({
      feverTotal: feverTotal + points,
      totalHits: totalHits + 1,
      currentMultiplier: newMultiplier,
      perfectStreak: newPerfectStreak,
      lastHitElapsedMs: elapsedMs,
      lastResult: isPerfect ? 'perfect' : 'success',
      feverMultiplierResetNotified: false,
    });

    return { points, newMultiplier, oldMultiplier: currentMultiplier };
  },

  feverResetMultiplier: () => {
    const { feverMultiplierResetNotified } = get();
    if (!feverMultiplierResetNotified) {
      set({
        currentMultiplier: 1,
        perfectStreak: 0,
        feverMultiplierResetNotified: true,
      });
    }
  },

  endFeverRun: (elapsedMs) => {
    const { feverTotal, totalHits, feverStartMs } = get();
    const totalMs = elapsedMs - feverStartMs;
    const totalSecs = Math.max(totalMs / 1000, 0.1);
    const efficiency = totalHits / totalSecs;
    const finalScore = Math.round(feverTotal * efficiency * 100) / 100;

    set({
      feverRunActive: false,
      feverEnded: true,
      totalSeconds: totalSecs,
      feverFinalScore: finalScore,
      feverEfficiency: efficiency,
      lastResult: 'fail',
      score: Math.round(finalScore),
    });
  },

  resetFever: () => set({
    currentMultiplier: 1,
    perfectStreak: 0,
    totalHits: 0,
    totalSeconds: 0,
    feverTotal: 0,
    feverRunActive: false,
    feverEnded: false,
    lastHitElapsedMs: 0,
    feverFinalScore: 0,
    feverEfficiency: 0,
    feverStartMs: 0,
    lastResult: null,
    isNewBest: false,
    score: 0,
    feverMultiplierResetNotified: false,
  }),
}));

export default useGameStore;
