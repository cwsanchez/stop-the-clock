import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useTimerStore from '../../stores/useTimerStore';
import useGameStore from '../../stores/useGameStore';
import { formatTime } from '../../utils/formatTime';

function TimerDigit({ value, label }) {
  return (
    <div className="flex flex-col items-center">
      <div className="relative overflow-hidden">
        <AnimatePresence mode="popLayout">
          <motion.span
            key={value}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ duration: 0.1 }}
            className="inline-block tabular-nums"
          >
            {value}
          </motion.span>
        </AnimatePresence>
      </div>
      <span className="text-xs text-gray-500 uppercase tracking-widest mt-1 font-mono">
        {label}
      </span>
    </div>
  );
}

function TimerSeparator({ weenie }) {
  return (
    <span className={`text-4xl sm:text-5xl md:text-6xl font-display mx-1 self-start mt-1 ${
      weenie ? 'text-amber-400/40' : 'text-neon-cyan/40'
    }`}>
      :
    </span>
  );
}

function WeenieBadge() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
      animate={{ opacity: 1, scale: 1, rotate: [-5, 5, -3, 3, 0] }}
      transition={{ duration: 0.5 }}
      className="absolute -top-4 -right-4 sm:-top-6 sm:-right-8 z-20"
    >
      <div className="bg-amber-400/20 border-2 border-amber-400/50 rounded-xl px-2 py-1 sm:px-3 sm:py-1.5 transform rotate-12 shadow-lg shadow-amber-400/10">
        <span className="text-[10px] sm:text-xs font-display uppercase tracking-wider text-amber-400 whitespace-nowrap">
          🧽 Weenie Hut Jr
        </span>
      </div>
    </motion.div>
  );
}

export default function Timer() {
  const { elapsedMs, phase } = useTimerStore();
  const { mode } = useGameStore();
  const { minutes, seconds, centiseconds } = formatTime(elapsedMs);
  const isWeenie = mode === 'weenie';

  const getTimerColor = () => {
    switch (phase) {
      case 'stopped-success':
        return isWeenie
          ? 'text-amber-400 drop-shadow-[0_0_20px_rgba(251,191,36,0.5)]'
          : 'text-neon-green drop-shadow-[0_0_20px_rgba(57,255,20,0.5)]';
      case 'stopped-fail':
        return 'text-red-500 drop-shadow-[0_0_20px_rgba(255,50,50,0.5)]';
      case 'running':
        return isWeenie
          ? 'text-amber-300 drop-shadow-[0_0_20px_rgba(251,191,36,0.4)]'
          : 'text-neon-cyan drop-shadow-[0_0_20px_rgba(0,240,255,0.4)]';
      default:
        return isWeenie ? 'text-amber-400/70' : 'text-neon-cyan/70';
    }
  };

  return (
    <motion.div
      className="relative select-none"
      animate={
        phase === 'stopped-fail'
          ? { x: [0, -6, 6, -4, 4, 0] }
          : {}
      }
      transition={{ duration: 0.4 }}
    >
      {isWeenie && <WeenieBadge />}

      <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-2xl opacity-[0.03]">
        <div className="w-full h-[200%] bg-repeating-linear animate-scanline"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)',
          }}
        />
      </div>

      <div
        className={`flex items-baseline justify-center font-display text-6xl sm:text-7xl md:text-8xl lg:text-9xl tracking-tight transition-colors duration-300 ${getTimerColor()}`}
      >
        <TimerDigit value={minutes} label="min" />
        <TimerSeparator weenie={isWeenie} />
        <TimerDigit value={seconds} label="sec" />
        <TimerSeparator weenie={isWeenie} />
        <motion.div
          className="flex flex-col items-center"
          animate={
            phase === 'stopped-success'
              ? { scale: [1, 1.2, 1] }
              : {}
          }
          transition={{ duration: 0.3 }}
        >
          <div className="relative overflow-hidden">
            <AnimatePresence mode="popLayout">
              <motion.span
                key={centiseconds}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -20, opacity: 0 }}
                transition={{ duration: 0.1 }}
                className="inline-block tabular-nums"
              >
                {centiseconds}
              </motion.span>
            </AnimatePresence>
          </div>
          <span className="text-xs text-gray-500 uppercase tracking-widest mt-1 font-mono">
            cs
          </span>
        </motion.div>
      </div>

      {phase === 'running' && (
        <motion.div
          className={`absolute -bottom-2 left-1/2 -translate-x-1/2 w-16 h-0.5 rounded-full ${
            isWeenie ? 'bg-amber-400' : 'bg-neon-cyan'
          }`}
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1, repeat: Infinity }}
        />
      )}
    </motion.div>
  );
}
