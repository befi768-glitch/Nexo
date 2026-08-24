import { db } from "../db.js";

export const FOREST_EVENT = {
  id: "forest_stranger",
  title: "🌲 Người lạ trong rừng",
  description: "Bạn bắt gặp một người bị thương bên cạnh con đường.",
  choices: [
    { id: "help", label: "❤️ Giúp người đó", result: "Bạn đã cứu người lạ. Anh ta ghi nhớ lòng tốt của bạn.", coin: 30, reputation: 5 },
    { id: "search", label: "💰 Lục túi của người đó", result: "Bạn tìm thấy vài đồng coin, nhưng hành động này để lại tiếng xấu.", coin: 100, reputation: -8 },
    { id: "leave", label: "🚶 Bỏ đi", result: "Bạn tiếp tục hành trình. Chuyện gì xảy ra với người đó vẫn là một bí ẩn.", coin: 0, reputation: 0 }
  ] as const
};

export async function applyChoice(discordId: string, choiceId: string) {
  const choice = FOREST_EVENT.choices.find(c => c.id === choiceId);
  if (!choice) throw new Error("INVALID_CHOICE");

  const player = await db.player.findUnique({ where: { discordId } });
  if (!player) throw new Error("PLAYER_NOT_FOUND");

  const updated = await db.player.update({
    where: { discordId },
    data: { coin: { increment: choice.coin }, reputation: { increment: choice.reputation } }
  });

  await db.choiceLog.create({
    data: { playerId: player.id, eventId: FOREST_EVENT.id, choiceId, result: choice.result }
  });

  return { choice, player: updated };
}
