import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing REACT_APP_SUPABASE_URL or REACT_APP_SUPABASE_ANON_KEY');
}

const isDev = process.env.NODE_ENV === 'development';

// We re-export `supabase` as a stable object whose method lookups are
// forwarded to a mutable inner client. This lets us fully recreate the
// underlying client (after tab suspension / auth-lock deadlock) without
// orphaning any callers that captured the import at module load time.
//
// Background: the Supabase JS client can enter a "zombie" state after a
// browser tab is suspended for long periods. Internal locks
// (navigator.locks or the library's fallback) can fail to release, and
// every subsequent `from()`, `auth.getSession()`, etc. hangs forever.
// The only reliable recovery is to create a fresh client instance.
// See: https://github.com/supabase/supabase/issues/36046

function buildClient() {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      detectSessionInUrl: true,
      persistSession: true,
      lock: async (_name, _acquireTimeout, fn) => fn(),
    },
    global: {
      fetch: (...args) => fetch(...args),
    },
  });
}

let _instance = buildClient();

// Callbacks registered via `onAuthStateChange` need to survive client
// recreations. We keep them here and re-register them every time we
// rebuild the underlying client.
const _authListeners = new Set();
let _authSubscription = null;

function rebindAuthListeners() {
  try {
    if (_authSubscription?.unsubscribe) _authSubscription.unsubscribe();
  } catch (_) {
    /* best-effort */
  }
  _authSubscription = null;

  if (_authListeners.size === 0) return;

  const aggregate = (event, session) => {
    for (const cb of _authListeners) {
      try {
        cb(event, session);
      } catch (err) {
        if (isDev) console.error('[supabase] auth listener threw:', err);
      }
    }
  };

  const { data } = _instance.auth.onAuthStateChange(aggregate);
  _authSubscription = data?.subscription || null;
}

// Proxy the `auth` namespace so we can intercept `onAuthStateChange` and
// transparently forward all other calls to the current client's auth
// module. Anything that captures `supabase.auth` into a variable will
// still stay bound to the live client via this proxy.
const authProxy = new Proxy(
  {},
  {
    get(_t, prop) {
      if (prop === 'onAuthStateChange') {
        return (callback) => {
          _authListeners.add(callback);
          if (!_authSubscription) rebindAuthListeners();
          return {
            data: {
              subscription: {
                unsubscribe: () => {
                  _authListeners.delete(callback);
                },
              },
            },
          };
        };
      }
      const value = _instance.auth[prop];
      return typeof value === 'function' ? value.bind(_instance.auth) : value;
    },
  },
);

// Top-level proxy for the supabase client. Method lookups are always
// resolved against the current `_instance`, so after a recreate the
// same `supabase` reference keeps working.
export const supabase = new Proxy(
  {},
  {
    get(_t, prop) {
      if (prop === 'auth') return authProxy;
      const value = _instance[prop];
      return typeof value === 'function' ? value.bind(_instance) : value;
    },
  },
);

let _recreating = false;

export function recreateClient(reason = 'unknown') {
  if (_recreating) return;
  _recreating = true;

  const old = _instance;
  try {
    old.removeAllChannels();
  } catch (_) {
    /* best-effort */
  }
  try {
    old.auth.stopAutoRefresh?.();
  } catch (_) {
    /* best-effort */
  }

  _instance = buildClient();
  rebindAuthListeners();

  if (isDev) console.log(`[supabase] client recreated (reason: ${reason})`);

  setTimeout(() => {
    _recreating = false;
  }, 1_000);
}

// Backwards-compatible alias used by existing callers.
export function forceReconnect() {
  recreateClient('legacy-forceReconnect');
}

export function cleanupClient() {
  try {
    _instance.removeAllChannels();
  } catch (_) {
    /* best-effort */
  }
}

// Health check: call a cheap operation (`auth.getSession()`) with a
// short timeout. If it hangs, the client is deadlocked and we rebuild.
// This is the primary recovery mechanism for the "idle freeze" bug.
const HEALTH_TIMEOUT_MS = 3_000;

export async function checkAndRecoverHealth(reason = 'health-check') {
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(
      () => reject(new Error('supabase-health-timeout')),
      HEALTH_TIMEOUT_MS,
    );
  });

  try {
    await Promise.race([_instance.auth.getSession(), timeoutPromise]);
    clearTimeout(timeoutId);
    return { healthy: true, recreated: false };
  } catch (err) {
    clearTimeout(timeoutId);
    if (isDev) {
      console.warn(
        `[supabase] health check failed (${reason}):`,
        err?.message || err,
      );
    }
    recreateClient(reason);
    return { healthy: false, recreated: true };
  }
}
