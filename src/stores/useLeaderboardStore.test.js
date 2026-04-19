// Tests for the hardened leaderboard store: submit timeout + offline queue.

const mockSupabase = {
  from: jest.fn(),
  auth: {
    getSession: jest.fn(async () => ({ data: { session: null } })),
    onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: () => {} } } })),
  },
};

// By mocking `checkAndRecoverHealth` to resolve immediately and `forceReconnect`
// to be a noop, we let the retry loop in useLeaderboardStore proceed without
// waiting for real-world recovery.
jest.mock('../lib/supabaseClient', () => ({
  __esModule: true,
  supabase: mockSupabase,
  forceReconnect: jest.fn(),
  checkAndRecoverHealth: jest.fn(async () => ({ healthy: false, recreated: true })),
}));

describe('useLeaderboardStore — submit resiliency', () => {
  let storeModule;

  beforeEach(() => {
    jest.resetModules();
    localStorage.clear();
    mockSupabase.from.mockReset();
    // eslint-disable-next-line global-require
    storeModule = require('./useLeaderboardStore');
  });

  test(
    'queues the score to localStorage when the read rejects',
    async () => {
      // Read rejects on every attempt to simulate a persistent backend
      // failure (e.g. the post-recreate client is still sad). This
      // exercises the `retry exhausted → queue to localStorage` path
      // without waiting for real 10s timeouts.
      mockSupabase.from.mockImplementation((table) => {
        if (table === 'leaderboard_daily') {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  maybeSingle: async () => ({ data: null, error: { message: 'network failure' } }),
                }),
              }),
            }),
          };
        }
        throw new Error(`Unexpected table: ${table}`);
      });

      const store = storeModule.default.getState();
      const result = await store.submitScore('user-1', 'classic', 42, 42);

      expect(result.failed).toBe(true);
      expect(result.queued).toBe(true);

      const pending = JSON.parse(localStorage.getItem('stc-pending-submit-v1'));
      expect(pending).toMatchObject({ userId: 'user-1', mode: 'classic', score: 42, bestStreak: 42 });
      expect(storeModule.default.getState().hasPendingSubmit).toBe(true);
    },
    15_000,
  );

  test('clears pending queue after a successful submit', async () => {
    mockSupabase.from.mockImplementation((table) => {
      if (table === 'leaderboard_daily') {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                maybeSingle: async () => ({ data: null, error: null }),
                order: () => ({
                  limit: async () => ({ data: [], error: null }),
                }),
              }),
            }),
          }),
        };
      }
      if (table === 'scores') {
        return {
          upsert: async () => ({ data: null, error: null }),
          select: () => ({
            eq: () => ({
              order: () => ({
                limit: async () => ({ data: [], error: null }),
              }),
            }),
          }),
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    });

    localStorage.setItem(
      'stc-pending-submit-v1',
      JSON.stringify({ userId: 'user-1', mode: 'classic', score: 1, bestStreak: 1 }),
    );

    jest.resetModules();
    // eslint-disable-next-line global-require
    storeModule = require('./useLeaderboardStore');
    expect(storeModule.default.getState().hasPendingSubmit).toBe(true);

    const result = await storeModule.default.getState().submitScore('user-1', 'classic', 10, 10);

    expect(result.failed).toBe(false);
    expect(result.isNewHigh).toBe(true);
    expect(localStorage.getItem('stc-pending-submit-v1')).toBeNull();
    expect(storeModule.default.getState().hasPendingSubmit).toBe(false);
  });

  test('flushPendingSubmit resubmits a queued score', async () => {
    mockSupabase.from.mockImplementation((table) => {
      if (table === 'leaderboard_daily') {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                maybeSingle: async () => ({ data: null, error: null }),
                order: () => ({
                  limit: async () => ({ data: [], error: null }),
                }),
              }),
            }),
          }),
        };
      }
      if (table === 'scores') {
        return {
          upsert: async () => ({ data: null, error: null }),
          select: () => ({
            eq: () => ({
              order: () => ({
                limit: async () => ({ data: [], error: null }),
              }),
            }),
          }),
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    });

    localStorage.setItem(
      'stc-pending-submit-v1',
      JSON.stringify({ userId: 'user-1', mode: 'fever', score: 99, bestStreak: 99 }),
    );

    jest.resetModules();
    // eslint-disable-next-line global-require
    storeModule = require('./useLeaderboardStore');

    const res = await storeModule.default.getState().flushPendingSubmit();
    expect(res.flushed).toBe(true);
    expect(localStorage.getItem('stc-pending-submit-v1')).toBeNull();
  });
});
