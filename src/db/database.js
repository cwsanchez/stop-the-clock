import Dexie from 'dexie';

export const db = new Dexie('StopTheClockDB');

db.version(1).stores({
  highScores: '++id, username, score, timestamp',
  attempts: '++id, username, score, stoppedAt, wasSuccess, timestamp',
  leaderboard: '++id, &username, score, timestamp',
});

export async function saveAttempt(username, score, stoppedAt, wasSuccess) {
  const timestamp = Date.now();
  await db.attempts.add({ username, score, stoppedAt, wasSuccess, timestamp });

  const count = await db.attempts.where('username').equals(username).count();
  if (count > 10) {
    const oldest = await db.attempts
      .where('username')
      .equals(username)
      .sortBy('timestamp');
    const toDelete = oldest.slice(0, count - 10);
    await db.attempts.bulkDelete(toDelete.map((a) => a.id));
  }
}

export async function getAttempts(username) {
  if (!username) return [];
  return db.attempts
    .where('username')
    .equals(username)
    .reverse()
    .sortBy('timestamp');
}

export async function submitToLeaderboard(username, score) {
  const existing = await db.leaderboard.where('username').equals(username).first();
  if (existing) {
    if (score > existing.score) {
      await db.leaderboard.update(existing.id, { score, timestamp: Date.now() });
      return true;
    }
    return false;
  }
  await db.leaderboard.add({ username, score, timestamp: Date.now() });

  const all = await db.leaderboard.orderBy('score').reverse().toArray();
  if (all.length > 50) {
    const toRemove = all.slice(50);
    await db.leaderboard.bulkDelete(toRemove.map((e) => e.id));
  }
  return true;
}

export async function getLeaderboard() {
  return db.leaderboard.orderBy('score').reverse().limit(50).toArray();
}

export async function getPersonalBest(username) {
  if (!username) return 0;
  const entry = await db.leaderboard.where('username').equals(username).first();
  return entry ? entry.score : 0;
}
