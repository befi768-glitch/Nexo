# PQT RPG V1 — Prefix + PostgreSQL

Bản này sửa lỗi `The URL must start with the protocol file:` bằng cách chuyển database từ SQLite sang PostgreSQL.

## Commands

- `-start`
- `-profile`
- `-cards`
- `-adventure`
- `-battle`
- `-help`

Adventure vẫn dùng Discord Buttons.

## Environment

Tạo `.env`:

```env
DISCORD_TOKEN=your_bot_token
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE?schema=public"
```

**Quan trọng:** dùng chính `DATABASE_URL` PostgreSQL mà nền tảng deploy của bạn cung cấp. Không dùng `file:./dev.db`.

## Deploy

Build command:

```bash
npm install
npm run build
```

Start command:

```bash
npm start
```

`npm start` sẽ chạy `prisma db push` trước khi khởi động bot để V1 tự đồng bộ schema database. Đây là cách tiện cho prototype V1; khi production ổn định, nên chuyển sang Prisma migrations.

## Discord

Vì bot dùng prefix, bật:
**Bot → Privileged Gateway Intents → Message Content Intent**

## V1 gồm

- Character
- Level / XP / HP / Stats
- Coin
- Card Collection
- Starter Cards
- PvE combat
- Choice system
- Reputation
- Choice history

Chưa có PvP, Guild, Faction, Market hoặc Hidden Fusion.
