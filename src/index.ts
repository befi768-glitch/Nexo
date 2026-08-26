import "dotenv/config";
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, Client, EmbedBuilder, Events, GatewayIntentBits, MessageFlags } from "discord.js";
import { db } from "./db.js";
import { seedCards } from "./game/cards.js";
import { createPlayer, getPlayer } from "./game/character.js";
import { applyChoice, getAdventureForPlayer } from "./game/choices.js";
import { runForestBattle } from "./game/combat.js";
import { assertCanPlay } from "./game/playerState.js";

const token = process.env.DISCORD_TOKEN;
const databaseUrl = process.env.DATABASE_URL;
if (!token) throw new Error("Thiếu biến DISCORD_TOKEN trên Railway Variables");
if (!databaseUrl) throw new Error("Thiếu biến DATABASE_URL trên Railway Variables");

const PREFIX = "-";
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

client.once(Events.ClientReady, async ready => {
  await seedCards();
  console.log(`Logged in as ${ready.user.tag}`);
  console.log(`Prefix: ${PREFIX}`);
  console.log("PQT RPG V2.8 — Living Adventure / Exploration / Memory / Discovery");
});

function helpText() {
  return [
    "🎮 **PQT RPG — V2.8**",
    "",
    "`-start` — Bắt đầu hành trình (không nhận card)",
    "`-profile` — Xem nhân vật, ký ức và các mối quan hệ",
    "`-cards` — Xem collection card đã khám phá",
    "`-adventure` — Khám phá một Adventure (lượt khám phá có giới hạn và hồi dần)",
    "`-world` — Xem trạng thái và lịch sử thế giới",
    "`-battle` — Chiến đấu PvE",
    "`-help` — Xem danh sách lệnh"
  ].join("\n");
}

function clamp(n: number) { return Math.max(0, Math.min(100, n)); }

function isExpectedGameError(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  return ["NO_CARDS", "ADVENTURE_ACTIVE", "NO_ADVENTURES", "NO_EXPLORATION", "ADVENTURE_EXPIRED", "ADVENTURE_ALREADY_DONE", "ADVENTURE_NOT_ACTIVE"].includes(message) || message.startsWith("GAMEPLAY_LOCKED:");
}

function identity(player: NonNullable<Awaited<ReturnType<typeof getPlayer>>>) {
  const scores = [
    ["❤️ Người bảo hộ", player.compassion],
    ["🩸 Kẻ quyết đoán", player.ruthlessness],
    ["🔮 Kẻ khám phá", player.curiosity],
    ["📚 Người tìm hiểu", player.knowledge]
  ] as const;
  const max = Math.max(...scores.map(s => s[1]));
  return max === 0 ? "❔ Chưa định hình" : scores.find(s => s[1] === max)?.[0] ?? "❔ Chưa định hình";
}

client.on(Events.MessageCreate, async message => {
  if (message.author.bot || !message.content.startsWith(PREFIX)) return;
  const args = message.content.slice(PREFIX.length).trim().split(/\s+/);
  const command = (args.shift() ?? "").toLowerCase();
  const id = message.author.id;
  if (!command) return;

  try {
    if (command === "help" || command === "h") return void await message.reply(helpText());

    if (command === "start") {
      const existing = await getPlayer(id);
      if (existing) return void await message.reply("Bạn đã bắt đầu hành trình rồi. Dùng `-profile` để xem nhân vật.");
      const player = await createPlayer(id, message.author.username);
      return void await message.reply(
        `🌟 **Hành trình bắt đầu!**\n\n👤 ${player.name}\n❤️ ${player.hp}/${player.maxHp}\n💰 ${player.coin} Coin\n\n` +
        `🃏 **Bạn chưa có Card nào.**\nCard phải được **khám phá** trong thế giới.\n\n🔎 Hãy dùng \`-adventure\` để tìm Card đầu tiên.`
      );
    }

    const player = await getPlayer(id);
    if (!player) return void await message.reply("Bạn chưa có nhân vật. Dùng `-start` trước.");

    if (command === "profile" || command === "me") {
      const memories = await db.playerMemory.findMany({ where: { playerId: player.id }, orderBy: { updatedAt: "desc" }, take: 4 });
      const factions = await db.factionStanding.findMany({ where: { playerId: player.id }, orderBy: { value: "desc" } });
      const factionNames: Record<string, string> = { forest_wardens: "🌲 Vệ Binh Rừng", wandering_merchants: "🐎 Thương Hội Lang Bạt" };
      const factionText = factions.length ? factions.map(f => `${factionNames[f.factionId] ?? f.factionId}: **${f.value >= 0 ? "+" : ""}${f.value}**`).join("\n") : "Chưa có ai biết đến bạn.";
      const memoryText = memories.length ? memories.map(m => `• ${m.value}`).join("\n") : "Chưa có ký ức đáng chú ý.";
      const lockText = player.gameplayLockedUntil && player.gameplayLockedUntil > new Date()
        ? `\n\n🔒 **ĐANG HỒI PHỤC**\nToàn bộ cơ chế chơi đang bị khóa đến <t:${Math.floor(player.gameplayLockedUntil.getTime()/1000)}:F> (<t:${Math.floor(player.gameplayLockedUntil.getTime()/1000)}:R>).`
        : "";
      const embed = new EmbedBuilder().setTitle(`👤 ${player.name}`).setDescription(
        `Level **${player.level}**\n❤️ ${player.hp}/${player.maxHp}\n⚔️ ATK ${player.attack}\n🛡️ DEF ${player.defense}\n💰 ${player.coin} Coin\n⭐ XP ${player.xp}\n📜 Reputation ${player.reputation}\n${lockText}\n\n🧠 **Identity:** ${identity(player)}\n❤️ Compassion: ${player.compassion}\n🩸 Ruthlessness: ${player.ruthlessness}\n🔮 Curiosity: ${player.curiosity}\n📚 Knowledge: ${player.knowledge}\n\n🏳️ **Dấu chân trong thế giới**\n${factionText}\n\n🧠 **Ký ức gần đây**\n${memoryText}`
      );
      return void await message.reply({ embeds: [embed] });
    }

    if (command === "cards" || command === "card") {
      if (!player.cards.length) return void await message.reply("🃏 **Collection trống.**\n\nBạn chưa khám phá được Card nào. Dùng `-adventure`.");
      const lines = player.cards.map(pc => `${pc.card.emoji} **${pc.card.name}** — ${pc.card.rarity} | Lv.${pc.level} | Bond ${pc.bond} | Battles ${pc.battles}`);
      return void await message.reply(`🃏 **Collection — ${player.cards.length} Card**\n\n${lines.join("\n")}`);
    }

    if (command === "world") {
      const guildId = message.guildId ?? "dm";
      const world = await db.worldState.upsert({ where: { guildId }, create: { guildId }, update: {} });
      const events = await db.worldEvent.findMany({ where: { guildId }, orderBy: { startedAt: "desc" }, take: 3 });
      const danger = "█".repeat(Math.round(world.forestDanger / 10)) + "░".repeat(10 - Math.round(world.forestDanger / 10));
      const trust = "█".repeat(Math.round(world.forestTrust / 10)) + "░".repeat(10 - Math.round(world.forestTrust / 10));
      const eventText = world.activeEvent
        ? `🔥 **Sự kiện đang diễn ra:** ${world.activeEvent === "BLOOD_MOON" ? "🌑 Trăng Máu" : world.activeEvent}`
        : "🌿 Chưa có World Event lớn nào đang diễn ra.";
      const historyText = events.length ? events.map(e => `• ${e.title} — ${e.description}`).join("\n") : "• Chưa có biến cố nào được ghi lại.";
      return void await message.reply({ embeds: [new EmbedBuilder().setTitle("🌍 Thế giới hiện tại").setDescription(
        `Ngày thế giới **${world.worldDay}**\n\n` +
        `🌲 **Forest Danger** ${danger} ${world.forestDanger}/100\n` +
        `🤝 **Forest Trust** ${trust} ${world.forestTrust}/100\n\n` +
        `${eventText}\n\n` +
        `📜 **Dấu vết gần đây**\n${historyText}\n\n` +
        `👁️ Thế giới không kể cho bạn mọi thứ. Hãy đi Adventure để tự phát hiện.`
      )] });
    }

    if (command === "adventure" || command === "adv") {
      await assertCanPlay(id);
      const guildId = message.guildId ?? "dm";
      const data = await getAdventureForPlayer(id, guildId);
      const expiresAt = Math.floor(data.session.expiresAt.getTime() / 1000);
      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        ...data.adventure.choices.map(choice => new ButtonBuilder()
          .setCustomId(`choice:${choice.id}:${id}:${data.adventure.id}`)
          .setLabel(choice.label)
          .setStyle(choice.id === "break" || choice.id === "search" ? ButtonStyle.Danger : ButtonStyle.Primary))
      );
      await message.reply({
        embeds: [new EmbedBuilder().setTitle(data.adventure.title).setDescription(
          `${data.adventure.description}\n\n⏳ **90 giây để lựa chọn.**\n🧭 Lượt khám phá đã dùng. Không có Adventure mới tự động sau khi bạn chọn.`
        ).setFooter({text:`Hết hạn <t:${expiresAt}:R>`})],
        components:[row]
      });
      return;
    }

    if (command === "battle" || command === "fight") {
      await assertCanPlay(id);
      const result = await runForestBattle(id);
      const text = result.log.slice(-8).join("\n");
      return void await message.reply(result.won
        ? `🏆 **Victory!**\n\n${text}\n\n🎁 +45 XP\n💰 +75 Coin\n🃏 Các Card tham chiến đã nhận Bond và Battle progress.`
        : `💀 **Bạn đã thất bại.**\n\n${text}\n\n❤️ HP: **0/${player?.maxHp ?? 100}**\n🔒 Toàn bộ cơ chế chơi đã bị khóa trong **12 giờ** để hồi phục.`);
    }

    return void await message.reply(`❓ Không tìm thấy lệnh \`-${command}\`. Dùng \`-help\`.`);
  } catch (error) {
    if (!isExpectedGameError(error)) console.error(error);
    if (error instanceof Error && error.message.startsWith("GAMEPLAY_LOCKED:")) {
      const until = error.message.slice("GAMEPLAY_LOCKED:".length);
      const ts = Math.floor(new Date(until).getTime()/1000);
      const currentPlayer = await getPlayer(id);
      return void await message.reply(`🔒 **Bạn đã kiệt sức.**\n\nToàn bộ cơ chế chơi của bạn đang bị khóa trong 12 giờ để hồi phục.\n❤️ HP: **0/${currentPlayer?.maxHp ?? 100}**\n⏰ Mở lại <t:${ts}:F> (<t:${ts}:R>).`);
    }
    if (error instanceof Error && error.message === "NO_CARDS") return void await message.reply("⚔️ Bạn chưa có Card để chiến đấu. Hãy dùng `-adventure` và khám phá Card đầu tiên.");
    if (error instanceof Error && error.message === "ADVENTURE_ACTIVE") return void await message.reply("📖 Bạn đang có một Adventure đang chờ lựa chọn. Hãy chọn một đáp án trong 90 giây.");
    if (error instanceof Error && error.message === "NO_ADVENTURES") return void await message.reply("🌙 Hiện chưa có Adventure phù hợp với lịch sử và trạng thái thế giới của bạn.");
    if (error instanceof Error && error.message === "NO_EXPLORATION") return void await message.reply("🧭 Bạn đã dùng hết lượt khám phá. Hãy chờ lượt hồi rồi quay lại.");
    await message.reply("⚠️ Có lỗi xảy ra khi xử lý lệnh.");
  }
});

client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isButton() || !interaction.customId.startsWith("choice:")) return;
  const [, choiceId, ownerId, adventureId] = interaction.customId.split(":");
  if (interaction.user.id !== ownerId) {
    await interaction.reply({ content: "🔒 Đây không phải Adventure của bạn.", flags: MessageFlags.Ephemeral });
    return;
  }
  try {
    const guildId = interaction.guildId ?? "dm";
    await assertCanPlay(interaction.user.id);
    const result = await applyChoice(interaction.user.id, adventureId, choiceId, guildId);
    const discovered = result.discoveredCard
      ? `\n\n🃏 **Một điều kỳ lạ đã được phát hiện.**\n${result.discoveredCard.card.emoji} **${result.discoveredCard.card.name}** — ${result.discoveredCard.card.rarity}\n${result.discoveredCard.card.description}`
      : "";
    const lockTimestamp = result.lockedUntil ? Math.floor(result.lockedUntil.getTime() / 1000) : 0;
    const koText = result.ko
      ? `\n\n💀 **HP của bạn đã về 0.**\n🔒 Toàn bộ cơ chế chơi đã bị khóa trong **12 giờ**.\n⏰ Mở lại <t:${Math.floor(lockTimestamp)}:R>.`
      : `\n\n🧭 **Bạn đã hoàn thành lượt khám phá này.**\nDùng \`-adventure\` khi muốn tiếp tục.`;
    await interaction.update({
      embeds: [new EmbedBuilder().setTitle(result.ko ? "💀 Bạn đã kiệt sức" : "📜 Adventure hoàn tất").setDescription(
        `${result.choice.result}\n\n💰 ${result.choice.coin >= 0 ? "+" : ""}${result.choice.coin} Coin\n❤️ ${result.choice.hp && result.choice.hp >= 0 ? "+" : ""}${result.choice.hp ?? 0} HP\n⭐ +${result.choice.xp ?? 0} XP\n📜 Reputation ${result.choice.reputation >= 0 ? "+" : ""}${result.choice.reputation}${discovered}\n\n⚖️ **Mỗi quyết định đều để lại một cái giá.**${koText}`
      )],
      components: []
    });
  } catch (error) {
    if (!isExpectedGameError(error)) console.error(error);
    const e = error instanceof Error ? error.message : "";
    const msg = e === "ADVENTURE_EXPIRED" ? "⌛ Adventure này đã hết 90 giây. Dùng `-adventure` để khám phá tiếp." :
      e === "NO_EXPLORATION" ? "🧭 Bạn đã dùng hết lượt khám phá. Lượt sẽ hồi dần theo thời gian." :
      e === "ADVENTURE_ALREADY_DONE" ? "📖 Adventure này đã được xử lý rồi." :
      e === "ADVENTURE_NOT_ACTIVE" ? "📖 Adventure này không còn hoạt động." : e.startsWith("GAMEPLAY_LOCKED:") ? `🔒 Bạn đã kiệt sức. Toàn bộ cơ chế chơi đang bị khóa đến <t:${Math.floor(new Date(e.slice("GAMEPLAY_LOCKED:".length)).getTime()/1000)}:R>.` : "⚠️ Có lỗi xảy ra khi xử lý lựa chọn.";
    if (interaction.replied || interaction.deferred) await interaction.followUp({content:msg,ephemeral:true});
    else await interaction.reply({content:msg,ephemeral:true});
  }
});

await client.login(token);
const shutdown = async () => { await db.$disconnect(); process.exit(0); };
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
