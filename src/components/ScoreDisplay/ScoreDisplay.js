import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Star } from 'lucide-react';
import useGameStore from '../../stores/useGameStore';

export default function ScoreDisplay() {
  const { score, personalBest, isNewBest, lastResult, mode } = useGameStore();
  const isWeenie = mode === 'weenie';

  return (
    <motion.div
      className="flex items-center justify-center gap-8 sm:gap-12 mt-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3 }}
    >
      <div className="flex flex-col items-center">
        <div className="flex items-center gap-2 mb-1">
          <Flame size={16} className={isWeenie ? 'text-amber-400' : 'text-orange-400'} />
          <span className="text-xs text-gray-500 uppercase tracking-widest font-mono">
            Streak
          </span>
        </div>
        <AnimatePresence mode="popLayout">
          <motion.span
            key={score}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.5, opacity: 0 }}
            className={`text-4xl sm:text-5xl font-display tabular-nums ${
              lastResult === 'success'
                ? isWeenie ? 'text-amber-400' : 'text-neon-green'
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
          <Star size={16} className={isWeenie ? 'text-amber-400' : 'text-neon-yellow'} />
          <span className="text-xs text-gray-500 uppercase tracking-widest font-mono">
            Best
          </span>
        </div>
        <motion.span
          animate={isNewBest ? { scale: [1, 1.3, 1] } : {}}
          transition={{ duration: 0.4 }}
          className={`text-4xl sm:text-5xl font-display tabular-nums ${
            isNewBest
              ? isWeenie ? 'text-amber-400' : 'text-neon-yellow'
              : 'text-gray-300'
          }`}
        >
          {personalBest}
        </motion.span>
      </div>
    </motion.div>
  );
}
