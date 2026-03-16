import { create } from 'zustand';

const useTimerStore = create((set) => ({
  elapsedMs: 0,
  running: false,
  phase: 'idle', // 'idle' | 'running' | 'stopped-success' | 'stopped-fail'

  setElapsedMs: (ms) => set({ elapsedMs: ms }),
  setRunning: (running) => set({ running }),
  setPhase: (phase) => set({ phase }),

  startTimer: () => set({ running: true, phase: 'running' }),

  stopTimer: (wasSuccess) =>
    set({
      running: false,
      phase: wasSuccess ? 'stopped-success' : 'stopped-fail',
    }),

  resetTimer: () =>
    set({ elapsedMs: 0, running: false, phase: 'idle' }),
}));

export default useTimerStore;
