require("dotenv").config();
const { REST, Routes } = require("discord.js");
const { commandBuilders } = require("./commands");

async function main() {
  if (!process.env.DISCORD_TOKEN || !process.env.CLIENT_ID) {
    throw new Error("Thiếu DISCORD_TOKEN hoặc CLIENT_ID.");
  }
  const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);
  // Global commands make the same command set available in every server
  // where the bot is installed. GUILD_ID is intentionally not used here:
  // guild-scoped registration would limit the bot to one server.
  await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: commandBuilders });
  console.log(`Registered ${commandBuilders.length} global commands for all Nexo servers.`);
}
main().catch(e => { console.error(e); process.exit(1); });
