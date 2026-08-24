import "dotenv/config";
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, Client, EmbedBuilder, Events, GatewayIntentBits } from "discord.js";
import { db } from "./db.js";
import { seedCards } from "./game/cards.js";
import { createPlayer, getPlayer } from "./game/character.js";
import { FOREST_EVENT, applyChoice } from "./game/choices.js";
import { runForestBattle } from "./game/combat.js";

const token = process.env.DISCORD_TOKEN;
if (!token) throw new Error("Thiếu DISCORD_TOKEN trong .env");

const PREFIX = "-";
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

client.once(Events.ClientReady, async ready => {
  await seedCards();
  console.log(`Logged in as ${ready.user.tag}`);
  console.log(`Prefix: ${PREFIX}`);
});

function helpText() {
  return [
    "🎮 **PQT RPG — Commands**",
    "",
    "`-start` — Bắt đầu hành trình",
    "`-profile` — Xem nhân vật",
    "`-cards` — Xem collection card",
    "`-adventure` — Khám phá và đưa ra lựa chọn",
    "`-battle` — Đánh một trận PvE",
    "`-help` — Xem danh sách lệnh"
  ].join("\n");
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
      return void await message.reply(`🌟 **Hành trình bắt đầu!**\n\n👤 ${player.name}\n❤️ ${player.hp}/${player.maxHp}\n💰 ${player.coin} Coin\n\nBạn đã nhận 3 starter card. Dùng \\`-adventure\\` để bắt đầu.`);
    }

    const player = await getPlayer(id);
    if (!player) return void await message.reply("Bạn chưa có nhân vật. Dùng `-start` trước.");

    if (command === "profile" || command === "me") {
      const embed = new EmbedBuilder().setTitle(`👤 ${player.name}`).setDescription(
        `Level **${player.level}**\n❤️ ${player.hp}/${player.maxHp}\n⚔️ ATK ${player.attack}\n🛡️ DEF ${player.defense}\n💰 ${player.coin} Coin\n⭐ XP ${player.xp}\n📜 Reputation ${player.reputation}`
      );
      return void await message.reply({ embeds: [embed] });
    }

    if (command === "cards" || command === "card") {
      const lines = player.cards.map(pc => `${pc.card.emoji} **${pc.card.name}** — Lv.${pc.level} | Bond ${pc.bond}`);
      return void await message.reply(`🃏 **Collection**\n\n${lines.join("\n")}`);
    }

    if (command === "adventure" || command === "adv") {
      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        ...FOREST_EVENT.choices.map(choice => new ButtonBuilder()
          .setCustomId(`choice:${choice.id}`)
          .setLabel(choice.label)
          .setStyle(choice.id === "search" ? ButtonStyle.Danger : ButtonStyle.Primary))
      );
      return void await message.reply({
        embeds: [new EmbedBuilder().setTitle(FOREST_EVENT.title).setDescription(FOREST_EVENT.description)],
        components: [row]
      });
    }

    if (command === "battle" || command === "fight") {
      const result = await runForestBattle(id);
      const text = result.log.slice(-8).join("\n");
      return void await message.reply(result.won
        ? `🏆 **Victory!**\n\n${text}\n\n🎁 +45 XP\n💰 +75 Coin`
        : `💀 **Bạn đã thất bại.**\n\n${text}\n\n❤️ HP đã được hồi lại.`);
    }

    return void await message.reply(`❓ Không tìm thấy lệnh \`-${command}\`. Dùng \`-help\`.`);
  } catch (error) {
    console.error(error);
    await message.reply("⚠️ Có lỗi xảy ra khi xử lý lệnh.");
  }
});

client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isButton() || !interaction.customId.startsWith("choice:")) return;
  const choiceId = interaction.customId.slice("choice:".length);
  try {
    const result = await applyChoice(interaction.user.id, choiceId);
    await interaction.update({
      embeds: [new EmbedBuilder().setTitle("📜 Lựa chọn đã được ghi lại").setDescription(
        `${result.choice.result}\n\n💰 ${result.choice.coin >= 0 ? "+" : ""}${result.choice.coin} Coin\n📜 Reputation ${result.choice.reputation >= 0 ? "+" : ""}${result.choice.reputation}`
      )],
      components: []
    });
  } catch (error) {
    console.error(error);
    await interaction.reply({ content: error instanceof Error && error.message === "PLAYER_NOT_FOUND" ? "Bạn chưa có nhân vật. Dùng `-start`." : "Có lỗi xảy ra khi xử lý lựa chọn.", ephemeral: true });
  }
});

await client.login(token);

const shutdown = async () => { await db.$disconnect(); process.exit(0); };
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
