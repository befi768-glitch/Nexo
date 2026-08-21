require("dotenv").config();
const { REST, Routes } = require("discord.js");
const { commandBuilders } = require("./commands");

async function main() {
  if (!process.env.DISCORD_TOKEN || !process.env.CLIENT_ID || !process.env.GUILD_ID) throw new Error("Thiếu DISCORD_TOKEN, CLIENT_ID hoặc GUILD_ID.");
  const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);
  await rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID), { body: commandBuilders });
  console.log(`Registered ${commandBuilders.length} guild commands.`);
}
main().catch(e => { console.error(e); process.exit(1); });
