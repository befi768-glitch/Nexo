const path = require("path");
const { emoji, setGuildEmojiMap } = require("./emoji");

const emojiFiles = {
  spark: "spark.png",
  glow: "glow.png",
  guardian: "guardian.png",
  astral: "astral.png",
  badge: "badge.png",
  quest: "quest.png"
};

const aliases = {
  seed: "spark",
  twinkle: "glow",
  xp: "glow",
  reward: "glow",
  companion: "guardian",
  progress: "guardian",
  moon: "astral",
  profile: "quest",
  chat: "quest",
  memory: "quest",
  wait: "quest",
  sun: "glow",
  leaf: "guardian",
  streak: "badge",
  locked: "badge",
  milestone: "badge",
  check: "badge",
  empty: "quest"
};

async function provisionGuildEmoji(guild) {
  const ids = {};
  const existing = new Map(guild.emojis.cache.map(item => [item.name, item]));
  const assetsDir = path.join(__dirname, "..", "assets", "emojis", "png");

  for (const [name, file] of Object.entries(emojiFiles)) {
    let custom = existing.get(name);
    if (!custom) {
      try {
        custom = await guild.emojis.create({
          attachment: path.join(assetsDir, file),
          name,
          reason: "Install Nexo image emoji pack"
        });
      } catch (error) {
        console.warn(`[EMOJI] Could not create ${name} in ${guild.name}: ${error.message}`);
        continue;
      }
    }
    ids[name] = custom.id;
  }

  for (const [alias, source] of Object.entries(aliases)) {
    if (ids[source]) ids[alias] = ids[source];
  }
  setGuildEmojiMap(guild.id, ids);
  return ids;
}

module.exports = { provisionGuildEmoji };