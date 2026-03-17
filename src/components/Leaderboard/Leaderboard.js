import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Medal, Flame, Baby, Zap, Swords, Clock } from 'lucide-react';
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

function getTimeUntilNextHour() {
  const now = new Date();
  const nextHour = new Date(now);
  nextHour.setMinutes(0, 0, 0);
  nextHour.setHours(nextHour.getHours() + 1);
  return nextHour - now;
}

function formatCountdown(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m ${String(seconds).padStart(2, '0')}s`;
}

function HourlyCountdown() {
  const [remaining, setRemaining] = useState(getTimeUntilNextHour);

  useEffect(() => {
    const tick = () => setRemaining(getTimeUntilNextHour());
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex items-center gap-1.5 text-[10px] text-gray-500 font-mono">
      <Clock size={10} className="text-gray-600" />
      <span>{formatCountdown(remaining)} until reset</span>
    </div>
  );
}

const TABS = [
  { key: 'classic', label: 'Classic', icon: Flame, activeClass: 'bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20' },
  { key: 'weenie', label: 'Weenie Hut Jr', icon: Baby, activeClass: 'bg-amber-400/10 text-amber-400 border border-amber-400/20' },
  { key: 'fever', label: 'Fever Legends', icon: Zap, activeClass: 'bg-red-500/10 text-red-400 border border-red-500/20' },
  { key: 'journey', label: 'Epic Journeys', icon: Swords, activeClass: 'bg-purple-500/10 text-purple-400 border border-purple-500/20' },
];

export default function Leaderboard({ iconsOnly = false }) {
  const {
    classicLeaderboard, weenieLeaderboard, feverLeaderboard, journeyLeaderboard,
    fetchLeaderboard, fetchAllLeaderboards, loading,
    activeLeaderboardTab, setActiveLeaderboardTab,
  } = useLeaderboardStore();
  const { profile } = useAuthStore();

  useEffect(() => {
    fetchAllLeaderboards();
  }, [fetchAllLeaderboards]);

  const handleTabChange = (newTab) => {
    setActiveLeaderboardTab(newTab);
    fetchLeaderboard(newTab);
  };

  const leaderboardMap = {
    classic: classicLeaderboard,
    weenie: weenieLeaderboard,
    fever: feverLeaderboard,
    journey: journeyLeaderboard,
  };

  const leaderboard = leaderboardMap[activeLeaderboardTab] || [];
  const isFever = activeLeaderboardTab === 'fever';
  const isWeenie = activeLeaderboardTab === 'weenie';
  const isJourney = activeLeaderboardTab === 'journey';

  const getHighlightColor = () => {
    if (isJourney) return { bg: 'bg-purple-500/5 border border-purple-500/10', text: 'text-purple-400' };
    if (isFever) return { bg: 'bg-red-500/5 border border-red-500/10', text: 'text-red-400' };
    if (isWeenie) return { bg: 'bg-amber-400/5 border border-amber-400/10', text: 'text-amber-400' };
    return { bg: 'bg-neon-cyan/5 border border-neon-cyan/10', text: 'text-neon-cyan' };
  };

  const scoreColor = isJourney ? 'text-purple-400' : isFever ? 'text-red-400' : isWeenie ? 'text-amber-400' : 'text-neon-green';
  const highlight = getHighlightColor();

  return (
    <div className="bg-dark-800/50 border border-gray-800 rounded-2xl p-4 sm:p-5">
      <div className="flex items-center gap-2 mb-1">
        <Trophy size={18} className={isJourney ? 'text-purple-400' : isFever ? 'text-red-400' : isWeenie ? 'text-amber-400' : 'text-neon-yellow'} />
        <h2 className="text-sm font-display uppercase tracking-widest text-gray-300">
          Leaderboard
        </h2>
        <span className="text-xs text-gray-600 font-mono ml-auto">
          Hourly
        </span>
      </div>

      <div className="flex justify-end mb-3">
        <HourlyCountdown />
      </div>

      <div className="flex gap-1 mb-4 bg-dark-900/50 rounded-xl p-1">
        {TABS.map(({ key, label, icon: Icon, activeClass }) => (
          <button
            key={key}
            onClick={() => handleTabChange(key)}
            className={`flex-1 min-w-0 flex items-center justify-center gap-1 px-2 py-2 rounded-lg text-[10px] sm:text-xs font-mono uppercase tracking-wider transition-all overflow-hidden ${
              activeLeaderboardTab === key ? activeClass : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <Icon size={iconsOnly ? 14 : 12} className="flex-shrink-0" />
            {!iconsOnly && (
              <>
                <span className="hidden sm:inline truncate">{label}</span>
                <span className="sm:hidden truncate">{key === 'journey' ? 'Journey' : key === 'fever' ? 'Fever' : key === 'weenie' ? 'Weenie' : 'Classic'}</span>
              </>
            )}
          </button>
        ))}
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
                    isYou ? highlight.bg : 'hover:bg-dark-700/50'
                  }`}
                >
                  <RankBadge rank={idx + 1} />
                  <span
                    className={`flex-1 min-w-0 truncate ${isYou ? highlight.text : 'text-gray-300'}`}
                  >
                    {entry.displayName}
                    {isYou && <span className="text-[10px] ml-1 opacity-60">(you)</span>}
                  </span>
                  <span className={`flex-shrink-0 tabular-nums font-display text-base ${scoreColor}`}>
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
