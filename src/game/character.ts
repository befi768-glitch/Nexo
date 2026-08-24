import { db } from "../db.js";

export function xpForNextLevel(level: number) {
  return 100 + (level - 1) * 75;
}

export async function getPlayer(discordId: string) {
  return db.player.findUnique({
    where: { discordId },
    include: { cards: { include: { card: true } } }
  });
}

export async function createPlayer(discordId: string, name: string) {
  return db.player.create({
    data: {
      discordId,
      name,
      cards: { create: [{ cardId: "ember" }, { cardId: "iron_guard" }, { cardId: "wanderer" }] }
    },
    include: { cards: { include: { card: true } } }
  });
}

export async function addProgress(discordId: string, xp: number, coin: number) {
  const player = await db.player.findUnique({ where: { discordId } });
  if (!player) return null;

  let level = player.level;
  let totalXp = player.xp + xp;
  let maxHp = player.maxHp;
  let attack = player.attack;
  let defense = player.defense;

  while (totalXp >= xpForNextLevel(level)) {
    totalXp -= xpForNextLevel(level);
    level++;
    maxHp += 15;
    attack += 2;
    defense += 1;
  }

  return db.player.update({
    where: { discordId },
    data: { level, xp: totalXp, coin: { increment: coin }, maxHp, hp: maxHp, attack, defense }
  });
}
