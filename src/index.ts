import "dotenv/config";
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, Client, EmbedBuilder, Events, GatewayIntentBits } from "discord.js";
import { db } from "./db.js";
import { seedCards } from "./game/cards.js";
import { createPlayer, getPlayer } from "./game/character.js";
import { ADVENTURES, applyChoice, getAdventureForPlayer } from "./game/choices.js";
import { runForestBattle } from "./game/combat.js";

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
  console.log("PQT RPG V2.5 — Dynamic World / Identity / Discovery");
});

function helpText() {
  return [
    "🎮 **PQT RPG — V2.5**",
    "",
    "`-start` — Bắt đầu hành trình (không nhận card)",
    "`-profile` — Xem nhân vật và tính cách hình thành",
    "`-cards` — Xem collection card đã khám phá",
    "`-adventure` — Khám phá thế giới và lựa chọn",
    "`-world` — Xem trạng thái thế giới",
    "`-battle` — Chiến đấu PvE",
    "`-help` — Xem danh sách lệnh"
  ].join("\n");
}

function clamp(n: number) { return Math.max(0, Math.min(100, n)); }

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
      const embed = new EmbedBuilder().setTitle(`👤 ${player.name}`).setDescription(
        `Level **${player.level}**\n❤️ ${player.hp}/${player.maxHp}\n⚔️ ATK ${player.attack}\n🛡️ DEF ${player.defense}\n💰 ${player.coin} Coin\n⭐ XP ${player.xp}\n📜 Reputation ${player.reputation}\n\n🧠 **Identity:** ${identity(player)}\n❤️ Compassion: ${player.compassion}\n🩸 Ruthlessness: ${player.ruthlessness}\n🔮 Curiosity: ${player.curiosity}\n📚 Knowledge: ${player.knowledge}`
      );
      return void await message.reply({ embeds: [embed] });
    }

    if (command === "cards" || command === "card") {
      if (!player.cards.length) return void await message.reply("🃏 **Collection trống.**\n\nBạn chưa khám phá được Card nào. Dùng `-adventure`.");
      const lines = player.cards.map(pc => `${pc.card.emoji} **${pc.card.name}** — ${pc.card.rarity} | Lv.${pc.level} | Bond ${pc.bond} | Battles ${pc.battles}`);
      return void await message.reply(`🃏 **Collection — ${player.cards.length} Card**\n\n${lines.join("\n")}`);
    }

    if (command === "world") {
      const world = await db.worldState.upsert({ where: { guildId: message.guildId ?? "dm" }, create: { guildId: message.guildId ?? "dm" }, update: {} });
      const danger = "█".repeat(Math.round(world.forestDanger / 10)) + "░".repeat(10 - Math.round(world.forestDanger / 10));
      const trust = "█".repeat(Math.round(world.forestTrust / 10)) + "░".repeat(10 - Math.round(world.forestTrust / 10));
      return void await message.reply({ embeds: [new EmbedBuilder().setTitle("🌍 Thế giới hiện tại").setDescription(
        `🌲 **Forest Danger** ${danger} ${world.forestDanger}/100\n` +
        `🤝 **Forest Trust** ${trust} ${world.forestTrust}/100\n\n` +
        `${world.forestDanger >= 70 ? "🌑 Trăng Máu đang đến gần." : world.forestDanger >= 40 ? "⚠️ Những dấu hiệu bất thường đang tăng." : "🌿 Khu rừng tương đối yên bình."}\n\n` +
        `👁️ Đây chỉ là trạng thái thế giới. Dùng \`-adventure\` để thay đổi nó.`
      )] });
    }

    if (command === "adventure" || command === "adv") {
      const adventure = await getAdventureForPlayer(id, message.guildId ?? "dm");
      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        ...adventure.choices.map(choice => new ButtonBuilder()
          .setCustomId(`choice:${choice.id}:${id}:${adventure.id}`)
          .setLabel(choice.label)
          .setStyle(choice.id === "search" || choice.id === "kill" ? ButtonStyle.Danger : ButtonStyle.Primary))
      );
      return void await message.reply({
        embeds: [new EmbedBuilder().setTitle(adventure.title).setDescription(adventure.description)],
        components: [row]
      });
    }

    if (command === "battle" || command === "fight") {
      const result = await runForestBattle(id);
      const text = result.log.slice(-8).join("\n");
      return void await message.reply(result.won
        ? `🏆 **Victory!**\n\n${text}\n\n🎁 +45 XP\n💰 +75 Coin\n🃏 Các Card tham chiến đã nhận Bond và Battle progress.`
        : `💀 **Bạn đã thất bại.**\n\n${text}\n\n❤️ HP đã được hồi lại.`);
    }

    return void await message.reply(`❓ Không tìm thấy lệnh \`-${command}\`. Dùng \`-help\`.`);
  } catch (error) {
    console.error(error);
    if (error instanceof Error && error.message === "NO_CARDS") return void await message.reply("⚔️ Bạn chưa có Card để chiến đấu. Hãy dùng `-adventure` và khám phá Card đầu tiên.");
    await message.reply("⚠️ Có lỗi xảy ra khi xử lý lệnh.");
  }
});

client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isButton() || !interaction.customId.startsWith("choice:")) return;
  const [, choiceId, ownerId, adventureId] = interaction.customId.split(":");

  if (interaction.user.id !== ownerId) {
    await interaction.reply({ content: "🔒 Đây không phải Adventure của bạn.", ephemeral: true });
    return;
  }

  try {
    const result = await applyChoice(interaction.user.id, adventureId, choiceId, interaction.guildId ?? "dm");
    const discovered = result.discoveredCard ? `\n\n🃏 **CARD DISCOVERED!**\n${result.discoveredCard.card.emoji} **${result.discoveredCard.card.name}** — ${result.discoveredCard.card.rarity}\n${result.discoveredCard.card.description}` : "";
    await interaction.update({
      embeds: [new EmbedBuilder().setTitle("📜 Lựa chọn đã được ghi lại").setDescription(
        `${result.choice.result}\n\n💰 ${result.choice.coin >= 0 ? "+" : ""}${result.choice.coin} Coin\n📜 Reputation ${result.choice.reputation >= 0 ? "+" : ""}${result.choice.reputation}${discovered}`
      )],
      components: []
    });
  } catch (error) {
    console.error(error);
    const msg = error instanceof Error && error.message === "PLAYER_NOT_FOUND"
      ? "Bạn chưa có nhân vật. Dùng `-start`."
      : error instanceof Error && error.message === "ADVENTURE_ALREADY_DONE"
        ? "📖 Bạn đã hoàn thành Adventure này rồi."
        : "Có lỗi xảy ra khi xử lý lựa chọn.";
    await interaction.reply({ content: msg, ephemeral: true });
  }
});

await client.login(token);
const shutdown = async () => { await db.$disconnect(); process.exit(0); };
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
