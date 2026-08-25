import "dotenv/config";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Client,
  EmbedBuilder,
  Events,
  GatewayIntentBits
} from "discord.js";
import { db } from "./db.js";
import { seedCards } from "./game/cards.js";
import { buyCard, createPlayer, getPlayer, setDeckSlot } from "./game/character.js";
import { FOREST_EVENT, applyChoice, getWorldState } from "./game/choices.js";
import { runForestBattle } from "./game/combat.js";

const token = process.env.DISCORD_TOKEN;
if (!token) throw new Error("Thiếu DISCORD_TOKEN trong .env");

const PREFIX = "-";
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

client.once(Events.ClientReady, async ready => {
  await seedCards();
  console.log(`Logged in as ${ready.user.tag}`);
  console.log(`Prefix: ${PREFIX}`);
});

function helpText() {
  return [
    "🎮 **PQT RPG V2**",
    "",
    "`-start` — Bắt đầu hành trình",
    "`-profile` — Xem nhân vật",
    "`-cards` — Xem collection + tiến trình card",
    "`-deck` — Xem deck hiện tại",
    "`-deck set <cardId> <slot>` — Đặt card vào slot 1-3",
    "`-shop` — Xem card có thể mua",
    "`-buy <cardId>` — Mua card bằng Coin",
    "`-adventure` — Khám phá và đưa ra lựa chọn",
    "`-world` — Xem trạng thái khu vực của server",
    "`-battle` — Đánh PvE",
    "`-help` — Xem danh sách lệnh",
    "",
    "🔒 Button Adventure chỉ người tạo event mới dùng được."
  ].join("\n");
}

function errorText(error: unknown) {
  if (!(error instanceof Error)) return "⚠️ Có lỗi xảy ra.";
  const messages: Record<string, string> = {
    PLAYER_NOT_FOUND: "Bạn chưa có nhân vật. Dùng `-start`.",
    INVALID_SLOT: "Slot phải là số 1, 2 hoặc 3.",
    CARD_NOT_OWNED: "Bạn chưa sở hữu card này.",
    CARD_NOT_FOUND: "Không tìm thấy card.",
    CARD_NOT_FOR_SALE: "Card này không bán trong shop.",
    NOT_ENOUGH_COIN: "Bạn không đủ Coin.",
    ALREADY_OWNED: "Bạn đã sở hữu card này rồi.",
    EMPTY_DECK: "Deck đang trống. Dùng `-deck set <cardId> <slot>` trước.",
    INVALID_SESSION: "Event này không còn hợp lệ.",
    CHOICE_ALREADY_USED: "Lựa chọn này đã được xử lý rồi.",
    INVALID_CHOICE: "Lựa chọn không hợp lệ."
  };
  return messages[error.message] ?? "⚠️ Có lỗi xảy ra khi xử lý lệnh.";
}

client.on(Events.MessageCreate, async message => {
  if (message.author.bot || !message.content.startsWith(PREFIX)) return;

  const args = message.content.slice(PREFIX.length).trim().split(/\s+/);
  const command = (args.shift() ?? "").toLowerCase();
  const id = message.author.id;
  if (!command) return;

  try {
    if (command === "help" || command === "h") {
      await message.reply(helpText());
      return;
    }

    if (command === "start") {
      const existing = await getPlayer(id);
      if (existing) {
        await message.reply("Bạn đã bắt đầu hành trình rồi. Dùng `-profile` để xem nhân vật.");
        return;
      }
      const player = await createPlayer(id, message.author.username);
      await message.reply(
        `🌟 **Hành trình bắt đầu!**\n\n👤 ${player.name}\n❤️ ${player.hp}/${player.maxHp}\n💰 ${player.coin} Coin\n\n` +
        `Bạn đã nhận 3 starter card. Dùng \`-deck\` để kiểm tra deck và \`-adventure\` để bắt đầu.`
      );
      return;
    }

    const player = await getPlayer(id);
    if (!player) {
      await message.reply("Bạn chưa có nhân vật. Dùng `-start` trước.");
      return;
    }

    if (command === "profile" || command === "me") {
      const embed = new EmbedBuilder()
        .setTitle(`👤 ${player.name}`)
        .setDescription(
          `Level **${player.level}**\n` +
          `❤️ ${player.hp}/${player.maxHp}\n` +
          `⚔️ ATK ${player.attack}\n` +
          `🛡️ DEF ${player.defense}\n` +
          `💰 ${player.coin} Coin\n` +
          `⭐ XP ${player.xp}\n` +
          `📜 Reputation ${player.reputation}`
        );
      await message.reply({ embeds: [embed] });
      return;
    }

    if (command === "cards" || command === "card") {
      const lines = player.cards.map(pc => {
        const deck = pc.deckSlot ? ` • Deck ${pc.deckSlot}` : "";
        return `${pc.card.emoji} **${pc.card.name}** [${pc.card.rarity}] — Lv.${pc.level} | Bond ${pc.bond} | Battles ${pc.battles}${deck}`;
      });
      await message.reply(`🃏 **Collection**\n\n${lines.join("\n")}`);
      return;
    }

    if (command === "deck") {
      if (args[0]?.toLowerCase() === "set") {
        const cardId = args[1];
        const slot = Number(args[2]);
        if (!cardId || !Number.isInteger(slot)) {
          await message.reply("Dùng: `-deck set <cardId> <slot 1-3>`");
          return;
        }
        await setDeckSlot(id, cardId, slot);
        await message.reply(`✅ Đã đặt **${cardId}** vào Deck slot **${slot}**.`);
        return;
      }

      const deck = player.cards.filter(pc => pc.deckSlot !== null).sort((a, b) => (a.deckSlot ?? 99) - (b.deckSlot ?? 99));
      const slots = [1, 2, 3].map(slot => {
        const card = deck.find(pc => pc.deckSlot === slot);
        return card ? `**${slot}.** ${card.card.emoji} ${card.card.name} (Lv.${card.level})` : `**${slot}.** — trống`;
      });
      await message.reply(`⚔️ **Deck**\n\n${slots.join("\n")}\n\nĐổi deck: \`-deck set <cardId> <slot>\``);
      return;
    }

    if (command === "shop") {
      const cards = await db.card.findMany({ where: { price: { gt: 0 } }, orderBy: { price: "asc" } });
      const lines = cards.map(card => `${card.emoji} **${card.name}** — ${card.rarity} — 💰 ${card.price} — \`${card.id}\``);
      await message.reply(`🛒 **Card Shop**\n\n${lines.join("\n")}\n\nMua bằng: \`-buy <cardId>\``);
      return;
    }

    if (command === "buy") {
      const cardId = args[0];
      if (!cardId) {
        await message.reply("Dùng: `-buy <cardId>`");
        return;
      }
      await buyCard(id, cardId);
      const bought = await db.card.findUnique({ where: { id: cardId } });
      await message.reply(`🃏 Đã mua **${bought?.emoji ?? ""} ${bought?.name ?? cardId}**. Dùng \`-cards\` để xem.`);
      return;
    }

    if (command === "adventure" || command === "adv") {
      const sent = await message.reply({
        embeds: [new EmbedBuilder().setTitle(FOREST_EVENT.title).setDescription(FOREST_EVENT.description)],
        components: [
          new ActionRowBuilder<ButtonBuilder>().addComponents(
            ...FOREST_EVENT.choices.map(choice =>
              new ButtonBuilder()
                .setCustomId(`choice:${message.id}:${choice.id}`)
                .setLabel(choice.label)
                .setStyle(choice.id === "search" ? ButtonStyle.Danger : ButtonStyle.Primary)
            )
          )
        ]
      });

      await db.adventureSession.create({
        data: { messageId: sent.id, playerId: player.id, guildId: message.guildId, eventId: FOREST_EVENT.id }
      });
      return;
    }

    if (command === "world") {
      if (!message.guildId) {
        await message.reply("World State chỉ hoạt động trong server.");
        return;
      }
      const world = await getWorldState(message.guildId);
      await message.reply(
        `🌍 **Forest World State**\n\n` +
        `🤝 Trust: **${world.forestTrust}**\n` +
        `⚠️ Danger: **${world.forestDanger}**\n` +
        `🗣️ Rumor: **${world.forestRumor}**\n` +
        `🗺️ Secret Path: **${world.discoveredPath ? "Đã mở" : "Chưa mở"}**`
      );
      return;
    }

    if (command === "battle" || command === "fight") {
      const result = await runForestBattle(id, message.guildId);
      const text = result.log.slice(-8).join("\n");
      if (result.won) {
        await message.reply(`🏆 **Victory!**\n\n${text}\n\n🎁 +45 XP\n💰 +75 Coin\n🧬 Các card trong deck đã nhận Battle/Bond progress.`);
      } else {
        await message.reply(`💀 **Bạn đã thất bại.**\n\n${text}\n\n❤️ HP đã được hồi lại.\n🧬 Các card trong deck vẫn ghi nhận Battle/Bond progress.`);
      }
      return;
    }

    await message.reply(`❓ Không tìm thấy lệnh \`-${command}\`. Dùng \`-help\`.`);
  } catch (error) {
    console.error(error);
    await message.reply(errorText(error));
  }
});

client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isButton() || !interaction.customId.startsWith("choice:")) return;

  const [, messageId, choiceId] = interaction.customId.split(":");
  const session = await db.adventureSession.findUnique({ where: { messageId } });

  if (!session) {
    await interaction.reply({ content: "⚠️ Event không còn tồn tại.", ephemeral: true });
    return;
  }

  if (session.resolved) {
    await interaction.reply({ content: "⚠️ Event này đã được chọn rồi.", ephemeral: true });
    return;
  }

  const player = await db.player.findUnique({ where: { id: session.playerId } });
  if (!player || player.discordId !== interaction.user.id) {
    await interaction.reply({ content: "🔒 Đây không phải Adventure của bạn.", ephemeral: true });
    return;
  }

  try {
    const result = await applyChoice(interaction.user.id, interaction.guildId, choiceId, messageId);
    const worldText = result.world
      ? `\n\n🌍 World: Trust ${result.world.forestTrust >= 0 ? "+" : ""}${result.world.forestTrust} | Danger ${result.world.forestDanger} | Rumor ${result.world.forestRumor}`
      : "";

    await interaction.update({
      embeds: [new EmbedBuilder().setTitle("📜 Lựa chọn đã được ghi lại").setDescription(
        `${result.choice.result}\n\n` +
        `💰 ${result.choice.coin >= 0 ? "+" : ""}${result.choice.coin} Coin\n` +
        `📜 Reputation ${result.choice.reputation >= 0 ? "+" : ""}${result.choice.reputation}` +
        worldText +
        (result.discoveredPath ? "\n\n🗺️ **Một con đường bí mật đã được phát hiện!**" : "")
      )],
      components: []
    });
  } catch (error) {
    console.error(error);
    await interaction.reply({ content: errorText(error), ephemeral: true });
  }
});

await client.login(token);

const shutdown = async () => {
  await db.$disconnect();
  process.exit(0);
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
