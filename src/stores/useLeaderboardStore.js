import { create } from 'zustand';
import {
  supabase,
  forceReconnect,
  checkAndRecoverHealth,
} from '../lib/supabaseClient';

const isDev = process.env.NODE_ENV === 'development';

const RATE_LIMIT_MS = 5000;
const FETCH_TIMEOUT_MS = 8_000;
const SUBMIT_TIMEOUT_MS = 10_000;
const RETRY_MAX = 2;
const RETRY_BACKOFF_MS = 1_000;

const PENDING_SUBMIT_KEY = 'stc-pending-submit-v1';

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

async function withRetry(queryFn, timeoutMs = FETCH_TIMEOUT_MS) {
  for (let attempt = 1; attempt <= RETRY_MAX; attempt++) {
    try {
      const result = await withTimeout(queryFn(), timeoutMs);
      if (result.error) throw result.error;
      return result;
    } catch (err) {
      if (attempt < RETRY_MAX && isNetworkOrTimeout(err)) {
        // A timeout here is the #1 signal that the Supabase client has
        // entered the idle/tab-suspension "zombie" state. Do a health
        // probe and, if it fails, rebuild the client before retrying.
        try {
          await checkAndRecoverHealth('withRetry-timeout');
        } catch (_) {
          forceReconnect();
        }
        await new Promise((r) => setTimeout(r, RETRY_BACKOFF_MS));
      } else {
        if (isDev) console.error('[leaderboard] fetch failed after retries:', err);
        return { data: null, error: err };
      }
    }
  }
}

function loadPendingSubmit() {
  try {
    const raw = localStorage.getItem(PENDING_SUBMIT_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (_) {
    return null;
  }
}

function savePendingSubmit(payload) {
  try {
    localStorage.setItem(PENDING_SUBMIT_KEY, JSON.stringify(payload));
  } catch (_) {
    /* best-effort */
  }
}

function clearPendingSubmit() {
  try {
    localStorage.removeItem(PENDING_SUBMIT_KEY);
  } catch (_) {
    /* best-effort */
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
  hasPendingSubmit: !!loadPendingSubmit(),

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
      return { rateLimited: true, isNewHigh: false, failed: false };
    }

    set({ lastSubmitTime: now });

    const streak = bestStreak ?? score;

    // Read existing row with timeout+retry so we never hang here.
    const { data: existing, error: readErr } = await withRetry(
      () =>
        supabase
          .from('leaderboard_daily')
          .select('*')
          .eq('user_id', userId)
          .eq('mode', mode)
          .maybeSingle(),
      SUBMIT_TIMEOUT_MS,
    );

    if (readErr) {
      // Couldn't even read the existing row — save to queue, report failure.
      savePendingSubmit({ userId, mode, score, bestStreak: streak, savedAt: Date.now() });
      set({ hasPendingSubmit: true });
      return { rateLimited: false, isNewHigh: false, failed: true, queued: true };
    }

    if (existing?.last_submit) {
      const dbLast = new Date(existing.last_submit).getTime();
      if (now - dbLast < RATE_LIMIT_MS) {
        return { rateLimited: true, isNewHigh: false, failed: false };
      }
    }

    const submitTs = new Date().toISOString();

    const newHighScore = existing ? Math.max(existing.high_score, score) : score;
    const newBestStreak = existing ? Math.max(existing.best_streak, streak) : streak;
    const isNewHigh = existing ? newHighScore > existing.high_score : true;

    const { error: writeErr } = await withRetry(
      () =>
        supabase
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
          ),
      SUBMIT_TIMEOUT_MS,
    );

    if (writeErr) {
      savePendingSubmit({ userId, mode, score, bestStreak: streak, savedAt: Date.now() });
      set({ hasPendingSubmit: true });
      return { rateLimited: false, isNewHigh: false, failed: true, queued: true };
    }

    clearPendingSubmit();
    set({ hasPendingSubmit: false });

    get().clearLeaderboards();
    await get().fetchAllLeaderboards();
    return { rateLimited: false, isNewHigh, failed: false };
  },

  flushPendingSubmit: async () => {
    const pending = loadPendingSubmit();
    if (!pending || !pending.userId) return { flushed: false };

    // Give the client a chance to recover before re-submitting.
    try {
      await checkAndRecoverHealth('flush-pending-submit');
    } catch (_) {
      /* ignore */
    }

    // Bypass rate-limit for queued retries — this was already earned.
    const prevLast = get().lastSubmitTime;
    set({ lastSubmitTime: 0 });
    const result = await get().submitScore(
      pending.userId,
      pending.mode,
      pending.score,
      pending.bestStreak,
    );

    if (result?.failed) {
      // Restore prior rate-limit timestamp so we don't spin.
      set({ lastSubmitTime: prevLast });
      return { flushed: false };
    }

    return { flushed: true, isNewHigh: result?.isNewHigh };
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
