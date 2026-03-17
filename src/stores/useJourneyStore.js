import { create } from 'zustand';

const BOSSES = [
  {
    id: 'sentinel', name: 'The Sentinel', emoji: '👁️',
    color: '#a855f7', bgColor: 'rgba(168,85,247,0.1)', borderColor: 'rgba(168,85,247,0.3)',
    objective: 'triplePerfect', objectiveDesc: 'Hit exactly :00 three times!', requirement: 3,
  },
  {
    id: 'golem', name: 'Stone Golem', emoji: '🗿',
    color: '#f59e0b', bgColor: 'rgba(245,158,11,0.1)', borderColor: 'rgba(245,158,11,0.3)',
    objective: 'streakMaster', objectiveDesc: 'Land 5 hits without missing!', requirement: 5,
  },
  {
    id: 'dragon', name: 'Chrono Dragon', emoji: '🐉',
    color: '#ef4444', bgColor: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.3)',
    objective: 'multiplierRush', objectiveDesc: 'Reach 3× multiplier!', requirement: 3,
  },
];

const SPECIAL_BOSSES = [
  {
    id: 'phantom', name: 'Phantom Lord', emoji: '👻',
    color: '#8b5cf6', bgColor: 'rgba(139,92,246,0.1)', borderColor: 'rgba(139,92,246,0.3)',
    objective: 'triplePerfect', objectiveDesc: 'Hit :00 five times in a row!', requirement: 5,
    soulThreshold: 15,
  },
  {
    id: 'lich', name: 'The Lich King', emoji: '💀',
    color: '#06b6d4', bgColor: 'rgba(6,182,212,0.1)', borderColor: 'rgba(6,182,212,0.3)',
    objective: 'streakMaster', objectiveDesc: 'Land 8 hits without missing!', requirement: 8,
    soulThreshold: 30,
  },
  {
    id: 'reaper', name: 'Soul Reaper', emoji: '⚔️',
    color: '#dc2626', bgColor: 'rgba(220,38,38,0.1)', borderColor: 'rgba(220,38,38,0.3)',
    objective: 'multiplierRush', objectiveDesc: 'Reach 5× multiplier!', requirement: 5,
    soulThreshold: 50,
  },
];

const POWERUPS = [
  { id: 'doublePoints', name: '2× Points', emoji: '⚡', duration: 10000, color: '#fbbf24' },
  { id: 'shield', name: 'Shield', emoji: '🛡️', duration: 15000, color: '#3b82f6' },
  { id: 'soulMagnet', name: '+Souls', emoji: '🧲', duration: 10000, color: '#a855f7' },
];

const INITIAL_STATE = {
  lives: 5,
  souls: 0,
  difficulty: 'normal',
  journeyActive: false,
  journeyEnded: false,
  journeyStartMs: 0,
  lastHitElapsedMs: 0,
  currentMultiplier: 1,
  perfectStreak: 0,
  totalHits: 0,
  journeyScore: 0,
  currentBoss: null,
  bossProgress: 0,
  bossesDefeated: 0,
  bossSpawnTime: 0,
  bossDefeatedAnimation: false,
  consecutivePerfects: 0,
  hitsWithoutMiss: 0,
  floatingTargets: [],
  targetIdCounter: 0,
  activePowerUp: null,
  powerUpEndMs: 0,
  shieldActive: false,
  unlockedSpecialBosses: [],
  difficultySelected: false,
  finalScore: 0,
  efficiency: 0,
  totalSeconds: 0,
  lastInactivityPenaltyMs: 0,
};

const useJourneyStore = create((set, get) => ({
  ...INITIAL_STATE,

  setDifficulty: (difficulty) => set({ difficulty }),

  startJourney: (elapsedMs) => set({
    ...INITIAL_STATE,
    difficulty: get().difficulty,
    difficultySelected: true,
    journeyActive: true,
    journeyStartMs: elapsedMs,
    lastHitElapsedMs: elapsedMs,
    lastInactivityPenaltyMs: elapsedMs,
    bossSpawnTime: Date.now() + 45000 + Math.random() * 15000,
  }),

  journeyHit: (elapsedMs, isPerfect, isNearHit) => {
    const state = get();
    const now = Date.now();
    const doubleActive = state.activePowerUp === 'doublePoints' && now < state.powerUpEndMs;
    const soulMagnetActive = state.activePowerUp === 'soulMagnet' && now < state.powerUpEndMs;
    const pointMult = doubleActive ? 2 : 1;

    const points = 1 * state.currentMultiplier * pointMult;
    let newMultiplier = state.currentMultiplier;
    if (isPerfect) {
      newMultiplier = Math.min(state.currentMultiplier + 0.5, 5);
    }

    const soulGain = soulMagnetActive ? 2 : 1;

    set({
      journeyScore: state.journeyScore + points,
      totalHits: state.totalHits + 1,
      currentMultiplier: newMultiplier,
      perfectStreak: isPerfect ? state.perfectStreak + 1 : 0,
      lastHitElapsedMs: elapsedMs,
      lastInactivityPenaltyMs: elapsedMs,
      souls: state.souls + soulGain,
      consecutivePerfects: isPerfect ? state.consecutivePerfects + 1 : 0,
      hitsWithoutMiss: state.hitsWithoutMiss + 1,
    });

    if (state.currentBoss) {
      setTimeout(() => get().checkBossProgress(isPerfect, newMultiplier), 0);
    }

    return { points, newMultiplier, oldMultiplier: state.currentMultiplier };
  },

  journeyMiss: () => {
    const { lives, shieldActive, activePowerUp, powerUpEndMs } = get();
    const now = Date.now();
    const shieldUp = shieldActive || (activePowerUp === 'shield' && now < powerUpEndMs);

    if (shieldUp) {
      set({ shieldActive: false, activePowerUp: null, powerUpEndMs: 0 });
      return { shielded: true, livesRemaining: lives };
    }

    const newLives = lives - 1;
    set({
      lives: newLives,
      currentMultiplier: 1,
      perfectStreak: 0,
      consecutivePerfects: 0,
      hitsWithoutMiss: 0,
    });
    return { shielded: false, livesRemaining: newLives };
  },

  endJourney: (elapsedMs) => {
    const { journeyScore, totalHits, journeyStartMs, bossesDefeated, souls } = get();
    const totalMs = elapsedMs - journeyStartMs;
    const totalSecs = Math.max(totalMs / 1000, 0.1);
    const efficiency = totalHits / totalSecs;
    const finalScore = Math.round(
      (journeyScore + bossesDefeated * 50 + souls * 2) * Math.max(efficiency, 0.01) * 100
    ) / 100;

    set({
      journeyActive: false,
      journeyEnded: true,
      totalSeconds: totalSecs,
      finalScore,
      efficiency,
    });
  },

  spawnBoss: () => {
    const { souls, unlockedSpecialBosses, bossesDefeated } = get();

    const availableSpecial = SPECIAL_BOSSES.filter(
      b => souls >= b.soulThreshold && !unlockedSpecialBosses.includes(b.id)
    );

    let boss;
    if (availableSpecial.length > 0 && Math.random() < 0.4) {
      boss = availableSpecial[Math.floor(Math.random() * availableSpecial.length)];
    } else {
      boss = BOSSES[bossesDefeated % BOSSES.length];
    }

    set({
      currentBoss: { ...boss },
      bossProgress: 0,
      consecutivePerfects: 0,
      hitsWithoutMiss: 0,
    });
  },

  checkBossProgress: (isPerfect, currentMult) => {
    const { currentBoss, consecutivePerfects, hitsWithoutMiss } = get();
    if (!currentBoss) return;

    let progress = 0;
    switch (currentBoss.objective) {
      case 'triplePerfect':
        progress = consecutivePerfects;
        break;
      case 'streakMaster':
        progress = hitsWithoutMiss;
        break;
      case 'multiplierRush':
        progress = currentMult;
        break;
      default:
        break;
    }

    set({ bossProgress: progress });

    if (progress >= currentBoss.requirement) {
      setTimeout(() => get().defeatBoss(), 0);
    }
  },

  defeatBoss: () => {
    const { currentBoss, bossesDefeated, currentMultiplier, journeyScore, souls, unlockedSpecialBosses } = get();
    if (!currentBoss) return;

    const bonusMultiplier = Math.min(currentMultiplier + 1, 5);
    const newUnlocked = currentBoss.soulThreshold
      ? [...unlockedSpecialBosses, currentBoss.id]
      : unlockedSpecialBosses;

    set({
      bossDefeatedAnimation: true,
      currentMultiplier: bonusMultiplier,
      journeyScore: journeyScore + 50,
      bossesDefeated: bossesDefeated + 1,
      souls: souls + 5,
      unlockedSpecialBosses: newUnlocked,
      bossSpawnTime: Date.now() + 45000 + Math.random() * 15000,
    });

    setTimeout(() => {
      set({ currentBoss: null, bossProgress: 0, bossDefeatedAnimation: false });
    }, 2000);
  },

  spawnFloatingTarget: () => {
    const { floatingTargets, targetIdCounter } = get();
    if (floatingTargets.length >= 2) return;

    const powerUp = POWERUPS[Math.floor(Math.random() * POWERUPS.length)];
    const side = Math.random() < 0.5 ? 'left' : 'right';
    const y = 20 + Math.random() * 50;

    set({
      floatingTargets: [
        ...floatingTargets,
        { id: targetIdCounter, powerUp, side, y, spawnTime: Date.now(), expiresAt: Date.now() + 6000 },
      ],
      targetIdCounter: targetIdCounter + 1,
    });
  },

  collectTarget: (targetId, elapsedMs) => {
    const { floatingTargets } = get();
    const target = floatingTargets.find(t => t.id === targetId);
    if (!target) return null;

    const cs = Math.floor(elapsedMs / 10) % 100;
    const success = cs <= 10 || cs >= 90;

    if (success) {
      set({
        floatingTargets: floatingTargets.filter(t => t.id !== targetId),
        activePowerUp: target.powerUp.id,
        powerUpEndMs: Date.now() + target.powerUp.duration,
        shieldActive: target.powerUp.id === 'shield',
      });
      return target.powerUp;
    }

    set({ floatingTargets: floatingTargets.filter(t => t.id !== targetId) });
    return null;
  },

  removeExpiredTargets: () => {
    const now = Date.now();
    const { floatingTargets } = get();
    const filtered = floatingTargets.filter(t => now < t.expiresAt);
    if (filtered.length !== floatingTargets.length) {
      set({ floatingTargets: filtered });
    }
  },

  resetJourney: () => set({ ...INITIAL_STATE }),
}));

export { BOSSES, SPECIAL_BOSSES, POWERUPS };
export default useJourneyStore;
