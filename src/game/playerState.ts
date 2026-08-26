import { db } from "../db.js";

export function lockRemaining(until: Date | null | undefined) {
  if (!until) return 0;
  return Math.max(0, until.getTime() - Date.now());
}

/** Blocks gameplay while the player is KO-locked. When the 12h lock expires,
 * the player's HP is restored and the lock is cleared atomically. */
export async function assertCanPlay(discordId: string) {
  const player = await db.player.findUnique({ where: { discordId } });
  if (!player) throw new Error("PLAYER_NOT_FOUND");

  if (player.gameplayLockedUntil && player.gameplayLockedUntil > new Date()) {
    throw new Error(`GAMEPLAY_LOCKED:${player.gameplayLockedUntil.toISOString()}`);
  }

  if (player.gameplayLockedUntil) {
    return await db.player.update({
      where: { id: player.id },
      data: { hp: player.maxHp, gameplayLockedUntil: null }
    });
  }

  return player;
}

export function lockForTwelveHours() {
  return new Date(Date.now() + 12 * 60 * 60 * 1000);
}
