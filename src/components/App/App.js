import React, { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Timer as TimerIcon, Trophy, Clock } from 'lucide-react';

import Timer from '../Timer/Timer';
import Controls from '../Controls/Controls';
import ScoreDisplay from '../ScoreDisplay/ScoreDisplay';
import Username from '../Username/Username';
import Leaderboard from '../Leaderboard/Leaderboard';
import History from '../History/History';

import useTimerStore from '../../stores/useTimerStore';
import useGameStore from '../../stores/useGameStore';
import useLeaderboardStore from '../../stores/useLeaderboardStore';
import useTimer from '../../hooks/useTimer';
import useSound from '../../hooks/useSound';
import { isCentisecondsZero, formatTime } from '../../utils/formatTime';
import { saveAttempt, getPersonalBest } from '../../db/database';

function GameMessage() {
  const { phase } = useTimerStore();
  const { lastResult } = useGameStore();

  const messages = {
    idle: { text: 'Press Start to begin', color: 'text-gray-500' },
    running: { text: 'Stop when centiseconds hit 00!', color: 'text-neon-cyan' },
    'stopped-success': { text: 'Perfect! Chain to keep going!', color: 'text-neon-green' },
    'stopped-fail': { text: 'Missed! Submit your score or reset.', color: 'text-red-400' },
  };

  const msg = messages[phase] || messages.idle;

  return (
    <AnimatePresence mode="wait">
      <motion.p
        key={phase + (lastResult || '')}
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
  const { username, score, incrementScore, failAttempt, resetGame, setPersonalBest, isNewBest, clearResult } = useGameStore();
  const { submitScore, fetchLeaderboard, fetchHistory } = useLeaderboardStore();
  const { reset: resetTimerLoop } = useTimer();
  const { playSuccess, playFail, playNewBest } = useSound();

  const [activeTab, setActiveTab] = useState('leaderboard');

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  useEffect(() => {
    if (username) {
      getPersonalBest(username).then(setPersonalBest);
      fetchHistory(username);
    }
  }, [username, setPersonalBest, fetchHistory]);

  const fireConfetti = useCallback(() => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#00f0ff', '#39ff14', '#f0ff00', '#ff00e5'],
    });
  }, []);

  const handleStart = useCallback(() => {
    clearResult();
    startTimer();
  }, [clearResult, startTimer]);

  const handleStop = useCallback(() => {
    const success = isCentisecondsZero(elapsedMs);
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

    if (username) {
      const currentScore = useGameStore.getState().score;
      saveAttempt(username, currentScore, centiseconds, success);
      fetchHistory(username);
    }
  }, [elapsedMs, stopTimer, incrementScore, failAttempt, playSuccess, playFail, playNewBest, fireConfetti, username, fetchHistory]);

  const handleChain = useCallback(() => {
    clearResult();
    resetTimerLoop();
    resetTimer();
    setTimeout(() => startTimer(), 50);
  }, [clearResult, resetTimerLoop, resetTimer, startTimer]);

  const handleSubmit = useCallback(async () => {
    if (!username || score === 0) return;
    const isNew = await submitScore(username, score);
    if (isNew) {
      fireConfetti();
      playNewBest();
      setPersonalBest(score);
    }
    fetchLeaderboard();
  }, [username, score, submitScore, fireConfetti, playNewBest, setPersonalBest, fetchLeaderboard]);

  const handleReset = useCallback(() => {
    resetTimerLoop();
    resetTimer();
    resetGame();
  }, [resetTimerLoop, resetTimer, resetGame]);

  return (
    <div className="min-h-screen bg-dark-900 text-white overflow-hidden">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-neon-cyan/[0.02] rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-neon-pink/[0.02] rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-6 sm:py-10">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 sm:mb-12"
        >
          <div className="flex items-center gap-3">
            <TimerIcon size={24} className="text-neon-cyan" />
            <h1 className="text-xl sm:text-2xl font-display uppercase tracking-[0.2em] text-white">
              Stop the Clock
            </h1>
          </div>
          <Username />
        </motion.header>

        {/* Main Game Area */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 lg:gap-8">
          {/* Center Column: Timer + Controls + Score */}
          <div className="flex flex-col items-center">
            <motion.div
              className="w-full bg-dark-800/30 border border-gray-800/50 rounded-3xl p-6 sm:p-10 backdrop-blur-sm"
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

            {/* Mobile tabs for Leaderboard/History */}
            <div className="w-full mt-6 lg:hidden">
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setActiveTab('leaderboard')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-mono transition-colors ${
                    activeTab === 'leaderboard'
                      ? 'bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20'
                      : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  <Trophy size={14} />
                  Leaderboard
                </button>
                <button
                  onClick={() => setActiveTab('history')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-mono transition-colors ${
                    activeTab === 'history'
                      ? 'bg-neon-purple/10 text-neon-purple border border-neon-purple/20'
                      : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  <Clock size={14} />
                  History
                </button>
              </div>
              {activeTab === 'leaderboard' ? (
                <Leaderboard currentUsername={username} />
              ) : (
                <History username={username} />
              )}
            </div>
          </div>

          {/* Sidebar: Desktop Leaderboard + History */}
          <div className="hidden lg:flex flex-col gap-6">
            <Leaderboard currentUsername={username} />
            <History username={username} />
          </div>
        </div>

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center mt-12 text-xs text-gray-700 font-mono"
        >
          Stop the Clock &mdash; Stop exactly on :00 to score
        </motion.footer>
      </div>
    </div>
  );
}
