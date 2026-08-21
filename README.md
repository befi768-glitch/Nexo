# Nexo Companion V2.1

Nexo is a Discord server companion: each server gets its own Nexo, while members earn XP, complete quests, unlock badges, and contribute to Nexo's evolution and server memory.

## V2.1 features

- Per-server Nexo companion
- Member XP, levels and daily streaks
- Daily quests with claimable rewards
- Badge system
- Nexo evolution stages
- Server-wide progress
- Server milestones
- Server memory/event timeline
- `/rename` for server owners to rename Nexo
- PostgreSQL support for Railway/production
- JSON fallback for local development without a database
- Safer XP cooldown and message-length checks
- Graceful shutdown and database connection handling

## Commands

- `/companion` — Nexo status and evolution
- `/profile [user]` — member profile
- `/quest` — today's quests and progress
- `/quest claim` — claim completed quest rewards
- `/badges` — badge collection
- `/progress` — server progress and milestones
- `/memory` — recent server memories
- `/daily` — daily reward/streak
- `/rename <name>` — rename Nexo (server owner only)

## Local setup

1. Install Node.js 20+.
2. `npm install`
3. Copy `.env.example` to `.env`.
4. Fill `DISCORD_TOKEN`, `CLIENT_ID`, `GUILD_ID`.
5. `npm start` (the `prestart` hook registers guild slash commands automatically).

If `DATABASE_URL` is empty, Nexo uses `data/database.json` locally.

## Railway + GitHub

Railway detects Node projects and normally uses `npm start` as the start command. You can also explicitly set the start command to `npm start` in the service settings.

For production persistence, add a PostgreSQL service in Railway and provide its `DATABASE_URL` to Nexo. Do not rely on the local JSON file for production persistence.

Railway runs `npm start`; the package `prestart` hook registers the guild slash commands before the bot process starts. Keep `CLIENT_ID` and `GUILD_ID` configured on Railway.

Set these Railway variables:

- `DISCORD_TOKEN`
- `CLIENT_ID`
- `GUILD_ID` (optional after switching to global command deployment; V2 keeps guild deployment for fast testing)
- `DATABASE_URL`
- `NODE_ENV=production`

Do not commit `.env` or your bot token to GitHub.

## Discord setup

Nexo V2.1 intentionally requests only three gateway intents:

- `Guilds`
- `GuildMessages`
- `MessageContent`

`MessageContent` is a **Privileged Gateway Intent**. You must enable **Message Content Intent** in Discord Developer Portal → your application → **Bot** → **Privileged Gateway Intents**. Nexo does **not** request `GuildMembers` or `GuildPresences`, because the current code does not need them.

If `Message Content Intent` is disabled, Discord will close the gateway connection with `Error: Used disallowed intents`. This is a Discord application setting, not a Railway or PostgreSQL error.

## Notes

V2.1 intentionally keeps the economy out. The goal is to validate the Companion loop before adding coins, shops or inventories.
