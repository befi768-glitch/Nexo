# Nexo Companion V2.1

## Fixes
- Reduced Discord Gateway intents to the exact intents used by the current code: `Guilds`, `GuildMessages`, and `MessageContent`.
- Removed unused intent-related assumptions such as `GuildMembers`/`GuildPresences`; they are not requested by Nexo.
- Added clearer startup logging for the active intents and environment.
- Added Discord client `error` and `warn` logging.
- Added an npm `prestart` hook so Railway registers guild slash commands automatically before `npm start`.
- Updated the example environment to `NODE_ENV=production`.
- Updated deployment documentation with the exact Discord Developer Portal requirement for Message Content Intent.

## Important
`MessageContent` remains necessary because Nexo awards XP from normal message content. If Discord Developer Portal has Message Content Intent disabled, Discord will reject the gateway connection with `Used disallowed intents`.
