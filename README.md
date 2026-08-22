# Nexo v2.4

Nexo is a Vietnamese-first Discord server companion built around **interaction → XP → level → unlock → server progression**.

## v2.4 Foundation → Server
- `/help` — onboarding/help
- `/profile` — member progression
- `/leaderboard` — XP, streak, badges
- `/settings view|set|reset` — per-server configuration
- `/progress` — server milestones and next target
- `/data export|backup|reset-user|reset-server` — data administration
- XP anti-spam and per-server XP tuning
- JSON fallback + PostgreSQL persistence
- schema versioning and automatic backups

## Run
1. Copy `.env.example` to `.env`.
2. Set `DISCORD_TOKEN` and `CLIENT_ID`.
3. Optional: set `DATABASE_URL` for PostgreSQL.
4. Run `npm install` then `npm start`.
