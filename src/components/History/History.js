import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, CheckCircle2, XCircle } from 'lucide-react';
import useLeaderboardStore from '../../stores/useLeaderboardStore';
import { formatTimestamp } from '../../utils/formatTime';

export default function History({ username }) {
  const { history, fetchHistory } = useLeaderboardStore();

  useEffect(() => {
    fetchHistory(username);
  }, [username, fetchHistory]);

  return (
    <div className="bg-dark-800/50 border border-gray-800 rounded-2xl p-4 sm:p-5">
      <div className="flex items-center gap-2 mb-4">
        <Clock size={18} className="text-neon-purple" />
        <h2 className="text-sm font-display uppercase tracking-widest text-gray-300">
          Recent Attempts
        </h2>
        <span className="text-xs text-gray-600 font-mono ml-auto">
          Last 10
        </span>
      </div>

      {!username ? (
        <div className="text-center py-8 text-gray-600 text-sm font-mono">
          Log in to track your history
        </div>
      ) : history.length === 0 ? (
        <div className="text-center py-8 text-gray-600 text-sm font-mono">
          No attempts yet. Start playing!
        </div>
      ) : (
        <div className="space-y-1 max-h-80 overflow-y-auto pr-1 scrollbar-thin">
          <AnimatePresence>
            {history.map((attempt, idx) => (
              <motion.div
                key={attempt.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.03 }}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-mono hover:bg-dark-700/50 transition-colors"
              >
                {attempt.wasSuccess ? (
                  <CheckCircle2 size={14} className="text-neon-green flex-shrink-0" />
                ) : (
                  <XCircle size={14} className="text-red-400 flex-shrink-0" />
                )}
                <span className="text-gray-400 flex-1">
                  Stopped at <span className="text-gray-200">{attempt.stoppedAt}</span>
                </span>
                <span
                  className={`tabular-nums font-display ${
                    attempt.wasSuccess ? 'text-neon-green' : 'text-red-400'
                  }`}
                >
                  {attempt.score}
                </span>
                {attempt.timestamp && (
                  <span className="text-[10px] text-gray-600 hidden sm:inline">
                    {formatTimestamp(attempt.timestamp)}
                  </span>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
