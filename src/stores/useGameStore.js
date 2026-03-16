import { create } from 'zustand';

const useGameStore = create((set, get) => ({
  username: '',
  score: 0,
  personalBest: 0,
  isNewBest: false,
  lastResult: null, // 'success' | 'fail' | null

  setUsername: (username) => set({ username }),

  incrementScore: () => {
    const { score, personalBest } = get();
    const newScore = score + 1;
    const isNewBest = newScore > personalBest;
    set({
      score: newScore,
      lastResult: 'success',
      isNewBest,
      personalBest: isNewBest ? newScore : personalBest,
    });
  },

  failAttempt: () => set({ lastResult: 'fail' }),

  resetGame: () => set({ score: 0, lastResult: null, isNewBest: false }),

  setPersonalBest: (personalBest) => set({ personalBest }),

  clearResult: () => set({ lastResult: null, isNewBest: false }),
}));

export default useGameStore;
