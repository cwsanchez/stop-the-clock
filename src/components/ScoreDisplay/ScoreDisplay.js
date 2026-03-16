import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Star, Zap, Target } from 'lucide-react';
import useGameStore from '../../stores/useGameStore';

function MultiplierBadge({ multiplier }) {
  const intensity = Math.min((multiplier - 1) / 4, 1);
  const isMax = multiplier >= 5;
  const isHigh = multiplier >= 4;

  return (
    <motion.div
      className="flex flex-col items-center"
      animate={isHigh ? { scale: [1, 1.08, 1] } : {}}
      transition={isHigh ? { duration: 0.3, repeat: Infinity } : {}}
    >
      <div className="flex items-center gap-1 mb-1">
        <Zap size={16} className="text-red-400" />
        <span className="text-xs text-gray-500 uppercase tracking-widest font-mono">
          Multiplier
        </span>
      </div>
      <motion.span
        key={multiplier}
        initial={{ scale: 1.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-3xl sm:text-4xl font-display tabular-nums"
        style={{
          color: isMax
            ? '#ff0066'
            : isHigh
              ? '#ff2200'
              : multiplier >= 3
                ? '#ff4400'
                : multiplier >= 2
                  ? '#ff9500'
                  : '#fbbf24',
          textShadow: isHigh
            ? `0 0 20px rgba(255, 34, 0, ${0.5 + intensity * 0.3}), 0 0 40px rgba(255, 0, 68, ${intensity * 0.3})`
            : `0 0 10px rgba(255, 149, 0, ${intensity * 0.5})`,
        }}
      >
        {multiplier.toFixed(1)}×
      </motion.span>
      {isMax && (
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 0.5, repeat: Infinity }}
          className="text-[10px] font-mono text-red-400 uppercase tracking-wider"
        >
          MAX!
        </motion.span>
      )}
    </motion.div>
  );
}

export default function ScoreDisplay() {
  const {
    score,
    personalBest,
    isNewBest,
    lastResult,
    mode,
    feverRunActive,
    feverTotal,
    currentMultiplier,
    totalHits,
    feverEnded,
  } = useGameStore();
  const isWeenie = mode === 'weenie';
  const isFever = mode === 'fever';

  if (isFever && feverRunActive) {
    return (
      <motion.div
        className="flex items-center justify-center gap-6 sm:gap-10 mt-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-2 mb-1">
            <Flame size={16} className="text-orange-400" />
            <span className="text-xs text-gray-500 uppercase tracking-widest font-mono">
              Points
            </span>
          </div>
          <AnimatePresence mode="popLayout">
            <motion.span
              key={feverTotal.toFixed(1)}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.5, opacity: 0 }}
              className="text-3xl sm:text-4xl font-display tabular-nums text-orange-400"
            >
              {feverTotal.toFixed(1)}
            </motion.span>
          </AnimatePresence>
        </div>

        <div className="h-12 w-px bg-gray-700" />

        <MultiplierBadge multiplier={currentMultiplier} />

        <div className="h-12 w-px bg-gray-700" />

        <div className="flex flex-col items-center">
          <div className="flex items-center gap-2 mb-1">
            <Target size={16} className="text-yellow-400" />
            <span className="text-xs text-gray-500 uppercase tracking-widest font-mono">
              Hits
            </span>
          </div>
          <span className="text-3xl sm:text-4xl font-display tabular-nums text-yellow-400">
            {totalHits}
          </span>
        </div>
      </motion.div>
    );
  }

  if (isFever && feverEnded) {
    return null;
  }

  return (
    <motion.div
      className="flex items-center justify-center gap-8 sm:gap-12 mt-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3 }}
    >
      <div className="flex flex-col items-center">
        <div className="flex items-center gap-2 mb-1">
          <Flame size={16} className={isWeenie ? 'text-amber-400' : isFever ? 'text-red-400' : 'text-orange-400'} />
          <span className="text-xs text-gray-500 uppercase tracking-widest font-mono">
            {isFever ? 'Score' : 'Streak'}
          </span>
        </div>
        <AnimatePresence mode="popLayout">
          <motion.span
            key={score}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.5, opacity: 0 }}
            className={`text-4xl sm:text-5xl font-display tabular-nums ${
              lastResult === 'success' || lastResult === 'perfect'
                ? isWeenie ? 'text-amber-400' : isFever ? 'text-red-400' : 'text-neon-green'
                : lastResult === 'fail'
                ? 'text-red-500'
                : 'text-white'
            }`}
          >
            {score}
          </motion.span>
        </AnimatePresence>
      </div>

      <div className="h-12 w-px bg-gray-700" />

      <div className="flex flex-col items-center">
        <div className="flex items-center gap-2 mb-1">
          <Star size={16} className={isWeenie ? 'text-amber-400' : isFever ? 'text-red-400' : 'text-neon-yellow'} />
          <span className="text-xs text-gray-500 uppercase tracking-widest font-mono">
            Best
          </span>
        </div>
        <motion.span
          animate={isNewBest ? { scale: [1, 1.3, 1] } : {}}
          transition={{ duration: 0.4 }}
          className={`text-4xl sm:text-5xl font-display tabular-nums ${
            isNewBest
              ? isWeenie ? 'text-amber-400' : isFever ? 'text-red-400' : 'text-neon-yellow'
              : 'text-gray-300'
          }`}
        >
          {personalBest}
        </motion.span>
      </div>
    </motion.div>
  );
}
