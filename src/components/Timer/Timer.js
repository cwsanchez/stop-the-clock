import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useTimerStore from '../../stores/useTimerStore';
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

function TimerSeparator() {
  return (
    <span className="text-4xl sm:text-5xl md:text-6xl font-display text-neon-cyan/40 mx-1 self-start mt-1">
      :
    </span>
  );
}

export default function Timer() {
  const { elapsedMs, phase } = useTimerStore();
  const { minutes, seconds, centiseconds } = formatTime(elapsedMs);

  const getTimerColor = () => {
    switch (phase) {
      case 'stopped-success':
        return 'text-neon-green drop-shadow-[0_0_20px_rgba(57,255,20,0.5)]';
      case 'stopped-fail':
        return 'text-red-500 drop-shadow-[0_0_20px_rgba(255,50,50,0.5)]';
      case 'running':
        return 'text-neon-cyan drop-shadow-[0_0_20px_rgba(0,240,255,0.4)]';
      default:
        return 'text-neon-cyan/70';
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
      {/* Scanline overlay */}
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
        <TimerSeparator />
        <TimerDigit value={seconds} label="sec" />
        <TimerSeparator />
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
          className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-16 h-0.5 bg-neon-cyan rounded-full"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1, repeat: Infinity }}
        />
      )}
    </motion.div>
  );
}
