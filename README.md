# Nexo Companion V2.3

Nexo is a Discord server companion: each server gets its own Nexo, while members earn XP, complete quests, unlock badges, and contribute to Nexo's evolution and server memory.

## V2.3 Foundation

- Vietnamese `/help` onboarding and command guide
- Automatic onboarding message when Nexo joins a server
- Member XP, levels and daily streaks
- Daily quests with claimable rewards
- Badge system
- Nexo evolution stages
- Server-wide progress and milestones
- Server memory/event timeline
- `/leaderboard` for XP, streak and badges
- Anti-spam XP protection for repeated/burst/low-information messages
- Rich `/profile` with avatar, progress bar, streak, badges and evolution context
- `/rename` for server owners/admins to rename Nexo
- PostgreSQL support for Railway/production
- JSON fallback for local development without a database
- Multi-server support with isolated data per Discord server
- Custom image emoji provisioning with readable fallbacks

## Commands

- `/help` — hướng dẫn bắt đầu
- `/companion` — Nexo status và evolution
- `/profile [user]` — member profile
- `/leaderboard [type]` — XP, streak hoặc badges
- `/quest list` — today's quests
- `/quest claim` — claim completed quest rewards
- `/badges` — badge collection
- `/progress` — server progress and milestones
- `/memory` — recent server memories
- `/daily` — daily reward/streak
- `/rename <name>` — rename Nexo

## XP anti-spam

Nexo vẫn dùng cooldown XP, đồng thời V2.3 bỏ thưởng cho:
- Tin nhắn lặp lại trong cửa sổ ngắn
- Burst spam quá nhanh
- Nội dung quá ngắn/ít thông tin

Các giới hạn nằm trong `src/config.js` để có thể cân bằng tiếp ở các bản sau.

## Local setup

1. Node.js 20+
2. `npm install`
3. Copy `.env.example` → `.env`
4. Điền `DISCORD_TOKEN` và `CLIENT_ID`
5. `npm start`

Nếu `DATABASE_URL` trống, Nexo dùng `data/database.json`.

## Production

Railway + PostgreSQL được hỗ trợ. Đặt `DISCORD_TOKEN`, `CLIENT_ID`, `DATABASE_URL` và `NODE_ENV=production`.

Discord Developer Portal phải bật **Message Content Intent**, vì XP được tính từ message content.
