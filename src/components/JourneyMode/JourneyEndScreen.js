import React from 'react';
import { motion } from 'framer-motion';
import { Swords, Target, Clock, TrendingUp, Trophy, RotateCcw, Shield, Zap } from 'lucide-react';
import useJourneyStore, { OBJECTIVES } from '../../stores/useJourneyStore';
import useAuthStore from '../../stores/useAuthStore';
import useGameStore from '../../stores/useGameStore';

function StatCard({ icon: Icon, label, value, color, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="flex flex-col items-center p-2.5 rounded-xl bg-dark-800/50 border border-gray-800/50"
    >
      <Icon size={14} className={`${color} mb-1`} />
      <span className={`text-lg font-display tabular-nums ${color}`}>{value}</span>
      <span className="text-[10px] text-gray-500 uppercase tracking-wider font-mono">{label}</span>
    </motion.div>
  );
}

function ObjectiveSummary({ powerUpsCollected, totalHits, bossesDefeated, delay }) {
  const values = [powerUpsCollected, totalHits, bossesDefeated];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="w-full rounded-xl bg-dark-800/50 border border-gray-800/50 p-3"
    >
      <span className="text-[10px] text-gray-500 uppercase tracking-wider font-mono block text-center mb-2">
        Objectives
      </span>
      <div className="flex gap-3">
        {OBJECTIVES.map((obj, i) => {
          const current = Math.min(values[i], obj.target);
          const complete = current >= obj.target;

          return (
            <div key={obj.id} className="flex flex-col items-center flex-1 min-w-0">
              <span className="text-sm mb-0.5">{obj.emoji}</span>
              <div className="w-full h-1.5 rounded-full bg-gray-800 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    background: complete ? '#4ade80' : obj.color,
                    width: `${(current / obj.target) * 100}%`,
                    boxShadow: complete ? '0 0 8px rgba(74,222,128,0.5)' : 'none',
                  }}
                />
              </div>
              <span
                className="text-[9px] font-mono mt-0.5 tabular-nums"
                style={{ color: complete ? '#4ade80' : '#6b7280' }}
              >
                {current}/{obj.target}
              </span>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

export default function JourneyEndScreen({ onSubmit, onReset }) {
  const {
    finalScore, journeyScore, totalHits, totalSeconds,
    efficiency, bossesDefeated, powerUpsCollected, difficulty,
  } = useJourneyStore();
  const { user } = useAuthStore();
  const { score } = useGameStore();

  const efficiencyPct = (efficiency * 100).toFixed(1);
  const isHighEff = efficiency >= 0.8;
  const diffLabel = difficulty === 'easy' ? 'Easy' : difficulty === 'insanity' ? 'Insanity' : 'Normal';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full"
    >
      <div className="text-center mb-4">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/30 mb-3"
        >
          <Swords size={16} className="text-purple-400" />
          <span className="text-xs font-display uppercase tracking-wider text-purple-400">
            Journey Complete
          </span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <span className="block text-xs text-gray-500 uppercase tracking-wider font-mono mb-1">
            Final Score ({diffLabel})
          </span>
          <span className="text-5xl sm:text-6xl font-display text-purple-400 tabular-nums drop-shadow-[0_0_20px_rgba(168,85,247,0.5)]">
            {finalScore.toFixed(1)}
          </span>
        </motion.div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mt-4">
        <StatCard icon={Swords} label="Bosses" value={bossesDefeated} color="text-amber-400" delay={0.3} />
        <StatCard icon={Target} label="Hits" value={totalHits} color="text-purple-300" delay={0.35} />
        <StatCard icon={Zap} label="Power-ups" value={powerUpsCollected} color="text-purple-400" delay={0.4} />
        <StatCard icon={Clock} label="Duration" value={`${totalSeconds.toFixed(1)}s`} color="text-gray-300" delay={0.45} />
        <StatCard
          icon={TrendingUp}
          label="Efficiency"
          value={`${efficiencyPct}%`}
          color={isHighEff ? 'text-neon-green' : 'text-gray-300'}
          delay={0.5}
        />
      </div>

      <div className="mt-3">
        <ObjectiveSummary
          powerUpsCollected={powerUpsCollected}
          totalHits={totalHits}
          bossesDefeated={bossesDefeated}
          delay={0.55}
        />
      </div>

      <motion.div
        className="flex flex-col items-center gap-3 mt-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <div className="flex gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onReset}
            className="flex items-center gap-2 px-6 py-3 rounded-xl border font-mono uppercase tracking-wider text-purple-300 bg-purple-500/10 border-purple-500/40 hover:bg-purple-500/20 transition-all"
          >
            <RotateCcw size={18} />
            Play Again
          </motion.button>
          {user && score > 0 && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onSubmit}
              className="flex items-center gap-2 px-6 py-3 rounded-xl border font-mono uppercase tracking-wider text-neon-yellow bg-neon-yellow/10 border-neon-yellow/50 hover:bg-neon-yellow/20 transition-all"
            >
              <Trophy size={18} />
              Submit Score
            </motion.button>
          )}
        </div>
        {!user && (
          <p className="text-xs text-gray-600 font-mono mt-1">
            Sign in to save scores & compete on the leaderboard
          </p>
        )}
      </motion.div>
    </motion.div>
  );
}
