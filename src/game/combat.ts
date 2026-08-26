import { db } from "../db.js";
import { addProgress, getPlayer } from "./character.js";
import { assertCanPlay, lockForTwelveHours } from "./playerState.js";

export async function runForestBattle(discordId: string) {
  const player = await assertCanPlay(discordId);
  if (!player.cards.length) throw new Error("NO_CARDS");

  let enemyHp = 80;
  let playerHp = player.hp;
  const log: string[] = [];
  const deck = player.cards;
  const used = new Set<string>();

  while (enemyHp > 0 && playerHp > 0) {
    const card = deck[Math.floor(Math.random() * deck.length)];
    used.add(card.id);
    const damage = Math.max(1, card.card.attack + player.attack - 8);
    enemyHp -= damage;
    log.push(`${card.card.emoji} ${card.card.name} gây ${damage} sát thương.`);
    if (enemyHp <= 0) break;

    const enemyDamage = Math.max(1, 12 - player.defense);
    playerHp -= enemyDamage;
    log.push(`👹 Quái vật gây ${enemyDamage} sát thương.`);
  }

  if (playerHp <= 0) {
    const lockedUntil = lockForTwelveHours();
    await db.player.update({ where: { discordId }, data: { hp: 0, gameplayLockedUntil: lockedUntil } });
    return { won: false, log, lockedUntil };
  }

  for (const playerCardId of used) {
    const pc = await db.playerCard.findUnique({ where: { id: playerCardId } });
    if (!pc) continue;
    const newBattles = pc.battles + 1;
    await db.playerCard.update({
      where: { id: playerCardId },
      data: {
        battles: newBattles,
        bond: { increment: 2 },
        level: newBattles % 5 === 0 ? { increment: 1 } : undefined,
        memory: `Đã cùng bạn chiến đấu ${newBattles} trận.`
      }
    });
  }

  const reward = await addProgress(discordId, 45, 75);
  return { won: true, log, reward };
}
