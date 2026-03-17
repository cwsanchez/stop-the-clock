import { create } from 'zustand';
import { supabase } from '../lib/supabaseClient';

const RATE_LIMIT_MS = 5000;

const useLeaderboardStore = create((set, get) => ({
  classicLeaderboard: [],
  weenieLeaderboard: [],
  feverLeaderboard: [],
  loading: false,
  lastSubmitTime: 0,

  fetchLeaderboard: async (mode) => {
    set({ loading: true });

    const { data, error } = await supabase
      .from('leaderboard_hourly')
      .select('high_score, best_streak, updated_at, display_name')
      .eq('mode', mode)
      .order('high_score', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Leaderboard fetch failed:', error);
      set({ loading: false });
      return [];
    }

    const entries = (data || []).map((row) => ({
      displayName: row.display_name || 'Anonymous',
      highScore: row.high_score,
      bestStreak: row.best_streak,
      updatedAt: row.updated_at,
    }));

    if (mode === 'classic') {
      set({ classicLeaderboard: entries, loading: false });
    } else if (mode === 'weenie') {
      set({ weenieLeaderboard: entries, loading: false });
    } else if (mode === 'fever') {
      set({ feverLeaderboard: entries, loading: false });
    }

    return data || [];
  },

  fetchBothLeaderboards: async () => {
    await Promise.all([
      get().fetchLeaderboard('classic'),
      get().fetchLeaderboard('weenie'),
    ]);
  },

  fetchAllLeaderboards: async () => {
    await Promise.all([
      get().fetchLeaderboard('classic'),
      get().fetchLeaderboard('weenie'),
      get().fetchLeaderboard('fever'),
    ]);
  },

  submitScore: async (userId, mode, score) => {
    const now = Date.now();
    const { lastSubmitTime } = get();
    if (now - lastSubmitTime < RATE_LIMIT_MS) {
      return { rateLimited: true, isNewHigh: false };
    }

    set({ lastSubmitTime: now });

    const { data: existing } = await supabase
      .from('scores')
      .select('*')
      .eq('user_id', userId)
      .eq('mode', mode)
      .maybeSingle();

    if (existing?.last_submit) {
      const dbLast = new Date(existing.last_submit).getTime();
      if (now - dbLast < RATE_LIMIT_MS) {
        return { rateLimited: true, isNewHigh: false };
      }
    }

    const submitTs = new Date().toISOString();
    let isNewHigh;

    if (existing) {
      const newHighScore = Math.max(existing.high_score, score);
      const newBestStreak = Math.max(existing.best_streak, score);
      if (newHighScore > existing.high_score || newBestStreak > existing.best_streak) {
        await supabase
          .from('scores')
          .update({
            high_score: newHighScore,
            best_streak: newBestStreak,
            updated_at: submitTs,
            last_submit: submitTs,
          })
          .eq('user_id', userId)
          .eq('mode', mode);
      } else {
        await supabase
          .from('scores')
          .update({ last_submit: submitTs })
          .eq('user_id', userId)
          .eq('mode', mode);
      }
      isNewHigh = newHighScore > existing.high_score;
    } else {
      await supabase
        .from('scores')
        .insert({
          user_id: userId,
          mode,
          high_score: score,
          best_streak: score,
          last_submit: submitTs,
        });
      isNewHigh = true;
    }

    await get().fetchAllLeaderboards();
    return { rateLimited: false, isNewHigh };
  },

  fetchUserScores: async (userId, mode) => {
    if (!userId) return { highScore: 0, bestStreak: 0 };
    const { data } = await supabase
      .from('scores')
      .select('high_score, best_streak')
      .eq('user_id', userId)
      .eq('mode', mode)
      .maybeSingle();

    return data ? { highScore: data.high_score, bestStreak: data.best_streak } : { highScore: 0, bestStreak: 0 };
  },
}));

export default useLeaderboardStore;
