import React from 'react';
import { motion } from 'framer-motion';
import { Play, Square, RotateCcw, Trophy, Zap } from 'lucide-react';
import useTimerStore from '../../stores/useTimerStore';
import useGameStore from '../../stores/useGameStore';

function ActionButton({ onClick, icon: Icon, label, variant = 'default', disabled = false }) {
  const variants = {
    start: 'bg-neon-cyan/10 border-neon-cyan/50 text-neon-cyan hover:bg-neon-cyan/20 hover:shadow-neon-cyan',
    stop: 'bg-neon-pink/10 border-neon-pink/50 text-neon-pink hover:bg-neon-pink/20 hover:shadow-neon-pink',
    chain: 'bg-neon-green/10 border-neon-green/50 text-neon-green hover:bg-neon-green/20 hover:shadow-neon-green',
    submit: 'bg-neon-yellow/10 border-neon-yellow/50 text-neon-yellow hover:bg-neon-yellow/20',
    reset: 'bg-gray-500/10 border-gray-500/50 text-gray-400 hover:bg-gray-500/20',
    default: 'bg-dark-600 border-gray-600 text-gray-300 hover:bg-dark-500',
  };

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-2 px-5 py-3 rounded-xl border font-mono text-sm uppercase tracking-wider transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed ${variants[variant]}`}
    >
      <Icon size={18} />
      {label}
    </motion.button>
  );
}

export default function Controls({ onStop, onStart, onChain, onSubmit, onReset }) {
  const { phase } = useTimerStore();
  const { score, username } = useGameStore();

  return (
    <motion.div
      className="flex flex-wrap justify-center gap-3 mt-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      {phase === 'idle' && (
        <ActionButton onClick={onStart} icon={Play} label="Start" variant="start" />
      )}

      {phase === 'running' && (
        <ActionButton onClick={onStop} icon={Square} label="Stop" variant="stop" />
      )}

      {phase === 'stopped-success' && (
        <>
          <ActionButton onClick={onChain} icon={Zap} label="Chain" variant="chain" />
          {username && score > 0 && (
            <ActionButton onClick={onSubmit} icon={Trophy} label="Submit" variant="submit" />
          )}
          <ActionButton onClick={onReset} icon={RotateCcw} label="Reset" variant="reset" />
        </>
      )}

      {phase === 'stopped-fail' && (
        <>
          {username && score > 0 && (
            <ActionButton onClick={onSubmit} icon={Trophy} label="Submit" variant="submit" />
          )}
          <ActionButton onClick={onReset} icon={RotateCcw} label="Reset" variant="reset" />
        </>
      )}
    </motion.div>
  );
}
