const config = require("./config");

function xpNeeded(level) { return 100 + ((level - 1) * 50); }

function addUserXp(user, amount) {
  user.xp += Math.max(0, amount);
  let levels = 0;
  while (user.xp >= xpNeeded(user.level)) { user.xp -= xpNeeded(user.level); user.level += 1; levels++; }
  return levels;
}

function addCompanionXp(guild, amount) {
  guild.companion.xp += Math.max(0, amount);
  guild.totalXp += Math.max(0, amount);
  let levels = 0;
  while (guild.companion.xp >= xpNeeded(guild.companion.level)) { guild.companion.xp -= xpNeeded(guild.companion.level); guild.companion.level += 1; levels++; }
  guild.companion.stageId = [...config.companion.stages].reverse().find(s => guild.companion.level >= s.minLevel).id;
  return levels;
}

function messageReward(user, content = "") {
  const now = Date.now();
  const normalized = content.trim().toLowerCase().replace(/\s+/g, " ");
  const recent = user.xpAntiSpam || { recentHashes: [], recentMessages: [], lastRewardAt: 0 };
  user.xpAntiSpam = recent;

  // Hard cooldown: keeps XP farming predictable and cheap.
  if (now - (user.lastMessageXp || 0) < config.xp.messageCooldownMs) return 0;

  // Ignore obvious repeated messages. Keep a short rolling fingerprint window.
  if (normalized && recent.recentHashes.includes(normalized)) return 0;
  if (normalized) {
    recent.recentHashes.push(normalized);
    recent.recentHashes = recent.recentHashes.slice(-config.xp.antiSpam.repeatWindow);
  }

  // Burst protection: too many messages in a short window should not become a farm.
  recent.recentMessages = recent.recentMessages.filter(t => now - t < config.xp.antiSpam.burstWindowMs);
  recent.recentMessages.push(now);
  if (recent.recentMessages.length > config.xp.antiSpam.maxMessagesInBurst) return 0;

  // Very low-information spam gets no XP.
  const compact = normalized.replace(/[^\p{L}\p{N}]+/gu, "");
  if (compact.length < config.xp.antiSpam.minMeaningfulChars) return 0;

  user.lastMessageXp = now;
  recent.lastRewardAt = now;
  return Math.floor(Math.random() * (config.xp.messageMax - config.xp.messageMin + 1)) + config.xp.messageMin;
}

function today() { return new Date().toISOString().slice(0, 10); }
function ensureQuest(user) {
  const d = today();
  if (user.quest.date !== d) { user.quest.date = d; user.quest.progress = {}; user.quest.claimed = {}; }
  for (const q of config.quests) if (user.quest.progress[q.id] == null) user.quest.progress[q.id] = 0;
}
function questProgress(user, type, amount = 1) {
  ensureQuest(user);
  for (const q of config.quests.filter(q => q.type === type)) user.quest.progress[q.id] = Math.min(q.target, user.quest.progress[q.id] + amount);
}
function awardBadge(user, id) {
  if (user.badges.includes(id)) return null;
  const b = config.badges.find(x => x.id === id);
  if (!b) return null;
  user.badges.push(id); return b;
}
function checkBadges(user, guild) {
  const out = [];
  const maybe = [
    user.badges.length === 0 ? "first-contact" : null,
    user.level >= 5 ? "level-5" : null,
    user.level >= 10 ? "level-10" : null,
    user.daily.streak >= 7 ? "daily-7" : null,
    guild.totalInteractions >= 100 ? "server-100" : null
  ].filter(Boolean);
  for (const id of maybe) { const b = awardBadge(user, id); if (b) out.push(b); }
  return out;
}
function stage(guild) { return config.companion.stages.find(s => s.id === guild.companion.stageId) || config.companion.stages[0]; }

module.exports = { xpNeeded, addUserXp, addCompanionXp, messageReward, today, ensureQuest, questProgress, checkBadges, stage };
