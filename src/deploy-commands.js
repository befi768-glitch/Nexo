require("dotenv").config();
const { REST, Routes } = require("discord.js");
const { commandBuilders } = require("./commands");

async function main() {
  if (!process.env.DISCORD_TOKEN || !process.env.CLIENT_ID) {
    throw new Error("Thiếu DISCORD_TOKEN hoặc CLIENT_ID.");
  }
  const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);
  const route = process.env.GUILD_ID
    ? Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID)
    : Routes.applicationCommands(process.env.CLIENT_ID);
  await rest.put(route, { body: commandBuilders });
  console.log(`Registered ${commandBuilders.length} ${process.env.GUILD_ID ? "guild" : "global"} commands.`);
}
main().catch(e => { console.error(e); process.exit(1); });
