import { db } from "../db.js";

export const STARTER_CARDS = [
  {
    id: "ember",
    name: "Ember",
    emoji: "🔥",
    description: "Một ngọn lửa nhỏ nhưng ổn định.",
    rarity: "Common",
    attack: 14,
    defense: 2,
    energy: 2,
    skill: "Burn"
  },
  {
    id: "iron_guard",
    name: "Iron Guard",
    emoji: "🛡️",
    description: "Phòng thủ cơ bản của một lữ khách.",
    rarity: "Common",
    attack: 5,
    defense: 14,
    energy: 2,
    skill: "Guard"
  },
  {
    id: "wanderer",
    name: "Wanderer",
    emoji: "⚔️",
    description: "Một chiến binh lang thang chưa rõ quá khứ.",
    rarity: "Uncommon",
    attack: 11,
    defense: 8,
    energy: 3,
    skill: "Slash"
  }
];

export async function seedCards() {
  for (const card of STARTER_CARDS) {
    await db.card.upsert({
      where: { id: card.id },
      update: card,
      create: card
    });
  }
}
