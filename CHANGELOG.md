# Changelog

## v2.7.0 — Hardening & Polish
- Fixed PostgreSQL Coin spending with an atomic conditional UPDATE, preventing double-spend races between concurrent purchases/gifts.
- Made Coin crediting atomic on PostgreSQL.
- Added optional S3-compatible remote backup uploads for production persistence.
- Made backup directory configurable through `BACKUP_DIR`.
- Added custom emoji aliases for Coin, shop, inventory, gift and milestone/trophy UI.
- Added vi/en localization for onboarding/help, profile, settings, economy and data backup responses.
- Raised schema version to 5 with backward-compatible user migration.

# Changelog

## 2.6.0 — Identity & Economy
- Added Coin wallet and cosmetic shop.
- Added `/shop`, `/buy`, `/inventory`, `/equip`, `/gift`.
- Added profile cosmetic/title display.
- Added Coin rewards from valid interactions and daily bonus.
- Added lightweight personality reactions with per-server cooldown.
- Added level-up and server milestone announcements.
- Added schema v4 migration for economy/cosmetics.

2.4.0
- Added `/settings` for per-server XP, daily, channel, color, language and emoji configuration.
- Added `/data export`, `/data backup`, `/data reset-user`, and protected server reset.
- Added schema versioning and soft migration for JSON/PostgreSQL records.
- Added scheduled/startup backups.
- Added milestone-next progress display.
- Added per-server XP cooldown/range overrides.

# Nexo Companion V2.3.0

## Foundation
- Added `/help` with a short Vietnamese onboarding guide and command map.
- Nexo now attempts to send the same onboarding embed when it joins a server.
- Added `/leaderboard` with XP, streak and badge rankings.
- Added XP anti-spam protection for repeated messages, burst spam and low-information messages.
- Added a richer `/profile` with avatar, XP progress bar, badge count and evolution context.
- Added backwards-compatible data normalization for existing JSON/PostgreSQL records.
- Bumped package version to `2.3.0`.

## Design goal
V2.3 completes the Foundation loop before economy or AI: interact → XP → level → unlock → show progress.

## 2.7.1 — Nexo Emoji Identity Polish
- Replaced generic Unicode fallbacks with a cohesive branded Nexo image-emoji pack.
- Added dedicated 128px transparent assets for progression, profile, quest, economy, status and personality states.
- Provisioner now uploads `nexo_*` emojis to avoid collisions with unrelated server emoji.
- Removed broad aliasing so important UI states have their own visual identity.
- Updated personality and economy UI to prefer branded emoji throughout.
