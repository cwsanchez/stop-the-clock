import React from 'react';
import { motion } from 'framer-motion';
import { Flame, Baby } from 'lucide-react';
import useGameStore from '../../stores/useGameStore';
import useTimerStore from '../../stores/useTimerStore';

export default function ModeSwitcher() {
  const { mode, setMode } = useGameStore();
  const { phase } = useTimerStore();
  const disabled = phase === 'running';

  const handleSwitch = (newMode) => {
    if (disabled || newMode === mode) return;
    setMode(newMode);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center gap-3 mb-6"
    >
      <span className="text-xs font-mono uppercase tracking-[0.3em] text-gray-500">
        Game Mode
      </span>
      <div className="relative flex items-center bg-dark-800/60 border border-gray-800/60 rounded-2xl p-1">
        <motion.div
          className={`absolute top-1 bottom-1 rounded-xl transition-colors duration-300 ${
            mode === 'classic'
              ? 'bg-neon-cyan/10 border border-neon-cyan/20'
              : 'bg-amber-400/10 border border-amber-400/20'
          }`}
          animate={{
            x: mode === 'classic' ? 0 : '100%',
          }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          style={{ left: '4px', width: 'calc(50% - 4px)' }}
        />

        <button
          onClick={() => handleSwitch('classic')}
          disabled={disabled}
          className={`relative z-10 flex flex-1 justify-center items-center gap-2 px-5 py-2.5 rounded-xl font-mono text-sm uppercase tracking-wider transition-all duration-300 disabled:cursor-not-allowed ${
            mode === 'classic'
              ? 'text-neon-cyan'
              : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          <Flame size={16} />
          Classic
        </button>

        <button
          onClick={() => handleSwitch('weenie')}
          disabled={disabled}
          className={`relative z-10 flex flex-1 justify-center items-center gap-2 px-5 py-2.5 rounded-xl font-mono text-sm uppercase tracking-wider transition-all duration-300 disabled:cursor-not-allowed ${
            mode === 'weenie'
              ? 'text-amber-400'
              : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          <Baby size={16} />
          Weenie Hut Jr
        </button>
      </div>

      {mode === 'weenie' && (
        <motion.p
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs font-mono text-amber-400/70"
        >
          ±0.05s forgiveness — you got this! 🧽
        </motion.p>
      )}
    </motion.div>
  );
}
