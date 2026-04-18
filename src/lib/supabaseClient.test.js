const originalEnv = process.env;

beforeEach(() => {
  jest.resetModules();
  process.env = {
    ...originalEnv,
    REACT_APP_SUPABASE_URL: 'https://example.supabase.co',
    REACT_APP_SUPABASE_ANON_KEY: 'test-anon-key',
    NODE_ENV: 'test',
  };
});

afterAll(() => {
  process.env = originalEnv;
});

// The Supabase client is expensive to construct but we only need a
// shape-compatible stub here: we're validating our Proxy indirection
// and recovery plumbing, not Supabase's internals.
jest.mock('@supabase/supabase-js', () => {
  let counter = 0;
  return {
    __esModule: true,
    createClient: jest.fn(() => {
      counter += 1;
      const id = counter;
      const listeners = new Set();
      return {
        __id: id,
        removeAllChannels: jest.fn(),
        from: jest.fn((table) => ({ __id: id, table })),
        auth: {
          getSession: jest.fn(async () => ({ data: { session: null }, error: null })),
          onAuthStateChange: jest.fn((cb) => {
            listeners.add(cb);
            return { data: { subscription: { unsubscribe: () => listeners.delete(cb) } } };
          }),
          refreshSession: jest.fn(async () => ({ data: {}, error: null })),
          stopAutoRefresh: jest.fn(),
          __emit: (evt, session) => listeners.forEach((cb) => cb(evt, session)),
          __listenerCount: () => listeners.size,
        },
      };
    }),
  };
});

describe('supabaseClient Proxy + recoverable client', () => {
  test('proxy forwards method calls to current underlying client', async () => {
    const { supabase } = require('./supabaseClient');
    const result = supabase.from('scores');
    expect(result.table).toBe('scores');
    expect(result.__id).toBe(1);
  });

  test('recreateClient swaps the underlying instance but the exported supabase ref keeps working', () => {
    const mod = require('./supabaseClient');
    const first = mod.supabase.from('x');
    expect(first.__id).toBe(1);

    mod.recreateClient('test');

    const second = mod.supabase.from('x');
    expect(second.__id).toBe(2);
  });

  test('onAuthStateChange listeners survive client recreation', () => {
    const mod = require('./supabaseClient');
    const { createClient } = require('@supabase/supabase-js');

    const cb = jest.fn();
    mod.supabase.auth.onAuthStateChange(cb);

    // Listener should be attached to the first client.
    const firstClient = createClient.mock.results[0].value;
    expect(firstClient.auth.__listenerCount()).toBe(1);

    mod.recreateClient('test-listener-rebind');

    const secondClient = createClient.mock.results[1].value;
    expect(secondClient.auth.__listenerCount()).toBe(1);

    // Firing on the new client still hits our callback.
    secondClient.auth.__emit('SIGNED_IN', { user: { id: 'u1' } });
    expect(cb).toHaveBeenCalledWith('SIGNED_IN', { user: { id: 'u1' } });
  });

  test('checkAndRecoverHealth rebuilds the client when getSession hangs', async () => {
    jest.isolateModules(() => {});
    const { createClient } = require('@supabase/supabase-js');

    let hangSignal;
    createClient.mockImplementationOnce(() => {
      return {
        __id: 'hung',
        removeAllChannels: jest.fn(),
        auth: {
          getSession: jest.fn(
            () =>
              new Promise(() => {
                // Never resolves — simulates the idle-freeze deadlock.
                hangSignal = true;
              }),
          ),
          onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: () => {} } } })),
          stopAutoRefresh: jest.fn(),
        },
        from: jest.fn(() => ({ __id: 'hung' })),
      };
    });

    const mod = require('./supabaseClient');

    const firstRef = mod.supabase.from('x');
    expect(firstRef.__id).toBe('hung');

    const result = await mod.checkAndRecoverHealth('test-hang');
    expect(hangSignal).toBe(true);
    expect(result.healthy).toBe(false);
    expect(result.recreated).toBe(true);

    // After recovery, the next `.from()` should resolve through the
    // rebuilt (mocked) healthy client — i.e. NOT __id === 'hung'.
    const afterRef = mod.supabase.from('x');
    expect(afterRef.__id).not.toBe('hung');
  });

  test('checkAndRecoverHealth reports healthy when getSession resolves', async () => {
    const mod = require('./supabaseClient');
    const res = await mod.checkAndRecoverHealth('test-healthy');
    expect(res.healthy).toBe(true);
    expect(res.recreated).toBe(false);
  });

  test('forceReconnect is the legacy alias for recreateClient', () => {
    const mod = require('./supabaseClient');
    const { createClient } = require('@supabase/supabase-js');
    const before = createClient.mock.calls.length;

    mod.forceReconnect();

    const after = createClient.mock.calls.length;
    expect(after).toBe(before + 1);
  });
});
