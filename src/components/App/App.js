import React, { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Timer as TimerIcon, Trophy, Flame } from 'lucide-react';

import Timer from '../Timer/Timer';
import Controls from '../Controls/Controls';
import ScoreDisplay from '../ScoreDisplay/ScoreDisplay';
import Leaderboard from '../Leaderboard/Leaderboard';
import ModeSwitcher from '../ModeSwitcher/ModeSwitcher';
import UserHeader from '../UserHeader/UserHeader';
import AuthModal from '../AuthModal/AuthModal';

import useTimerStore from '../../stores/useTimerStore';
import useGameStore from '../../stores/useGameStore';
import useLeaderboardStore from '../../stores/useLeaderboardStore';
import useAuthStore from '../../stores/useAuthStore';
import useTimer from '../../hooks/useTimer';
import useSound from '../../hooks/useSound';
import { isStopSuccess, formatTime } from '../../utils/formatTime';

function GameMessage() {
  const { phase } = useTimerStore();
  const { lastResult, mode } = useGameStore();
  const isWeenie = mode === 'weenie';

  const messages = {
    idle: { text: 'Press Start to begin', color: 'text-gray-500' },
    running: {
      text: isWeenie
        ? 'Stop near :00 — you have ±0.05s forgiveness!'
        : 'Stop when centiseconds hit 00!',
      color: isWeenie ? 'text-amber-400' : 'text-neon-cyan',
    },
    'stopped-success': {
      text: isWeenie ? 'Nice one! Keep it going! 🧽' : 'Perfect! Chain to keep going!',
      color: isWeenie ? 'text-amber-400' : 'text-neon-green',
    },
    'stopped-fail': { text: 'Missed! Submit your score or reset.', color: 'text-red-400' },
  };

  const msg = messages[phase] || messages.idle;

  return (
    <AnimatePresence mode="wait">
      <motion.p
        key={phase + (lastResult || '') + mode}
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -5 }}
        className={`text-sm font-mono tracking-wide mt-4 ${msg.color}`}
      >
        {msg.text}
      </motion.p>
    </AnimatePresence>
  );
}

export default function App() {
  const { startTimer, stopTimer, resetTimer, elapsedMs, phase } = useTimerStore();
  const { mode, score, incrementScore, failAttempt, resetGame, setPersonalBest, isNewBest, clearResult } = useGameStore();
  const { submitScore, fetchBothLeaderboards, fetchUserScores } = useLeaderboardStore();
  const { user, initialize } = useAuthStore();
  const { reset: resetTimerLoop } = useTimer();
  const { playSuccess, playFail, playNewBest } = useSound();

  const [activeTab, setActiveTab] = useState('leaderboard');

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    fetchBothLeaderboards();
  }, [fetchBothLeaderboards]);

  useEffect(() => {
    if (user) {
      fetchUserScores(user.id, mode).then(({ highScore }) => {
        setPersonalBest(highScore);
      });
    } else {
      setPersonalBest(0);
    }
  }, [user, mode, fetchUserScores, setPersonalBest]);

  const isWeenie = mode === 'weenie';

  const fireConfetti = useCallback(() => {
    const colors = isWeenie
      ? ['#fbbf24', '#f59e0b', '#f97316', '#fcd34d', '#fef08a']
      : ['#00f0ff', '#39ff14', '#f0ff00', '#ff00e5'];
    confetti({
      particleCount: isWeenie ? 150 : 80,
      spread: isWeenie ? 100 : 70,
      origin: { y: 0.6 },
      colors,
    });
    if (isWeenie) {
      setTimeout(() => {
        confetti({
          particleCount: 60,
          spread: 120,
          origin: { y: 0.4 },
          colors: ['#fbbf24', '#fde68a', '#f59e0b'],
        });
      }, 200);
    }
  }, [isWeenie]);

  const handleStart = useCallback(() => {
    clearResult();
    startTimer();
  }, [clearResult, startTimer]);

  const handleStop = useCallback(() => {
    const success = isStopSuccess(elapsedMs, mode);
    const { centiseconds } = formatTime(elapsedMs);
    stopTimer(success);

    if (success) {
      incrementScore();
      playSuccess();
      const currentScore = useGameStore.getState().score;
      if (currentScore > useGameStore.getState().personalBest) {
        setTimeout(() => {
          fireConfetti();
          playNewBest();
        }, 200);
      }
    } else {
      failAttempt();
      playFail();
    }
  }, [elapsedMs, mode, stopTimer, incrementScore, failAttempt, playSuccess, playFail, playNewBest, fireConfetti]);

  const handleChain = useCallback(() => {
    clearResult();
    resetTimerLoop();
    resetTimer();
    setTimeout(() => startTimer(), 50);
  }, [clearResult, resetTimerLoop, resetTimer, startTimer]);

  const handleSubmit = useCallback(async () => {
    if (!user || score === 0) return;
    const isNew = await submitScore(user.id, mode, score);
    if (isNew) {
      fireConfetti();
      playNewBest();
      setPersonalBest(score);
    }
  }, [user, score, mode, submitScore, fireConfetti, playNewBest, setPersonalBest]);

  const handleReset = useCallback(() => {
    resetTimerLoop();
    resetTimer();
    resetGame();
  }, [resetTimerLoop, resetTimer, resetGame]);

  return (
    <div className="min-h-screen bg-dark-900 text-white overflow-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <div className={`absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl transition-colors duration-1000 ${
          isWeenie ? 'bg-amber-400/[0.03]' : 'bg-neon-cyan/[0.02]'
        }`} />
        <div className={`absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-3xl transition-colors duration-1000 ${
          isWeenie ? 'bg-orange-500/[0.03]' : 'bg-neon-pink/[0.02]'
        }`} />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-6 sm:py-10">
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 sm:mb-8"
        >
          <div className="flex items-center gap-3">
            <TimerIcon size={24} className={isWeenie ? 'text-amber-400' : 'text-neon-cyan'} />
            <h1 className="text-xl sm:text-2xl font-display uppercase tracking-[0.2em] text-white">
              Stop the Clock
            </h1>
          </div>
          <UserHeader />
        </motion.header>

        <ModeSwitcher />

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 lg:gap-8">
          <div className="flex flex-col items-center">
            <motion.div
              className={`w-full border rounded-3xl p-6 sm:p-10 backdrop-blur-sm transition-colors duration-500 ${
                isWeenie
                  ? 'bg-amber-900/10 border-amber-400/10'
                  : 'bg-dark-800/30 border-gray-800/50'
              }`}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <Timer />
              <GameMessage />
              <Controls
                onStart={handleStart}
                onStop={handleStop}
                onChain={handleChain}
                onSubmit={handleSubmit}
                onReset={handleReset}
              />
              <ScoreDisplay />
            </motion.div>

            <div className="w-full mt-6 lg:hidden">
              <Leaderboard />
            </div>
          </div>

          <div className="hidden lg:flex flex-col gap-6">
            <Leaderboard />
          </div>
        </div>

        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center mt-12 text-xs text-gray-700 font-mono"
        >
          Stop the Clock &mdash; {mode === 'weenie' ? 'Stop near :00 (±0.05s)' : 'Stop exactly on :00'} to score
        </motion.footer>
      </div>

      <AuthModal />
    </div>
  );
}
