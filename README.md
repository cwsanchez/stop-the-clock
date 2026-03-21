# ⏱️ Stop the Clock!

A precision-timing game where milliseconds decide everything. Built with **React 18**, **Zustand**, **Framer Motion**, and **Supabase**.

> Hit the timer **exactly** when the centiseconds reach `:00`. Chain perfect stops, ride multiplier waves, defeat bosses, and climb the global leaderboard.

---

## 🎮 How to Play

1. **Sign in** with email + password to save scores, or play as a **guest** (scores won't be submitted).
2. **Pick a mode** from the top bar — Classic, Weenie Hut Jr, Fever, or Journey.
3. **Start** the timer and watch the centiseconds fly.
4. **Stop / Hit** when the display reads **:00** (or within tolerance, depending on mode).
5. **Submit** your score to the global leaderboard when you're done.

**Tip:** The timer uses `requestAnimationFrame` + `performance.now()` for sub-millisecond precision — no cheating with slow intervals!

---

## 🕹️ Game Modes

| Mode | Icon | Tolerance | Core Mechanic | Scoring |
|---|---|---|---|---|
| **Classic** | 🔥 | Exact `:00` only | Stop → Chain → Build streak | Streak count |
| **Weenie Hut Jr** | 👶 | ±0.05 s | Same as Classic, with forgiveness | Streak count |
| **Fever** | ⚡ | ±0.05 s (near) / exact (perfect) | Nonstop timer, multiplier ramp | `rawPoints × efficiency` |
| **Journey** | ⚔️ | Varies by difficulty | 5 lives, bosses, souls, power-ups | `(raw + bonuses) × efficiency` |

Each mode has its **own global leaderboard** and **per-user high score tracking**.

### Classic

Stop the timer exactly on `:00`. Each success adds **+1** to your streak. One miss and the streak resets — submit before you lose it.

### Weenie Hut Jr 🧽

Same rules, but with **±0.05 s forgiveness** (centiseconds 0–5 or 95–99 count as a hit). Extra confetti, SpongeBob vibes.

### Fever 🔥

The timer **never stops**. Keep hitting at `:00` to rack up points.

| Hit Type | Effect |
|---|---|
| **Perfect** (exact `:00`) | +1 × current multiplier, multiplier +0.5× (max 5×) |
| **Near** (±0.05 s) | +1 × current multiplier, multiplier unchanged |
| **Skip** (1–4 s idle) | Multiplier resets to 1×, run continues |
| **Hard miss** (> ±0.05 s) | Run ends |
| **5 s inactivity** | Run ends |

**Final Score** = `rawPoints × (totalHits / totalSeconds)`

### Journey ⚔️

An endurance gauntlet with lives, difficulty tiers, bosses, souls, floating power-up orbs, and an efficiency-weighted final score.

👉 **[Full Journey Mode deep-dive →](src/docs/JourneyMode.md)**

---

## 🎯 Controls

| Phase | Button | Action |
|---|---|---|
| Idle | **Start** | Begin the timer |
| Running (Classic/Weenie) | **Stop** | Attempt to stop at `:00` |
| Running (Fever) | **HIT!** | Register a hit |
| Running (Journey) | **HIT!** | Register a hit |
| Success (Classic/Weenie) | **Chain** | Restart timer, keep streak |
| Any stopped state | **Submit** | Push score to leaderboard |
| Any stopped state | **Reset** | Clear score and restart |

Journey Mode also has **floating orbs** on the left/right edges — tap them when centiseconds are near `:00` (±0.1 s) to collect power-ups.

---

## 📊 Scoring Formulas

### Classic & Weenie Hut Jr

```
score = consecutive successful stops (streak)
personalBest = max(score, previousBest)
```

### Fever

```
rawPoints   = Σ (1 × multiplierAtHit)
efficiency  = totalHits / totalSeconds
finalScore  = rawPoints × efficiency
```

### Journey

```
rawScore    = Σ (1 × multiplierAtHit × pointMultiplier)
bossBonus   = bossesDefeated × 50
soulBonus   = souls × 2
efficiency  = totalHits / totalSeconds

finalScore  = (rawScore + bossBonus + soulBonus) × max(efficiency, 0.01)
```

*`pointMultiplier` is 2 when the ⚡ 2× Points power-up is active, otherwise 1.*

---

## ✨ Features

- **4 Game Modes** — Classic, Weenie Hut Jr, Fever, Journey
- **Supabase Auth** — Email/password sign-up, guest mode for casual play
- **Global Leaderboards** — Separate tab per mode (top 50 each), auto-refresh every 30 s
- **Per-User Scores** — High score + best streak saved per mode in Supabase
- **Precision Timer** — `requestAnimationFrame` + `performance.now()`
- **Dark Neon Theme** — Glowing timer, neon accents, parallax backgrounds
- **Sound Effects** — Oscillator-based chimes for success, fail, new-best, multiplier bumps
- **Confetti** — Canvas Confetti particle explosions on personal bests and boss defeats
- **Responsive** — Fully playable on mobile and desktop
- **Smooth Animations** — Framer Motion throughout

---

## 🏗️ Architecture

```
┌─────────── App ───────────┐
│                            │
│  ModeSwitcher  UserHeader  │  ← mode select + auth
│       │            │       │
│  ┌────┴────┐  AuthModal    │
│  │ Router  │               │
│  ├─────────┤               │
│  │Classic/ │  Leaderboard  │  ← global rankings
│  │Weenie/  │       │       │
│  │Fever    │  ChallengeModal│ ← anti-cheat gate
│  │Journey  │               │
│  └────┬────┘               │
│       │                    │
│  Timer  Controls  Score    │
└────────────────────────────┘

Zustand Stores          Supabase
───────────────         ─────────
useTimerStore  ◄──────► useTimer hook (rAF loop)
useGameStore   ◄──────► Classic / Weenie / Fever state
useJourneyStore◄──────► Journey mode state
useAuthStore   ◄──────► Supabase Auth
useLeaderboardStore ◄─► Supabase Postgres (scores, profiles)
```

### Zustand Stores

| Store | Purpose |
|---|---|
| `useTimerStore` | Elapsed time, running state, phase (`idle` / `running` / `stopped-success` / `stopped-fail`) |
| `useGameStore` | Mode, score, personal best, Fever multiplier / total / efficiency |
| `useJourneyStore` | Lives, souls, bosses, power-ups, floating targets, difficulty, Journey scoring |
| `useLeaderboardStore` | Leaderboard fetch/submit, rate limiting, retries |
| `useAuthStore` | Supabase auth state, user profile, sign-in / sign-up / sign-out |

### Supabase Tables

| Table | Columns (key) | Description |
|---|---|---|
| `profiles` | `id`, `display_name` | User display names |
| `scores` | `user_id`, `mode`, `high_score`, `best_streak`, `updated_at` | Per-user high score per mode |
| `leaderboard_daily` | (view) | Leaderboard query view |

The daily leaderboard resets at midnight UTC. UI shows "Daily reset in Xh Ym".

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 (Create React App) |
| State | Zustand 5 |
| Backend | Supabase (Auth + Postgres) |
| Styling | Tailwind CSS 3 |
| Animation | Framer Motion 12 |
| Icons | Lucide React |
| Effects | Canvas Confetti · Web Audio API |
| Timer | `requestAnimationFrame` + `performance.now()` |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 16+ and **npm** 8+
- A **Supabase** project ([supabase.com](https://supabase.com))

### 1. Clone & Install

```bash
git clone <repo-url>
cd js-react
npm install
```

### 2. Environment Variables

Create a `.env` file in the project root:

```env
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Supabase Setup

Run the following SQL in your Supabase SQL Editor:

```sql
-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL
);

-- Scores table (one row per user per mode)
CREATE TABLE IF NOT EXISTS scores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mode TEXT NOT NULL CHECK (mode IN ('classic', 'weenie', 'fever', 'journey')),
  high_score NUMERIC NOT NULL DEFAULT 0,
  best_streak INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_submit TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, mode)
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;

-- Policies (adjust to your needs)
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Scores are viewable by everyone"
  ON scores FOR SELECT USING (true);

CREATE POLICY "Users can insert their own scores"
  ON scores FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scores"
  ON scores FOR UPDATE USING (auth.uid() = user_id);
```

### 4. Run

```bash
npm start          # Dev server on http://localhost:3000
npm run build      # Production build
CI=true npm test   # Run tests (non-interactive)
```

---

## 📁 Project Structure

```
src/
├── lib/
│   └── supabaseClient.js          # Supabase client singleton + reconnect helper
├── stores/
│   ├── useTimerStore.js            # Timer elapsed time & phase (Zustand)
│   ├── useGameStore.js             # Game mode, score, Fever state (Zustand)
│   ├── useJourneyStore.js          # Journey mode state — lives, bosses, souls, power-ups
│   ├── useLeaderboardStore.js      # Leaderboard CRUD + rate limiting (Zustand)
│   └── useAuthStore.js             # Supabase Auth wrapper (Zustand)
├── hooks/
│   ├── useTimer.js                 # requestAnimationFrame timer loop
│   └── useSound.js                 # Web Audio API oscillator-based SFX
├── utils/
│   └── formatTime.js               # Time formatting + success-check with mode tolerance
├── components/
│   ├── App/App.js                  # Root layout, game orchestration, mode router
│   ├── Timer/Timer.js              # Large animated timer display
│   ├── Controls/Controls.js        # Start / Stop / Chain / HIT! / Submit / Reset
│   ├── ScoreDisplay/ScoreDisplay.js
│   ├── ModeSwitcher/ModeSwitcher.js # Mode toggle (Classic / Weenie / Fever / Journey)
│   ├── UserHeader/UserHeader.js    # Auth status + sign in/out
│   ├── AuthModal/AuthModal.js      # Email/password auth dialog
│   ├── ChallengeModal/ChallengeModal.js # Anti-cheat gate before submit
│   ├── Leaderboard/Leaderboard.js  # Multi-tab global leaderboard
│   ├── FeverRulesPanel/FeverRulesPanel.js
│   ├── FeverEndScreen/FeverEndScreen.js
│   ├── FeverParticles/FeverParticles.js
│   └── JourneyMode/
│       ├── JourneyMode.js          # Full Journey Mode UI + game loop
│       ├── JourneyEndScreen.js     # Post-run stats & submit
│       └── JourneyRulesPanel.js    # In-game rules tooltip
└── docs/
    └── JourneyMode.md              # Journey Mode deep-dive for developers
```

---

## 🔧 How to Tweak the Game

All gameplay constants live in a handful of files — no hunting required.

### Timing & Tolerance

| What | File | Detail |
|---|---|---|
| Hit tolerance (Classic/Weenie) | `src/utils/formatTime.js` | `isStopSuccess()` — Weenie tolerance = 5 cs, Classic = 0 |
| Journey tolerance | `src/components/JourneyMode/JourneyMode.js` | `getTolerance()` — Easy 10, Normal 5, Insanity 0 |
| Floating target collect window | `src/stores/useJourneyStore.js` | `collectTarget()` — `cs <= 10 \|\| cs >= 90` |

### Multipliers & Scoring

| What | File | Detail |
|---|---|---|
| Multiplier step / cap | `useGameStore.js` (Fever) / `useJourneyStore.js` (Journey) | `+0.5` per perfect, max `5` |
| Fever final score | `useGameStore.js` → `endFeverRun()` | `feverTotal × efficiency` |
| Journey final score | `useJourneyStore.js` → `endJourney()` | `(score + bosses×50 + souls×2) × max(eff, 0.01)` |

### Journey Mode Tuning

| What | Constant / Location | Default |
|---|---|---|
| Starting lives | `INITIAL_STATE.lives` in `useJourneyStore.js` | `5` |
| Boss spawn interval | `startJourney()` / `defeatBoss()` in `useJourneyStore.js` | `45 000 – 60 000 ms` |
| Floating target spawn interval | `JourneyMode.js` → target spawn `useEffect` | `8 000 – 12 000 ms` |
| Max simultaneous targets | `spawnFloatingTarget()` in `useJourneyStore.js` | `2` |
| Target expiry | `spawnFloatingTarget()` in `useJourneyStore.js` | `6 000 ms` |
| Inactivity penalty threshold | `JourneyMode.js` game loop | `5 000 ms` |
| Multiplier decay threshold | `JourneyMode.js` game loop | `1 000 ms` |
| Boss defeat rewards | `defeatBoss()` in `useJourneyStore.js` | `+50 pts, +5 souls, multiplier +1` |
| Power-up durations | `POWERUPS` array in `useJourneyStore.js` | 10 s / 15 s / 10 s |

### Bosses & Special Bosses

Edit `BOSSES` and `SPECIAL_BOSSES` arrays at the top of `src/stores/useJourneyStore.js`. Each boss has:

```js
{
  id: 'sentinel',
  name: 'The Sentinel',
  emoji: '👁️',
  objective: 'triplePerfect',    // 'triplePerfect' | 'streakMaster' | 'multiplierRush'
  objectiveDesc: 'Hit exactly :00 three times!',
  requirement: 3,
  soulThreshold: 15,             // special bosses only — souls needed to unlock
}
```

### Power-ups

Edit the `POWERUPS` array in `src/stores/useJourneyStore.js`:

```js
{ id: 'doublePoints', name: '2× Points', emoji: '⚡', duration: 10000, color: '#fbbf24' },
{ id: 'shield',       name: 'Shield',    emoji: '🛡️', duration: 15000, color: '#3b82f6' },
{ id: 'soulMagnet',   name: '+Souls',    emoji: '🧲', duration: 10000, color: '#a855f7' },
```

### Leaderboard

| What | File | Default |
|---|---|---|
| Rate limit between submits | `useLeaderboardStore.js` | `5 000 ms` |
| Fetch timeout | `useLeaderboardStore.js` | `5 000 ms` |
| Max retries | `useLeaderboardStore.js` | `2` |
| Auto-refresh interval | `useLeaderboardStore.js` | `30 000 ms` |

---

## 🤝 Multiplayer / Competing with Friends

1. Share the app URL with friends.
2. Each player creates an account (email + password).
3. Pick the same mode and try to out-score each other.
4. Check the **Leaderboard** tabs — each mode has independent rankings.

---

## 📝 License

MIT
