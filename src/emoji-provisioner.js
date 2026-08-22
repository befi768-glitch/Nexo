const path = require("path");
const { setGuildEmojiMap } = require("./emoji");

// Dedicated branded assets. We intentionally provision every logical emoji
// instead of aliasing several UI states to the same generic icon.
const emojiNames = [
  "spark", "glow", "guardian", "astral", "profile", "xp", "streak", "badge",
  "reward", "quest", "locked", "progress", "companion", "chat", "milestone",
  "memory", "wait", "sun", "leaf", "check", "empty", "seed", "moon", "twinkle",
  "coin", "shop", "inventory", "gift", "trophy"
];

async function provisionGuildEmoji(guild) {
  const ids = {};
  const existing = new Map(guild.emojis.cache.map(item => [item.name, item]));
  const assetsDir = path.join(__dirname, "..", "assets", "emojis", "png");

  for (const name of emojiNames) {
    const discordName = `nexo_${name}`;
    let custom = existing.get(discordName);
    if (!custom) {
      try {
        custom = await guild.emojis.create({
          attachment: path.join(assetsDir, `${name}.png`),
          name: discordName,
          reason: "Install Nexo branded image emoji pack"
        });
      } catch (error) {
        console.warn(`[EMOJI] Could not create ${discordName} in ${guild.name}: ${error.message}`);
        continue;
      }
    }
    ids[name] = custom.id;
  }

  setGuildEmojiMap(guild.id, ids);
  return ids;
}

module.exports = { provisionGuildEmoji };
