module.exports={
 companion:{defaultName:'Luma',defaultLevel:1,defaultXp:0},
 xp:{messageMin:8,messageMax:15,messageCooldownMs:60000,daily:50},
 quests:[
  {id:'chat-10',name:'Người trò chuyện',description:'Gửi 10 tin nhắn hợp lệ hôm nay.',target:10,reward:100},
  {id:'daily-1',name:'Điểm danh',description:'Nhận phần thưởng /daily.',target:1,reward:60},
  {id:'profile-1',name:'Làm quen',description:'Xem hồ sơ của chính bạn.',target:1,reward:40}
 ],
 badges:[
  {id:'first-contact',name:'First Contact',icon:'🌱',description:'Tương tác với Companion lần đầu.'},
  {id:'level-5',name:'Growing',icon:'🌿',description:'Đạt Level 5.'},
  {id:'level-10',name:'Companion',icon:'✨',description:'Đạt Level 10.'},
  {id:'daily-7',name:'Consistent',icon:'📅',description:'Điểm danh 7 ngày.'}
 ]
};
