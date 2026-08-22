require("dotenv").config();
const { Client, GatewayIntentBits, Events } = require("discord.js");
const db = require("./db");
const config = require("./config");
const { addUserXp, addCompanionXp, messageReward, questProgress, checkBadges } = require("./systems");
const { handleCommand } = require("./commands");
const { provisionGuildEmoji } = require("./emoji-provisioner");
const { activateGuildEmoji } = require("./emoji");
const { helpEmbed } = require("./commands");

if (!process.env.DISCORD_TOKEN) throw new Error("DISCORD_TOKEN is required.");

// Intents are intentionally minimal for Nexo V2.1.
// - Guilds: slash-command interactions and guild context
// - GuildMessages: receive message events in guild channels
// - MessageContent: required because Nexo awards XP from normal message content
// NOTE: Message Content is a privileged intent and must be enabled in the
// Discord Developer Portal -> Bot -> Privileged Gateway Intents.
const NEXO_INTENTS = [
  GatewayIntentBits.Guilds,
  GatewayIntentBits.GuildMessages,
  GatewayIntentBits.MessageContent
];

const client = new Client({ intents: NEXO_INTENTS });

async function sendOnboarding(guild) {
  const target = guild.systemChannel || guild.channels.cache.find(ch => ch.isTextBased() && ch.permissionsFor(guild.members.me)?.has("SendMessages"));
  if (!target) return false;
  await target.send({ embeds: [helpEmbed()] });
  return true;
}

async function milestoneCheck(guild) {
  const unlocked = [];
  for (const m of config.milestones) {
    if (guild.totalInteractions >= m.target && !guild.milestones.includes(m.id)) {
      guild.milestones.push(m.id); unlocked.push(m);
    }
  }
  return unlocked;
}

client.once(Events.ClientReady, c => {
  console.log(`Nexo V2.4 online as ${c.user.tag}`);
  console.log(`Gateway intents: ${NEXO_INTENTS.join(", ")}`);
  console.log(`Connected to ${c.guilds.cache.size} server(s).`);
  for (const guild of c.guilds.cache.values()) {
    provisionGuildEmoji(guild).catch(err => console.error(`[EMOJI] Provision failed for ${guild.id}`, err));
  }
});

client.on(Events.Error, err => console.error("[DISCORD CLIENT]", err));
client.on(Events.Warn, warning => console.warn("[DISCORD WARN]", warning));

client.on(Events.GuildCreate, async guild => {
  try {
    const record = await db.getGuild(guild.id, config);
    await provisionGuildEmoji(guild);
    if (!record.onboardingSent) {
      record.onboardingSent = await sendOnboarding(guild);
      await db.saveGuild(record);
    }
    console.log(`[SERVER JOINED] ${guild.name} (${guild.id})`);
  } catch (err) {
    console.error(`[SERVER INIT FAILED] ${guild.id}`, err);
  }
});

client.on(Events.GuildDelete, guild => {
  console.log(`[SERVER LEFT] ${guild.name} (${guild.id}) - data retained.`);
});

client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;
  try {
    activateGuildEmoji(interaction.guildId, config);
    await handleCommand(interaction);
  }
  catch (err) {
    console.error(err);
    const payload = { content: "Nexo gặp lỗi khi xử lý lệnh.", ephemeral: true };
    if (interaction.replied || interaction.deferred) await interaction.followUp(payload); else await interaction.reply(payload);
  }
});

client.on(Events.MessageCreate, async message => {
  if (!message.guild || message.author.bot || message.content.trim().length < 2) return;
  try {
    activateGuildEmoji(message.guild.id, config);
    const guild = await db.getGuild(message.guild.id, config);
    const user = await db.getUser(message.guild.id, message.author.id);
    if (!guild.settings.xpEnabled) return;
    const reward = messageReward(user, message.content, guild.settings);
    if (!reward) { await db.saveUser(user); return; }
    addUserXp(user, reward);
    addCompanionXp(guild, Math.max(1, Math.floor(reward / 2)));
    guild.totalInteractions += 1;
    questProgress(user, "chat");
    const badges = checkBadges(user, guild);
    const milestones = await milestoneCheck(guild);
    if (milestones.length) {
      for (const m of milestones) await db.addMemory(guild.id, { title: m.name, text: m.description, icon: m.icon, createdAt: Date.now() });
    }
    await db.saveUser(user); await db.saveGuild(guild);
    if (badges.length) console.log(`[BADGE] ${message.author.tag}: ${badges.map(b => b.name).join(", ")}`);
    if (milestones.length) console.log(`[MILESTONE] ${guild.id}: ${milestones.map(m => m.name).join(", ")}`);
  } catch (err) { console.error("message handler error", err); }
});

async function shutdown(signal) {
  console.log(`${signal}: shutting down Nexo...`);
  client.destroy();
  await db.close();
  process.exit(0);
}
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

(async () => {
  await db.init();
  console.log(`Persistence: ${db.hasPostgres ? "PostgreSQL" : "JSON fallback"}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
  await db.backup("startup").catch(err => console.error("[BACKUP] startup failed", err));
  setInterval(() => db.backup("scheduled").catch(err => console.error("[BACKUP] scheduled failed", err)), 6 * 60 * 60 * 1000).unref();
  await client.login(process.env.DISCORD_TOKEN);
})();
