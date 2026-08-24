import { db } from "../db.js";
import { addProgress, getPlayer } from "./character.js";

export async function runForestBattle(discordId: string) {
  const player = await getPlayer(discordId);
  if (!player) throw new Error("PLAYER_NOT_FOUND");

  let enemyHp = 80;
  let playerHp = player.hp;
  const log: string[] = [];
  const deck = player.cards.slice(0, 3);

  while (enemyHp > 0 && playerHp > 0) {
    const card = deck[Math.floor(Math.random() * deck.length)];
    const damage = Math.max(1, card.card.attack + player.attack - 8);
    enemyHp -= damage;
    log.push(`${card.card.emoji} ${card.card.name} gây ${damage} sát thương.`);

    if (enemyHp <= 0) break;

    const enemyDamage = Math.max(1, 12 - player.defense);
    playerHp -= enemyDamage;
    log.push(`👹 Quái vật gây ${enemyDamage} sát thương.`);
  }

  if (playerHp <= 0) {
    await db.player.update({ where: { discordId }, data: { hp: player.maxHp } });
    return { won: false, log };
  }

  const reward = await addProgress(discordId, 45, 75);
  return { won: true, log, reward };
}
