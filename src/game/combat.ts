import { db } from "../db.js";
import { addProgress, getPlayer, recordCardBattle } from "./character.js";

export async function runForestBattle(discordId: string, guildId: string | null) {
  const player = await getPlayer(discordId);
  if (!player) throw new Error("PLAYER_NOT_FOUND");

  const deck = player.cards.filter(pc => pc.deckSlot !== null).sort((a, b) => (a.deckSlot ?? 99) - (b.deckSlot ?? 99));
  if (deck.length === 0) throw new Error("EMPTY_DECK");

  const world = guildId ? await db.worldState.upsert({ where: { guildId }, update: {}, create: { guildId } }) : null;
  let enemyHp = 80 + Math.min(30, (world?.forestDanger ?? 0));
  let playerHp = player.hp;
  const log: string[] = [];

  while (enemyHp > 0 && playerHp > 0) {
    const card = deck[Math.floor(Math.random() * deck.length)];
    const damage = Math.max(1, card.card.attack + player.attack + (card.level - 1) * 2 - 8);
    enemyHp -= damage;
    log.push(`${card.card.emoji} ${card.card.name} gây ${damage} sát thương.`);

    if (enemyHp <= 0) break;

    const enemyDamage = Math.max(1, 12 + Math.floor((world?.forestDanger ?? 0) / 10) - player.defense);
    playerHp -= enemyDamage;
    log.push(`👹 Quái vật gây ${enemyDamage} sát thương.`);
  }

  await recordCardBattle(player.id, deck.map(pc => pc.id));

  if (playerHp <= 0) {
    await db.player.update({ where: { discordId }, data: { hp: player.maxHp } });
    return { won: false, log, usedCards: deck };
  }
  const reward = await addProgress(discordId, 45, 75);
  return { won: true, log, reward, usedCards: deck };
}
