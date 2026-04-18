import { create } from 'zustand';
import { supabase, checkAndRecoverHealth } from '../lib/supabaseClient';

const INIT_TIMEOUT_MS = 5_000;

function withTimeout(promise, ms) {
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error('auth-init-timeout')), ms);
  });
  return Promise.race([Promise.resolve(promise), timeoutPromise]).finally(() =>
    clearTimeout(timeoutId),
  );
}

const useAuthStore = create((set, get) => ({
  user: null,
  profile: null,
  loading: true,
  authError: null,
  showAuthModal: false,

  setShowAuthModal: (show) => set({ showAuthModal: show }),
  clearError: () => set({ authError: null }),

  initialize: async () => {
    let session = null;
    try {
      const result = await withTimeout(supabase.auth.getSession(), INIT_TIMEOUT_MS);
      session = result?.data?.session || null;
    } catch (_) {
      // A timeout at boot means the persisted client state is already
      // bad (e.g. reload landed in a zombie auth lock). Rebuild and
      // try one more time.
      await checkAndRecoverHealth('auth-init');
      try {
        const retry = await withTimeout(supabase.auth.getSession(), INIT_TIMEOUT_MS);
        session = retry?.data?.session || null;
      } catch (_) {
        session = null;
      }
    }

    if (session?.user) {
      const profile = await get().fetchProfile(session.user.id);
      set({ user: session.user, profile, loading: false });
    } else {
      set({ loading: false });
    }

    // `onAuthStateChange` goes through our Proxy — the registered
    // listener is re-bound automatically every time the client is
    // recreated, so this only needs to be called once.
    supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const profile = await get().fetchProfile(session.user.id);
        set({ user: session.user, profile });
      } else {
        set({ user: null, profile: null });
      }
    });
  },

  fetchProfile: async (userId) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    return data;
  },

  isDisplayNameAvailable: async (displayName, ignoreUserId = null) => {
    const trimmed = (displayName || '').trim();
    if (!trimmed) return false;

    // Escape LIKE wildcards so `_` in a username isn't treated as a wildcard.
    const escaped = trimmed.replace(/([\\%_])/g, '\\$1');

    let query = supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .ilike('display_name', escaped);

    if (ignoreUserId) {
      query = query.neq('id', ignoreUserId);
    }

    const { count, error } = await query;
    if (error) return false;
    return (count ?? 0) === 0;
  },

  signUp: async (email, password, displayName) => {
    set({ authError: null });

    const trimmedName = (displayName || '').trim();
    if (!trimmedName) {
      set({ authError: 'Please choose a display name.' });
      return false;
    }
    if (trimmedName.length < 3 || trimmedName.length > 24) {
      set({ authError: 'Display name must be 3–24 characters.' });
      return false;
    }
    if (!/^[A-Za-z0-9_.-]+$/.test(trimmedName)) {
      set({ authError: 'Display name can only use letters, numbers, "." "_" "-".' });
      return false;
    }

    const available = await get().isDisplayNameAvailable(trimmedName);
    if (!available) {
      set({ authError: 'That display name is already taken.' });
      return false;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: trimmedName },
      },
    });
    if (error) {
      set({ authError: error.message });
      return false;
    }

    // Profile is created automatically by the `handle_new_user` trigger using
    // the display_name from raw_user_meta_data. No client-side insert needed
    // (and it would fail RLS anyway when email confirmation is enabled because
    // there's no authenticated session yet).

    if (data.session && data.user) {
      const profile = await get().fetchProfile(data.user.id);
      set({ profile, showAuthModal: false });
      return { ok: true, needsConfirmation: false };
    }
    return { ok: true, needsConfirmation: true };
  },

  signIn: async (email, password) => {
    set({ authError: null });
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      set({ authError: error.message });
      return false;
    }
    set({ showAuthModal: false });
    return true;
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, profile: null });
  },

  updateDisplayName: async (newName) => {
    const { user } = get();
    if (!user) return { ok: false, error: 'Not signed in.' };

    const trimmed = (newName || '').trim();
    if (!trimmed) return { ok: false, error: 'Display name cannot be empty.' };
    if (trimmed.length < 3 || trimmed.length > 24) {
      return { ok: false, error: 'Display name must be 3–24 characters.' };
    }
    if (!/^[A-Za-z0-9_.-]+$/.test(trimmed)) {
      return { ok: false, error: 'Only letters, numbers, "." "_" "-" allowed.' };
    }

    const available = await get().isDisplayNameAvailable(trimmed, user.id);
    if (!available) {
      return { ok: false, error: 'That display name is already taken.' };
    }

    const { data, error } = await supabase
      .from('profiles')
      .update({ display_name: trimmed })
      .eq('id', user.id)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return { ok: false, error: 'That display name is already taken.' };
      }
      return { ok: false, error: error.message };
    }

    set({ profile: data });
    return { ok: true };
  },
}));

export default useAuthStore;
