# Nexo Companion V2

Nexo is a Discord server companion: each server gets its own Nexo, while members earn XP, complete quests, unlock badges, and contribute to Nexo's evolution and server memory.

## V2 features

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
5. `npm run deploy`
6. `npm start`

If `DATABASE_URL` is empty, Nexo uses `data/database.json` locally.

## Railway + GitHub

Railway detects Node projects and normally uses `npm start` as the start command. You can also explicitly set the start command to `npm start` in the service settings.

For production persistence, add a PostgreSQL service in Railway and provide its `DATABASE_URL` to Nexo. Do not rely on the local JSON file for production persistence.

Set these Railway variables:

- `DISCORD_TOKEN`
- `CLIENT_ID`
- `GUILD_ID` (optional after switching to global command deployment; V2 keeps guild deployment for fast testing)
- `DATABASE_URL`
- `NODE_ENV=production`

Do not commit `.env` or your bot token to GitHub.

## Discord setup

Nexo needs the `Message Content` privileged intent because V2 awards limited XP from normal messages. Enable that intent in the Discord Developer Portal for the bot. If you do not want message XP, remove the `GuildMessages`/`MessageContent` intents and the message handler.

## Notes

V2 intentionally keeps the economy out. The goal is to validate the Companion loop before adding coins, shops or inventories.
