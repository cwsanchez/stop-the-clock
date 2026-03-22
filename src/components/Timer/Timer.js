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

function TimerSeparator({ colorClass }) {
  return (
    <span className={`text-4xl sm:text-5xl md:text-6xl font-display mx-1 self-start mt-1 ${colorClass}`}>
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

function FeverBadge({ multiplier }) {
  const intensity = Math.min((multiplier - 1) / 4, 1);
  const isMax = multiplier >= 4;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
      animate={{
        opacity: 1,
        scale: isMax ? [1, 1.05, 1] : 1,
        rotate: [-5, 5, -3, 3, 0],
      }}
      transition={{
        duration: isMax ? 0.5 : 0.5,
        scale: isMax ? { repeat: Infinity, duration: 0.4 } : undefined,
      }}
      className="absolute -top-4 -right-4 sm:-top-6 sm:-right-8 z-20"
    >
      <div
        className="rounded-xl px-2 py-1 sm:px-3 sm:py-1.5 transform rotate-12"
        style={{
          background: `rgba(255, ${Math.floor(68 - intensity * 68)}, 0, ${0.15 + intensity * 0.15})`,
          border: `2px solid rgba(255, ${Math.floor(68 - intensity * 68)}, 0, ${0.4 + intensity * 0.3})`,
          boxShadow: isMax
            ? '0 0 15px rgba(255, 34, 0, 0.4), 0 0 30px rgba(255, 0, 68, 0.2)'
            : `0 0 10px rgba(255, 68, 0, ${intensity * 0.3})`,
        }}
      >
        <span className="text-[10px] sm:text-xs font-display uppercase tracking-wider text-red-400 whitespace-nowrap">
          🔥 FEVER {multiplier.toFixed(1)}×
        </span>
      </div>
    </motion.div>
  );
}

function getFeverTimerColor(phase, multiplier) {
  if (phase === 'stopped-fail') {
    return 'text-red-500 drop-shadow-[0_0_20px_rgba(255,50,50,0.5)]';
  }

  if (multiplier >= 4) {
    return 'text-red-400 text-shadow-fever-inferno';
  }
  if (multiplier >= 3) {
    return 'text-orange-400 text-shadow-fever-fire';
  }
  if (multiplier >= 2) {
    return 'text-orange-300 text-shadow-fever-hot';
  }
  if (multiplier >= 1.5) {
    return 'text-yellow-400 text-shadow-fever-warm';
  }
  return 'text-red-400 drop-shadow-[0_0_20px_rgba(255,68,0,0.4)]';
}

function getFeverSeparatorColor(multiplier) {
  if (multiplier >= 4) return 'text-red-400/60';
  if (multiplier >= 3) return 'text-orange-400/50';
  if (multiplier >= 2) return 'text-orange-300/40';
  return 'text-red-400/40';
}

export default function Timer() {
  const { elapsedMs, phase } = useTimerStore();
  const { mode, currentMultiplier, feverRunActive } = useGameStore();
  const { minutes, seconds, centiseconds } = formatTime(elapsedMs);
  const isWeenie = mode === 'weenie';
  const isFever = mode === 'fever';
  const multiplier = currentMultiplier;

  const getTimerColor = () => {
    if (isFever && (feverRunActive || phase === 'running')) {
      return getFeverTimerColor(phase, multiplier);
    }

    switch (phase) {
      case 'stopped-success':
        return isWeenie
          ? 'text-amber-400 drop-shadow-[0_0_20px_rgba(251,191,36,0.5)]'
          : isFever
            ? 'text-red-400 drop-shadow-[0_0_20px_rgba(255,68,0,0.5)]'
            : 'text-neon-green drop-shadow-[0_0_20px_rgba(57,255,20,0.5)]';
      case 'stopped-fail':
        return 'text-red-500 drop-shadow-[0_0_20px_rgba(255,50,50,0.5)]';
      case 'running':
        return isWeenie
          ? 'text-amber-300 drop-shadow-[0_0_20px_rgba(251,191,36,0.4)]'
          : isFever
            ? getFeverTimerColor('running', multiplier)
            : 'text-neon-cyan drop-shadow-[0_0_20px_rgba(0,240,255,0.4)]';
      default:
        return isWeenie
          ? 'text-amber-400/70'
          : isFever
            ? 'text-red-400/70'
            : 'text-neon-cyan/70';
    }
  };

  const getSeparatorColor = () => {
    if (isFever && feverRunActive) return getFeverSeparatorColor(multiplier);
    if (isWeenie) return 'text-amber-400/40';
    if (isFever) return 'text-red-400/40';
    return 'text-neon-cyan/40';
  };

  const timerSizeClass = isFever && feverRunActive && multiplier >= 3
    ? 'text-7xl sm:text-8xl md:text-9xl lg:text-[10rem]'
    : 'text-6xl sm:text-7xl md:text-8xl lg:text-9xl';

  const shakeIntensity = isFever && feverRunActive && multiplier >= 4;
  const isFailShake = phase === 'stopped-fail' && !isFever;

  return (
    <motion.div
      className="relative select-none"
      animate={
        isFailShake
          ? { x: [0, -1.5, 1.5, -1.5, 1.5, 0] }
          : shakeIntensity
            ? { x: [0, -1.5, 1.5, -1.5, 1.5, 0] }
            : {}
      }
      transition={
        shakeIntensity
          ? { duration: 0.06, repeat: Infinity }
          : { duration: 0.06 }
      }
    >
      {isWeenie && <WeenieBadge />}
      {isFever && feverRunActive && <FeverBadge multiplier={multiplier} />}

      <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-2xl opacity-[0.03]">
        <div className="w-full h-[200%] bg-repeating-linear animate-scanline"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)',
          }}
        />
      </div>

      <div
        className={`flex items-baseline justify-center font-display ${timerSizeClass} tracking-tight transition-all duration-300 ${getTimerColor()}`}
      >
        <TimerDigit value={minutes} label="min" />
        <TimerSeparator colorClass={getSeparatorColor()} />
        <TimerDigit value={seconds} label="sec" />
        <TimerSeparator colorClass={getSeparatorColor()} />
        <motion.div
          className="flex flex-col items-center"
          animate={
            phase === 'stopped-success'
              ? { scale: [1, 1.2, 1] }
              : (isFailShake || shakeIntensity)
                ? { x: [0, 0.75, -0.75, 0.75, -0.75, 0] }
                : {}
          }
          transition={
            phase === 'stopped-success'
              ? { duration: 0.3 }
              : shakeIntensity
                ? { duration: 0.06, repeat: Infinity }
                : { duration: 0.06 }
          }
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

      {phase === 'running' && !isFever && (
        <motion.div
          className={`absolute -bottom-2 left-1/2 -translate-x-1/2 w-16 h-0.5 rounded-full ${
            isWeenie ? 'bg-amber-400' : 'bg-neon-cyan'
          }`}
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1, repeat: Infinity }}
        />
      )}

      {isFever && feverRunActive && (
        <motion.div
          className="absolute -bottom-2 left-1/2 -translate-x-1/2 h-1 rounded-full"
          style={{
            width: `${Math.min(multiplier / 5 * 100, 100)}%`,
            maxWidth: '200px',
            background: multiplier >= 4
              ? 'linear-gradient(90deg, #ff4400, #ff0044, #ff4400)'
              : multiplier >= 2
                ? 'linear-gradient(90deg, #ff9500, #ff4400)'
                : '#ff9500',
            boxShadow: multiplier >= 3
              ? '0 0 10px rgba(255, 68, 0, 0.5)'
              : 'none',
          }}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 0.3, repeat: Infinity }}
        />
      )}
    </motion.div>
  );
}
