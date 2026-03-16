import { create } from 'zustand';
import { supabase } from '../lib/supabaseClient';

const useLeaderboardStore = create((set, get) => ({
  classicLeaderboard: [],
  weenieLeaderboard: [],
  loading: false,

  fetchLeaderboard: async (mode) => {
    set({ loading: true });
    const { data, error } = await supabase
      .from('scores')
      .select(`
        high_score,
        best_streak,
        updated_at,
        user_id,
        profiles!user_id(display_name)
      `)
      .eq('mode', mode)
      .gt('high_score', 0)
      .order('high_score', { ascending: false })
      .limit(50);

    if (!error && data) {
      const entries = data.map((row) => ({
        userId: row.user_id,
        displayName: row.profiles?.display_name || 'Anonymous',
        highScore: row.high_score,
        bestStreak: row.best_streak,
        updatedAt: row.updated_at,
      }));
      if (mode === 'classic') {
        set({ classicLeaderboard: entries, loading: false });
      } else {
        set({ weenieLeaderboard: entries, loading: false });
      }
    } else {
      set({ loading: false });
    }
  },

  fetchBothLeaderboards: async () => {
    await Promise.all([
      get().fetchLeaderboard('classic'),
      get().fetchLeaderboard('weenie'),
    ]);
  },

  submitScore: async (userId, mode, score) => {
    const { data: existing } = await supabase
      .from('scores')
      .select('*')
      .eq('user_id', userId)
      .eq('mode', mode)
      .single();

    let isNewHigh;
    if (existing) {
      const newHighScore = Math.max(existing.high_score, score);
      const newBestStreak = Math.max(existing.best_streak, score);
      if (newHighScore > existing.high_score || newBestStreak > existing.best_streak) {
        await supabase
          .from('scores')
          .update({ high_score: newHighScore, best_streak: newBestStreak })
          .eq('user_id', userId)
          .eq('mode', mode);
      }
      isNewHigh = newHighScore > existing.high_score;
    } else {
      await supabase
        .from('scores')
        .insert({ user_id: userId, mode, high_score: score, best_streak: score });
      isNewHigh = true;
    }

    await get().fetchBothLeaderboards();
    return isNewHigh;
  },

  fetchUserScores: async (userId, mode) => {
    if (!userId) return { highScore: 0, bestStreak: 0 };
    const { data } = await supabase
      .from('scores')
      .select('high_score, best_streak')
      .eq('user_id', userId)
      .eq('mode', mode)
      .single();

    return data ? { highScore: data.high_score, bestStreak: data.best_streak } : { highScore: 0, bestStreak: 0 };
  },
}));

export default useLeaderboardStore;
