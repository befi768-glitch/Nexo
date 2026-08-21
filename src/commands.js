const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require("discord.js");
const config = require("./config");
const db = require("./db");
const { xpNeeded, addUserXp, addCompanionXp, ensureQuest, questProgress, checkBadges, stage, today } = require("./systems");
const { emoji } = require("./emoji");

const builders = [
  new SlashCommandBuilder().setName("companion").setDescription("Xem Nexo và tiến hóa hiện tại."),
  new SlashCommandBuilder().setName("profile").setDescription("Xem hồ sơ thành viên.").addUserOption(o => o.setName("user").setDescription("Thành viên cần xem").setRequired(false)),
  new SlashCommandBuilder().setName("quest").setDescription("Xem hoặc nhận thưởng quest.").addSubcommand(s => s.setName("list").setDescription("Xem quest hôm nay")).addSubcommand(s => s.setName("claim").setDescription("Nhận thưởng các quest đã hoàn thành")),
  new SlashCommandBuilder().setName("badges").setDescription("Xem bộ sưu tập huy hiệu."),
  new SlashCommandBuilder().setName("progress").setDescription("Xem tiến trình của server."),
  new SlashCommandBuilder().setName("memory").setDescription("Xem ký ức gần đây của server."),
  new SlashCommandBuilder().setName("daily").setDescription("Nhận phần thưởng hằng ngày."),
  new SlashCommandBuilder().setName("rename").setDescription("Đổi tên Nexo.").addStringOption(o => o.setName("name").setDescription("Tên mới").setMinLength(2).setMaxLength(24).setRequired(true)).setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
].map(x => x.toJSON());

function profileEmbed(member, user) {
  const badges = user.badges.length ? user.badges.map(id => { const b = config.badges.find(x => x.id === id); return b ? `${b.icon} ${b.name}` : id; }).join(" • ") : "Chưa có huy hiệu";
  return new EmbedBuilder().setTitle(`${emoji.profile()} ${member.displayName}`).setDescription("Hồ sơ Nexo của thành viên").addFields(
    { name: `${emoji.xp()} Level`, value: String(user.level), inline: true },
    { name: `${emoji.glow()} XP`, value: `${user.xp}/${xpNeeded(user.level)}`, inline: true },
    { name: `${emoji.streak()} Streak`, value: `${user.daily.streak} ngày`, inline: true },
    { name: `${emoji.badge()} Huy hiệu`, value: badges }
  ).setColor(0x63c5da);
}

async function handle(interaction) {
  const guildId = interaction.guildId;
  if (!guildId) return interaction.reply({ content: "Lệnh này chỉ dùng trong server.", ephemeral: true });
  const guild = await db.getGuild(guildId, config);
  const user = await db.getUser(guildId, interaction.user.id);

  if (interaction.commandName === "companion") {
    const s = stage(guild);
    return interaction.reply({ embeds: [new EmbedBuilder().setTitle(`${s.icon} ${guild.companion.name}`).setDescription(s.description).addFields(
      { name: `${emoji.xp()} Level`, value: String(guild.companion.level), inline: true },
      { name: `${emoji.glow()} XP`, value: `${guild.companion.xp}/${xpNeeded(guild.companion.level)}`, inline: true },
      { name: `${emoji.seed()} Stage`, value: s.name, inline: true },
      { name: `${emoji.chat()} Interactions`, value: String(guild.totalInteractions), inline: true }
    ).setColor(0x63c5da)] });
  }

  if (interaction.commandName === "profile") {
    questProgress(user, "profile");
    const target = interaction.options.getMember("user") || interaction.member;
    const targetUser = await db.getUser(guildId, target.id);
    const badges = checkBadges(targetUser, guild);
    await db.saveUser(targetUser); await db.saveGuild(guild);
    return interaction.reply({ content: badges.length ? `${emoji.badge()} Mở khóa: ${badges.map(b => `${b.icon} ${b.name}`).join(", ")}` : undefined, embeds: [profileEmbed(target, targetUser)] });
  }

  if (interaction.commandName === "quest") {
    ensureQuest(user);
    const sub = interaction.options.getSubcommand();
    if (sub === "claim") {
      let total = 0, claimed = [];
      for (const q of config.quests) {
        if (user.quest.progress[q.id] >= q.target && !user.quest.claimed[q.id]) {
          user.quest.claimed[q.id] = true; total += q.reward; claimed.push(q.name);
        }
      }
      if (!total) return interaction.reply({ content: "Chưa có quest nào đủ điều kiện nhận thưởng.", ephemeral: true });
      const levels = addUserXp(user, total); addCompanionXp(guild, Math.floor(total / 2));
      const badges = checkBadges(user, guild);
      await db.saveUser(user); await db.saveGuild(guild);
      return interaction.reply({ content: `${emoji.reward()} Nhận **${total} XP** từ: ${claimed.join(", ")}${levels ? `\n${emoji.xp()} Bạn lên ${user.level}!` : ""}${badges.length ? `\n${emoji.badge()} ${badges.map(b => `${b.icon} ${b.name}`).join(", ")}` : ""}` });
    }
    const lines = config.quests.map(q => `${user.quest.progress[q.id] >= q.target ? emoji.check() : emoji.empty()} **${q.name}** — ${user.quest.progress[q.id]}/${q.target} — +${q.reward} XP\n└ ${q.description}`);
    await db.saveUser(user);
    return interaction.reply({ embeds: [new EmbedBuilder().setTitle(`${emoji.quest()} Daily Quests`).setDescription(lines.join("\n\n")).setFooter({ text: "Dùng /quest claim khi quest hoàn thành." }).setColor(0x8ad6b8)] });
  }

  if (interaction.commandName === "badges") {
    const lines = config.badges.map(b => `${user.badges.includes(b.id) ? emoji.badge() : emoji.locked()} ${b.icon} **${b.name}** — ${b.description}`);
    return interaction.reply({ embeds: [new EmbedBuilder().setTitle(`${emoji.badge()} Nexo Badges`).setDescription(lines.join("\n")).setColor(0xf2c94c)] });
  }

  if (interaction.commandName === "progress") {
    const unlocked = config.milestones.filter(m => guild.milestones.includes(m.id)).map(m => `${m.icon} ${m.name}`).join(" • ") || "Chưa có milestone";
    return interaction.reply({ embeds: [new EmbedBuilder().setTitle(`${emoji.progress()} Server Progress`).addFields(
      { name: `${emoji.companion()} Nexo`, value: `${guild.companion.name} — Level ${guild.companion.level}`, inline: true },
      { name: `${emoji.glow()} Tổng XP`, value: String(guild.totalXp), inline: true },
      { name: `${emoji.chat()} Interactions`, value: String(guild.totalInteractions), inline: true },
      { name: `${emoji.milestone()} Milestones`, value: unlocked }
    ).setColor(0x63c5da)] });
  }

  if (interaction.commandName === "memory") {
    const memories = await db.getMemories(guildId, 8);
    const desc = memories.length ? memories.map(m => `${m.icon || emoji.memory()} **${m.title}**\n${m.text}`).join("\n\n") : "Server chưa có ký ức nào.";
    return interaction.reply({ embeds: [new EmbedBuilder().setTitle(`${emoji.memory()} Nexo Memory`).setDescription(desc).setColor(0x8c7ae6)] });
  }

  if (interaction.commandName === "daily") {
    const now = Date.now(), day = 86_400_000;
    if (now - user.daily.lastClaim < day) {
      const hours = Math.ceil((day - (now - user.daily.lastClaim)) / 3_600_000);
      return interaction.reply({ content: `${emoji.wait()} Bạn đã điểm danh hôm nay. Quay lại sau khoảng ${hours} giờ.`, ephemeral: true });
    }
    const yesterday = user.daily.lastClaim && now - user.daily.lastClaim < day * 2;
    user.daily.streak = yesterday ? user.daily.streak + 1 : 1;
    user.daily.lastClaim = now;
    addUserXp(user, config.xp.daily); addCompanionXp(guild, Math.floor(config.xp.daily / 2));
    questProgress(user, "daily");
    const badges = checkBadges(user, guild);
    await db.saveUser(user); await db.saveGuild(guild);
    return interaction.reply({ content: `${emoji.sun()} Điểm danh thành công! **+${config.xp.daily} XP** • Streak: **${user.daily.streak}**${badges.length ? `\n${emoji.badge()} ${badges.map(b => `${b.icon} ${b.name}`).join(", ")}` : ""}` });
  }

  if (interaction.commandName === "rename") {
    const name = interaction.options.getString("name", true).trim();
    if (!interaction.memberPermissions.has(PermissionFlagsBits.ManageGuild)) return interaction.reply({ content: "Bạn cần quyền Manage Server.", ephemeral: true });
    guild.companion.name = name;
    await db.saveGuild(guild);
    await db.addMemory(guildId, { title: "Nexo đổi tên", text: `Companion đã được đổi tên thành **${name}**.`, icon: emoji.glow(), createdAt: Date.now() });
    return interaction.reply({ content: `${emoji.glow()} Nexo giờ có tên **${name}**.` });
  }
}

module.exports = { commandBuilders: builders, handleCommand: handle };
