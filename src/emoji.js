/**
 * Nexo's emoji registry.
 *
 * Set NEXO_EMOJI_<NAME>_ID to a Discord custom emoji ID after uploading the
 * matching image from assets/emojis. Until then, the friendly fallback keeps
 * every command readable in development and in servers without the pack.
 */
function customEmoji(name, fallback) {
  const id = process.env[`NEXO_EMOJI_${name.toUpperCase()}_ID`];
  return id ? `<:${name}:${id}>` : fallback;
}

const emoji = {
  spark: () => customEmoji("spark", "🌱"),
  glow: () => customEmoji("glow", "✨"),
  guardian: () => customEmoji("guardian", "🌌"),
  astral: () => customEmoji("astral", "🌠"),
  profile: () => customEmoji("profile", "👤"),
  xp: () => customEmoji("xp", "⭐"),
  streak: () => customEmoji("streak", "🔥"),
  badge: () => customEmoji("badge", "🏅"),
  reward: () => customEmoji("reward", "🎁"),
  quest: () => customEmoji("quest", "📜"),
  locked: () => customEmoji("locked", "🔒"),
  progress: () => customEmoji("progress", "🌍"),
  companion: () => customEmoji("companion", "🤖"),
  chat: () => customEmoji("chat", "💬"),
  milestone: () => customEmoji("milestone", "🏁"),
  memory: () => customEmoji("memory", "📖"),
  wait: () => customEmoji("wait", "⏳"),
  sun: () => customEmoji("sun", "🌞"),
  leaf: () => customEmoji("leaf", "🌿"),
  check: () => customEmoji("check", "✅"),
  empty: () => customEmoji("empty", "▫️"),
  seed: () => customEmoji("seed", "🌱"),
  moon: () => customEmoji("moon", "🌌"),
  twinkle: () => customEmoji("twinkle", "✨")
};

module.exports = { customEmoji, emoji };