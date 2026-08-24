# PQT RPG V1 — Prefix Edition

V1 sử dụng prefix `-`, không dùng slash command.

## Commands

- `-start`
- `-profile`
- `-cards`
- `-adventure`
- `-battle`
- `-help`

Các lựa chọn trong Adventure vẫn dùng Discord Buttons.

## Discord Developer Portal

Vì bot đọc tin nhắn, cần bật:

**Bot → Privileged Gateway Intents → Message Content Intent**

Sau đó:

```bash
npm install
npm run db:push
npm run dev
```

`.env`:

```env
DISCORD_TOKEN=your_bot_token
DATABASE_URL="file:./dev.db"
```

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

Chưa có PvP, Guild, Faction, Market hoặc Hidden Fusion; các hệ thống này dành cho các version sau.
