import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Swords, X, Info, Github } from 'lucide-react';

export default function JourneyRulesPanel() {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="absolute top-3 right-3 z-20">
      <button
        onClick={() => setExpanded(v => !v)}
        className="flex items-center justify-center w-7 h-7 rounded-full bg-purple-950/40 border border-purple-500/30 text-purple-400/60 hover:text-purple-400 hover:bg-purple-950/70 transition-all duration-200"
        title="How Journey Mode Works"
        aria-label="How Journey Mode Works"
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
            className="absolute right-0 top-9 w-80 bg-dark-800 border border-purple-500/20 rounded-2xl shadow-2xl overflow-hidden z-30"
          >
            <div className="flex items-center justify-between px-4 py-2.5 bg-purple-950/30">
              <div className="flex items-center gap-2">
                <Swords size={13} className="text-purple-400" />
                <span className="text-xs font-display uppercase tracking-wider text-purple-400">
                  How Journey Mode Works
                </span>
              </div>
              <button
                onClick={() => setExpanded(false)}
                className="text-purple-400/50 hover:text-purple-400 transition-colors"
                aria-label="Close"
              >
                <X size={13} />
              </button>
            </div>
            <div className="px-4 py-3 space-y-1.5 text-xs font-mono text-gray-400">
              <div className="flex items-start gap-2">
                <span className="text-red-400 mt-0.5">❤️</span>
                <span>Start with <strong className="text-red-300">5 lives</strong> — hard miss or 5s inactivity costs 1 life</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-purple-400 mt-0.5">⚔️</span>
                <span>Timer <strong className="text-purple-300">never stops</strong> — keep hitting at :00 nonstop</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-yellow-400 mt-0.5">⚡</span>
                <span>Perfect hit: <strong className="text-yellow-300">+1 × multiplier</strong> + bumps multiplier (max 5×)</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-400 mt-0.5">🌿</span>
                <span><strong className="text-green-300">Easy</strong> ±0.1s · <strong className="text-purple-300">Normal</strong> ±0.05s · <strong className="text-red-300">Insanity</strong> exact only</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-400 mt-0.5">🔮</span>
                <span><strong className="text-blue-300">Floating orbs</strong> appear on sides — tap for power-ups (2×, shield, +souls)</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-amber-400 mt-0.5">👁️</span>
                <span><strong className="text-amber-300">Bosses</strong> appear every 45-60s — complete their objective to defeat them</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-purple-300 mt-0.5">👻</span>
                <span>Collect <strong className="text-purple-300">souls</strong> — milestones unlock special bosses</span>
              </div>
              <div className="flex items-start gap-2 pt-1.5 border-t border-purple-500/10">
                <span className="text-neon-green mt-0.5">🏆</span>
                <span>Final score = (raw pts + boss bonus + soul bonus) × efficiency</span>
              </div>
              <a
                href="https://github.com/cwsanchez/stop-the-clock"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 pt-2 mt-1 border-t border-purple-500/10 text-purple-400/40 hover:text-neon-green/70 transition-colors"
              >
                <Github size={11} />
                <span>View source on GitHub</span>
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
