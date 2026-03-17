import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Swords, Heart, Zap, Ghost, Shield, Play, RotateCcw, Trophy, Info, X } from 'lucide-react';
import useTimerStore from '../../stores/useTimerStore';
import useJourneyStore, { POWERUPS } from '../../stores/useJourneyStore';
import useGameStore from '../../stores/useGameStore';
import useAuthStore from '../../stores/useAuthStore';
import useTimer from '../../hooks/useTimer';
import useSound from '../../hooks/useSound';
import { formatTime } from '../../utils/formatTime';
import JourneyEndScreen from './JourneyEndScreen';
import JourneyRulesPanel from './JourneyRulesPanel';

function fireJourneyConfetti() {
  const colors = ['#a855f7', '#8b5cf6', '#c084fc', '#7c3aed', '#fbbf24'];
  confetti({ particleCount: 140, spread: 100, origin: { y: 0.5 }, colors });
  setTimeout(() => {
    confetti({ particleCount: 80, spread: 140, origin: { y: 0.4 }, colors: ['#a855f7', '#fbbf24', '#f97316'] });
  }, 150);
}

function fireBossDefeatConfetti(color) {
  const colors = [color, '#fbbf24', '#ffffff', color, '#a855f7'];
  confetti({ particleCount: 200, spread: 120, origin: { y: 0.45 }, colors });
  setTimeout(() => {
    confetti({ particleCount: 100, spread: 160, origin: { y: 0.3 }, colors });
  }, 200);
  setTimeout(() => {
    confetti({ particleCount: 60, spread: 90, origin: { y: 0.6 }, colors: ['#fbbf24', '#ffffff'] });
  }, 400);
}

/* ─── Parallax Background ─── */
function JourneyBackground({ multiplier, souls, active }) {
  const intensity = active ? Math.min((multiplier - 1) / 4, 1) : 0;
  const soulIntensity = Math.min(souls / 50, 1);
  const combined = Math.min(intensity + soulIntensity * 0.3, 1);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Layer 1: slow-drift deep orbs */}
      <motion.div
        className="absolute w-[600px] h-[600px] rounded-full blur-3xl"
        style={{
          top: '10%', left: '-10%',
          background: `radial-gradient(circle, rgba(168,85,247,${0.03 + combined * 0.08}) 0%, transparent 70%)`,
        }}
        animate={{ x: [0, 30, 0], y: [0, 20, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
      />
      <motion.div
        className="absolute w-[500px] h-[500px] rounded-full blur-3xl"
        style={{
          bottom: '5%', right: '-5%',
          background: `radial-gradient(circle, rgba(139,92,246,${0.03 + combined * 0.06}) 0%, transparent 70%)`,
        }}
        animate={{ x: [0, -25, 0], y: [0, -15, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
      />

      {/* Layer 2: heat-up overlay */}
      {active && intensity > 0 && (
        <motion.div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(ellipse at center, rgba(168,85,247,${0.02 + intensity * 0.06}) 0%, rgba(124,58,237,${0.01 + intensity * 0.03}) 40%, transparent 70%)`,
          }}
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      )}

      {/* Layer 3: screen pulse at high multiplier */}
      {active && multiplier >= 3 && (
        <motion.div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(ellipse at center, rgba(139,92,246,${0.04 + intensity * 0.06}) 0%, transparent 60%)`,
          }}
          animate={{ opacity: [0.3, 0.8, 0.3] }}
          transition={{ duration: 0.8, repeat: Infinity }}
        />
      )}

      {/* Layer 4: star particles */}
      {active && (
        <div className="absolute inset-0">
          {Array.from({ length: Math.min(Math.floor(souls / 3) + 2, 15) }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 rounded-full bg-purple-400/40"
              style={{ left: `${(i * 17 + 5) % 100}%`, top: `${(i * 23 + 10) % 90}%` }}
              animate={{ opacity: [0, 0.6, 0], scale: [0.5, 1, 0.5] }}
              transition={{ duration: 2 + (i % 3), repeat: Infinity, delay: i * 0.3 }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Lives Display ─── */
function LivesDisplay({ lives, maxLives = 5 }) {
  return (
    <div className="flex items-center gap-1.5">
      <Heart size={16} className="text-red-400" />
      <div className="flex gap-1">
        {Array.from({ length: maxLives }).map((_, i) => (
          <motion.div
            key={i}
            animate={i < lives ? { scale: [1, 1.15, 1] } : { scale: 1, opacity: 0.2 }}
            transition={i < lives ? { duration: 1.2, repeat: Infinity, delay: i * 0.15 } : {}}
            className={`w-3 h-3 rounded-full ${i < lives ? 'bg-red-400 shadow-[0_0_6px_rgba(248,113,113,0.6)]' : 'bg-gray-700'}`}
          />
        ))}
      </div>
      <span className="text-xs font-mono text-gray-400 ml-1">{lives}</span>
    </div>
  );
}

/* ─── Souls Counter ─── */
function SoulsCounter({ souls }) {
  return (
    <motion.div className="flex items-center gap-1.5" layout>
      <Ghost size={14} className="text-purple-400" />
      <AnimatePresence mode="popLayout">
        <motion.span
          key={souls}
          initial={{ y: -8, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 8, opacity: 0 }}
          className="text-sm font-display tabular-nums text-purple-300"
        >
          {souls}
        </motion.span>
      </AnimatePresence>
      <span className="text-[10px] font-mono text-gray-500 uppercase tracking-wider">souls</span>
    </motion.div>
  );
}

/* ─── Multiplier Display ─── */
function MultiplierHUD({ multiplier }) {
  const isHigh = multiplier >= 4;
  const intensity = Math.min((multiplier - 1) / 4, 1);
  const color = multiplier >= 5 ? '#c084fc' : multiplier >= 4 ? '#a855f7' : multiplier >= 3 ? '#8b5cf6' : multiplier >= 2 ? '#7c3aed' : '#9ca3af';

  return (
    <motion.div
      className="flex items-center gap-1.5"
      animate={isHigh ? { scale: [1, 1.05, 1] } : {}}
      transition={isHigh ? { duration: 0.4, repeat: Infinity } : {}}
    >
      <Zap size={14} style={{ color }} />
      <AnimatePresence mode="popLayout">
        <motion.span
          key={multiplier}
          initial={{ scale: 1.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          className="text-lg font-display tabular-nums"
          style={{
            color,
            textShadow: `0 0 ${10 + intensity * 15}px ${color}`,
          }}
        >
          {multiplier.toFixed(1)}×
        </motion.span>
      </AnimatePresence>
    </motion.div>
  );
}

/* ─── Power-up Indicator ─── */
function PowerUpIndicator({ powerUpId, endMs }) {
  const [remaining, setRemaining] = useState(0);
  const powerUp = POWERUPS.find(p => p.id === powerUpId);

  useEffect(() => {
    if (!endMs) return;
    const tick = () => setRemaining(Math.max(0, endMs - Date.now()));
    tick();
    const id = setInterval(tick, 100);
    return () => clearInterval(id);
  }, [endMs]);

  if (!powerUp || remaining <= 0) return null;

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 20, opacity: 0 }}
      className="flex items-center gap-2 px-3 py-1.5 rounded-full border"
      style={{
        background: `${powerUp.color}15`,
        borderColor: `${powerUp.color}40`,
      }}
    >
      <span className="text-base">{powerUp.emoji}</span>
      <span className="text-xs font-mono" style={{ color: powerUp.color }}>
        {powerUp.name}
      </span>
      <span className="text-[10px] font-mono text-gray-400">
        {(remaining / 1000).toFixed(1)}s
      </span>
    </motion.div>
  );
}

/* ─── Floating Target ─── */
function FloatingTarget({ target, onCollect }) {
  const [gone, setGone] = useState(false);
  const timeLeft = Math.max(0, target.expiresAt - Date.now());

  const handleClick = () => {
    setGone(true);
    onCollect(target.id);
  };

  if (gone) return null;

  return (
    <motion.button
      onClick={handleClick}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{
        opacity: [0.7, 1, 0.7],
        scale: [0.95, 1.05, 0.95],
        y: [0, -8, 0],
      }}
      exit={{ opacity: 0, scale: 0, rotate: 180 }}
      transition={{
        opacity: { duration: 2, repeat: Infinity },
        scale: { duration: 3, repeat: Infinity },
        y: { duration: 4, repeat: Infinity },
      }}
      className="absolute z-30 flex flex-col items-center cursor-pointer group"
      style={{
        [target.side]: '4%',
        top: `${target.y}%`,
      }}
    >
      <div
        className="w-14 h-14 rounded-full flex items-center justify-center border-2 transition-transform group-hover:scale-110"
        style={{
          background: `radial-gradient(circle, ${target.powerUp.color}30, ${target.powerUp.color}10)`,
          borderColor: `${target.powerUp.color}60`,
          boxShadow: `0 0 20px ${target.powerUp.color}40, 0 0 40px ${target.powerUp.color}20`,
        }}
      >
        <span className="text-2xl">{target.powerUp.emoji}</span>
      </div>
      <span className="text-[9px] font-mono mt-1 opacity-60" style={{ color: target.powerUp.color }}>
        {target.powerUp.name}
      </span>
      <div className="w-10 h-0.5 rounded-full mt-0.5 bg-gray-700 overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: target.powerUp.color }}
          initial={{ width: '100%' }}
          animate={{ width: '0%' }}
          transition={{ duration: timeLeft / 1000, ease: 'linear' }}
        />
      </div>
    </motion.button>
  );
}

/* ─── Boss Encounter ─── */
function BossEncounter({ boss, progress, defeated }) {
  if (!boss) return null;
  const pct = Math.min(progress / boss.requirement, 1);

  return (
    <AnimatePresence>
      <motion.div
        key={boss.id}
        initial={{ opacity: 0, scale: 0.8, y: -30 }}
        animate={
          defeated
            ? { opacity: 0, scale: 0, rotate: 720, y: -200 }
            : { opacity: 1, scale: 1, y: 0 }
        }
        exit={{ opacity: 0, scale: 0, rotate: 720, y: -200 }}
        transition={defeated ? { duration: 1.2, ease: 'easeIn' } : { type: 'spring', stiffness: 200 }}
        className="absolute top-[15%] left-1/2 -translate-x-1/2 z-20 flex flex-col items-center"
      >
        <motion.div
          animate={{ y: [0, -6, 0], rotate: [-2, 2, -2] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="relative"
        >
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center border-2"
            style={{
              background: boss.bgColor,
              borderColor: boss.borderColor,
              boxShadow: `0 0 30px ${boss.borderColor}, 0 0 60px ${boss.bgColor}`,
            }}
          >
            <span className="text-4xl">{boss.emoji}</span>
          </div>
          {defeated && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: [1, 1.5, 0] }}
              transition={{ duration: 0.8 }}
              className="absolute inset-0 rounded-2xl"
              style={{ boxShadow: `0 0 60px ${boss.color}, 0 0 120px ${boss.color}` }}
            />
          )}
        </motion.div>

        <span className="text-xs font-display uppercase tracking-wider mt-2" style={{ color: boss.color }}>
          {boss.name}
        </span>

        {!defeated && (
          <>
            <span className="text-[10px] font-mono text-gray-400 mt-1">{boss.objectiveDesc}</span>
            <div className="w-32 h-1.5 rounded-full mt-1.5 bg-gray-800 overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ background: boss.color }}
                animate={{ width: `${pct * 100}%` }}
                transition={{ type: 'spring', stiffness: 300 }}
              />
            </div>
            <span className="text-[9px] font-mono text-gray-500 mt-0.5">
              {Math.min(Math.floor(progress), boss.requirement)}/{boss.requirement}
            </span>
          </>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

/* ─── Journey Timer ─── */
function JourneyTimer({ elapsedMs, multiplier, active }) {
  const { minutes, seconds, centiseconds } = formatTime(elapsedMs);
  const intensity = Math.min((multiplier - 1) / 4, 1);
  const color = multiplier >= 4
    ? '#c084fc' : multiplier >= 3
      ? '#a855f7' : multiplier >= 2
        ? '#8b5cf6' : '#c4b5fd';
  const glow = `0 0 ${15 + intensity * 25}px ${color}`;

  return (
    <motion.div
      className="select-none"
      animate={
        active && multiplier >= 4
          ? { x: [0, -1, 1, -1, 1, 0] }
          : {}
      }
      transition={multiplier >= 4 ? { duration: 0.15, repeat: Infinity } : {}}
    >
      <div
        className="flex items-baseline justify-center font-display tracking-tight transition-all duration-300"
        style={{
          fontSize: active && multiplier >= 3 ? 'clamp(4rem, 12vw, 10rem)' : 'clamp(3.5rem, 10vw, 8rem)',
          color,
          textShadow: glow,
        }}
      >
        <span className="tabular-nums">{minutes}</span>
        <span className="mx-1 opacity-40">:</span>
        <span className="tabular-nums">{seconds}</span>
        <span className="mx-1 opacity-40">:</span>
        <motion.span
          className="tabular-nums"
          animate={centiseconds === '00' && active ? { scale: [1, 1.15, 1] } : {}}
          transition={{ duration: 0.2 }}
        >
          {centiseconds}
        </motion.span>
      </div>
      {active && (
        <motion.div
          className="mx-auto h-1 rounded-full mt-2"
          style={{
            width: `${Math.min(multiplier / 5 * 100, 100)}%`,
            maxWidth: '200px',
            background: `linear-gradient(90deg, #7c3aed, ${color})`,
            boxShadow: multiplier >= 3 ? `0 0 10px ${color}` : 'none',
          }}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 0.3, repeat: Infinity }}
        />
      )}
    </motion.div>
  );
}

/* ─── Difficulty Select ─── */
function DifficultySelect({ onSelect, onStart }) {
  const { difficulty, setDifficulty } = useJourneyStore();

  const difficulties = [
    { key: 'easy', label: 'Easy', desc: '±0.1s tolerance', color: '#4ade80', icon: '🌿' },
    { key: 'normal', label: 'Normal', desc: '±0.05s tolerance', color: '#a855f7', icon: '⚔️' },
    { key: 'insanity', label: 'Insanity', desc: 'Exact :00 only', color: '#ef4444', icon: '💀' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center gap-6 py-8"
    >
      <motion.div
        initial={{ y: -20 }}
        animate={{ y: 0 }}
        className="flex items-center gap-3"
      >
        <Swords size={28} className="text-purple-400" />
        <h2 className="text-2xl font-display uppercase tracking-[0.2em] text-purple-300">
          Journey Mode
        </h2>
      </motion.div>

      <p className="text-sm font-mono text-gray-400 text-center max-w-md">
        Survive with 5 lives. Hit the timer, defeat bosses, collect souls.
        How far can you go?
      </p>

      <div className="flex flex-col gap-3 w-full max-w-xs">
        <span className="text-xs font-mono uppercase tracking-[0.3em] text-gray-500 text-center">
          Select Difficulty
        </span>
        {difficulties.map(d => (
          <motion.button
            key={d.key}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setDifficulty(d.key)}
            className="flex items-center gap-3 px-4 py-3 rounded-xl border transition-all"
            style={{
              background: difficulty === d.key ? `${d.color}15` : 'rgba(18,18,26,0.5)',
              borderColor: difficulty === d.key ? `${d.color}50` : 'rgba(75,75,100,0.3)',
              boxShadow: difficulty === d.key ? `0 0 15px ${d.color}20` : 'none',
            }}
          >
            <span className="text-xl">{d.icon}</span>
            <div className="text-left flex-1">
              <span className="text-sm font-display uppercase tracking-wider" style={{ color: difficulty === d.key ? d.color : '#9ca3af' }}>
                {d.label}
              </span>
              <span className="block text-[10px] font-mono text-gray-500">{d.desc}</span>
            </div>
            {difficulty === d.key && (
              <motion.div layoutId="diff-check" className="w-2 h-2 rounded-full" style={{ background: d.color }} />
            )}
          </motion.button>
        ))}
      </div>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onStart}
        className="flex items-center gap-2 px-8 py-4 rounded-2xl border font-mono uppercase tracking-wider text-purple-300 bg-purple-500/10 border-purple-500/40 hover:bg-purple-500/20 hover:shadow-[0_0_20px_rgba(168,85,247,0.3)] transition-all"
      >
        <Play size={20} />
        Begin Journey
      </motion.button>
    </motion.div>
  );
}

/* ─── Shield Flash Overlay ─── */
function ShieldFlash({ show }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.3, 0] }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0 z-40 pointer-events-none bg-blue-500/10 rounded-3xl"
        />
      )}
    </AnimatePresence>
  );
}

/* ─── Life Lost Flash ─── */
function LifeLostFlash({ show }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.4, 0] }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="absolute inset-0 z-40 pointer-events-none bg-red-500/10 rounded-3xl"
        />
      )}
    </AnimatePresence>
  );
}

/* ═══════════════════════════════════════════
   MAIN JOURNEY MODE COMPONENT
   ═══════════════════════════════════════════ */
export default function JourneyMode({ onSubmit }) {
  const { startTimer, stopTimer, resetTimer, elapsedMs } = useTimerStore();
  const {
    lives, souls, difficulty, journeyActive, journeyEnded, currentMultiplier,
    lastHitElapsedMs, currentBoss, bossProgress, bossesDefeated,
    bossDefeatedAnimation, floatingTargets, activePowerUp, powerUpEndMs,
    shieldActive, journeyScore, totalHits, difficultySelected,
    bossSpawnTime, lastInactivityPenaltyMs,
    startJourney, journeyHit, journeyMiss, endJourney,
    spawnBoss, spawnFloatingTarget, collectTarget, removeExpiredTargets,
    resetJourney,
  } = useJourneyStore();
  const { user } = useAuthStore();
  const { reset: resetTimerLoop } = useTimer();
  const {
    playFeverHit, playFeverPerfect, playMultiplierChime, playFeverEnd,
    playLifeLost, playBossDefeat, playPowerUp, playShieldBreak,
  } = useSound();

  const journeyIntervalRef = useRef(null);
  const targetSpawnRef = useRef(null);
  const [shieldFlash, setShieldFlash] = useState(false);
  const [lifeLostFlash, setLifeLostFlash] = useState(false);

  // Sync final score to game store for submission flow
  useEffect(() => {
    if (journeyEnded) {
      const { finalScore } = useJourneyStore.getState();
      useGameStore.setState({ score: Math.round(finalScore) });
    }
  }, [journeyEnded]);

  // Cleanup on unmount (mode change away from journey)
  useEffect(() => {
    return () => {
      if (journeyIntervalRef.current) clearInterval(journeyIntervalRef.current);
      if (targetSpawnRef.current) clearTimeout(targetSpawnRef.current);
    };
  }, []);

  // Get hit tolerance based on difficulty
  const getTolerance = useCallback(() => {
    switch (difficulty) {
      case 'easy': return 10;
      case 'insanity': return 0;
      default: return 5;
    }
  }, [difficulty]);

  const handleJourneyEnd = useCallback((ms) => {
    endJourney(ms);
    stopTimer(false);
    playFeverEnd();
  }, [endJourney, stopTimer, playFeverEnd]);

  // Main game loop interval
  useEffect(() => {
    if (!journeyActive) {
      if (journeyIntervalRef.current) {
        clearInterval(journeyIntervalRef.current);
        journeyIntervalRef.current = null;
      }
      return;
    }

    journeyIntervalRef.current = setInterval(() => {
      const jState = useJourneyStore.getState();
      const tState = useTimerStore.getState();
      if (!jState.journeyActive || !tState.running) return;

      const msSinceLastHit = tState.elapsedMs - jState.lastHitElapsedMs;
      const msSinceLastPenalty = tState.elapsedMs - jState.lastInactivityPenaltyMs;

      // 5s inactivity penalty
      if (msSinceLastHit >= 5000 && msSinceLastPenalty >= 5000) {
        const result = jState.journeyMiss();
        useJourneyStore.setState({
          lastInactivityPenaltyMs: tState.elapsedMs,
          lastHitElapsedMs: tState.elapsedMs,
        });

        if (result.shielded) {
          setShieldFlash(true);
          playShieldBreak();
          setTimeout(() => setShieldFlash(false), 500);
        } else {
          setLifeLostFlash(true);
          playLifeLost();
          setTimeout(() => setLifeLostFlash(false), 400);
          if (result.livesRemaining <= 0) {
            handleJourneyEnd(tState.elapsedMs);
            return;
          }
        }
      }

      // Multiplier reset after 1s inactivity
      if (msSinceLastHit >= 1000 && jState.currentMultiplier > 1) {
        useJourneyStore.setState({ currentMultiplier: 1, perfectStreak: 0 });
      }

      // Boss spawn
      if (!jState.currentBoss && !jState.bossDefeatedAnimation && Date.now() >= jState.bossSpawnTime && jState.bossSpawnTime > 0) {
        jState.spawnBoss();
      }

      // Expired targets
      jState.removeExpiredTargets();

      // Power-up expiry
      if (jState.activePowerUp && Date.now() >= jState.powerUpEndMs) {
        useJourneyStore.setState({ activePowerUp: null, powerUpEndMs: 0, shieldActive: false });
      }
    }, 250);

    return () => {
      if (journeyIntervalRef.current) {
        clearInterval(journeyIntervalRef.current);
        journeyIntervalRef.current = null;
      }
    };
  }, [journeyActive, handleJourneyEnd, playShieldBreak, playLifeLost]);

  // Target spawning loop
  useEffect(() => {
    if (!journeyActive) {
      if (targetSpawnRef.current) {
        clearTimeout(targetSpawnRef.current);
        targetSpawnRef.current = null;
      }
      return;
    }

    const scheduleNext = () => {
      const delay = 8000 + Math.random() * 4000;
      targetSpawnRef.current = setTimeout(() => {
        if (useJourneyStore.getState().journeyActive) {
          spawnFloatingTarget();
          scheduleNext();
        }
      }, delay);
    };
    scheduleNext();

    return () => {
      if (targetSpawnRef.current) {
        clearTimeout(targetSpawnRef.current);
        targetSpawnRef.current = null;
      }
    };
  }, [journeyActive, spawnFloatingTarget]);

  const handleStart = useCallback(() => {
    resetTimerLoop();
    resetTimer();
    setTimeout(() => {
      startTimer();
      const ms = useTimerStore.getState().elapsedMs;
      startJourney(ms);
    }, 50);
  }, [resetTimerLoop, resetTimer, startTimer, startJourney]);

  const handleHit = useCallback(() => {
    if (!journeyActive) return;

    const currentMs = useTimerStore.getState().elapsedMs;
    const cs = Math.floor(currentMs / 10) % 100;
    const tolerance = getTolerance();
    const isPerfect = cs === 0;
    const isNearHit = cs <= tolerance || cs >= (100 - tolerance);

    if (!isPerfect && !isNearHit) {
      // Hard miss
      const result = journeyMiss();
      if (result.shielded) {
        setShieldFlash(true);
        playShieldBreak();
        setTimeout(() => setShieldFlash(false), 500);
      } else {
        setLifeLostFlash(true);
        playLifeLost();
        setTimeout(() => setLifeLostFlash(false), 400);
        if (result.livesRemaining <= 0) {
          handleJourneyEnd(currentMs);
        }
      }
      return;
    }

    const { newMultiplier, oldMultiplier } = journeyHit(currentMs, isPerfect, isNearHit);

    if (isPerfect) {
      playFeverPerfect();
    } else {
      playFeverHit();
    }

    if (newMultiplier > oldMultiplier) {
      const wholeOld = Math.floor(oldMultiplier);
      const wholeNew = Math.floor(newMultiplier);
      if (wholeNew > wholeOld || newMultiplier >= 5) {
        setTimeout(() => playMultiplierChime(newMultiplier), 150);
      }
    }

    // Boss defeat confetti check (done via store's setTimeout)
    const jState = useJourneyStore.getState();
    if (jState.bossDefeatedAnimation) {
      fireBossDefeatConfetti(jState.currentBoss?.color || '#a855f7');
      playBossDefeat();
    }
  }, [journeyActive, getTolerance, journeyHit, journeyMiss, handleJourneyEnd, playFeverHit, playFeverPerfect, playMultiplierChime, playLifeLost, playShieldBreak, playBossDefeat]);

  const handleCollectTarget = useCallback((targetId) => {
    const currentMs = useTimerStore.getState().elapsedMs;
    const result = collectTarget(targetId, currentMs);
    if (result) {
      playPowerUp();
    }
  }, [collectTarget, playPowerUp]);

  const handleReset = useCallback(() => {
    resetJourney();
    resetTimerLoop();
    resetTimer();
  }, [resetJourney, resetTimerLoop, resetTimer]);

  // Difficulty select screen
  if (!difficultySelected) {
    return (
      <div className="relative w-full border rounded-3xl p-6 sm:p-10 backdrop-blur-sm bg-purple-950/10 border-purple-500/10">
        <JourneyRulesPanel />
        <DifficultySelect onStart={handleStart} />
      </div>
    );
  }

  // Journey ended screen
  if (journeyEnded) {
    return (
      <div className="relative w-full border rounded-3xl p-6 sm:p-10 backdrop-blur-sm bg-purple-950/10 border-purple-500/10">
        <JourneyEndScreen onSubmit={onSubmit} onReset={handleReset} />
      </div>
    );
  }

  // Active journey
  return (
    <motion.div
      className="relative w-full border rounded-3xl p-6 sm:p-10 backdrop-blur-sm bg-purple-950/10 border-purple-500/10 min-h-[500px] overflow-hidden"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      style={
        journeyActive && currentMultiplier >= 3
          ? { animation: 'journey-glow 1.5s ease-in-out infinite' }
          : {}
      }
    >
      <JourneyBackground
        multiplier={currentMultiplier}
        souls={souls}
        active={journeyActive}
      />

      <ShieldFlash show={shieldFlash} />
      <LifeLostFlash show={lifeLostFlash} />

      <JourneyRulesPanel />

      {/* HUD Top Bar */}
      <div className="relative z-10 flex items-start justify-between mb-4">
        <div className="flex flex-col gap-2">
          <LivesDisplay lives={lives} />
          <SoulsCounter souls={souls} />
        </div>
        <div className="flex flex-col items-end gap-2">
          <MultiplierHUD multiplier={currentMultiplier} />
          <AnimatePresence>
            {activePowerUp && (
              <PowerUpIndicator powerUpId={activePowerUp} endMs={powerUpEndMs} />
            )}
          </AnimatePresence>
          {shieldActive && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex items-center gap-1 text-xs font-mono text-blue-400"
            >
              <Shield size={12} /> Shield Active
            </motion.div>
          )}
        </div>
      </div>

      {/* Boss */}
      <BossEncounter boss={currentBoss} progress={bossProgress} defeated={bossDefeatedAnimation} />

      {/* Floating Targets */}
      <AnimatePresence>
        {floatingTargets.map(t => (
          <FloatingTarget key={t.id} target={t} onCollect={handleCollectTarget} />
        ))}
      </AnimatePresence>

      {/* Center: Timer + Message + Controls */}
      <div className="relative z-10 flex flex-col items-center justify-center mt-8">
        <JourneyTimer
          elapsedMs={elapsedMs}
          multiplier={currentMultiplier}
          active={journeyActive}
        />

        {journeyActive && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm font-mono tracking-wide mt-3 text-purple-300/70"
          >
            {currentMultiplier >= 4
              ? 'COSMIC POWER! Keep going! ✨'
              : currentMultiplier >= 3
                ? 'Blazing through! ⚔️'
                : currentMultiplier >= 2
                  ? 'Building momentum... 🔮'
                  : 'Hit when centiseconds reach :00!'}
          </motion.p>
        )}

        {/* HIT Button */}
        {journeyActive && (
          <motion.div
            className="mt-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleHit}
              className="flex items-center gap-2 px-8 py-4 text-base rounded-2xl border font-mono uppercase tracking-wider text-purple-300 bg-purple-500/20 border-purple-500/50 hover:bg-purple-500/30 hover:shadow-[0_0_25px_rgba(168,85,247,0.4)] transition-all"
            >
              <Zap size={22} />
              HIT!
            </motion.button>
          </motion.div>
        )}
      </div>

      {/* Bottom stats */}
      <div className="relative z-10 flex items-center justify-center gap-6 mt-6">
        <div className="flex flex-col items-center">
          <span className="text-[10px] font-mono text-gray-500 uppercase tracking-wider">Score</span>
          <span className="text-lg font-display tabular-nums text-purple-300">
            {journeyScore.toFixed(1)}
          </span>
        </div>
        <div className="h-8 w-px bg-gray-700/50" />
        <div className="flex flex-col items-center">
          <span className="text-[10px] font-mono text-gray-500 uppercase tracking-wider">Hits</span>
          <span className="text-lg font-display tabular-nums text-purple-300">{totalHits}</span>
        </div>
        <div className="h-8 w-px bg-gray-700/50" />
        <div className="flex flex-col items-center">
          <span className="text-[10px] font-mono text-gray-500 uppercase tracking-wider">Bosses</span>
          <span className="text-lg font-display tabular-nums text-purple-300">{bossesDefeated}</span>
        </div>
      </div>
    </motion.div>
  );
}
