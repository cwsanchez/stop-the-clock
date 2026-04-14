import { create } from 'zustand';
import { supabase, forceReconnect } from '../lib/supabaseClient';

const isDev = process.env.NODE_ENV === 'development';

const RATE_LIMIT_MS = 5000;
const FETCH_TIMEOUT_MS = 8_000;
const RETRY_MAX = 2;
const RETRY_BACKOFF_MS = 1_000;

function isNetworkOrTimeout(err) {
  if (!err) return false;
  const msg = String(err.message || err).toLowerCase();
  return (
    msg.includes('timeout') ||
    msg.includes('timed out') ||
    msg.includes('fetch') ||
    msg.includes('network') ||
    msg.includes('failed') ||
    msg.includes('aborted') ||
    msg.includes('econnrefused') ||
    msg.includes('enotfound')
  );
}

function withTimeout(promise, ms = FETCH_TIMEOUT_MS) {
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error('Supabase request timed out')), ms);
  });
  return Promise.race([Promise.resolve(promise), timeoutPromise]).finally(() =>
    clearTimeout(timeoutId),
  );
}

async function withRetry(queryFn) {
  for (let attempt = 1; attempt <= RETRY_MAX; attempt++) {
    try {
      const result = await withTimeout(queryFn());
      if (result.error) throw result.error;
      return result;
    } catch (err) {
      if (attempt < RETRY_MAX && isNetworkOrTimeout(err)) {
        forceReconnect();
        await new Promise((r) => setTimeout(r, RETRY_BACKOFF_MS));
      } else {
        if (isDev) console.error('[leaderboard] fetch failed after retries:', err);
        return { data: null, error: err };
      }
    }
  }
}

function getNextResetTime() {
  const now = new Date();
  const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
  return next;
}

function formatTimeUntilReset() {
  const ms = Math.max(0, getNextResetTime() - Date.now());
  const totalMinutes = Math.floor(ms / 60000);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h}h ${m}m`;
}

const useLeaderboardStore = create((set, get) => ({
  classicLeaderboard: [],
  weenieLeaderboard: [],
  feverLeaderboard: [],
  journeyLeaderboard: [],
  loading: false,
  lastSubmitTime: 0,
  activeLeaderboardTab: 'classic',
  period: 'all-time',
  nextResetTime: getNextResetTime(),
  timeUntilReset: formatTimeUntilReset(),

  setActiveLeaderboardTab: (tab) => set({ activeLeaderboardTab: tab }),

  setPeriod: (period) => {
    set({ period });
    get().clearLeaderboards();
    get().fetchAllLeaderboards();
  },

  clearLeaderboards: () =>
    set({ classicLeaderboard: [], weenieLeaderboard: [], feverLeaderboard: [], journeyLeaderboard: [] }),

  fetchLeaderboard: async (mode) => {
    set({ loading: true });

    const { period } = get();

    const doQuery = period === 'daily'
      ? () =>
          supabase
            .from('leaderboard_daily')
            .select('high_score, best_streak, updated_at, mode, user_id, profiles(display_name)')
            .eq('mode', mode)
            .order('high_score', { ascending: false })
            .limit(50)
      : () =>
          supabase
            .from('scores')
            .select('high_score, best_streak, updated_at, mode, user_id, profiles(display_name)')
            .eq('mode', mode)
            .order('high_score', { ascending: false })
            .limit(50);

    const { data, error } = await withRetry(doQuery);

    if (error || !data) {
      set({ loading: false });
      return [];
    }

    const entries = (data || []).map((row) => ({
      displayName: row.profiles?.display_name || 'Anonymous',
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
    } else if (mode === 'journey') {
      set({ journeyLeaderboard: entries, loading: false });
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
      get().fetchLeaderboard('journey'),
    ]);
  },

  submitScore: async (userId, mode, score, bestStreak) => {
    const now = Date.now();
    const { lastSubmitTime } = get();
    if (now - lastSubmitTime < RATE_LIMIT_MS) {
      return { rateLimited: true, isNewHigh: false };
    }

    set({ lastSubmitTime: now });

    const streak = bestStreak ?? score;

    const { data: existing } = await supabase
      .from('leaderboard_daily')
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

    const newHighScore = existing ? Math.max(existing.high_score, score) : score;
    const newBestStreak = existing ? Math.max(existing.best_streak, streak) : streak;
    const isNewHigh = existing ? newHighScore > existing.high_score : true;

    await supabase
      .from('scores')
      .upsert(
        {
          user_id: userId,
          mode,
          high_score: newHighScore,
          best_streak: newBestStreak,
          updated_at: submitTs,
          last_submit: submitTs,
        },
        { onConflict: 'user_id,mode' },
      );

    get().clearLeaderboards();
    await get().fetchAllLeaderboards();
    return { rateLimited: false, isNewHigh };
  },

  fetchUserScores: async (userId, mode) => {
    if (!userId) return { highScore: 0, bestStreak: 0 };

    const doQuery = () =>
      supabase
        .from('leaderboard_daily')
        .select('high_score, best_streak')
        .eq('user_id', userId)
        .eq('mode', mode)
        .maybeSingle();

    const { data, error } = await withRetry(doQuery);

    if (error || !data) return { highScore: 0, bestStreak: 0 };
    return { highScore: data.high_score, bestStreak: data.best_streak };
  },
}));

setInterval(() => {
  useLeaderboardStore.setState({
    nextResetTime: getNextResetTime(),
    timeUntilReset: formatTimeUntilReset(),
  });
}, 30_000);

export default useLeaderboardStore;
