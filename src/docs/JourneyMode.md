# ⚔️ Journey Mode — Developer Deep-Dive

Journey Mode is an endurance gauntlet layered on top of the core timer mechanic. The player starts with **5 lives**, a nonstop timer, and three difficulty tiers. Bosses appear periodically, floating power-up orbs drift across the screen, and souls accumulate to unlock harder special bosses. The final score is efficiency-weighted.

This document is the single source of truth for every Journey Mode constant, formula, and code path. All references point to the actual source files — search for the quoted strings or line ranges to jump straight into the code.

---

## Table of Contents

- [Difficulty Tiers](#-difficulty-tiers)
- [Lives System](#-lives-system)
- [Hitting the Timer](#-hitting-the-timer)
- [Multiplier](#-multiplier)
- [Soul Collection](#-soul-collection)
- [Floating Targets (Power-ups)](#-floating-targets-power-ups)
- [Boss Encounters](#-boss-encounters)
- [Special Bosses](#-special-bosses)
- [Efficiency & Final Score](#-efficiency--final-score)
- [Game Loop Internals](#-game-loop-internals)
- [State Shape (useJourneyStore)](#-state-shape-usejourneystore)
- [Tuning Cheat Sheet](#-tuning-cheat-sheet)

---

## 🎚️ Difficulty Tiers

Selected before the run starts. Determines how close to `:00` a hit must be.

| Difficulty | Tolerance (centiseconds) | Human-readable | Check |
|---|---|---|---|
| 🌿 **Easy** | ±10 cs | ±0.1 s | `cs <= 10 \|\| cs >= 90` |
| ⚔️ **Normal** (default) | ±5 cs | ±0.05 s | `cs <= 5 \|\| cs >= 95` |
| 💀 **Insanity** | 0 cs | Exact `:00` only | `cs === 0` |

**Code ref:** `src/components/JourneyMode/JourneyMode.js` → `getTolerance()`

```js
const getTolerance = useCallback(() => {
  switch (difficulty) {
    case 'easy': return 10;
    case 'insanity': return 0;
    default: return 5;       // normal
  }
}, [difficulty]);
```

The difficulty picker UI lives in the `DifficultySelect` component inside `JourneyMode.js`.

---

## ❤️ Lives System

| Property | Value |
|---|---|
| Starting lives | **5** |
| Max lives | **5** (no way to gain extra) |

**Life is lost when:**

1. **Hard miss** — player taps HIT but centiseconds are outside tolerance.
2. **Inactivity** — 5 seconds pass without any hit.

On life loss, the multiplier resets to 1×, `perfectStreak`, `consecutivePerfects`, and `hitsWithoutMiss` all reset to 0.

When lives reach **0**, the journey ends immediately via `endJourney()`.

**Shield exception:** If the 🛡️ Shield power-up is active, one hit that would cost a life is absorbed instead. The shield is consumed and no life is lost. The shield absorbs *both* hard misses and inactivity penalties.

**Code ref:** `src/stores/useJourneyStore.js` → `journeyMiss()`

```js
journeyMiss: () => {
  const { lives, shieldActive, activePowerUp, powerUpEndMs } = get();
  const shieldUp = shieldActive || (activePowerUp === 'shield' && now < powerUpEndMs);

  if (shieldUp) {
    // shield absorbed the hit
    set({ shieldActive: false, activePowerUp: null, powerUpEndMs: 0 });
    return { shielded: true, livesRemaining: lives };
  }

  const newLives = lives - 1;
  set({ lives: newLives, currentMultiplier: 1, perfectStreak: 0, ... });
  return { shielded: false, livesRemaining: newLives };
}
```

---

## 🎯 Hitting the Timer

When the player presses **HIT!**, the current `elapsedMs` is read from `useTimerStore` and converted to centiseconds:

```js
const cs = Math.floor(currentMs / 10) % 100;
```

Then the tolerance is checked:

| Outcome | Condition | Result |
|---|---|---|
| **Perfect** | `cs === 0` | `journeyHit(ms, true, true)` — full points + multiplier bump |
| **Near hit** | `cs <= tolerance \|\| cs >= (100 - tolerance)` | `journeyHit(ms, false, true)` — full points, no multiplier bump |
| **Hard miss** | Otherwise | `journeyMiss()` — lose life or shield |

**Code ref:** `src/components/JourneyMode/JourneyMode.js` → `handleHit()`

---

## ⚡ Multiplier

| Property | Value |
|---|---|
| Starting value | **1×** |
| Perfect hit bump | **+0.5×** |
| Near hit bump | **0** (no change) |
| Maximum | **5×** |
| Boss defeat bonus | **+1×** (capped at 5×) |
| Decay | Resets to **1×** after **1 second** of inactivity |
| Miss reset | Resets to **1×** on any life loss |

Points per hit: `1 × currentMultiplier × pointMultiplier`

Where `pointMultiplier` is **2** when the ⚡ 2× Points power-up is active, otherwise **1**.

**Code ref:** `src/stores/useJourneyStore.js` → `journeyHit()`

```js
const points = 1 * state.currentMultiplier * pointMult;
let newMultiplier = state.currentMultiplier;
if (isPerfect) {
  newMultiplier = Math.min(state.currentMultiplier + 0.5, 5);
}
```

---

## 👻 Soul Collection

Souls are a secondary currency that unlock special bosses.

| Source | Souls gained |
|---|---|
| Every successful hit | **1** (or **2** with 🧲 Soul Magnet active) |
| Boss defeated | **+5** |

### Soul Milestones

| Souls reached | Effect |
|---|---|
| **15** | Unlocks **Phantom Lord** as a possible boss spawn |
| **30** | Unlocks **The Lich King** |
| **50** | Unlocks **Soul Reaper** |

Once a special boss is unlocked, it has a **40% chance** of spawning instead of the next regular boss (if there are unlocked-but-undefeated special bosses available).

**Code ref:** `src/stores/useJourneyStore.js` → `journeyHit()` (soul gain) and `spawnBoss()` (milestone logic)

---

## 🔮 Floating Targets (Power-ups)

Glowing orbs drift on the left or right edge of the screen. Tap one to attempt collection.

### Spawn Rules

| Property | Value |
|---|---|
| Spawn interval | **8 – 12 seconds** (`8000 + Math.random() * 4000` ms) |
| Max simultaneous targets | **2** |
| Expiry time | **6 seconds** after spawn |
| Spawn position | Random side (`left` / `right`), random Y between 20–70% |

**Code ref:** `src/components/JourneyMode/JourneyMode.js` → target spawn `useEffect`; `src/stores/useJourneyStore.js` → `spawnFloatingTarget()`

### Collection

When the player taps a floating orb, the current centiseconds are checked with a **fixed ±0.1 s tolerance** (regardless of difficulty):

```js
const cs = Math.floor(elapsedMs / 10) % 100;
const success = cs <= 10 || cs >= 90;
```

- **Success** → power-up activates, orb disappears.
- **Failure** → orb disappears, no power-up.

**Code ref:** `src/stores/useJourneyStore.js` → `collectTarget()`

### Power-up Types

| ID | Name | Emoji | Duration | Effect |
|---|---|---|---|---|
| `doublePoints` | 2× Points | ⚡ | **10 s** | All hit points doubled |
| `shield` | Shield | 🛡️ | **15 s** | Absorbs one miss (life saved) |
| `soulMagnet` | +Souls | 🧲 | **10 s** | 2 souls per hit instead of 1 |

Only **one** power-up can be active at a time. Collecting a new one replaces the current one.

**Code ref:** `src/stores/useJourneyStore.js` → `POWERUPS` array (top of file)

```js
const POWERUPS = [
  { id: 'doublePoints', name: '2× Points', emoji: '⚡', duration: 10000, color: '#fbbf24' },
  { id: 'shield',       name: 'Shield',    emoji: '🛡️', duration: 15000, color: '#3b82f6' },
  { id: 'soulMagnet',   name: '+Souls',    emoji: '🧲', duration: 10000, color: '#a855f7' },
];
```

---

## 👁️ Boss Encounters

### Spawn Timing

- First boss spawns **45 – 60 seconds** after the Journey starts.
- After each boss is defeated, the next spawns **45 – 60 seconds** later.
- Formula: `Date.now() + 45000 + Math.random() * 15000`

### Regular Bosses

Cycle through in order (`bossesDefeated % 3`):

| # | Boss | Emoji | Objective | Requirement |
|---|---|---|---|---|
| 0 | **The Sentinel** | 👁️ | `triplePerfect` | Hit exactly `:00` **3 times** consecutively |
| 1 | **Stone Golem** | 🗿 | `streakMaster` | Land **5 hits** without missing |
| 2 | **Chrono Dragon** | 🐉 | `multiplierRush` | Reach **3× multiplier** |

### Objective Types

| Objective | Tracked by | Progress counter |
|---|---|---|
| `triplePerfect` | `consecutivePerfects` | Resets to 0 on any non-perfect hit |
| `streakMaster` | `hitsWithoutMiss` | Resets to 0 on any miss |
| `multiplierRush` | `currentMultiplier` | Current multiplier value |

### Boss Defeat Rewards

When `progress >= requirement`:

| Reward | Value |
|---|---|
| Journey score bonus | **+50** |
| Souls | **+5** |
| Multiplier boost | `min(currentMultiplier + 1, 5)` |

The boss defeat animation plays for **2 seconds** (confetti + spin-away), after which the boss clears and the next spawn timer starts.

**Code ref:** `src/stores/useJourneyStore.js` → `BOSSES`, `spawnBoss()`, `checkBossProgress()`, `defeatBoss()`

---

## 💀 Special Bosses

Harder variants unlocked by soul milestones. When available (and not yet defeated), there's a **40% roll** each spawn cycle to get a special boss instead of the regular one.

| Boss | Emoji | Soul Threshold | Objective | Requirement |
|---|---|---|---|---|
| **Phantom Lord** | 👻 | 15 souls | `triplePerfect` | **5** perfect hits in a row |
| **The Lich King** | 💀 | 30 souls | `streakMaster` | **8** hits without missing |
| **Soul Reaper** | ⚔️ | 50 souls | `multiplierRush` | Reach **5× multiplier** |

Once a special boss is defeated, it is added to `unlockedSpecialBosses` and **won't spawn again**.

**Code ref:** `src/stores/useJourneyStore.js` → `SPECIAL_BOSSES` array

```js
const SPECIAL_BOSSES = [
  { id: 'phantom', name: 'Phantom Lord', emoji: '👻',
    objective: 'triplePerfect', requirement: 5, soulThreshold: 15 },
  { id: 'lich',    name: 'The Lich King', emoji: '💀',
    objective: 'streakMaster',  requirement: 8, soulThreshold: 30 },
  { id: 'reaper',  name: 'Soul Reaper',   emoji: '⚔️',
    objective: 'multiplierRush', requirement: 5, soulThreshold: 50 },
];
```

---

## 🏆 Efficiency & Final Score

When all lives are lost (or the journey ends), `endJourney(elapsedMs)` computes:

```
totalSeconds = max((elapsedMs - journeyStartMs) / 1000, 0.1)
efficiency   = totalHits / totalSeconds
finalScore   = round((journeyScore + bossesDefeated × 50 + souls × 2) × max(efficiency, 0.01) × 100) / 100
```

### Breakdown

| Term | Meaning |
|---|---|
| `journeyScore` | Sum of all hit points (including power-up multiplied hits) |
| `bossesDefeated × 50` | Boss kill bonus |
| `souls × 2` | Soul bonus |
| `efficiency` | Hits per second — rewards fast, consistent play |
| `max(efficiency, 0.01)` | Floor to prevent zero-score edge case |

### Leaderboard Submission

On submit, `bestStreak` is set to `bossesDefeated` (not the hit streak), so the leaderboard shows boss kills alongside the score.

**Code ref:** `src/stores/useJourneyStore.js` → `endJourney()`; `src/components/App/App.js` → `handleChallengeSuccess()`

---

## ⚙️ Game Loop Internals

The Journey game loop runs as a **250 ms `setInterval`** inside `JourneyMode.js`:

```
Every 250 ms:
├── Read useTimerStore.elapsedMs & useJourneyStore state
├── Check inactivity (>= 5000 ms since last hit AND last penalty)
│   ├── journeyMiss() → shield absorb or lose life
│   └── If lives <= 0 → endJourney()
├── Check multiplier decay (>= 1000 ms idle, multiplier > 1)
│   └── Reset multiplier to 1×
├── Check boss spawn (Date.now() >= bossSpawnTime, no current boss)
│   └── spawnBoss()
├── Remove expired floating targets
└── Check power-up expiry (Date.now() >= powerUpEndMs)
    └── Clear activePowerUp
```

**Floating target spawning** runs in a separate `useEffect` with recursive `setTimeout`:

```
Schedule next spawn in 8000 + random(4000) ms
└── spawnFloatingTarget() if journeyActive
    └── Schedule next spawn (recursive)
```

**Code ref:** `src/components/JourneyMode/JourneyMode.js` → two `useEffect` hooks (game loop interval, target spawn timeout)

---

## 🗃️ State Shape (useJourneyStore)

Full initial state from `src/stores/useJourneyStore.js`:

```js
{
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
}
```

### Store Actions

| Action | Purpose |
|---|---|
| `setDifficulty(d)` | Set difficulty before starting |
| `startJourney(ms)` | Reset state, mark active, set first boss spawn |
| `journeyHit(ms, isPerfect, isNear)` | Score a hit, update multiplier/souls/streak |
| `journeyMiss()` | Handle miss — shield check, life deduction |
| `endJourney(ms)` | Compute final score, mark ended |
| `spawnBoss()` | Pick & set current boss (regular or special) |
| `checkBossProgress(isPerfect, mult)` | Evaluate boss objective progress |
| `defeatBoss()` | Apply boss rewards, schedule next spawn |
| `spawnFloatingTarget()` | Add a floating orb (if < 2 exist) |
| `collectTarget(id, ms)` | Attempt power-up collection |
| `removeExpiredTargets()` | GC expired floating targets |
| `resetJourney()` | Full state reset |

---

## 🔧 Tuning Cheat Sheet

Quick-reference for every constant you'd want to tweak:

| What | File | Location | Default |
|---|---|---|---|
| Starting lives | `useJourneyStore.js` | `INITIAL_STATE.lives` | `5` |
| Default difficulty | `useJourneyStore.js` | `INITIAL_STATE.difficulty` | `'normal'` |
| Easy tolerance | `JourneyMode.js` | `getTolerance()` case `'easy'` | `10` cs |
| Normal tolerance | `JourneyMode.js` | `getTolerance()` default | `5` cs |
| Insanity tolerance | `JourneyMode.js` | `getTolerance()` case `'insanity'` | `0` cs |
| Multiplier step | `useJourneyStore.js` | `journeyHit()` | `+0.5` |
| Multiplier cap | `useJourneyStore.js` | `journeyHit()` | `5` |
| Multiplier decay time | `JourneyMode.js` | Game loop interval | `1000` ms |
| Inactivity penalty time | `JourneyMode.js` | Game loop interval | `5000` ms |
| Game loop tick rate | `JourneyMode.js` | `setInterval` | `250` ms |
| Boss spawn interval | `useJourneyStore.js` | `startJourney()` / `defeatBoss()` | `45 000 – 60 000` ms |
| Boss defeat score bonus | `useJourneyStore.js` | `defeatBoss()` | `+50` |
| Boss defeat soul bonus | `useJourneyStore.js` | `defeatBoss()` | `+5` |
| Boss defeat mult bonus | `useJourneyStore.js` | `defeatBoss()` | `+1` (max 5) |
| Boss defeat anim duration | `useJourneyStore.js` | `defeatBoss()` setTimeout | `2000` ms |
| Target spawn interval | `JourneyMode.js` | Target spawn `useEffect` | `8 000 – 12 000` ms |
| Max floating targets | `useJourneyStore.js` | `spawnFloatingTarget()` | `2` |
| Target expiry | `useJourneyStore.js` | `spawnFloatingTarget()` | `6000` ms |
| Target collect tolerance | `useJourneyStore.js` | `collectTarget()` | `cs <= 10 \|\| cs >= 90` |
| 2× Points duration | `useJourneyStore.js` | `POWERUPS[0].duration` | `10 000` ms |
| Shield duration | `useJourneyStore.js` | `POWERUPS[1].duration` | `15 000` ms |
| Soul Magnet duration | `useJourneyStore.js` | `POWERUPS[2].duration` | `10 000` ms |
| Soul Magnet gain | `useJourneyStore.js` | `journeyHit()` | `2` souls/hit |
| Special boss chance | `useJourneyStore.js` | `spawnBoss()` | `40%` (`Math.random() < 0.4`) |
| Phantom Lord threshold | `useJourneyStore.js` | `SPECIAL_BOSSES[0].soulThreshold` | `15` souls |
| Lich King threshold | `useJourneyStore.js` | `SPECIAL_BOSSES[1].soulThreshold` | `30` souls |
| Soul Reaper threshold | `useJourneyStore.js` | `SPECIAL_BOSSES[2].soulThreshold` | `50` souls |
| Efficiency floor | `useJourneyStore.js` | `endJourney()` | `0.01` |
| Soul bonus in final score | `useJourneyStore.js` | `endJourney()` | `× 2` per soul |
| Boss bonus in final score | `useJourneyStore.js` | `endJourney()` | `× 50` per boss |

---

*Last updated for the `useJourneyStore.js` / `JourneyMode.js` revision on the `cursor/journey-mode-documentation` branch.*
