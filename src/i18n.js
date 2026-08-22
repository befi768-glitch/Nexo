const dictionaries = {
  vi: {
    helpTitle: 'Nexo — Bắt đầu trong 60 giây', helpDesc: 'Nexo là companion của server. Bạn tương tác, nhận XP, lên level, hoàn thành quest và mở khóa thành tích.',
    start: '🚀 Bắt đầu', progress: '🏆 Tiến trình', admin: '🛠️ Admin', emoji: '✨ Image Emoji',
    profile: 'xem hồ sơ', daily: 'nhận XP hằng ngày', quests: 'xem quest hôm nay', leaderboard: 'bảng xếp hạng', badges: 'huy hiệu', companion: 'Nexo & evolution', serverProgress: 'tiến trình server', shop: 'cosmetic', inventory: 'kho đồ', settings: 'cấu hình', dataExport: 'xuất dữ liệu',
    emojiDesc: 'Nexo có thể tự provision image emoji nếu server cho phép.', footer: 'Tương tác → XP → Level → Unlock → Customize → Social',
    coin: 'Coin', shopTitle: 'Nexo Cosmetic Shop', buyHint: 'Dùng /buy item:<ID> để mua.', inventoryTitle: 'Kho cosmetic', emptyInventory: 'Bạn chưa có cosmetic nào.', notFound: 'Không tìm thấy vật phẩm.', owned: 'Bạn đã sở hữu vật phẩm này.', insufficient: 'Không đủ Coin. Cần', purchased: 'Đã mua', equipped: 'Đã trang bị', notOwned: 'Bạn chưa sở hữu vật phẩm này.',
    giftOnlyMembers: 'Chỉ có thể tặng Coin cho thành viên khác.', giftDone: 'đã tặng',
    settingsTitle: 'Nexo Server Settings', enabled: 'Bật', disabled: 'Tắt', default: 'mặc định', unset: 'Không chọn', language: 'Ngôn ngữ', autoEmoji: 'Auto emoji', updated: 'Đã cập nhật', resetSettings: 'Đã đưa cấu hình Nexo về mặc định.',
    onOff: 'Giá trị phải là on/off.', invalidNumber: 'Giá trị số không hợp lệ.', invalidChannel: 'Không tìm thấy text channel.', invalidColor: 'Màu phải có dạng #63c5da.', languages: 'Ngôn ngữ hỗ trợ: vi, en.', invalidSetting: 'Thiết lập không hợp lệ.',
    needManage: 'Bạn cần quyền Manage Server.', dataExported: 'Dữ liệu server đã được xuất.', backupCreated: 'Backup đã tạo.', resetUser: 'Đã reset dữ liệu Nexo của', resetServer: 'Đã reset toàn bộ dữ liệu Nexo của server.',
    onlyServer: 'Lệnh này chỉ dùng trong server.', noData: 'Chưa có dữ liệu leaderboard.'
  },
  en: {
    helpTitle: 'Nexo — Start in 60 seconds', helpDesc: 'Nexo is your server companion. Interact, earn XP, level up, complete quests and unlock achievements.',
    start: '🚀 Getting started', progress: '🏆 Progress', admin: '🛠️ Admin', emoji: '✨ Image Emoji',
    profile: 'view your profile', daily: 'claim daily XP', quests: 'view today’s quests', leaderboard: 'leaderboard', badges: 'badges', companion: 'Nexo & evolution', serverProgress: 'server progress', shop: 'cosmetics', inventory: 'inventory', settings: 'configuration', dataExport: 'export data',
    emojiDesc: 'Nexo can provision image emojis automatically when the server allows it.', footer: 'Interact → XP → Level → Unlock → Customize → Social',
    coin: 'Coin', shopTitle: 'Nexo Cosmetic Shop', buyHint: 'Use /buy item:<ID> to purchase.', inventoryTitle: 'Cosmetic Inventory', emptyInventory: 'You do not own any cosmetics yet.', notFound: 'Item not found.', owned: 'You already own this item.', insufficient: 'Not enough Coin. Required', purchased: 'Purchased', equipped: 'Equipped', notOwned: 'You do not own this item.',
    giftOnlyMembers: 'You can only gift Coin to another member.', giftDone: 'gifted',
    settingsTitle: 'Nexo Server Settings', enabled: 'On', disabled: 'Off', default: 'default', unset: 'Not set', language: 'Language', autoEmoji: 'Auto emoji', updated: 'Updated', resetSettings: 'Nexo settings have been reset to defaults.',
    onOff: 'Value must be on/off.', invalidNumber: 'Invalid numeric value.', invalidChannel: 'Text channel not found.', invalidColor: 'Color must use the format #63c5da.', languages: 'Supported languages: vi, en.', invalidSetting: 'Invalid setting.',
    needManage: 'You need Manage Server permission.', dataExported: 'Server data exported.', backupCreated: 'Backup created.', resetUser: 'Nexo data reset for', resetServer: 'All Nexo data for this server has been reset.',
    onlyServer: 'This command can only be used in a server.', noData: 'No leaderboard data yet.'
  }
};
function locale(settings) { return dictionaries[settings?.language] || dictionaries.vi; }
function t(settings, key) { return locale(settings)[key] ?? dictionaries.vi[key] ?? key; }
module.exports = { dictionaries, locale, t };
