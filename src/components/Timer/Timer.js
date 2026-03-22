import React from 'react';
import { motion } from 'framer-motion';
import useTimerStore from '../../stores/useTimerStore';
import useGameStore from '../../stores/useGameStore';
import { formatTime } from '../../utils/formatTime';

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
        duration: 0.5,
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

function getFeverTimerStyle(phase, multiplier) {
  if (phase === 'stopped-fail') {
    return { color: '#ef4444', textShadow: '0 0 20px rgba(255,50,50,0.5)' };
  }
  if (multiplier >= 4) {
    return { color: '#f87171', textShadow: '0 0 25px rgba(255,0,100,0.9), 0 0 60px rgba(255,34,0,0.7), 0 0 100px rgba(255,0,68,0.5), 0 0 150px rgba(255,140,0,0.3)' };
  }
  if (multiplier >= 3) {
    return { color: '#fb923c', textShadow: '0 0 20px rgba(255,0,68,0.8), 0 0 60px rgba(255,68,0,0.5), 0 0 100px rgba(255,0,68,0.3)' };
  }
  if (multiplier >= 2) {
    return { color: '#fdba74', textShadow: '0 0 15px rgba(255,68,0,0.7), 0 0 50px rgba(255,68,0,0.4), 0 0 80px rgba(255,0,68,0.2)' };
  }
  if (multiplier >= 1.5) {
    return { color: '#facc15', textShadow: '0 0 10px rgba(255,149,0,0.6), 0 0 40px rgba(255,149,0,0.3)' };
  }
  return { color: '#f87171', textShadow: '0 0 20px rgba(255,68,0,0.4)' };
}

export default function Timer() {
  const { elapsedMs, phase } = useTimerStore();
  const { mode, currentMultiplier, feverRunActive } = useGameStore();
  const { minutes, seconds, centiseconds } = formatTime(elapsedMs);
  const isWeenie = mode === 'weenie';
  const isFever = mode === 'fever';
  const multiplier = currentMultiplier;

  const getTimerStyle = () => {
    if (isFever && (feverRunActive || phase === 'running')) {
      return getFeverTimerStyle(phase, multiplier);
    }

    switch (phase) {
      case 'stopped-success':
        return isWeenie
          ? { color: '#fbbf24', textShadow: '0 0 20px rgba(251,191,36,0.5)' }
          : isFever
            ? { color: '#f87171', textShadow: '0 0 20px rgba(255,68,0,0.5)' }
            : { color: '#39ff14', textShadow: '0 0 20px rgba(57,255,20,0.5)' };
      case 'stopped-fail':
        return { color: '#ef4444', textShadow: '0 0 20px rgba(255,50,50,0.5)' };
      case 'running':
        return isWeenie
          ? { color: '#fcd34d', textShadow: '0 0 20px rgba(251,191,36,0.4)' }
          : isFever
            ? getFeverTimerStyle('running', multiplier)
            : { color: '#00f0ff', textShadow: '0 0 20px rgba(0,240,255,0.4)' };
      default:
        return isWeenie
          ? { color: 'rgba(251,191,36,0.7)' }
          : isFever
            ? { color: 'rgba(248,113,113,0.7)' }
            : { color: 'rgba(0,240,255,0.7)' };
    }
  };

  const shakeIntensity = isFever && feverRunActive && multiplier >= 4;
  const enlarged = isFever && feverRunActive && multiplier >= 3;

  return (
    <motion.div
      className="relative select-none"
      animate={
        phase === 'stopped-fail' && !isFever
          ? { x: [0, -6, 6, -4, 4, 0] }
          : shakeIntensity
            ? { x: [0, -1, 1, -1, 1, 0] }
            : {}
      }
      transition={
        shakeIntensity
          ? { duration: 0.15, repeat: Infinity }
          : { duration: 0.4 }
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
        className="flex items-baseline justify-center font-display tracking-tight transition-all duration-300"
        style={{
          fontSize: enlarged ? 'clamp(4rem, 12vw, 10rem)' : 'clamp(3.5rem, 10vw, 8rem)',
          ...getTimerStyle(),
        }}
      >
        <span className="tabular-nums">{minutes}</span>
        <span className="mx-1 opacity-40">:</span>
        <span className="tabular-nums">{seconds}</span>
        <span className="mx-1 opacity-40">:</span>
        <span className="tabular-nums">{centiseconds}</span>
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
