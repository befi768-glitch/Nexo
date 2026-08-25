import { db } from "../db.js";

export const FOREST_EVENT = {
  id: "forest_stranger",
  title: "🌲 Người lạ trong rừng",
  description: "Bạn bắt gặp một người bị thương bên cạnh con đường. Lựa chọn của bạn sẽ thay đổi trạng thái khu rừng của server.",
  choices: [
    { id: "help", label: "❤️ Giúp người đó", result: "Bạn cứu người lạ. Tin đồn về lòng tốt của bạn lan đi.", coin: 30, reputation: 5, trust: 4, danger: -2, rumor: 1 },
    { id: "search", label: "💰 Lục túi", result: "Bạn lấy được coin. Nhưng khu rừng trở nên cảnh giác với những kẻ tham lam.", coin: 100, reputation: -8, trust: -4, danger: 3, rumor: 2 },
    { id: "leave", label: "🚶 Bỏ đi", result: "Bạn rời đi. Khu rừng vẫn chưa biết bạn đứng về phía nào.", coin: 0, reputation: 0, trust: 0, danger: 0, rumor: 0 }
  ] as const
};

export async function getWorldState(guildId: string) {
  return db.worldState.upsert({ where: { guildId }, update: {}, create: { guildId } });
}

export async function applyChoice(discordId: string, guildId: string | null, choiceId: string, messageId: string) {
  const choice = FOREST_EVENT.choices.find(c => c.id === choiceId);
  if (!choice) throw new Error("INVALID_CHOICE");

  return db.$transaction(async tx => {
    const player = await tx.player.findUnique({ where: { discordId } });
    if (!player) throw new Error("PLAYER_NOT_FOUND");

    const session = await tx.adventureSession.findUnique({ where: { messageId } });
    if (!session || session.playerId !== player.id || session.eventId !== FOREST_EVENT.id) throw new Error("INVALID_SESSION");
    if (session.resolved) throw new Error("CHOICE_ALREADY_USED");

    const world = guildId
      ? await tx.worldState.upsert({ where: { guildId }, update: {}, create: { guildId } })
      : null;

    const updated = await tx.player.update({
      where: { discordId },
      data: { coin: { increment: choice.coin }, reputation: { increment: choice.reputation } }
    });

    let discoveredPath = world?.discoveredPath ?? false;
    if (world) {
      const nextTrust = Math.max(-100, Math.min(100, world.forestTrust + choice.trust));
      const nextDanger = Math.max(0, Math.min(100, world.forestDanger + choice.danger));
      const nextRumor = Math.max(0, Math.min(100, world.forestRumor + choice.rumor));
      discoveredPath = world.discoveredPath || nextRumor >= 5 || nextTrust >= 8;
      await tx.worldState.update({
        where: { guildId: world.guildId },
        data: { forestTrust: nextTrust, forestDanger: nextDanger, forestRumor: nextRumor, discoveredPath }
      });
    }

    await tx.choiceLog.create({
      data: {
        playerId: player.id,
        eventId: FOREST_EVENT.id,
        choiceId,
        result: choice.result,
        worldEffect: world ? `trust ${choice.trust >= 0 ? "+" : ""}${choice.trust}, danger ${choice.danger >= 0 ? "+" : ""}${choice.danger}, rumor ${choice.rumor >= 0 ? "+" : ""}${choice.rumor}` : ""
      }
    });

    await tx.adventureSession.update({ where: { id: session.id }, data: { resolved: true, resolvedAt: new Date() } });

    return { choice, player: updated, discoveredPath, world: guildId ? await tx.worldState.findUnique({ where: { guildId } }) : null };
  });
}
