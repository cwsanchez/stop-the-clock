import { create } from 'zustand';

const MINI_BOSSES = [
  {
    id: 'sentinel', name: 'The Sentinel', emoji: '👁️',
    color: '#a855f7', bgColor: 'rgba(168,85,247,0.1)', borderColor: 'rgba(168,85,247,0.3)',
    objective: 'chainHit', baseRequirement: 3, minTime: 15,
  },
  {
    id: 'bucky', name: 'Bucky', emoji: '🦌',
    color: '#10b981', bgColor: 'rgba(16,185,129,0.1)', borderColor: 'rgba(16,185,129,0.3)',
    objective: 'orbCollect', baseRequirement: 4, minTime: 15,
    orbSpawnInterval: 2000, orbLifespan: 3000,
  },
  {
    id: 'golem', name: 'Stone Golem', emoji: '🗿',
    color: '#f59e0b', bgColor: 'rgba(245,158,11,0.1)', borderColor: 'rgba(245,158,11,0.3)',
    objective: 'chainHit', baseRequirement: 6, minTime: 60,
  },
  {
    id: 'dragon', name: 'Chrono Dragon', emoji: '🐉',
    color: '#ef4444', bgColor: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.3)',
    objective: 'orbCollect', baseRequirement: 8, minTime: 60,
    orbSpawnInterval: 1400, orbLifespan: 2100,
  },
];

const OBJECTIVES = [
  { id: 'powerUps', label: 'Power-ups', target: 10, emoji: '🔮', color: '#a855f7' },
  { id: 'hits', label: 'Hits', target: 15, emoji: '🎯', color: '#3b82f6' },
  { id: 'bosses', label: 'Bosses', target: 4, emoji: '⚔️', color: '#f59e0b' },
];

const POWERUPS = [
  { id: 'doublePoints', name: '2× Points', emoji: '⚡', duration: 10000, color: '#fbbf24' },
  { id: 'shield', name: 'Shield', emoji: '🛡️', duration: 15000, color: '#3b82f6' },
];

function getBossObjectiveDesc(boss, requirement) {
  switch (boss.objective) {
    case 'chainHit': return `Chain ${requirement} hits!`;
    case 'orbCollect': return `Click ${requirement} orbs!`;
    default: return '';
  }
}

const INITIAL_STATE = {
  lives: 5,
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
  bossHits: 0,
  bossPowerUpsCollected: 0,
  bossOrbs: [],
  bossOrbIdCounter: 0,
  lastBossOrbSpawnTime: 0,
  powerUpsCollected: 0,
  floatingTargets: [],
  targetIdCounter: 0,
  activePowerUp: null,
  powerUpEndMs: 0,
  shieldActive: false,
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
    bossSpawnTime: Date.now() + 15000,
  }),

  journeyHit: (elapsedMs, isPerfect, isNearHit) => {
    const state = get();
    const now = Date.now();
    const doubleActive = state.activePowerUp === 'doublePoints' && now < state.powerUpEndMs;
    const pointMult = doubleActive ? 2 : 1;

    const points = 1 * state.currentMultiplier * pointMult;
    let newMultiplier = state.currentMultiplier;
    if (isPerfect) {
      newMultiplier = Math.min(state.currentMultiplier + 0.5, 5);
    }

    set({
      journeyScore: state.journeyScore + points,
      totalHits: state.totalHits + 1,
      currentMultiplier: newMultiplier,
      perfectStreak: isPerfect ? state.perfectStreak + 1 : 0,
      lastHitElapsedMs: elapsedMs,
      lastInactivityPenaltyMs: elapsedMs,
      consecutivePerfects: isPerfect ? state.consecutivePerfects + 1 : 0,
      hitsWithoutMiss: state.hitsWithoutMiss + 1,
      bossHits: state.bossHits + 1,
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
    const { journeyScore, totalHits, journeyStartMs, bossesDefeated, powerUpsCollected } = get();
    const totalMs = elapsedMs - journeyStartMs;
    const totalSecs = Math.max(totalMs / 1000, 0.1);
    const efficiency = totalHits / totalSecs;

    const objPowerUpPct = Math.min(powerUpsCollected / OBJECTIVES[0].target, 1);
    const objHitsPct = Math.min(totalHits / OBJECTIVES[1].target, 1);
    const objBossesPct = Math.min(bossesDefeated / OBJECTIVES[2].target, 1);
    const objectiveBonus = (objPowerUpPct + objHitsPct + objBossesPct) / 3 * 150;

    const finalScore = Math.round(
      (journeyScore + bossesDefeated * 50 + objectiveBonus) * Math.max(efficiency, 0.01) * 100
    ) / 100;

    set({
      journeyActive: false,
      journeyEnded: true,
      totalSeconds: totalSecs,
      finalScore,
      efficiency,
    });
  },

  spawnBoss: (currentElapsedMs) => {
    const { journeyStartMs } = get();
    const survivedSecs = Math.max((currentElapsedMs - journeyStartMs) / 1000, 0);

    const available = MINI_BOSSES.filter(b => survivedSecs >= b.minTime);
    if (available.length === 0) return; // No bosses available yet
    
    const boss = available[Math.floor(Math.random() * available.length)];

    const ramp = survivedSecs >= 150 ? Math.floor((survivedSecs - 150) / 90) + 1 : 0;
    const requirement = boss.baseRequirement + ramp;

    set({
      currentBoss: {
        ...boss,
        requirement,
        objectiveDesc: getBossObjectiveDesc(boss, requirement),
      },
      bossProgress: 0,
      bossHits: 0,
      bossPowerUpsCollected: 0,
      consecutivePerfects: 0,
      hitsWithoutMiss: 0,
      bossOrbs: [],
      lastBossOrbSpawnTime: 0,
    });
  },

  checkBossProgress: (isPerfect, currentMult) => {
    const { currentBoss, hitsWithoutMiss } = get();
    if (!currentBoss) return;

    if (currentBoss.objective === 'orbCollect') return;

    const progress = hitsWithoutMiss;
    set({ bossProgress: progress });

    if (progress >= currentBoss.requirement) {
      setTimeout(() => get().defeatBoss(), 0);
    }
  },

  defeatBoss: () => {
    const { currentBoss, bossesDefeated, currentMultiplier, journeyScore } = get();
    if (!currentBoss) return;

    const bonusMultiplier = Math.min(currentMultiplier + 1, 5);

    set({
      bossDefeatedAnimation: true,
      currentMultiplier: bonusMultiplier,
      journeyScore: journeyScore + 50,
      bossesDefeated: bossesDefeated + 1,
      bossSpawnTime: Date.now() + 15000,
    });

    setTimeout(() => {
      set({ currentBoss: null, bossProgress: 0, bossDefeatedAnimation: false, bossOrbs: [] });
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
    const { floatingTargets, powerUpsCollected, bossPowerUpsCollected } = get();
    const target = floatingTargets.find(t => t.id === targetId);
    if (!target) return null;

    const cs = Math.floor(elapsedMs / 10) % 100;
    const success = cs <= 10 || cs >= 90;

    if (success) {
      const newBossPowerUps = bossPowerUpsCollected + 1;
      const newTotalPowerUps = powerUpsCollected + 1;

      set({
        floatingTargets: floatingTargets.filter(t => t.id !== targetId),
        activePowerUp: target.powerUp.id,
        powerUpEndMs: Date.now() + target.powerUp.duration,
        shieldActive: target.powerUp.id === 'shield',
        powerUpsCollected: newTotalPowerUps,
        bossPowerUpsCollected: newBossPowerUps,
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

  spawnBossOrb: () => {
    const { currentBoss, bossOrbs, bossOrbIdCounter } = get();
    if (!currentBoss || currentBoss.objective !== 'orbCollect') return;

    const lifespan = currentBoss.orbLifespan || 3000;
    const x = 10 + Math.random() * 80;
    const y = 20 + Math.random() * 50;

    set({
      bossOrbs: [
        ...bossOrbs,
        { id: bossOrbIdCounter, x, y, spawnTime: Date.now(), expiresAt: Date.now() + lifespan },
      ],
      bossOrbIdCounter: bossOrbIdCounter + 1,
      lastBossOrbSpawnTime: Date.now(),
    });
  },

  clickBossOrb: (orbId) => {
    const { bossOrbs, bossProgress, currentBoss } = get();
    if (!bossOrbs.find(o => o.id === orbId) || !currentBoss) return;

    const newProgress = bossProgress + 1;
    set({
      bossOrbs: bossOrbs.filter(o => o.id !== orbId),
      bossProgress: newProgress,
    });

    if (newProgress >= currentBoss.requirement) {
      setTimeout(() => get().defeatBoss(), 0);
    }
  },

  removeExpiredBossOrbs: () => {
    const now = Date.now();
    const { bossOrbs } = get();
    const filtered = bossOrbs.filter(o => now < o.expiresAt);
    if (filtered.length !== bossOrbs.length) {
      set({ bossOrbs: filtered });
    }
  },

  resetJourney: () => set({ ...INITIAL_STATE }),
}));

export { MINI_BOSSES, OBJECTIVES, POWERUPS };
export default useJourneyStore;
