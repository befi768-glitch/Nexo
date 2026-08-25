import { db } from "../db.js";

export const DISCOVERY_CARDS = [
  { id: "ember", name: "Ember", emoji: "🔥", description: "Một ngọn lửa nhỏ nhưng ổn định.", rarity: "Common", attack: 14, defense: 2, energy: 2, skill: "Burn" },
  { id: "iron_guard", name: "Iron Guard", emoji: "🛡️", description: "Một hộ vệ cổ xưa chỉ xuất hiện với người biết bảo vệ người khác.", rarity: "Common", attack: 5, defense: 14, energy: 2, skill: "Guard" },
  { id: "wanderer", name: "Wanderer", emoji: "⚔️", description: "Một chiến binh lang thang chưa rõ quá khứ.", rarity: "Uncommon", attack: 11, defense: 8, energy: 3, skill: "Slash" },
  { id: "moon_seer", name: "Moon Seer", emoji: "🌙", description: "Kẻ nhìn thấy những con đường chỉ xuất hiện dưới ánh trăng.", rarity: "Rare", attack: 16, defense: 9, energy: 3, skill: "Lunar Sight" },
  { id: "thorn_beast", name: "Thorn Beast", emoji: "🌿", description: "Một ma thú nhớ rất rõ ai từng cứu nó.", rarity: "Rare", attack: 13, defense: 16, energy: 3, skill: "Regrowth" },
  { id: "frost_mage", name: "Frost Mage", emoji: "❄️", description: "Pháp sư xuất hiện bên những đoàn thương nhân đi qua phương Bắc.", rarity: "Epic", attack: 21, defense: 11, energy: 4, skill: "Frostbind" },
  { id: "ancient_guardian", name: "Ancient Guardian", emoji: "🗿", description: "Một linh hồn cổ đại chỉ công nhận người có đủ lòng tin.", rarity: "Epic", attack: 18, defense: 23, energy: 5, skill: "Aegis" },
  { id: "blood_moon", name: "Blood Moon", emoji: "🌑", description: "Một card chỉ được nhìn thấy trong những đêm mà khu rừng mất kiểm soát.", rarity: "Legendary", attack: 30, defense: 15, energy: 5, skill: "Red Eclipse" }
] as const;

export async function seedCards() {
  for (const card of DISCOVERY_CARDS) {
    await db.card.upsert({ where: { id: card.id }, update: card, create: card });
  }
}
