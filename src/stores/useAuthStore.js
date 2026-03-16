import { create } from 'zustand';
import { supabase } from '../lib/supabaseClient';

const useAuthStore = create((set, get) => ({
  user: null,
  profile: null,
  loading: true,
  authError: null,
  showAuthModal: false,

  setShowAuthModal: (show) => set({ showAuthModal: show }),
  clearError: () => set({ authError: null }),

  initialize: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const profile = await get().fetchProfile(session.user.id);
      set({ user: session.user, profile, loading: false });
    } else {
      set({ loading: false });
    }

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

  signUp: async (email, password, displayName) => {
    set({ authError: null });
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      set({ authError: error.message });
      return false;
    }
    if (data.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({ id: data.user.id, display_name: displayName });
      if (profileError) {
        set({ authError: profileError.message });
        return false;
      }
      const profile = { id: data.user.id, display_name: displayName };
      set({ profile, showAuthModal: false });
    }
    return true;
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
}));

export default useAuthStore;
