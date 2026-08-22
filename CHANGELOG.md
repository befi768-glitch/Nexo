# Changelog

## 2.4.0
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
