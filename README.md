# PQT RPG V2 — Core RPG Expansion

V2 được xây trên chính baseline V1 chạy ổn trên Railway.

## V2 có gì mới

### 1. 🔒 Adventure ownership
- Button Adventure được khóa theo người tạo event.
- Người khác bấm button sẽ nhận thông báo `Đây không phải Adventure của bạn.`
- Event được lưu trong `AdventureSession`.
- Một event chỉ được xử lý một lần.

### 2. 🌍 World State
Lựa chọn của người chơi trong server bắt đầu ảnh hưởng trạng thái khu vực:
- Forest Trust
- Forest Danger
- Forest Rumor
- Secret Path

Dùng:
```text
-world
```

World State được lưu theo Discord server (`guildId`), nên lựa chọn của một người có thể làm thay đổi trạng thái chung của server.

### 3. 🃏 Card progression
Mỗi card giờ có:
- Level
- Bond
- Battles
- Memory

Sau mỗi trận, card trong deck nhận Battle/Bond progress. Mỗi 5 battle, card tăng 1 level và cập nhật Memory.

### 4. ⚔️ Deck system
Deck có 3 slot.

```text
-deck
-deck set <cardId> <slot>
```

Combat chỉ sử dụng card đang nằm trong 3 slot deck.

### 5. 🛒 Card acquisition
V2 giải quyết một điểm thiếu của V1: người chơi đã có Coin nhưng chưa có vòng lặp sở hữu card mới.

```text
-shop
-buy <cardId>
```

Một số card mới được thêm vào shop với giá khác nhau.

### 6. ⚔️ PvE phản ứng với World State
Forest Danger ảnh hưởng HP và damage của quái vật.

## Commands

```text
-start
-profile
-cards
-deck
-deck set <cardId> <slot>
-shop
-buy <cardId>
-adventure
-world
-battle
-help
```

## Database

PostgreSQL + Prisma.

V2 mở rộng schema nhưng giữ nguyên các model V1 để `prisma db push` cập nhật database hiện tại.

## Railway

Giữ nguyên:

```env
DISCORD_TOKEN=...
DATABASE_URL=...
```

Build:
```bash
npm install
npm run build
```

Start:
```bash
npm start
```

`npm start` chạy `prisma db push` trước khi bot khởi động.

## Discord

Bật:
**Bot → Privileged Gateway Intents → Message Content Intent**

## Chưa đưa vào V2

- PvP matchmaking
- Guild system
- Market người chơi
- Card Fusion ẩn
- Hidden cards

Các hệ thống này nên được xây sau khi core loop V2 ổn định.
