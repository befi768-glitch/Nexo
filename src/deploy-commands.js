require("dotenv").config();
const { REST, Routes } = require("discord.js");
const { commandBuilders } = require("./commands");

async function main() {
  if (!process.env.DISCORD_TOKEN || !process.env.CLIENT_ID) {
    throw new Error("Thiếu DISCORD_TOKEN hoặc CLIENT_ID.");
  }
  const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);
  // Global commands make the same command set available in every server
  // where the bot is installed.
  await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: commandBuilders });
  console.log(`Registered ${commandBuilders.length} global commands for all Nexo servers.`);

  // When GUILD_ID is provided, also register to that server for instant
  // visibility while Discord propagates the global commands.
  if (process.env.GUILD_ID) {
    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
      { body: commandBuilders }
    );
    console.log(`Registered ${commandBuilders.length} guild commands for ${process.env.GUILD_ID}.`);
  }
}
main().catch(e => { console.error(e); process.exit(1); });
