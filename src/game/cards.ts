import { db } from "../db.js";

export const CARD_POOL = [
  { id: "ember", name: "Ember", emoji: "🔥", description: "Một ngọn lửa nhỏ nhưng ổn định.", rarity: "Common", attack: 14, defense: 2, energy: 2, skill: "Burn", price: 0 },
  { id: "iron_guard", name: "Iron Guard", emoji: "🛡️", description: "Phòng thủ cơ bản của một lữ khách.", rarity: "Common", attack: 5, defense: 14, energy: 2, skill: "Guard", price: 0 },
  { id: "wanderer", name: "Wanderer", emoji: "⚔️", description: "Một chiến binh lang thang chưa rõ quá khứ.", rarity: "Uncommon", attack: 11, defense: 8, energy: 3, skill: "Slash", price: 0 },
  { id: "frost_mage", name: "Frost Mage", emoji: "❄️", description: "Pháp sư băng có khả năng làm chậm đối thủ.", rarity: "Uncommon", attack: 17, defense: 5, energy: 3, skill: "Freeze", price: 180 },
  { id: "thorn_beast", name: "Thorn Beast", emoji: "🌿", description: "Sinh vật gai sống sâu trong khu rừng.", rarity: "Rare", attack: 21, defense: 10, energy: 4, skill: "Thorns", price: 320 },
  { id: "moon_seer", name: "Moon Seer", emoji: "🌙", description: "Kẻ nhìn thấy những khả năng chưa xảy ra.", rarity: "Rare", attack: 19, defense: 15, energy: 4, skill: "Insight", price: 420 }
] as const;

export async function seedCards() {
  for (const card of CARD_POOL) {
    await db.card.upsert({ where: { id: card.id }, update: card, create: card });
  }
}

export function getCard(id: string) {
  return CARD_POOL.find(card => card.id === id);
}
