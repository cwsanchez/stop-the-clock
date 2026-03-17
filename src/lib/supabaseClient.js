import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing REACT_APP_SUPABASE_URL or REACT_APP_SUPABASE_ANON_KEY');
}

export let supabase = createClient(supabaseUrl, supabaseAnonKey);

export function forceReconnect() {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
  console.log('🔄 Supabase client recreated on error');
  return supabase;
}
