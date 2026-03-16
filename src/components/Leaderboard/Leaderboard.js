import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Medal, Flame, Baby } from 'lucide-react';
import useLeaderboardStore from '../../stores/useLeaderboardStore';
import useAuthStore from '../../stores/useAuthStore';

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

export default function Leaderboard() {
  const { classicLeaderboard, weenieLeaderboard, fetchLeaderboard, fetchBothLeaderboards, loading } = useLeaderboardStore();
  const { profile } = useAuthStore();
  const [tab, setTab] = useState('classic');

  useEffect(() => {
    fetchBothLeaderboards();
  }, [fetchBothLeaderboards]);

  const handleTabChange = (newTab) => {
    setTab(newTab);
    fetchLeaderboard(newTab);
  };

  const leaderboard = tab === 'classic' ? classicLeaderboard : weenieLeaderboard;
  const isWeenie = tab === 'weenie';

  return (
    <div className="bg-dark-800/50 border border-gray-800 rounded-2xl p-4 sm:p-5">
      <div className="flex items-center gap-2 mb-4">
        <Trophy size={18} className={isWeenie ? 'text-amber-400' : 'text-neon-yellow'} />
        <h2 className="text-sm font-display uppercase tracking-widest text-gray-300">
          Leaderboard
        </h2>
        <span className="text-xs text-gray-600 font-mono ml-auto">
          Top 50
        </span>
      </div>

      <div className="flex gap-1 mb-4 bg-dark-900/50 rounded-xl p-1">
        <button
          onClick={() => handleTabChange('classic')}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-mono uppercase tracking-wider transition-all ${
            tab === 'classic'
              ? 'bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20'
              : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          <Flame size={12} />
          Classic
        </button>
        <button
          onClick={() => handleTabChange('weenie')}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-mono uppercase tracking-wider transition-all ${
            tab === 'weenie'
              ? 'bg-amber-400/10 text-amber-400 border border-amber-400/20'
              : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          <Baby size={12} />
          Weenie Hut Jr
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block w-5 h-5 border-2 border-gray-700 border-t-neon-cyan rounded-full animate-spin" />
        </div>
      ) : leaderboard.length === 0 ? (
        <div className="text-center py-8 text-gray-600 text-sm font-mono">
          <Medal size={24} className="mx-auto mb-2 opacity-50" />
          No scores yet. Be the first!
        </div>
      ) : (
        <div className="space-y-1 max-h-80 overflow-y-auto pr-1 scrollbar-thin">
          <AnimatePresence mode="popLayout">
            {leaderboard.map((entry, idx) => {
              const isYou = profile && entry.displayName === profile.display_name;
              return (
                <motion.div
                  key={`${entry.displayName}-${idx}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-mono transition-colors ${
                    isYou
                      ? isWeenie
                        ? 'bg-amber-400/5 border border-amber-400/10'
                        : 'bg-neon-cyan/5 border border-neon-cyan/10'
                      : 'hover:bg-dark-700/50'
                  }`}
                >
                  <RankBadge rank={idx + 1} />
                  <span
                    className={`flex-1 truncate ${
                      isYou
                        ? isWeenie ? 'text-amber-400' : 'text-neon-cyan'
                        : 'text-gray-300'
                    }`}
                  >
                    {entry.displayName}
                    {isYou && <span className="text-[10px] ml-1 opacity-60">(you)</span>}
                  </span>
                  <span className={`tabular-nums font-display text-base ${
                    isWeenie ? 'text-amber-400' : 'text-neon-green'
                  }`}>
                    {entry.highScore}
                  </span>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
