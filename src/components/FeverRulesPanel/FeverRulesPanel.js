import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Zap } from 'lucide-react';

export default function FeverRulesPanel() {
  const [expanded, setExpanded] = useState(true);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full mb-4 bg-red-950/20 border border-red-500/20 rounded-2xl overflow-hidden"
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2">
          <Zap size={16} className="text-red-400" />
          <span className="text-sm font-display uppercase tracking-wider text-red-400">
            How Fever Mode Works
          </span>
        </div>
        {expanded
          ? <ChevronUp size={16} className="text-red-400/60" />
          : <ChevronDown size={16} className="text-red-400/60" />
        }
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-1.5 text-xs font-mono text-gray-400">
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
              <div className="flex items-start gap-2 pt-1 border-t border-red-500/10">
                <span className="text-neon-green mt-0.5">🏆</span>
                <span>Final score = raw points × efficiency (hits ÷ seconds)</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
