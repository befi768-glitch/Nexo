# PQT RPG V2.5

V2.5 tập trung vào 3 hệ thống lõi: **Dynamic World + Player Identity + Card Discovery**.

## Triết lý Card

`-start` **không phát Card**.

Card không được bán trong shop. Card phải được **khám phá thông qua Adventure, điều kiện thế giới và các lựa chọn**.

## Commands

- `-start` — tạo nhân vật, không có Card
- `-profile` — xem nhân vật + Identity
- `-cards` — collection Card đã khám phá
- `-adventure` — Adventure động
- `-world` — xem World State
- `-battle` — PvE
- `-help`

## V2.5

### Dynamic World

Mỗi server có Forest Danger và Forest Trust. Lựa chọn của người chơi làm thay đổi thế giới.

### Player Identity

Không chọn class cố định. Lựa chọn tích lũy các xu hướng:

- Compassion
- Ruthlessness
- Curiosity
- Knowledge

Profile hiển thị Identity nổi trội nhất.

### Card Discovery

Starter card cũ đã trở thành **Discovery Card**. Người chơi mới bắt đầu với collection trống.

Adventure đầu tiên luôn là `Con đường đầu tiên`, cho người chơi khám phá một trong ba Card cơ bản.

Các Card hiếm hơn xuất hiện qua điều kiện Adventure:

- Moon Seer
- Thorn Beast
- Frost Mage
- Ancient Guardian
- Blood Moon

### PvE

Nếu người chơi chưa có Card, `-battle` bị khóa và hướng dẫn họ khám phá Card trước.

Card tham chiến nhận:

- Battles +1
- Bond +2
- mỗi 5 trận: Level +1
- Memory được cập nhật

## Railway

Giữ nguyên PostgreSQL của V1:

```bash
npm install
npm run build
npm start
```

`start` chạy `prisma db push` trước khi bot khởi động.
