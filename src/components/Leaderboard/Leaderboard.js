import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Medal } from 'lucide-react';
import useLeaderboardStore from '../../stores/useLeaderboardStore';
import { formatTimestamp } from '../../utils/formatTime';

function RankBadge({ rank }) {
  if (rank === 1) return <span className="text-lg">{'\u{1F947}'}</span>;
  if (rank === 2) return <span className="text-lg">{'\u{1F948}'}</span>;
  if (rank === 3) return <span className="text-lg">{'\u{1F949}'}</span>;
  return (
    <span className="text-xs text-gray-500 font-mono w-6 text-center">
      {rank}
    </span>
  );
}

export default function Leaderboard({ currentUsername }) {
  const { leaderboard, fetchLeaderboard } = useLeaderboardStore();

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  return (
    <div className="bg-dark-800/50 border border-gray-800 rounded-2xl p-4 sm:p-5">
      <div className="flex items-center gap-2 mb-4">
        <Trophy size={18} className="text-neon-yellow" />
        <h2 className="text-sm font-display uppercase tracking-widest text-gray-300">
          Leaderboard
        </h2>
        <span className="text-xs text-gray-600 font-mono ml-auto">
          Top 50
        </span>
      </div>

      {leaderboard.length === 0 ? (
        <div className="text-center py-8 text-gray-600 text-sm font-mono">
          <Medal size={24} className="mx-auto mb-2 opacity-50" />
          No scores yet. Be the first!
        </div>
      ) : (
        <div className="space-y-1 max-h-80 overflow-y-auto pr-1 scrollbar-thin">
          <AnimatePresence>
            {leaderboard.map((entry, idx) => (
              <motion.div
                key={entry.username}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.03 }}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-mono transition-colors ${
                  entry.username === currentUsername
                    ? 'bg-neon-cyan/5 border border-neon-cyan/10'
                    : 'hover:bg-dark-700/50'
                }`}
              >
                <RankBadge rank={idx + 1} />
                <span
                  className={`flex-1 truncate ${
                    entry.username === currentUsername
                      ? 'text-neon-cyan'
                      : 'text-gray-300'
                  }`}
                >
                  {entry.username}
                </span>
                <span className="text-neon-green tabular-nums font-display text-base">
                  {entry.score}
                </span>
                {entry.timestamp && (
                  <span className="text-[10px] text-gray-600 hidden sm:inline">
                    {formatTimestamp(entry.timestamp)}
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
