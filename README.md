# PQT RPG V2.8 — Living Adventure

## Core idea
Adventure is no longer a linear chapter chain and no longer an infinite random farm.

`-adventure` opens one exploration session. The player chooses once, the session ends, and the player must deliberately start another exploration.

## Exploration charges
- Maximum: 5
- Each `-adventure` consumes 1 charge
- +1 charge every 30 minutes, up to 5
- No automatic next Adventure after a choice

## 90-second choice window
- An Adventure session expires after 90 seconds.
- Expired sessions do not count as completed.
- The player must run `-adventure` again.

## Dynamic Adventure Pool
Adventure selection considers:
- Adventures already completed by the player
- World danger/trust
- Player memories
- Conditional requirements
- Weighted rarity of events

Completed Adventures do not repeat for that player.

## Card Discovery
Cards are NOT direct Adventure rewards. Discovery is a separate rare check influenced by context, memory, world state and player identity.

Hidden/rare cards require specific conditions.

## Anti-farm principle
There is no `A -> B -> C -> D` automatic chain and no infinite button loop. Progress requires starting another exploration and spending another exploration charge.


## V2.8.1 — Consequence-first Adventures

Mọi lựa chọn trong Adventure đều bắt buộc có ít nhất một mặt lợi và một mặt hại.
- Không hiển thị trước toàn bộ cái giá của lựa chọn.
- Sau khi chọn, bot mới công bố consequence thực tế.
- Consequence có thể tác động Coin, HP, XP, Reputation, World Danger/Trust, Memory và Faction.
- HP không giảm dưới 1 bởi Adventure.
- World Danger/Trust luôn được clamp trong 0–100.
- Choice được claim atomic trong transaction, tránh double-claim.


## KO / 12-hour gameplay lock

If a player's HP reaches exactly 0, the player is marked KO and all gameplay actions are locked for 12 hours. Profile remains available so the player can see the recovery timer. After the lock expires, the first gameplay attempt automatically restores HP to max HP and clears the lock.
