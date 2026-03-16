import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, LogIn, LogOut } from 'lucide-react';
import useGameStore from '../../stores/useGameStore';

const USERNAME_PATTERN = /^[a-zA-Z0-9_-]+$/;

export default function Username() {
  const { username, setUsername } = useGameStore();
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = input.trim();

    if (!trimmed) {
      setError('Username cannot be empty');
      return;
    }
    if (!USERNAME_PATTERN.test(trimmed)) {
      setError('Only A-Z, a-z, 0-9, -, _ allowed');
      return;
    }
    if (trimmed.length > 20) {
      setError('Max 20 characters');
      return;
    }

    setError('');
    setUsername(trimmed);
  };

  const handleLogout = () => {
    setUsername('');
    setInput('');
    setError('');
  };

  return (
    <div className="flex items-center justify-center gap-3">
      <AnimatePresence mode="wait">
        {!username ? (
          <motion.form
            key="form"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            onSubmit={handleSubmit}
            className="flex items-center gap-2"
          >
            <div className="relative">
              <User
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
              />
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  setError('');
                }}
                placeholder="Enter username"
                className="bg-dark-700 border border-gray-700 rounded-lg pl-8 pr-3 py-2 text-sm text-gray-200 font-mono placeholder:text-gray-600 focus:outline-none focus:border-neon-cyan/50 focus:shadow-[0_0_10px_rgba(0,240,255,0.1)] transition-all w-44"
              />
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="submit"
              className="flex items-center gap-1.5 px-3 py-2 bg-neon-cyan/10 border border-neon-cyan/30 rounded-lg text-neon-cyan text-sm font-mono hover:bg-neon-cyan/20 transition-colors"
            >
              <LogIn size={14} />
              Join
            </motion.button>
          </motion.form>
        ) : (
          <motion.div
            key="display"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="flex items-center gap-2"
          >
            <div className="flex items-center gap-2 px-3 py-2 bg-dark-700 border border-neon-cyan/20 rounded-lg">
              <User size={14} className="text-neon-cyan" />
              <span className="text-sm font-mono text-neon-cyan">{username}</span>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-2 bg-dark-700 border border-gray-700 rounded-lg text-gray-400 text-sm font-mono hover:border-red-500/30 hover:text-red-400 transition-colors"
            >
              <LogOut size={14} />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {error && (
          <motion.span
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            className="text-xs text-red-400 font-mono"
          >
            {error}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}
