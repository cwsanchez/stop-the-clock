import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing REACT_APP_SUPABASE_URL or REACT_APP_SUPABASE_ANON_KEY');
}

const isDev = process.env.NODE_ENV === 'development';

let _instance = null;

function getClient() {
  if (_instance) return _instance;

  _instance = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      detectSessionInUrl: true,
      persistSession: true,
      lock: async (_name, _acquireTimeout, fn) => fn(),
    },
    global: {
      fetch: (...args) => fetch(...args),
    },
  });

  return _instance;
}

export const supabase = getClient();

let _reconnecting = false;

export function forceReconnect() {
  if (_reconnecting) return;
  _reconnecting = true;

  try { supabase.removeAllChannels(); } catch (_) { /* best-effort */ }
  supabase.auth.refreshSession().catch(() => {});

  if (isDev) console.log('[supabase] channels reset + session refreshed');

  setTimeout(() => { _reconnecting = false; }, 5_000);
}

export function cleanupClient() {
  try { supabase.removeAllChannels(); } catch (_) { /* best-effort */ }
}
