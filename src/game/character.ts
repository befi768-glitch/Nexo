import { db } from "../db.js";

export function xpForNextLevel(level: number) {
  return 100 + (level - 1) * 75;
}

export async function getPlayer(discordId: string) {
  return db.player.findUnique({
    where: { discordId },
    include: { cards: { include: { card: true }, orderBy: { deckSlot: "asc" } } }
  });
}

export async function createPlayer(discordId: string, name: string) {
  return db.player.create({
    data: {
      discordId,
      name,
      cards: {
        create: [
          { cardId: "ember", deckSlot: 1 },
          { cardId: "iron_guard", deckSlot: 2 },
          { cardId: "wanderer", deckSlot: 3 }
        ]
      }
    },
    include: { cards: { include: { card: true }, orderBy: { deckSlot: "asc" } } }
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

export async function setDeckSlot(discordId: string, cardId: string, slot: number) {
  if (!Number.isInteger(slot) || slot < 1 || slot > 3) throw new Error("INVALID_SLOT");

  const player = await db.player.findUnique({ where: { discordId } });
  if (!player) throw new Error("PLAYER_NOT_FOUND");

  const target = await db.playerCard.findFirst({ where: { playerId: player.id, cardId } });
  if (!target) throw new Error("CARD_NOT_OWNED");

  const current = await db.playerCard.findFirst({ where: { playerId: player.id, deckSlot: slot } });
  await db.$transaction(async tx => {
    if (current && current.id !== target.id) {
      await tx.playerCard.update({ where: { id: current.id }, data: { deckSlot: null } });
    }
    await tx.playerCard.update({ where: { id: target.id }, data: { deckSlot: slot } });
  });
}

export async function recordCardBattle(playerId: string, playerCardIds: string[]) {
  for (const playerCardId of playerCardIds) {
    const pc = await db.playerCard.findFirst({ where: { id: playerCardId, playerId } });
    if (!pc) continue;

    const nextBattles = pc.battles + 1;
    const leveled = nextBattles % 5 === 0;
    await db.playerCard.update({
      where: { id: pc.id },
      data: {
        battles: nextBattles,
        bond: { increment: 2 },
        level: leveled ? { increment: 1 } : undefined,
        memory: leveled ? `Đã chiến đấu ${nextBattles} trận.` : pc.memory
      }
    });
  }
}

export async function buyCard(discordId: string, cardId: string) {
  const card = await db.card.findUnique({ where: { id: cardId } });
  if (!card) throw new Error("CARD_NOT_FOUND");
  if (card.price <= 0) throw new Error("CARD_NOT_FOR_SALE");

  return db.$transaction(async tx => {
    const player = await tx.player.findUnique({ where: { discordId } });
    if (!player) throw new Error("PLAYER_NOT_FOUND");
    if (player.coin < card.price) throw new Error("NOT_ENOUGH_COIN");

    const owned = await tx.playerCard.findFirst({ where: { playerId: player.id, cardId } });
    if (owned) throw new Error("ALREADY_OWNED");

    const nextSlot = await tx.playerCard.count({ where: { playerId: player.id, deckSlot: { not: null } } });
    const playerCard = await tx.playerCard.create({
      data: { playerId: player.id, cardId, deckSlot: nextSlot < 3 ? nextSlot + 1 : null }
    });
    await tx.player.update({ where: { id: player.id }, data: { coin: { decrement: card.price } } });
    return playerCard;
  });
}
