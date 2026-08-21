const {SlashCommandBuilder,EmbedBuilder}=require('discord.js');
const c=require('./config'),db=require('./db');const {xpNeeded,addUserXp,addCompanionXp}=require('./systems/xp');const {check}=require('./systems/badges');const {ensureQuest,progress}=require('./systems/quests');
const builders=[
 new SlashCommandBuilder().setName('companion').setDescription('Xem Companion của server.'),
 new SlashCommandBuilder().setName('profile').setDescription('Xem hồ sơ Companion.').addUserOption(o=>o.setName('user').setDescription('Thành viên').setRequired(false)),
 new SlashCommandBuilder().setName('quest').setDescription('Xem nhiệm vụ hôm nay.'),
 new SlashCommandBuilder().setName('badges').setDescription('Xem huy hiệu.'),
 new SlashCommandBuilder().setName('progress').setDescription('Xem tiến trình server.'),
 new SlashCommandBuilder().setName('daily').setDescription('Nhận phần thưởng hằng ngày.')
].map(x=>x.toJSON());
function profile(member,u){const bs=u.badges.length?u.badges.map(id=>{const b=c.badges.find(x=>x.id===id);return b?`${b.icon} ${b.name}`:id}).join(' • '):'Chưa có huy hiệu';return new EmbedBuilder().setTitle(`👤 ${member.displayName}`).setDescription('Hồ sơ Companion').addFields({name:'⭐ Level',value:`${u.level}`,inline:true},{name:'✨ XP',value:`${u.xp}/${xpNeeded(u.level)}`,inline:true},{name:'🏅 Huy hiệu',value:bs}).setColor(0x63c5da)}
async function handle(i){if(!i.guildId)return i.reply({content:'Lệnh này chỉ dùng trong server.',ephemeral:true});const g=db.getGuild(i.guildId,c),u=db.getUser(i.guildId,i.user.id);
 if(i.commandName==='companion')return i.reply({embeds:[new EmbedBuilder().setTitle(`🤖 ${g.companion.name}`).setDescription('Companion đang sống cùng server này.').addFields({name:'⭐ Level',value:`${g.companion.level}`,inline:true},{name:'✨ XP',value:`${g.companion.xp}/${xpNeeded(g.companion.level)}`,inline:true},{name:'🌱 Tương tác',value:`${g.totalInteractions}`,inline:true}).setColor(0x63c5da)]});
 if(i.commandName==='profile'){progress(u,'profile-1');const m=i.options.getMember('user')||i.member;const tu=db.getUser(i.guildId,m.id),bs=check(tu);db.save();return i.reply({embeds:[profile(m,tu)],content:bs.length?`🏅 Mở khóa: ${bs.map(b=>`${b.icon} ${b.name}`).join(', ')}`:undefined})}
 if(i.commandName==='quest'){ensureQuest(u);db.save();const lines=c.quests.map(q=>`${(u.quest.progress[q.id]||0)>=q.target?'✅':'▫️'} **${q.name}** — ${u.quest.progress[q.id]||0}/${q.target}\n└ ${q.description} (+${q.reward} XP)`).join('\n\n');return i.reply({embeds:[new EmbedBuilder().setTitle('📜 Daily Quests').setDescription(lines).setColor(0x8ad6b8)]})}
 if(i.commandName==='badges'){const lines=c.badges.map(b=>`${u.badges.includes(b.id)?'🏅':'🔒'} ${b.icon} **${b.name}** — ${b.description}`).join('\n');return i.reply({embeds:[new EmbedBuilder().setTitle('🏅 Companion Badges').setDescription(lines).setColor(0xf2c94c)]})}
 if(i.commandName==='progress')return i.reply({embeds:[new EmbedBuilder().setTitle('🌍 Server Progress').addFields({name:'🤖 Companion',value:`${g.companion.name} — Level ${g.companion.level}`,inline:true},{name:'✨ Tổng XP',value:`${g.totalXp}`,inline:true},{name:'💬 Tương tác',value:`${g.totalInteractions}`,inline:true}).setColor(0x63c5da)]});
 if(i.commandName==='daily'){const now=Date.now(),day=86400000;if(now-u.daily.lastClaim<day){const h=Math.ceil((day-(now-u.daily.lastClaim))/3600000);return i.reply({content:`⏳ Bạn đã điểm danh hôm nay. Quay lại sau khoảng ${h} giờ.`,ephemeral:true})}const yesterday=u.daily.lastClaim&&now-u.daily.lastClaim<day*2;u.daily.streak=yesterday?u.daily.streak+1:1;u.daily.lastClaim=now;addUserXp(u,c.xp.daily);addCompanionXp(g,Math.floor(c.xp.daily/2));progress(u,'daily-1');const bs=check(u);db.save();return i.reply({content:`🌞 Điểm danh thành công! **+${c.xp.daily} XP** • Streak: **${u.daily.streak}**${bs.length?`\n🏅 ${bs.map(b=>`${b.icon} ${b.name}`).join(', ')}`:''}`})}
}
module.exports={builders,handle};
