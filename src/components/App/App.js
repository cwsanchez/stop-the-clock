import React, { useCallback, useEffect, useState, useRef } from 'react';
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
import FeverParticles from '../FeverParticles/FeverParticles';
import FeverRulesPanel from '../FeverRulesPanel/FeverRulesPanel';
import FeverEndScreen from '../FeverEndScreen/FeverEndScreen';

import useTimerStore from '../../stores/useTimerStore';
import useGameStore from '../../stores/useGameStore';
import useLeaderboardStore from '../../stores/useLeaderboardStore';
import useAuthStore from '../../stores/useAuthStore';
import useTimer from '../../hooks/useTimer';
import useSound from '../../hooks/useSound';
import { isStopSuccess, formatTime } from '../../utils/formatTime';

function GameMessage() {
  const { phase } = useTimerStore();
  const { lastResult, mode, feverRunActive, feverEnded, currentMultiplier } = useGameStore();
  const isWeenie = mode === 'weenie';
  const isFever = mode === 'fever';

  if (isFever && feverRunActive) {
    const urgency = currentMultiplier >= 4
      ? 'NEON FIRE MODE! 🔥🔥🔥'
      : currentMultiplier >= 3
        ? 'ON FIRE! Keep going! 🔥🔥'
        : currentMultiplier >= 2
          ? 'Heating up! Hit at :00! 🔥'
          : 'Hit when centiseconds reach :00!';

    return (
      <AnimatePresence mode="wait">
        <motion.p
          key={`fever-${currentMultiplier}`}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          className={`text-sm font-mono tracking-wide mt-4 ${
            currentMultiplier >= 4 ? 'text-red-400' : currentMultiplier >= 2 ? 'text-orange-400' : 'text-yellow-400'
          }`}
        >
          {urgency}
        </motion.p>
      </AnimatePresence>
    );
  }

  if (isFever && feverEnded) {
    return null;
  }

  const messages = {
    idle: {
      text: isFever ? 'Ready for Fever Mode? Press Start!' : 'Press Start to begin',
      color: isFever ? 'text-red-400/70' : 'text-gray-500',
    },
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
  const {
    mode, score, incrementScore, failAttempt, resetGame, setPersonalBest,
    isNewBest, clearResult,
    feverRunActive, feverEnded, currentMultiplier, lastHitElapsedMs,
    startFeverRun, feverHit, feverResetMultiplier, endFeverRun, resetFever,
  } = useGameStore();
  const { submitScore, fetchAllLeaderboards, fetchUserScores } = useLeaderboardStore();
  const { user, initialize } = useAuthStore();
  const { reset: resetTimerLoop } = useTimer();
  const {
    playSuccess, playFail, playNewBest,
    playFeverHit, playFeverPerfect, playMultiplierChime, playFeverEnd,
  } = useSound();

  const [activeTab, setActiveTab] = useState('leaderboard');
  const feverCheckRef = useRef(null);
  const prevMultiplierRef = useRef(1);

  const isFever = mode === 'fever';
  const isWeenie = mode === 'weenie';

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    fetchAllLeaderboards();
  }, [fetchAllLeaderboards]);

  useEffect(() => {
    if (user) {
      fetchUserScores(user.id, mode).then(({ highScore }) => {
        setPersonalBest(highScore);
      });
    } else {
      setPersonalBest(0);
    }
  }, [user, mode, fetchUserScores, setPersonalBest]);

  // Fever mode inactivity checker
  useEffect(() => {
    if (!feverRunActive) {
      if (feverCheckRef.current) {
        cancelAnimationFrame(feverCheckRef.current);
        feverCheckRef.current = null;
      }
      return;
    }

    const checkFever = () => {
      const state = useGameStore.getState();
      const timerState = useTimerStore.getState();

      if (!state.feverRunActive || !timerState.running) return;

      const msSinceLastHit = timerState.elapsedMs - state.lastHitElapsedMs;

      if (msSinceLastHit >= 5000) {
        endFeverRun(timerState.elapsedMs);
        stopTimer(false);
        playFeverEnd();
        return;
      }

      if (msSinceLastHit >= 1000 && state.currentMultiplier > 1) {
        feverResetMultiplier();
      }

      feverCheckRef.current = requestAnimationFrame(checkFever);
    };

    feverCheckRef.current = requestAnimationFrame(checkFever);

    return () => {
      if (feverCheckRef.current) {
        cancelAnimationFrame(feverCheckRef.current);
      }
    };
  }, [feverRunActive, endFeverRun, stopTimer, feverResetMultiplier, playFeverEnd]);

  const fireConfetti = useCallback(() => {
    const colors = isFever
      ? ['#ff4400', '#ff0044', '#ff9500', '#ffcc00', '#ff2200']
      : isWeenie
        ? ['#fbbf24', '#f59e0b', '#f97316', '#fcd34d', '#fef08a']
        : ['#00f0ff', '#39ff14', '#f0ff00', '#ff00e5'];

    confetti({
      particleCount: isFever ? 120 : isWeenie ? 150 : 80,
      spread: isFever ? 90 : isWeenie ? 100 : 70,
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

    if (isFever) {
      setTimeout(() => {
        confetti({
          particleCount: 80,
          spread: 140,
          origin: { y: 0.5 },
          colors: ['#ff0044', '#ff4400', '#ffcc00'],
        });
      }, 150);
    }
  }, [isWeenie, isFever]);

  const handleStart = useCallback(() => {
    if (isFever) {
      resetFever();
      resetTimerLoop();
      resetTimer();
      setTimeout(() => {
        startTimer();
        const currentMs = useTimerStore.getState().elapsedMs;
        startFeverRun(currentMs);
      }, 50);
    } else {
      clearResult();
      startTimer();
    }
  }, [isFever, clearResult, startTimer, resetFever, resetTimerLoop, resetTimer, startFeverRun]);

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

  const handleFeverHit = useCallback(() => {
    if (!feverRunActive) return;

    const currentMs = useTimerStore.getState().elapsedMs;
    const cs = Math.floor(currentMs / 10) % 100;
    const isPerfect = cs === 0;
    const isNearHit = cs <= 5 || cs >= 95;

    if (!isPerfect && !isNearHit) {
      endFeverRun(currentMs);
      stopTimer(false);
      playFeverEnd();
      return;
    }

    const { newMultiplier, oldMultiplier } = feverHit(currentMs, isPerfect);

    if (isPerfect) {
      playFeverPerfect();
    } else {
      playFeverHit();
    }

    if (newMultiplier > oldMultiplier && newMultiplier !== oldMultiplier) {
      const wholeOld = Math.floor(oldMultiplier);
      const wholeNew = Math.floor(newMultiplier);
      if (wholeNew > wholeOld || newMultiplier >= 5) {
        setTimeout(() => playMultiplierChime(newMultiplier), 150);
      }
    }

    if (isPerfect) {
      const state = useGameStore.getState();
      if (state.feverTotal > state.personalBest) {
        fireConfetti();
      }
    }
  }, [feverRunActive, feverHit, endFeverRun, stopTimer, playFeverHit, playFeverPerfect, playMultiplierChime, playFeverEnd, fireConfetti]);

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
    if (isFever) {
      resetFever();
    }
    resetTimerLoop();
    resetTimer();
    resetGame();
  }, [isFever, resetFever, resetTimerLoop, resetTimer, resetGame]);

  const feverBgIntensity = feverRunActive ? Math.min((currentMultiplier - 1) / 4, 1) : 0;
  const showScreenPulse = feverRunActive && currentMultiplier >= 3;

  return (
    <div className="min-h-screen bg-dark-900 text-white overflow-hidden">
      <div className="fixed inset-0 pointer-events-none">
        {isFever && feverRunActive ? (
          <>
            <div
              className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl transition-all duration-500"
              style={{
                background: `rgba(255, ${Math.floor(68 - feverBgIntensity * 68)}, 0, ${0.02 + feverBgIntensity * 0.06})`,
              }}
            />
            <div
              className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-3xl transition-all duration-500"
              style={{
                background: `rgba(255, 0, ${Math.floor(68 + feverBgIntensity * 32)}, ${0.02 + feverBgIntensity * 0.04})`,
              }}
            />
            {showScreenPulse && (
              <div
                className="absolute inset-0 animate-screen-pulse"
                style={{
                  background: `radial-gradient(ellipse at center, rgba(255, 34, 0, ${0.03 + feverBgIntensity * 0.05}) 0%, transparent 70%)`,
                }}
              />
            )}
          </>
        ) : (
          <>
            <div className={`absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl transition-colors duration-1000 ${
              isWeenie ? 'bg-amber-400/[0.03]' : isFever ? 'bg-red-500/[0.02]' : 'bg-neon-cyan/[0.02]'
            }`} />
            <div className={`absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-3xl transition-colors duration-1000 ${
              isWeenie ? 'bg-orange-500/[0.03]' : isFever ? 'bg-orange-600/[0.02]' : 'bg-neon-pink/[0.02]'
            }`} />
          </>
        )}
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-6 sm:py-10">
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 sm:mb-8"
        >
          <div className="flex items-center gap-3">
            <TimerIcon size={24} className={isFever ? 'text-red-400' : isWeenie ? 'text-amber-400' : 'text-neon-cyan'} />
            <h1 className="text-xl sm:text-2xl font-display uppercase tracking-[0.2em] text-white">
              Stop the Clock
            </h1>
          </div>
          <UserHeader />
        </motion.header>

        <ModeSwitcher />

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 lg:gap-8">
          <div className="flex flex-col items-center">
            {isFever && !feverRunActive && !feverEnded && (
              <FeverRulesPanel />
            )}

            <motion.div
              className={`relative w-full border rounded-3xl p-6 sm:p-10 backdrop-blur-sm transition-all duration-500 ${
                isFever
                  ? feverRunActive
                    ? 'bg-red-950/20 border-red-500/20'
                    : 'bg-red-950/10 border-red-500/10'
                  : isWeenie
                    ? 'bg-amber-900/10 border-amber-400/10'
                    : 'bg-dark-800/30 border-gray-800/50'
              }`}
              style={
                isFever && feverRunActive && currentMultiplier >= 3
                  ? {
                      animation: 'fire-glow 1s ease-in-out infinite',
                    }
                  : {}
              }
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <FeverParticles
                multiplier={currentMultiplier}
                active={feverRunActive}
              />

              <Timer />
              <GameMessage />
              <Controls
                onStart={handleStart}
                onStop={handleStop}
                onChain={handleChain}
                onSubmit={handleSubmit}
                onReset={handleReset}
                onFeverHit={handleFeverHit}
              />
              {feverEnded ? <FeverEndScreen /> : <ScoreDisplay />}
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
          Stop the Clock &mdash; {
            mode === 'fever'
              ? 'Fever Mode — nonstop timer + multiplier madness'
              : mode === 'weenie'
                ? 'Stop near :00 (±0.05s)'
                : 'Stop exactly on :00'
          } to score
        </motion.footer>
      </div>

      <AuthModal />
    </div>
  );
}
