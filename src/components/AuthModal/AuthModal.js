import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, User, LogIn, UserPlus, Loader2 } from 'lucide-react';
import useAuthStore from '../../stores/useAuthStore';

export default function AuthModal() {
  const { showAuthModal, setShowAuthModal, signIn, signUp, authError, clearError } = useAuthStore();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setDisplayName('');
    clearError();
  };

  const handleClose = () => {
    setShowAuthModal(false);
    resetForm();
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    resetForm();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    if (isSignUp) {
      await signUp(email, password, displayName || email.split('@')[0]);
    } else {
      await signIn(email, password);
    }
    setSubmitting(false);
  };

  return (
    <AnimatePresence>
      {showAuthModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={handleClose} />

          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-md bg-dark-800 border border-gray-700/50 rounded-2xl p-8 shadow-2xl"
          >
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-300 transition-colors"
            >
              <X size={20} />
            </button>

            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-neon-cyan/10 border border-neon-cyan/20 mb-4">
                {isSignUp ? <UserPlus size={24} className="text-neon-cyan" /> : <LogIn size={24} className="text-neon-cyan" />}
              </div>
              <h2 className="text-xl font-display uppercase tracking-widest text-white">
                {isSignUp ? 'Create Account' : 'Welcome Back'}
              </h2>
              <p className="text-sm text-gray-500 font-mono mt-2">
                {isSignUp ? 'Sign up to save scores & compete' : 'Log in to continue your streak'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {isSignUp && (
                <div className="relative">
                  <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Display name"
                    className="w-full bg-dark-700 border border-gray-700 rounded-xl pl-10 pr-4 py-3 text-sm text-gray-200 font-mono placeholder:text-gray-600 focus:outline-none focus:border-neon-cyan/50 focus:shadow-[0_0_10px_rgba(0,240,255,0.1)] transition-all"
                  />
                </div>
              )}

              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email address"
                  required
                  className="w-full bg-dark-700 border border-gray-700 rounded-xl pl-10 pr-4 py-3 text-sm text-gray-200 font-mono placeholder:text-gray-600 focus:outline-none focus:border-neon-cyan/50 focus:shadow-[0_0_10px_rgba(0,240,255,0.1)] transition-all"
                />
              </div>

              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  required
                  minLength={6}
                  className="w-full bg-dark-700 border border-gray-700 rounded-xl pl-10 pr-4 py-3 text-sm text-gray-200 font-mono placeholder:text-gray-600 focus:outline-none focus:border-neon-cyan/50 focus:shadow-[0_0_10px_rgba(0,240,255,0.1)] transition-all"
                />
              </div>

              <AnimatePresence>
                {authError && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-xs text-red-400 font-mono text-center bg-red-400/5 border border-red-400/10 rounded-lg py-2 px-3"
                  >
                    {authError}
                  </motion.p>
                )}
              </AnimatePresence>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 py-3 bg-neon-cyan/10 border border-neon-cyan/50 rounded-xl text-neon-cyan font-mono text-sm uppercase tracking-wider hover:bg-neon-cyan/20 hover:shadow-neon-cyan transition-all disabled:opacity-50"
              >
                {submitting ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : isSignUp ? (
                  <>
                    <UserPlus size={18} />
                    Create Account
                  </>
                ) : (
                  <>
                    <LogIn size={18} />
                    Sign In
                  </>
                )}
              </motion.button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={toggleMode}
                className="text-xs text-gray-500 font-mono hover:text-neon-cyan transition-colors"
              >
                {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
