import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing REACT_APP_SUPABASE_URL or REACT_APP_SUPABASE_ANON_KEY');
}

const isDev = process.env.NODE_ENV === 'development';

export let supabase = createClient(supabaseUrl, supabaseAnonKey);

export function forceReconnect() {
  try { supabase.removeAllChannels(); } catch (_) { /* best-effort */ }
  supabase = createClient(supabaseUrl, supabaseAnonKey);
  if (isDev) console.log('🔄 Supabase client recreated');
  return supabase;
}
