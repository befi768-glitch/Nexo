const { emoji } = require("./emoji");

module.exports = {
  companion: {
    defaultName: "Nexo",
    stages: [
      { minLevel: 1, id: "spark", name: "Spark", icon: emoji.spark(), description: "Nexo vừa thức tỉnh." },
      { minLevel: 5, id: "companion", name: "Companion", icon: emoji.glow(), description: "Nexo bắt đầu gắn kết với cộng đồng." },
      { minLevel: 10, id: "guardian", name: "Guardian", icon: emoji.guardian(), description: "Nexo trở thành người bảo hộ của server." },
      { minLevel: 20, id: "astral", name: "Astral", icon: emoji.astral(), description: "Nexo đạt trạng thái Astral." }
    ]
  },
  xp: {
    messageMin: 8,
    messageMax: 15,
    messageCooldownMs: 60_000,
    daily: 50,
    questDefault: 100,
    antiSpam: {
      repeatWindow: 5,
      burstWindowMs: 20_000,
      maxMessagesInBurst: 4,
      minMeaningfulChars: 3
    }
  },
  settings: {
    allowedLanguages: ["vi", "en"],
    colorPresets: { default: "#63c5da", gold: "#f2c94c", purple: "#8c7ae6", green: "#8ad6b8" }
  },
  quests: [
    { id: "chat-10", name: "Người trò chuyện", description: "Gửi 10 tin nhắn hợp lệ hôm nay.", type: "chat", target: 10, reward: 100 },
    { id: "daily-1", name: "Điểm danh", description: "Nhận phần thưởng /daily.", type: "daily", target: 1, reward: 60 },
    { id: "profile-1", name: "Làm quen", description: "Xem profile của chính bạn.", type: "profile", target: 1, reward: 40 }
  ],
  badges: [
    { id: "first-contact", name: "First Contact", icon: emoji.spark(), description: "Tương tác với Nexo lần đầu." },
    { id: "level-5", name: "Growing", icon: emoji.leaf(), description: "Đạt Level 5." },
    { id: "level-10", name: "Guardian", icon: emoji.guardian(), description: "Đạt Level 10." },
    { id: "daily-7", name: "Consistent", icon: emoji.streak(), description: "Điểm danh 7 ngày." },
    { id: "server-100", name: "First Milestone", icon: emoji.milestone(), description: "Server đạt 100 tương tác." }
  ],
  milestones: [
    { id: "interactions-100", target: 100, name: "First Milestone", icon: emoji.milestone(), description: "Server đạt 100 tương tác." },
    { id: "interactions-500", target: 500, name: "Growing Community", icon: emoji.leaf(), description: "Server đạt 500 tương tác." },
    { id: "interactions-1000", target: 1000, name: "Established", icon: emoji.guardian(), description: "Server đạt 1.000 tương tác." }
  ]
};
