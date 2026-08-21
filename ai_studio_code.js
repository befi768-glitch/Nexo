module.exports = {
  companion: {
    defaultName: "Nexo",
    stages: [
      { 
        minLevel: 1, 
        id: "spark", 
        name: "Spark", 
        icon: "✨",
        thumbnail: "https://raw.githubusercontent.com/befi768-glitch/Nexo/main/assets/images/nexo_spark.jpg",
        description: "Nexo vừa thức tỉnh dưới hình thái sinh linh ánh sáng huyền bí." 
      },
      { 
        minLevel: 5, 
        id: "companion", 
        name: "Companion", 
        icon: "🌟",
        thumbnail: "https://raw.githubusercontent.com/befi768-glitch/Nexo/main/assets/images/nexo_companion.jpg",
        description: "Nexo bắt đầu gắn kết và bảo vệ cộng đồng server." 
      },
      { 
        minLevel: 10, 
        id: "guardian", 
        name: "Guardian", 
        icon: "🌌",
        thumbnail: "https://raw.githubusercontent.com/befi768-glitch/Nexo/main/assets/images/nexo_guardian.jpg",
        description: "Nexo trở thành người bảo hộ vũ trụ với vương miện tinh tú." 
      },
      { 
        minLevel: 20, 
        id: "astral", 
        name: "Astral", 
        icon: "🌠",
        thumbnail: "https://raw.githubusercontent.com/befi768-glitch/Nexo/main/assets/images/nexo_astral.jpg",
        description: "Nexo đạt trạng thái Astral tối thượng bao bọc thiên hà." 
      }
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
    { id: "level-5", name: "Growing Sprout", icon: "🌿", description: "Đạt mốc Level 5." },
    { id: "level-10", name: "Cosmic Guardian", icon: "🌌", description: "Đạt mốc Level 10." },
    { id: "daily-7", name: "Streak Master", icon: "🔥", description: "Duy trì điểm danh liên tục 7 ngày." },
    { id: "server-100", name: "First Milestone", icon: "🏆", description: "Server đạt mốc 100 tương tác." }
  ],
  milestones: [
    { id: "interactions-100", target: 100, name: "First Milestone", icon: "🏆", description: "Server đạt 100 tương tác." },
    { id: "interactions-500", target: 500, name: "Growing Community", icon: "🌿", description: "Server đạt 500 tương tác." },
    { id: "interactions-1000", target: 1000, name: "Astral Realm", icon: "🌌", description: "Server đạt 1.000 tương tác." }
  ]
};