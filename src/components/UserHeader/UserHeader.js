import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogIn, LogOut, User, Ghost } from 'lucide-react';
import useAuthStore from '../../stores/useAuthStore';

export default function UserHeader() {
  const { user, profile, signOut, setShowAuthModal } = useAuthStore();

  return (
    <div className="flex items-center gap-2">
      <AnimatePresence mode="wait">
        {user ? (
          <motion.div
            key="logged-in"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="flex items-center gap-2"
          >
            <div className="flex items-center gap-2 px-3 py-2 bg-dark-700 border border-neon-cyan/20 rounded-lg">
              <User size={14} className="text-neon-cyan" />
              <span className="text-sm font-mono text-neon-cyan truncate max-w-[120px]">
                {profile?.display_name || user.email?.split('@')[0]}
              </span>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={signOut}
              className="flex items-center gap-1.5 px-3 py-2 bg-dark-700 border border-gray-700 rounded-lg text-gray-400 text-sm font-mono hover:border-red-500/30 hover:text-red-400 transition-colors"
            >
              <LogOut size={14} />
            </motion.button>
          </motion.div>
        ) : (
          <motion.div
            key="logged-out"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="flex items-center gap-2"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowAuthModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-neon-cyan/10 border border-neon-cyan/30 rounded-lg text-neon-cyan text-sm font-mono hover:bg-neon-cyan/20 transition-colors"
            >
              <LogIn size={14} />
              Sign In
            </motion.button>
            <div className="flex items-center gap-1.5 px-3 py-2 text-gray-600 text-xs font-mono">
              <Ghost size={14} />
              Guest
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
