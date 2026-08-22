/**
 * Nexo's branded image-emoji registry.
 *
 * Every logical emoji maps to a dedicated Nexo asset. The provisioner uploads
 * these as `nexo_<name>` so Nexo never collides with a server's unrelated emoji.
 * Environment IDs remain supported for deployments that provision manually.
 */
const guildEmojiMaps = new Map();
let activeGuildId = null;

function customEmoji(name, fallback) {
  const id = guildEmojiMaps.get(activeGuildId)?.[name]
    || process.env[`NEXO_EMOJI_${name.toUpperCase()}_ID`];
  return id ? `<:nexo_${name}:${id}>` : fallback;
}

function setGuildEmojiMap(guildId, emojiIds) {
  guildEmojiMaps.set(guildId, emojiIds);
  activeGuildId = guildId;
}

function activateGuildEmoji(guildId, config) {
  activeGuildId = guildId;
  if (!config) return;
  config.companion.stages.forEach(stage => { stage.icon = emoji[stage.id === "companion" ? "companion" : stage.id](); });
  config.badges.forEach(badge => { badge.icon = emoji[badge.id === "first-contact" ? "spark" : badge.id === "level-5" ? "leaf" : badge.id === "level-10" ? "guardian" : badge.id === "daily-7" ? "streak" : "milestone"](); });
  config.milestones.forEach(milestone => { milestone.icon = emoji[milestone.id === "interactions-500" ? "leaf" : milestone.id === "interactions-1000" ? "guardian" : "milestone"](); });
}

const emoji = {
  spark: () => customEmoji("spark", "✦"),
  glow: () => customEmoji("glow", "◉"),
  guardian: () => customEmoji("guardian", "⬡"),
  astral: () => customEmoji("astral", "✧"),
  profile: () => customEmoji("profile", "◌"),
  xp: () => customEmoji("xp", "✦"),
  streak: () => customEmoji("streak", "∿"),
  badge: () => customEmoji("badge", "◇"),
  reward: () => customEmoji("reward", "□"),
  quest: () => customEmoji("quest", "▤"),
  locked: () => customEmoji("locked", "◇"),
  progress: () => customEmoji("progress", "◷"),
  companion: () => customEmoji("companion", "◉"),
  chat: () => customEmoji("chat", "•••"),
  milestone: () => customEmoji("milestone", "♜"),
  memory: () => customEmoji("memory", "▧"),
  wait: () => customEmoji("wait", "⌛"),
  sun: () => customEmoji("sun", "☼"),
  leaf: () => customEmoji("leaf", "⌁"),
  check: () => customEmoji("check", "✓"),
  empty: () => customEmoji("empty", "○"),
  seed: () => customEmoji("seed", "✦"),
  moon: () => customEmoji("moon", "◐"),
  twinkle: () => customEmoji("twinkle", "✧"),
  coin: () => customEmoji("coin", "◎"),
  shop: () => customEmoji("shop", "□"),
  inventory: () => customEmoji("inventory", "▤"),
  gift: () => customEmoji("gift", "◇"),
  trophy: () => customEmoji("trophy", "♜")
};

module.exports = { customEmoji, emoji, setGuildEmojiMap, activateGuildEmoji };
