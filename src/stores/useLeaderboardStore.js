import { create } from 'zustand';
import { getLeaderboard, getAttempts, submitToLeaderboard, getPersonalBest } from '../db/database';

const useLeaderboardStore = create((set) => ({
  leaderboard: [],
  history: [],
  loading: false,

  fetchLeaderboard: async () => {
    set({ loading: true });
    const leaderboard = await getLeaderboard();
    set({ leaderboard, loading: false });
  },

  fetchHistory: async (username) => {
    if (!username) {
      set({ history: [] });
      return;
    }
    const history = await getAttempts(username);
    set({ history });
  },

  submitScore: async (username, score) => {
    const isNew = await submitToLeaderboard(username, score);
    if (isNew) {
      const leaderboard = await getLeaderboard();
      set({ leaderboard });
    }
    return isNew;
  },

  fetchPersonalBest: async (username) => {
    return getPersonalBest(username);
  },
}));

export default useLeaderboardStore;
