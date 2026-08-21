# Nexo Companion V2.2

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
- Multi-server support with isolated data per Discord server
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

## Nexo image emoji pack

Nexo ships with a custom image emoji pack so command responses no longer rely
on generic Unicode emoji. Upload the PNG files from `assets/emojis/png/` to the
Discord server, then put each emoji ID in the matching `NEXO_EMOJI_<NAME>_ID`
variable from `.env.example`.

The registry in `src/emoji.js` renders Discord custom emoji markup when an ID
is configured and uses a readable Unicode fallback when it is not. This keeps
local development and servers without the pack functional while letting
production responses use Nexo's own visual language.

## Local setup

1. Install Node.js 20+.
2. `npm install`
3. Copy `.env.example` to `.env`.
4. Fill `DISCORD_TOKEN` and `CLIENT_ID`.
5. `npm start` (the `prestart` hook registers guild slash commands automatically).

If `DATABASE_URL` is empty, Nexo uses `data/database.json` locally.

## Railway + GitHub

Railway detects Node projects and normally uses `npm start` as the start command. You can also explicitly set the start command to `npm start` in the service settings.

For production persistence, add a PostgreSQL service in Railway and provide its `DATABASE_URL` to Nexo. Do not rely on the local JSON file for production persistence.

Railway runs `npm start`; the package `prestart` hook registers global slash commands before the bot process starts. Global commands are shared by every server where the bot is installed and may take a few minutes to appear after the first deployment.

Set these Railway variables:

- `DISCORD_TOKEN`
- `CLIENT_ID`
- `DATABASE_URL`
- `NODE_ENV=production`

Do not commit `.env` or your bot token to GitHub.

## Discord setup

Nexo V2.2 intentionally requests only three gateway intents:

- `Guilds`
- `GuildMessages`
- `MessageContent`

`MessageContent` is a **Privileged Gateway Intent**. You must enable **Message Content Intent** in Discord Developer Portal → your application → **Bot** → **Privileged Gateway Intents**. Nexo does **not** request `GuildMembers` or `GuildPresences`, because the current code does not need them.

If `Message Content Intent` is disabled, Discord will close the gateway connection with `Error: Used disallowed intents`. This is a Discord application setting, not a Railway or PostgreSQL error.

## Notes

V2.1 intentionally keeps the economy out. The goal is to validate the Companion loop before adding coins, shops or inventories.
