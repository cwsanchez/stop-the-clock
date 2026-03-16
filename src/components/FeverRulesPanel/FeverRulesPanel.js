import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, X, Info } from 'lucide-react';

export default function FeverRulesPanel() {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="absolute top-3 right-3 z-20">
      <button
        onClick={() => setExpanded(v => !v)}
        className="flex items-center justify-center w-7 h-7 rounded-full bg-red-950/40 border border-red-500/30 text-red-400/60 hover:text-red-400 hover:bg-red-950/70 transition-all duration-200"
        title="How Fever Mode Works"
        aria-label="How Fever Mode Works"
      >
        <Info size={13} />
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-9 w-72 bg-dark-800 border border-red-500/20 rounded-2xl shadow-2xl overflow-hidden z-30"
          >
            <div className="flex items-center justify-between px-4 py-2.5 bg-red-950/30">
              <div className="flex items-center gap-2">
                <Zap size={13} className="text-red-400" />
                <span className="text-xs font-display uppercase tracking-wider text-red-400">
                  How Fever Mode Works
                </span>
              </div>
              <button
                onClick={() => setExpanded(false)}
                className="text-red-400/50 hover:text-red-400 transition-colors"
                aria-label="Close"
              >
                <X size={13} />
              </button>
            </div>
            <div className="px-4 py-3 space-y-1.5 text-xs font-mono text-gray-400">
              <div className="flex items-start gap-2">
                <span className="text-red-400 mt-0.5">🔥</span>
                <span>Timer <strong className="text-red-300">never stops</strong> — keep hitting at :00 nonstop</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-yellow-400 mt-0.5">⚡</span>
                <span>Perfect hit (exact :00): <strong className="text-yellow-300">+1 × multiplier</strong> + bumps multiplier by 0.5× (max 5×)</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-orange-400 mt-0.5">✓</span>
                <span>Near hit (±0.05s): <strong className="text-orange-300">+1 × multiplier</strong> — keeps your run alive</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-gray-500 mt-0.5">⏭</span>
                <span>Skip 1-4 seconds: <strong className="text-gray-300">multiplier resets to 1×</strong> but run continues</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-red-500 mt-0.5">✗</span>
                <span>Hard miss (&gt;±0.05s) or 5s inactivity: <strong className="text-red-400">run ends</strong></span>
              </div>
              <div className="flex items-start gap-2 pt-1.5 border-t border-red-500/10">
                <span className="text-neon-green mt-0.5">🏆</span>
                <span>Final score = raw points × efficiency (hits ÷ seconds)</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
