require("dotenv").config();
const { Client, GatewayIntentBits, Events } = require("discord.js");
const db = require("./db");
const config = require("./config");
const { addUserXp, addCompanionXp, messageReward, questProgress, checkBadges, stage } = require("./systems");
const { handleCommand } = require("./commands");

if (!process.env.DISCORD_TOKEN) throw new Error("DISCORD_TOKEN is required.");

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

async function milestoneCheck(guild) {
  const unlocked = [];
  for (const m of config.milestones) {
    if (guild.totalInteractions >= m.target && !guild.milestones.includes(m.id)) {
      guild.milestones.push(m.id); unlocked.push(m);
    }
  }
  return unlocked;
}

client.once(Events.ClientReady, c => console.log(`Nexo V2 online as ${c.user.tag}`));

client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;
  try { await handleCommand(interaction); }
  catch (err) {
    console.error(err);
    const payload = { content: "Nexo gặp lỗi khi xử lý lệnh.", ephemeral: true };
    if (interaction.replied || interaction.deferred) await interaction.followUp(payload); else await interaction.reply(payload);
  }
});

client.on(Events.MessageCreate, async message => {
  if (!message.guild || message.author.bot || message.content.trim().length < 2) return;
  try {
    const guild = await db.getGuild(message.guild.id, config);
    const user = await db.getUser(message.guild.id, message.author.id);
    const reward = messageReward(user);
    if (!reward) return;
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
  await client.login(process.env.DISCORD_TOKEN);
})();
