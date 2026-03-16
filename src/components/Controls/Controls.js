import React from 'react';
import { motion } from 'framer-motion';
import { Play, Square, RotateCcw, Trophy, Zap } from 'lucide-react';
import useTimerStore from '../../stores/useTimerStore';
import useGameStore from '../../stores/useGameStore';
import useAuthStore from '../../stores/useAuthStore';

function ActionButton({ onClick, icon: Icon, label, variant = 'default', disabled = false, size = 'normal' }) {
  const variants = {
    start: 'bg-neon-cyan/10 border-neon-cyan/50 text-neon-cyan hover:bg-neon-cyan/20 hover:shadow-neon-cyan',
    'start-weenie': 'bg-amber-400/10 border-amber-400/50 text-amber-400 hover:bg-amber-400/20',
    'start-fever': 'bg-red-500/10 border-red-500/50 text-red-400 hover:bg-red-500/20 hover:shadow-neon-red',
    stop: 'bg-neon-pink/10 border-neon-pink/50 text-neon-pink hover:bg-neon-pink/20 hover:shadow-neon-pink',
    'fever-hit': 'bg-red-500/20 border-red-500/60 text-red-300 hover:bg-red-500/30 hover:shadow-neon-fire',
    chain: 'bg-neon-green/10 border-neon-green/50 text-neon-green hover:bg-neon-green/20 hover:shadow-neon-green',
    'chain-weenie': 'bg-amber-400/10 border-amber-400/50 text-amber-400 hover:bg-amber-400/20',
    submit: 'bg-neon-yellow/10 border-neon-yellow/50 text-neon-yellow hover:bg-neon-yellow/20',
    reset: 'bg-gray-500/10 border-gray-500/50 text-gray-400 hover:bg-gray-500/20',
    default: 'bg-dark-600 border-gray-600 text-gray-300 hover:bg-dark-500',
  };

  const sizeClass = size === 'large'
    ? 'px-8 py-4 text-base rounded-2xl'
    : 'px-5 py-3 text-sm rounded-xl';

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-2 ${sizeClass} border font-mono uppercase tracking-wider transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed ${variants[variant]}`}
    >
      <Icon size={size === 'large' ? 22 : 18} />
      {label}
    </motion.button>
  );
}

export default function Controls({ onStop, onStart, onChain, onSubmit, onReset, onFeverHit }) {
  const { phase } = useTimerStore();
  const { score, mode, feverRunActive, feverEnded } = useGameStore();
  const { user } = useAuthStore();
  const isWeenie = mode === 'weenie';
  const isFever = mode === 'fever';

  return (
    <motion.div
      className="flex flex-wrap justify-center gap-3 mt-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      {phase === 'idle' && !feverRunActive && !feverEnded && (
        <ActionButton
          onClick={onStart}
          icon={Play}
          label={isFever ? 'Start Fever' : 'Start'}
          variant={isFever ? 'start-fever' : isWeenie ? 'start-weenie' : 'start'}
          size={isFever ? 'large' : 'normal'}
        />
      )}

      {isFever && feverRunActive && phase === 'running' && (
        <ActionButton
          onClick={onFeverHit}
          icon={Zap}
          label="HIT!"
          variant="fever-hit"
          size="large"
        />
      )}

      {!isFever && phase === 'running' && (
        <ActionButton onClick={onStop} icon={Square} label="Stop" variant="stop" />
      )}

      {!isFever && phase === 'stopped-success' && (
        <>
          {user && score > 0 && (
            <ActionButton onClick={onSubmit} icon={Trophy} label="Submit" variant="submit" />
          )}
          <ActionButton
            onClick={onChain}
            icon={Zap}
            label="Chain"
            variant={isWeenie ? 'chain-weenie' : 'chain'}
          />
          <ActionButton onClick={onReset} icon={RotateCcw} label="Reset" variant="reset" />
        </>
      )}

      {!isFever && phase === 'stopped-fail' && (
        <>
          {user && score > 0 && (
            <ActionButton onClick={onSubmit} icon={Trophy} label="Submit" variant="submit" />
          )}
          <ActionButton onClick={onReset} icon={RotateCcw} label="Reset" variant="reset" />
        </>
      )}

      {isFever && feverEnded && (
        <>
          {user && score > 0 && (
            <ActionButton onClick={onSubmit} icon={Trophy} label="Submit Score" variant="submit" />
          )}
          <ActionButton onClick={onReset} icon={RotateCcw} label="Play Again" variant="start-fever" />
        </>
      )}

      {!user && phase !== 'running' && !feverRunActive && (
        <p className="w-full text-center text-xs text-gray-600 font-mono mt-2">
          Sign in to save scores & compete on the leaderboard
        </p>
      )}
    </motion.div>
  );
}
