import React from 'react';
import { motion } from 'framer-motion';
import { Flame, Target, Clock, Zap, TrendingUp } from 'lucide-react';
import useGameStore from '../../stores/useGameStore';

export default function FeverEndScreen() {
  const {
    feverTotal,
    totalHits,
    totalSeconds,
    feverFinalScore,
    feverEfficiency,
    personalBest,
  } = useGameStore();

  const efficiencyPct = (feverEfficiency * 100).toFixed(1);
  const isHighEff = feverEfficiency >= 0.8;
  const isNewBest = feverFinalScore > personalBest && personalBest > 0;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full mt-4 bg-gradient-to-b from-red-950/30 to-dark-800/50 border border-red-500/20 rounded-2xl p-5 sm:p-6"
    >
      <div className="text-center mb-4">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-500/10 border border-red-500/30 mb-3"
        >
          <Flame size={16} className="text-red-400" />
          <span className="text-xs font-display uppercase tracking-wider text-red-400">
            Fever Run Complete
          </span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <span className="block text-xs text-gray-500 uppercase tracking-wider font-mono mb-1">
            Final Score
          </span>
          <span className="text-5xl sm:text-6xl font-display text-red-400 tabular-nums drop-shadow-[0_0_20px_rgba(255,68,0,0.5)]">
            {feverFinalScore.toFixed(1)}
          </span>
        </motion.div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
        <StatCard
          icon={Zap}
          label="Raw Points"
          value={feverTotal.toFixed(1)}
          color="text-orange-400"
          delay={0.3}
        />
        <StatCard
          icon={Target}
          label="Total Hits"
          value={totalHits}
          color="text-yellow-400"
          delay={0.35}
        />
        <StatCard
          icon={Clock}
          label="Duration"
          value={`${totalSeconds.toFixed(1)}s`}
          color="text-gray-300"
          delay={0.4}
        />
        <StatCard
          icon={TrendingUp}
          label="Efficiency"
          value={`${efficiencyPct}%`}
          color={isHighEff ? 'text-neon-green' : 'text-gray-300'}
          delay={0.45}
        />
      </div>

      {isNewBest && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center text-xs font-mono text-neon-yellow mt-3"
        >
          ★ New Personal Best! ★
        </motion.p>
      )}
    </motion.div>
  );
}

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
