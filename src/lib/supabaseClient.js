import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing REACT_APP_SUPABASE_URL or REACT_APP_SUPABASE_ANON_KEY');
}

const isProd = process.env.NODE_ENV === 'production';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    detectSessionInUrl: true,
    persistSession: true,
    lock: async (_name, _acquireTimeout, fn) => fn(),
  },
});

/**
 * Lightweight reconnect: tears down realtime channels and refreshes the
 * auth session without creating a new GoTrueClient.
 */
export function forceReconnect() {
  try { supabase.removeAllChannels(); } catch (_) { /* best-effort */ }
  supabase.auth.refreshSession().catch(() => {});
  if (!isProd) console.log('🔄 Supabase channels reset + session refreshed');
}
