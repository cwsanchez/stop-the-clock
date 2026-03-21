import React from 'react';
import { motion } from 'framer-motion';
import { Flame, Baby, Zap, Swords } from 'lucide-react';
import useGameStore from '../../stores/useGameStore';
import useTimerStore from '../../stores/useTimerStore';
import useJourneyStore from '../../stores/useJourneyStore';

const MODES = [
  { key: 'classic', label: 'Classic', icon: Flame, color: 'text-neon-cyan' },
  { key: 'weenie', label: 'Weenie Hut Jr', icon: Baby, color: 'text-amber-400' },
  { key: 'fever', label: 'Fever', icon: Zap, color: 'text-red-400' },
  { key: 'journey', label: 'Journey', icon: Swords, color: 'text-purple-400' },
];

function getModeIndex(mode) {
  return MODES.findIndex(m => m.key === mode);
}

function getSliderStyle(mode) {
  const idx = getModeIndex(mode);
  const bgColors = {
    classic: 'bg-neon-cyan/10 border border-neon-cyan/20',
    weenie: 'bg-amber-400/10 border border-amber-400/20',
    fever: 'bg-red-500/10 border border-red-500/20',
    journey: 'bg-purple-500/10 border border-purple-500/20',
  };
  return {
    className: `absolute top-1 bottom-1 rounded-xl transition-colors duration-300 ${bgColors[mode]}`,
    x: `${idx * 100}%`,
    width: 'calc(25% - 3px)',
    left: '4px',
  };
}

export default function ModeSwitcher() {
  const { mode, setMode, feverRunActive } = useGameStore();
  const { phase } = useTimerStore();
  const { journeyActive } = useJourneyStore();
  const disabled = phase === 'running' || feverRunActive || journeyActive;

  const handleSwitch = (newMode) => {
    if (disabled || newMode === mode) return;
    if (mode === 'journey') {
      useJourneyStore.getState().resetJourney();
      useTimerStore.getState().resetTimer();
    }
    setMode(newMode);
  };

  const sliderStyle = getSliderStyle(mode);

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
          className={sliderStyle.className}
          animate={{ x: sliderStyle.x }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          style={{ left: sliderStyle.left, width: sliderStyle.width }}
        />

        {MODES.map(({ key, label, icon: Icon, color }) => (
          <button
            key={key}
            onClick={() => handleSwitch(key)}
            disabled={disabled}
            className={`relative z-10 flex flex-1 sm:min-w-[8rem] justify-center items-center gap-2 px-3 sm:px-4 py-2.5 rounded-xl font-mono text-sm uppercase tracking-wider transition-all duration-300 disabled:cursor-not-allowed ${
              mode === key ? color : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <Icon size={16} className="flex-shrink-0" />
            <span className="hidden sm:inline whitespace-nowrap">{label}</span>
          </button>
        ))}
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

      {mode === 'fever' && (
        <motion.p
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs font-mono text-red-400/70"
        >
          Nonstop timer — keep hitting to build your multiplier! 🔥
        </motion.p>
      )}

      {mode === 'journey' && (
        <motion.p
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs font-mono text-purple-400/70"
        >
          5 lives — defeat mini-bosses, complete objectives, survive the journey! ⚔️
        </motion.p>
      )}
    </motion.div>
  );
}
