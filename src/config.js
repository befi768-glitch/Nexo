module.exports = {
  companion: {
    defaultName: "Nexo",
    stages: [
      { minLevel: 1, id: "spark", name: "Spark", icon: "🌱", description: "Nexo vừa thức tỉnh." },
      { minLevel: 5, id: "companion", name: "Companion", icon: "✨", description: "Nexo bắt đầu gắn kết với cộng đồng." },
      { minLevel: 10, id: "guardian", name: "Guardian", icon: "🌌", description: "Nexo trở thành người bảo hộ của server." },
      { minLevel: 20, id: "astral", name: "Astral", icon: "🌠", description: "Nexo đạt trạng thái Astral." }
    ]
  },
  xp: {
    messageMin: 8,
    messageMax: 15,
    messageCooldownMs: 60_000,
    daily: 50,
    questDefault: 100
  },
  quests: [
    { id: "chat-10", name: "Người trò chuyện", description: "Gửi 10 tin nhắn hợp lệ hôm nay.", type: "chat", target: 10, reward: 100 },
    { id: "daily-1", name: "Điểm danh", description: "Nhận phần thưởng /daily.", type: "daily", target: 1, reward: 60 },
    { id: "profile-1", name: "Làm quen", description: "Xem profile của chính bạn.", type: "profile", target: 1, reward: 40 }
  ],
  badges: [
    { id: "first-contact", name: "First Contact", icon: "🌱", description: "Tương tác với Nexo lần đầu." },
    { id: "level-5", name: "Growing", icon: "🌿", description: "Đạt Level 5." },
    { id: "level-10", name: "Guardian", icon: "🌌", description: "Đạt Level 10." },
    { id: "daily-7", name: "Consistent", icon: "📅", description: "Điểm danh 7 ngày." },
    { id: "server-100", name: "First Milestone", icon: "🏁", description: "Server đạt 100 tương tác." }
  ],
  milestones: [
    { id: "interactions-100", target: 100, name: "First Milestone", icon: "🏁", description: "Server đạt 100 tương tác." },
    { id: "interactions-500", target: 500, name: "Growing Community", icon: "🌿", description: "Server đạt 500 tương tác." },
    { id: "interactions-1000", target: 1000, name: "Established", icon: "🌌", description: "Server đạt 1.000 tương tác." }
  ]
};
