# Nexo v2.7

Nexo is a Vietnamese-first Discord server companion built around **interaction → XP → level → unlock → customize → social progression**.

## v2.7 Hardening → Identity → Economy
- `/help` — onboarding/help
- `/profile` — member progression
- `/leaderboard` — XP, streak, badges
- `/settings view|set|reset` — per-server configuration
- `/progress` — server milestones and next target
- `/data export|backup|reset-user|reset-server` — data administration
- XP anti-spam and per-server XP tuning
- JSON fallback + PostgreSQL persistence
- schema versioning and automatic backups
- atomic PostgreSQL Coin spending (race-condition safe)
- optional S3-compatible remote backup storage
- custom emoji registry for economy/progression UI
- vi/en localization for onboarding, profile, settings and economy UI

## Run
1. Copy `.env.example` to `.env`.
2. Set `DISCORD_TOKEN` and `CLIENT_ID`.
3. Optional: set `DATABASE_URL` for PostgreSQL.
4. Run `npm install` then `npm start`.
