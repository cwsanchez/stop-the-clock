import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Swords, Heart, Zap, Shield, Play } from 'lucide-react';
import useTimerStore from '../../stores/useTimerStore';
import useJourneyStore, { POWERUPS, OBJECTIVES, SPECIAL_BOSSES } from '../../stores/useJourneyStore';
import useGameStore from '../../stores/useGameStore';
import useAuthStore from '../../stores/useAuthStore';
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
function JourneyBackground({ multiplier, active }) {
  const intensity = active ? Math.min((multiplier - 1) / 4, 1) : 0;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div
        className="absolute w-[600px] h-[600px] rounded-full blur-3xl"
        style={{
          top: '10%', left: '-10%',
          background: `radial-gradient(circle, rgba(168,85,247,${0.03 + intensity * 0.08}) 0%, transparent 70%)`,
          animation: 'journey-drift-1 20s ease-in-out infinite',
        }}
      />
      <div
        className="absolute w-[500px] h-[500px] rounded-full blur-3xl"
        style={{
          bottom: '5%', right: '-5%',
          background: `radial-gradient(circle, rgba(139,92,246,${0.03 + intensity * 0.06}) 0%, transparent 70%)`,
          animation: 'journey-drift-2 18s ease-in-out infinite',
        }}
      />
      {active && intensity > 0 && (
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(ellipse at center, rgba(168,85,247,${0.02 + intensity * 0.06}) 0%, rgba(124,58,237,${0.01 + intensity * 0.03}) 40%, transparent 70%)`,
            animation: 'journey-pulse 1.5s ease-in-out infinite',
          }}
        />
      )}
      {active && multiplier >= 3 && (
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(ellipse at center, rgba(139,92,246,${0.04 + intensity * 0.06}) 0%, transparent 60%)`,
            animation: 'journey-pulse 0.8s ease-in-out infinite',
          }}
        />
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
          <div
            key={i}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              i < lives ? 'bg-red-400 shadow-[0_0_6px_rgba(248,113,113,0.6)]' : 'bg-gray-700 opacity-20'
            }`}
          />
        ))}
      </div>
      <span className="text-xs font-mono text-gray-400 ml-1">{lives}</span>
    </div>
  );
}

/* ─── Multiplier Display ─── */
function MultiplierHUD({ multiplier }) {
  const color = multiplier >= 5 ? '#c084fc' : multiplier >= 4 ? '#a855f7' : multiplier >= 3 ? '#8b5cf6' : multiplier >= 2 ? '#7c3aed' : '#9ca3af';
  const intensity = Math.min((multiplier - 1) / 4, 1);

  return (
    <div className="flex items-center gap-1.5">
      <Zap size={14} style={{ color }} />
      <span
        className="text-lg font-display tabular-nums transition-all duration-200"
        style={{
          color,
          textShadow: `0 0 ${10 + intensity * 15}px ${color}`,
        }}
      >
        {multiplier.toFixed(1)}×
      </span>
    </div>
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
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [endMs]);

  if (!powerUp || remaining <= 0) return null;

  return (
    <div
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
        {(remaining / 1000).toFixed(0)}s
      </span>
    </div>
  );
}

/* ─── Floating Target ─── */
function FloatingTarget({ target, onCollect }) {
  const [gone, setGone] = useState(false);

  const handleClick = () => {
    setGone(true);
    onCollect(target.id);
  };

  if (gone) return null;

  return (
    <button
      onClick={handleClick}
      className="absolute z-30 flex flex-col items-center cursor-pointer group"
      style={{
        [target.side]: '4%',
        top: `${target.y}%`,
        animation: 'journey-target-float 3s ease-in-out infinite',
      }}
    >
      <div
        className="w-14 h-14 rounded-full flex items-center justify-center border-2 transition-transform group-hover:scale-110"
        style={{
          background: `radial-gradient(circle, ${target.powerUp.color}30, ${target.powerUp.color}10)`,
          borderColor: `${target.powerUp.color}60`,
          boxShadow: `0 0 20px ${target.powerUp.color}40, 0 0 40px ${target.powerUp.color}20`,
          animation: 'journey-target-glow 2s ease-in-out infinite',
        }}
      >
        <span className="text-2xl">{target.powerUp.emoji}</span>
      </div>
      <span className="text-[9px] font-mono mt-1 opacity-60" style={{ color: target.powerUp.color }}>
        {target.powerUp.name}
      </span>
    </button>
  );
}

/* ─── Boss Orb (for orbCollect bosses) ─── */
function BossOrb({ orb, bossColor, lifespan, onClick }) {
  const elapsed = Date.now() - orb.spawnTime;
  const fadeStart = lifespan * 0.6;
  const startOpacity = elapsed > fadeStart ? Math.max(1 - (elapsed - fadeStart) / (lifespan - fadeStart), 0.2) : 1;

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: startOpacity, scale: 1 }}
      exit={{ opacity: 0, scale: 0 }}
      transition={{ duration: 0.25 }}
      onClick={() => onClick(orb.id)}
      className="absolute z-30 cursor-pointer"
      style={{
        left: `${orb.x}%`,
        top: `${orb.y}%`,
        transform: 'translate(-50%, -50%)',
      }}
    >
      <div
        className="w-11 h-11 rounded-full flex items-center justify-center border-2 hover:scale-125 transition-transform"
        style={{
          background: `radial-gradient(circle, ${bossColor}50, ${bossColor}15)`,
          borderColor: `${bossColor}90`,
          boxShadow: `0 0 18px ${bossColor}60, 0 0 36px ${bossColor}30`,
          animation: 'journey-target-glow 1.5s ease-in-out infinite',
        }}
      >
        <div
          className="w-4 h-4 rounded-full"
          style={{ background: bossColor, boxShadow: `0 0 10px ${bossColor}` }}
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
    <motion.div
      key={boss.id + '-' + boss.requirement}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={
        defeated
          ? { opacity: 0, scale: 0, rotate: 720, y: -200 }
          : { opacity: 1, scale: 1, y: 0 }
      }
      transition={defeated ? { duration: 1.2, ease: 'easeIn' } : { duration: 0.4 }}
      className="absolute top-[15%] left-1/2 -translate-x-1/2 z-20 flex flex-col items-center"
    >
      <div
        className="relative"
        style={{ animation: 'journey-boss-float 3s ease-in-out infinite' }}
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
      </div>

      <span className="text-xs font-display uppercase tracking-wider mt-2" style={{ color: boss.color }}>
        {boss.name}
      </span>

      {!defeated && (
        <>
          <span className="text-[10px] font-mono text-gray-400 mt-1">{boss.objectiveDesc}</span>
          <div className="w-32 h-1.5 rounded-full mt-1.5 bg-gray-800 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{ background: boss.color, width: `${pct * 100}%` }}
            />
          </div>
          <span className="text-[9px] font-mono text-gray-500 mt-0.5">
            {Math.min(Math.floor(progress), boss.requirement)}/{boss.requirement}
          </span>
        </>
      )}
    </motion.div>
  );
}

/* ─── Objective Progress Bars ─── */
function ObjectiveProgress({ powerUpsCollected, totalHits, bossesDefeated }) {
  const values = [powerUpsCollected, totalHits, bossesDefeated];

  return (
    <div className="flex items-stretch gap-3 w-full max-w-md">
      {OBJECTIVES.map((obj, i) => {
        const current = Math.min(values[i], obj.target);
        const pct = current / obj.target;
        const complete = current >= obj.target;

        return (
          <div key={obj.id} className="flex flex-col items-center flex-1 min-w-0">
            <div className="flex items-center gap-1 mb-1">
              <span className="text-xs">{obj.emoji}</span>
              <span
                className="text-[9px] font-mono uppercase tracking-wider truncate"
                style={{ color: complete ? '#4ade80' : '#9ca3af' }}
              >
                {obj.label}
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-gray-800 overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                initial={false}
                animate={{ width: `${pct * 100}%` }}
                transition={{ duration: 0.3 }}
                style={{
                  background: complete ? '#4ade80' : obj.color,
                  boxShadow: complete ? '0 0 8px rgba(74,222,128,0.5)' : 'none',
                }}
              />
            </div>
            <span
              className="text-[9px] font-mono mt-0.5 tabular-nums"
              style={{ color: complete ? '#4ade80' : '#6b7280' }}
            >
              {current}/{obj.target}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Journey Timer ─── */
function JourneyTimer({ multiplier, active }) {
  const elapsedMs = useTimerStore(state => state.elapsedMs);
  const { minutes, seconds, centiseconds } = formatTime(elapsedMs);
  const intensity = Math.min((multiplier - 1) / 4, 1);
  const color = multiplier >= 4
    ? '#c084fc' : multiplier >= 3
      ? '#a855f7' : multiplier >= 2
        ? '#8b5cf6' : '#c4b5fd';

  return (
    <div className="select-none">
      <div
        className="flex items-baseline justify-center font-display tracking-tight transition-all duration-300"
        style={{
          fontSize: active && multiplier >= 3 ? 'clamp(4rem, 12vw, 10rem)' : 'clamp(3.5rem, 10vw, 8rem)',
          color,
          textShadow: `0 0 ${15 + intensity * 25}px ${color}`,
        }}
      >
        <span className="tabular-nums">{minutes}</span>
        <span className="mx-1 opacity-40">:</span>
        <span className="tabular-nums">{seconds}</span>
        <span className="mx-1 opacity-40">:</span>
        <span className="tabular-nums">{centiseconds}</span>
      </div>
      {active && (
        <div
          className="mx-auto h-1 rounded-full mt-2"
          style={{
            width: `${Math.min(multiplier / 5 * 100, 100)}%`,
            maxWidth: '200px',
            background: `linear-gradient(90deg, #7c3aed, ${color})`,
            boxShadow: multiplier >= 3 ? `0 0 10px ${color}` : 'none',
            opacity: 0.75,
          }}
        />
      )}
    </div>
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
        Survive with 5 lives. Hit the timer, defeat mini-bosses, complete objectives.
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

/* ─── Flash Overlays ─── */
function ShieldFlash({ show }) {
  if (!show) return null;
  return (
    <div
      className="absolute inset-0 z-40 pointer-events-none bg-blue-500/20 rounded-3xl"
      style={{ animation: 'journey-flash 0.5s ease-out forwards' }}
    />
  );
}

function LifeLostFlash({ show }) {
  if (!show) return null;
  return (
    <div
      className="absolute inset-0 z-40 pointer-events-none bg-red-500/20 rounded-3xl"
      style={{ animation: 'journey-flash 0.4s ease-out forwards' }}
    />
  );
}

/* ─── Special Boss Offer Modal ─── */
function SpecialBossOfferModal({ offer, onAccept, onDecline }) {
  if (!offer) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 22, stiffness: 300 }}
        className="relative flex flex-col items-center gap-4 px-8 py-8 rounded-2xl border max-w-sm w-full mx-4"
        style={{
          background: 'rgba(10,10,20,0.95)',
          borderColor: `${offer.color}50`,
          boxShadow: `0 0 40px ${offer.color}30, 0 0 80px ${offer.color}15`,
        }}
      >
        <span className="text-5xl" style={{ filter: `drop-shadow(0 0 12px ${offer.color})` }}>
          {offer.emoji}
        </span>
        <h3
          className="text-xl font-display uppercase tracking-[0.2em]"
          style={{ color: offer.color, textShadow: `0 0 20px ${offer.color}` }}
        >
          {offer.name}
        </h3>
        <p className="text-xs font-mono text-gray-400 text-center leading-relaxed">
          {offer.description}
        </p>
        <div
          className="flex items-center gap-2 px-3 py-1 rounded-full border mt-1"
          style={{ background: '#fbbf2415', borderColor: '#fbbf2440' }}
        >
          <Zap size={12} className="text-yellow-400" />
          <span className="text-xs font-mono text-yellow-400">×3 MULTIPLIER FOR 60s</span>
        </div>
        <div className="flex gap-3 mt-3 w-full">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onAccept}
            className="flex-1 py-3 rounded-xl border font-mono uppercase tracking-wider text-sm transition-all"
            style={{
              background: `${offer.color}20`,
              borderColor: `${offer.color}60`,
              color: offer.color,
              textShadow: `0 0 8px ${offer.color}`,
              boxShadow: `0 0 15px ${offer.color}20`,
            }}
          >
            Accept
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onDecline}
            className="flex-1 py-3 rounded-xl border font-mono uppercase tracking-wider text-sm text-gray-400 bg-gray-800/50 border-gray-600/40 hover:bg-gray-700/50 transition-all"
          >
            Decline
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── Special Boss Visual Effects ─── */
function SpecialBossEffects({ boss }) {
  if (!boss) return null;

  if (boss.effect === 'psychedelic') {
    return (
      <div className="absolute inset-0 z-[5] pointer-events-none overflow-hidden rounded-3xl">
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(45deg, rgba(232,121,249,0.15), rgba(168,85,247,0.12), rgba(56,189,248,0.15), rgba(232,121,249,0.15))',
            backgroundSize: '400% 400%',
            animation: 'journey-psychedelic 3s ease-in-out infinite',
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse at 30% 50%, rgba(232,121,249,0.18), transparent 60%)',
            animation: 'journey-pulse 2s ease-in-out infinite',
          }}
        />
      </div>
    );
  }

  if (boss.effect === 'distortion') {
    return (
      <div className="absolute inset-0 z-[5] pointer-events-none overflow-hidden rounded-3xl">
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(180deg, rgba(110,231,183,0.12) 0%, rgba(0,0,0,0) 40%, rgba(110,231,183,0.10) 100%)',
            animation: 'journey-distortion 2s steps(4) infinite',
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage: 'repeating-linear-gradient(0deg, #6ee7b7 0px, transparent 1px, transparent 3px)',
            backgroundSize: '100% 3px',
            animation: 'journey-scanlines 0.1s linear infinite',
          }}
        />
      </div>
    );
  }

  if (boss.effect === 'reaperOrbs') {
    return (
      <div className="absolute inset-0 z-[5] pointer-events-none overflow-hidden rounded-3xl">
        <div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(248,113,113,0.12) 0%, transparent 70%)',
            animation: 'journey-pulse 1.8s ease-in-out infinite',
          }}
        />
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className="absolute text-3xl opacity-30"
            style={{
              left: `${20 + i * 30}%`,
              top: `${30 + (i % 2) * 20}%`,
              animation: `journey-target-float ${2.5 + i * 0.5}s ease-in-out infinite`,
              animationDelay: `${i * 0.8}s`,
            }}
          >
            ☠️
          </div>
        ))}
      </div>
    );
  }

  return null;
}

/* ─── Special Boss x3 Multiplier Banner ─── */
function SpecialMultiplierBanner({ boss, endMs }) {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (!endMs) return;
    const tick = () => setRemaining(Math.max(0, endMs - Date.now()));
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [endMs]);

  if (!boss || remaining <= 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="absolute top-2 left-1/2 -translate-x-1/2 z-30 px-4 py-1.5 rounded-full border"
      style={{
        background: `${boss.color}15`,
        borderColor: `${boss.color}40`,
        boxShadow: `0 0 20px ${boss.color}25`,
      }}
    >
      <span
        className="text-xs font-display uppercase tracking-[0.2em]"
        style={{ color: boss.color, textShadow: `0 0 10px ${boss.color}` }}
      >
        ×3 MULTIPLIER ACTIVE
      </span>
      <span className="text-[10px] font-mono text-gray-400 ml-2">
        {Math.ceil(remaining / 1000)}s
      </span>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════
   MAIN JOURNEY MODE COMPONENT
   ═══════════════════════════════════════════ */
export default function JourneyMode({ onSubmit, resetTimerLoop }) {
  const { startTimer, stopTimer, resetTimer } = useTimerStore();
  const {
    lives, difficulty, journeyActive, journeyEnded, currentMultiplier,
    lastHitElapsedMs, currentBoss, bossProgress, bossesDefeated,
    bossDefeatedAnimation, floatingTargets, activePowerUp, powerUpEndMs,
    shieldActive, journeyScore, totalHits, difficultySelected,
    bossSpawnTime, lastInactivityPenaltyMs, powerUpsCollected,
    bossOrbs,
    specialBossOffer, currentSpecialBoss, specialBossMultiplierEndMs,
    forceHalfSecond, reaperOrbs,
    startJourney, journeyHit, journeyMiss, endJourney,
    spawnBoss, spawnFloatingTarget, collectTarget, removeExpiredTargets,
    spawnBossOrb, clickBossOrb, removeExpiredBossOrbs,
    tryOfferSpecialBoss, acceptSpecialBoss, declineSpecialBoss,
    clickReaperOrb, removeExpiredReaperOrbs, spawnReaperOrbs,
    resetJourney,
  } = useJourneyStore();
  const { user } = useAuthStore();
  const {
    playFeverHit, playFeverPerfect, playMultiplierChime, playFeverEnd,
    playLifeLost, playBossDefeat, playPowerUp, playShieldBreak,
  } = useSound();

  const journeyIntervalRef = useRef(null);
  const targetSpawnRef = useRef(null);
  const [shieldFlash, setShieldFlash] = useState(false);
  const [lifeLostFlash, setLifeLostFlash] = useState(false);

  useEffect(() => {
    if (journeyEnded) {
      const { finalScore } = useJourneyStore.getState();
      useGameStore.setState({ score: Math.round(finalScore) });
    }
  }, [journeyEnded]);

  useEffect(() => {
    return () => {
      if (journeyIntervalRef.current) clearInterval(journeyIntervalRef.current);
      if (targetSpawnRef.current) clearTimeout(targetSpawnRef.current);
    };
  }, []);

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

  // Main game loop
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

      if (msSinceLastHit >= 1000 && jState.currentMultiplier > 1) {
        useJourneyStore.setState({ currentMultiplier: 1, perfectStreak: 0 });
      }

      if (!jState.currentBoss && !jState.bossDefeatedAnimation && Date.now() >= jState.bossSpawnTime && jState.bossSpawnTime > 0) {
        jState.spawnBoss(tState.elapsedMs);
      }

      if (jState.currentBoss && jState.currentBoss.objective === 'orbCollect' && !jState.bossDefeatedAnimation) {
        const interval = jState.currentBoss.orbSpawnInterval || 2000;
        if (Date.now() - jState.lastBossOrbSpawnTime >= interval) {
          jState.spawnBossOrb();
        }
        jState.removeExpiredBossOrbs();
      }

      jState.removeExpiredTargets();

      if (jState.activePowerUp && Date.now() >= jState.powerUpEndMs) {
        useJourneyStore.setState({ activePowerUp: null, powerUpEndMs: 0, shieldActive: false });
      }

      if (jState.currentSpecialBoss?.id === 'soulReaper') {
        const lostCount = jState.removeExpiredReaperOrbs();
        if (lostCount > 0) {
          const updated = useJourneyStore.getState();
          if (updated.lives <= 0) {
            handleJourneyEnd(tState.elapsedMs);
            return;
          }
        }
        const reaperState = useJourneyStore.getState();
        if (reaperState.reaperOrbs.length === 0 && reaperState.currentSpecialBoss?.id === 'soulReaper') {
          reaperState.spawnReaperOrbs();
        }
      }

      if (jState.currentSpecialBoss && Date.now() >= jState.specialBossMultiplierEndMs) {
        useJourneyStore.setState({
          currentSpecialBoss: null,
          specialBossMultiplierEndMs: 0,
          lastSpecialBossDefeatedTime: Date.now(),
          forceHalfSecond: false,
          specialBossStreak: 0,
          reaperOrbs: [],
        });
      }

      const totalPlaytime = (tState.elapsedMs - jState.journeyStartMs) / 1000;
      jState.tryOfferSpecialBoss(totalPlaytime);
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

    const jSnap = useJourneyStore.getState();
    const phantomActive = jSnap.currentSpecialBoss?.id === 'phantomLord' && jSnap.forceHalfSecond;

    const isPerfect = phantomActive ? cs === 50 : cs === 0;
    const isNearHit = phantomActive
      ? Math.abs(cs - 50) <= tolerance
      : cs <= tolerance || cs >= (100 - tolerance);

    if (!isPerfect && !isNearHit) {
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
      const jState = useJourneyStore.getState();
      if (jState.bossDefeatedAnimation) {
        fireBossDefeatConfetti(jState.currentBoss?.color || '#a855f7');
        playBossDefeat();
      }
    }
  }, [collectTarget, playPowerUp, playBossDefeat]);

  const handleClickBossOrb = useCallback((orbId) => {
    clickBossOrb(orbId);
    const jState = useJourneyStore.getState();
    if (jState.bossDefeatedAnimation) {
      fireBossDefeatConfetti(jState.currentBoss?.color || '#a855f7');
      playBossDefeat();
    }
  }, [clickBossOrb, playBossDefeat]);

  const handleClickReaperOrb = useCallback((orbId) => {
    clickReaperOrb(orbId);
  }, [clickReaperOrb]);

  const handleReset = useCallback(() => {
    resetJourney();
    resetTimerLoop();
    resetTimer();
  }, [resetJourney, resetTimerLoop, resetTimer]);

  if (!difficultySelected) {
    return (
      <div className="relative w-full border rounded-3xl p-6 sm:p-10 backdrop-blur-sm bg-purple-950/10 border-purple-500/10">
        <JourneyRulesPanel />
        <DifficultySelect onStart={handleStart} />
      </div>
    );
  }

  if (journeyEnded) {
    return (
      <div className="relative w-full border rounded-3xl p-6 sm:p-10 backdrop-blur-sm bg-purple-950/10 border-purple-500/10">
        <JourneyEndScreen onSubmit={onSubmit} onReset={handleReset} />
      </div>
    );
  }

  return (
    <div
      className="relative w-full border rounded-3xl p-6 sm:p-10 backdrop-blur-sm bg-purple-950/10 border-purple-500/10 min-h-[500px] overflow-hidden"
      style={
        journeyActive && currentMultiplier >= 3
          ? { animation: 'journey-glow 1.5s ease-in-out infinite' }
          : {}
      }
    >
      <JourneyBackground
        multiplier={currentMultiplier}
        active={journeyActive}
      />

      <ShieldFlash show={shieldFlash} />
      <LifeLostFlash show={lifeLostFlash} />

      <SpecialBossEffects boss={currentSpecialBoss} />
      <SpecialMultiplierBanner boss={currentSpecialBoss} endMs={specialBossMultiplierEndMs} />

      {currentSpecialBoss?.id === 'phantomLord' && forceHalfSecond && (
        <div
          className="absolute top-12 left-1/2 -translate-x-1/2 z-30 px-4 py-1.5 rounded-full border"
          style={{
            background: 'rgba(232,121,249,0.15)',
            borderColor: 'rgba(232,121,249,0.4)',
            animation: 'journey-pulse 0.6s ease-in-out infinite',
          }}
        >
          <span className="text-xs font-display uppercase tracking-[0.2em] text-fuchsia-300">
            ⚠️ TARGET: .50 ⚠️
          </span>
        </div>
      )}

      <JourneyRulesPanel />

      {/* HUD Top Bar */}
      <div className="relative z-10 flex items-start justify-between mb-4">
        <div className="flex flex-col gap-2">
          <LivesDisplay lives={lives} />
        </div>
        <div className="flex flex-col items-end gap-2">
          <MultiplierHUD multiplier={currentMultiplier} />
          {activePowerUp && (
            <PowerUpIndicator powerUpId={activePowerUp} endMs={powerUpEndMs} />
          )}
          {shieldActive && (
            <div className="flex items-center gap-1 text-xs font-mono text-blue-400">
              <Shield size={12} /> Shield Active
            </div>
          )}
        </div>
      </div>

      {/* Boss */}
      <BossEncounter boss={currentBoss} progress={bossProgress} defeated={bossDefeatedAnimation} />

      {/* Floating Targets */}
      {floatingTargets.map(t => (
        <FloatingTarget key={t.id} target={t} onCollect={handleCollectTarget} />
      ))}

      {/* Boss Orbs (orbCollect bosses) */}
      {currentBoss && currentBoss.objective === 'orbCollect' && bossOrbs.map(o => (
        <BossOrb
          key={o.id}
          orb={o}
          bossColor={currentBoss.color}
          lifespan={currentBoss.orbLifespan || 3000}
          onClick={handleClickBossOrb}
        />
      ))}

      {/* Reaper Orbs (Soul Reaper special boss) */}
      {currentSpecialBoss?.id === 'soulReaper' && reaperOrbs.map(o => (
        <motion.button
          key={o.id}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0 }}
          transition={{ duration: 0.25 }}
          onClick={() => handleClickReaperOrb(o.id)}
          className="reaper-orb absolute z-30 cursor-pointer"
          style={{
            left: `${o.x}%`,
            top: `${o.y}%`,
          }}
        >
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center border-2 hover:scale-125 transition-transform"
            style={{
              background: 'radial-gradient(circle, rgba(248,113,113,0.5), rgba(248,113,113,0.15))',
              borderColor: 'rgba(248,113,113,0.9)',
              boxShadow: '0 0 18px rgba(248,113,113,0.6), 0 0 36px rgba(248,113,113,0.3)',
            }}
          >
            <span className="text-xl">☠️</span>
          </div>
        </motion.button>
      ))}

      {/* Center: Timer + Message + Controls */}
      <div className="relative z-10 flex flex-col items-center justify-center mt-8">
        <JourneyTimer
          multiplier={currentMultiplier}
          active={journeyActive}
        />

        {journeyActive && (
          <p className="text-sm font-mono tracking-wide mt-3 text-purple-300/70">
            {currentMultiplier >= 4
              ? 'COSMIC POWER! Keep going! ✨'
              : currentMultiplier >= 3
                ? 'Blazing through! ⚔️'
                : currentMultiplier >= 2
                  ? 'Building momentum... 🔮'
                  : 'Hit when centiseconds reach :00!'}
          </p>
        )}

        {journeyActive && (
          <div className="mt-8">
            <button
              onClick={handleHit}
              className="flex items-center gap-2 px-8 py-4 text-base rounded-2xl border font-mono uppercase tracking-wider text-purple-300 bg-purple-500/20 border-purple-500/50 hover:bg-purple-500/30 hover:shadow-[0_0_25px_rgba(168,85,247,0.4)] hover:scale-105 active:scale-95 transition-all"
            >
              <Zap size={22} />
              HIT!
            </button>
          </div>
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

      {/* Objective Progress Bars */}
      {journeyActive && (
        <div className="relative z-10 flex justify-center mt-4">
          <ObjectiveProgress
            powerUpsCollected={powerUpsCollected}
            totalHits={totalHits}
            bossesDefeated={bossesDefeated}
          />
        </div>
      )}

      <SpecialBossOfferModal
        offer={specialBossOffer}
        onAccept={acceptSpecialBoss}
        onDecline={declineSpecialBoss}
      />
    </div>
  );
}
