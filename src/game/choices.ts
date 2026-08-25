import { db } from "../db.js";

export type AdventureChoice = {
  id: string;
  label: string;
  result: string;
  coin: number;
  reputation: number;
  danger: number;
  trust: number;
  compassion?: number;
  ruthlessness?: number;
  curiosity?: number;
  knowledge?: number;
  discoverCardId?: string;
};

export type Adventure = {
  id: string;
  title: string;
  description: string;
  minDanger?: number;
  minTrust?: number;
  maxDanger?: number;
  choices: AdventureChoice[];
};

export const ADVENTURES: Adventure[] = [
  {
    id: "first_road",
    title: "🌅 Con đường đầu tiên",
    description: "Bạn rời khỏi ngôi làng. Trước mặt là ba con đường. Mỗi con đường dường như đang gọi một phần khác nhau trong con người bạn.",
    choices: [
      { id: "ember", label: "🔥 Đi theo ánh lửa", result: "Một ngọn lửa nhỏ dẫn bạn qua khu rừng. Bạn phát hiện một Card đang ngủ trong đống tro tàn.", coin: 10, reputation: 1, danger: 0, trust: 1, curiosity: 1, discoverCardId: "ember" },
      { id: "guard", label: "🛡️ Đi theo tiếng chuông", result: "Bạn tìm thấy một ngôi miếu cũ. Một hộ vệ cổ đại trao cho bạn dấu ấn của nó.", coin: 10, reputation: 2, danger: -1, trust: 3, compassion: 2, discoverCardId: "iron_guard" },
      { id: "wanderer", label: "⚔️ Đi theo dấu chân", result: "Bạn gặp một chiến binh lang thang. Sau một cuộc trò chuyện, anh ta để lại Card của mình cho bạn.", coin: 10, reputation: 0, danger: 1, trust: 0, ruthlessness: 1, curiosity: 2, discoverCardId: "wanderer" }
    ]
  },
  {
    id: "forest_wounded",
    title: "🌲 Người lạ bị thương",
    description: "Một người lạ nằm bên vệ đường. Anh ta vẫn còn tỉnh và đang cố gọi bạn.",
    choices: [
      { id: "help", label: "❤️ Giúp người đó", result: "Bạn băng bó vết thương và đưa người lạ đến nơi an toàn.", coin: 30, reputation: 5, danger: -3, trust: 5, compassion: 4 },
      { id: "search", label: "💰 Lục túi", result: "Bạn lấy được vài đồng coin. Người lạ sẽ nhớ chuyện này.", coin: 100, reputation: -8, danger: 3, trust: -5, ruthlessness: 4 },
      { id: "leave", label: "🚶 Bỏ đi", result: "Bạn tiếp tục hành trình và để số phận quyết định phần còn lại.", coin: 0, reputation: 0, danger: 1, trust: -1, curiosity: 1 }
    ]
  },
  {
    id: "forest_cry",
    title: "🕳️ Tiếng khóc trong hang",
    description: "Một tiếng khóc yếu ớt vọng ra từ một hang đá tối.",
    choices: [
      { id: "enter", label: "🔦 Đi vào", result: "Bạn tìm thấy một đứa trẻ của bộ tộc rừng. Nó trao cho bạn một mảnh tinh thể kỳ lạ.", coin: 20, reputation: 4, danger: -2, trust: 4, curiosity: 3, knowledge: 2, discoverCardId: "moon_seer" },
      { id: "call", label: "📢 Gọi từ ngoài", result: "Bạn cảnh báo người bên trong nhưng không bước vào bóng tối.", coin: 10, reputation: 2, danger: -1, trust: 2, compassion: 1 },
      { id: "leave", label: "🚶 Rời đi", result: "Tiếng khóc dần biến mất phía sau bạn.", coin: 0, reputation: 0, danger: 2, trust: -2, ruthlessness: 1 }
    ]
  },
  {
    id: "forest_merchants",
    title: "🐎 Đoàn thương nhân",
    description: "Một đoàn thương nhân chuẩn bị băng qua vùng rừng có nhiều dấu chân ma thú.",
    choices: [
      { id: "escort", label: "🛡️ Hộ tống", result: "Đoàn thương nhân vượt qua an toàn và ghi nhớ bạn.", coin: 60, reputation: 6, danger: -4, trust: 6, compassion: 2 },
      { id: "watch", label: "👁️ Theo dõi", result: "Bạn quan sát từ xa và phát hiện một pháp sư băng đang ẩn trong đoàn.", coin: 25, reputation: 1, danger: 0, trust: 1, curiosity: 2, knowledge: 3, discoverCardId: "frost_mage" },
      { id: "avoid", label: "🚶 Tránh mặt", result: "Bạn không muốn dính vào rắc rối.", coin: 0, reputation: 0, danger: 1, trust: -1 }
    ]
  },
  {
    id: "forest_trapped_beast",
    title: "🐺 Ma thú mắc bẫy",
    description: "Một ma thú non đang bị mắc trong chiếc bẫy của thợ săn.",
    maxDanger: 65,
    choices: [
      { id: "free", label: "🌿 Giải cứu", result: "Ma thú chạy vào rừng. Một ánh sáng kỳ lạ xuất hiện nơi nó biến mất.", coin: 15, reputation: 5, danger: -5, trust: 4, compassion: 5, discoverCardId: "thorn_beast" },
      { id: "kill", label: "⚔️ Kết liễu", result: "Bạn kết thúc sự đau đớn của nó.", coin: 50, reputation: -2, danger: 2, trust: -2, ruthlessness: 3 },
      { id: "watch", label: "👁️ Quan sát", result: "Bạn không can thiệp nhưng ghi nhớ cách chiếc bẫy hoạt động.", coin: 0, reputation: 0, danger: 1, trust: 0, knowledge: 2 }
    ]
  },
  {
    id: "forest_temple",
    title: "⛩️ Ngôi đền bỏ hoang",
    description: "Một ngôi đền cổ xuất hiện giữa màn sương. Những ký hiệu trên cửa đang phát sáng.",
    minTrust: 55,
    choices: [
      { id: "enter", label: "⛩️ Bước vào", result: "Bạn tìm thấy một dấu ấn cổ. Một Guardian thức tỉnh và công nhận bạn.", coin: 20, reputation: 8, danger: -2, trust: 5, knowledge: 3, discoverCardId: "ancient_guardian" },
      { id: "pray", label: "🙏 Cầu nguyện", result: "Một lời thì thầm vang lên: 'Ngươi đã được nhìn thấy.'", coin: 10, reputation: 10, danger: -1, trust: 6, compassion: 2, knowledge: 2 },
      { id: "search", label: "🔍 Tìm quanh", result: "Bạn tìm thấy vài đồng coin bị chôn dưới nền đá.", coin: 80, reputation: 0, danger: 1, trust: 0, curiosity: 2 }
    ]
  },
  {
    id: "blood_moon",
    title: "🌑 Trăng Máu",
    description: "Mặt trăng chuyển đỏ. Tiếng gầm vang lên từ sâu trong rừng.",
    minDanger: 70,
    choices: [
      { id: "hunt", label: "⚔️ Săn ma thú", result: "Bạn đối đầu với sinh vật tràn ra khỏi rừng.", coin: 120, reputation: 8, danger: -8, trust: 4, ruthlessness: 2 },
      { id: "hide", label: "🏕️ Ẩn náu", result: "Bạn sống sót qua đêm kinh hoàng.", coin: 20, reputation: 0, danger: 2, trust: 0 },
      { id: "observe", label: "👁️ Quan sát", result: "Bạn nhìn thấy một Card bí ẩn xuất hiện giữa ánh trăng đỏ.", coin: 0, reputation: 3, danger: 4, trust: 1, curiosity: 4, knowledge: 4, discoverCardId: "blood_moon" }
    ]
  }
];

function clamp(n: number) { return Math.max(0, Math.min(100, n)); }

export async function getAdventureForPlayer(discordId: string, guildId: string) {
  const player = await db.player.findUnique({ where: { discordId } });
  if (!player) throw new Error("PLAYER_NOT_FOUND");

  const world = await db.worldState.upsert({ where: { guildId }, create: { guildId }, update: {} });
  const history = await db.choiceLog.findMany({ where: { playerId: player.id }, orderBy: { createdAt: "desc" }, take: 8 });
  const recent = new Set(history.map(h => h.eventId));

  if (history.length === 0) return ADVENTURES[0];

  const available = ADVENTURES.filter(a =>
    a.id !== "first_road" &&
    !recent.has(a.id) &&
    (a.minDanger === undefined || world.forestDanger >= a.minDanger) &&
    (a.minTrust === undefined || world.forestTrust >= a.minTrust)
  );

  return available.length ? available[Math.floor(Math.random() * available.length)] : ADVENTURES.find(a => a.id !== "first_road")!;
}

export async function applyChoice(discordId: string, adventureId: string, choiceId: string, guildId: string) {
  const adventure = ADVENTURES.find(a => a.id === adventureId);
  const choice = adventure?.choices.find(c => c.id === choiceId);
  if (!adventure || !choice) throw new Error("INVALID_CHOICE");

  const player = await db.player.findUnique({ where: { discordId } });
  if (!player) throw new Error("PLAYER_NOT_FOUND");

  const done = await db.choiceLog.findFirst({ where: { playerId: player.id, eventId: adventureId } });
  if (done) throw new Error("ADVENTURE_ALREADY_DONE");

  const result = await db.$transaction(async tx => {
    const updated = await tx.player.update({
      where: { discordId },
      data: {
        coin: { increment: choice.coin },
        reputation: { increment: choice.reputation },
        compassion: { increment: choice.compassion ?? 0 },
        ruthlessness: { increment: choice.ruthlessness ?? 0 },
        curiosity: { increment: choice.curiosity ?? 0 },
        knowledge: { increment: choice.knowledge ?? 0 }
      }
    });

    let discoveredCard = null;
    if (choice.discoverCardId) {
      const card = await tx.card.findUnique({ where: { id: choice.discoverCardId } });
      if (card) {
        const owned = await tx.playerCard.findUnique({ where: { playerId_cardId: { playerId: player.id, cardId: card.id } } });
        if (!owned) {
          discoveredCard = await tx.playerCard.create({
            data: { playerId: player.id, cardId: card.id, memory: `Discovered through ${adventure.title}` },
            include: { card: true }
          });
        }
      }
    }

    await tx.choiceLog.create({ data: { playerId: player.id, eventId: adventureId, choiceId, result: choice.result } });

    const currentWorld = await tx.worldState.findUnique({ where: { guildId } });
    const world = await tx.worldState.upsert({
      where: { guildId },
      create: { guildId, forestDanger: clamp(20 + choice.danger), forestTrust: clamp(50 + choice.trust) },
      update: { forestDanger: clamp((currentWorld?.forestDanger ?? 20) + choice.danger), forestTrust: clamp((currentWorld?.forestTrust ?? 50) + choice.trust) }
    });

    return { updated, world, discoveredCard };
  });

  return { adventure, choice, ...result };
}
