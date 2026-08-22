const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, AttachmentBuilder } = require("discord.js");
const config = require("./config");
const db = require("./db");
const { xpNeeded, addUserXp, addCompanionXp, ensureQuest, questProgress, checkBadges, stage } = require("./systems");
const { emoji } = require("./emoji");

const builders = [
  new SlashCommandBuilder().setName("help").setDescription("Xem hướng dẫn sử dụng Nexo."),
  new SlashCommandBuilder().setName("companion").setDescription("Xem Nexo và tiến hóa hiện tại."),
  new SlashCommandBuilder().setName("profile").setDescription("Xem hồ sơ thành viên.").addUserOption(o => o.setName("user").setDescription("Thành viên cần xem").setRequired(false)),
  new SlashCommandBuilder().setName("leaderboard").setDescription("Xem bảng xếp hạng.").addStringOption(o => o.setName("type").setDescription("Tiêu chí xếp hạng").setRequired(false).addChoices({ name: "XP", value: "xp" }, { name: "Streak", value: "streak" }, { name: "Badges", value: "badges" })),
  new SlashCommandBuilder().setName("quest").setDescription("Xem hoặc nhận thưởng quest.").addSubcommand(s => s.setName("list").setDescription("Xem quest hôm nay")).addSubcommand(s => s.setName("claim").setDescription("Nhận thưởng các quest đã hoàn thành")),
  new SlashCommandBuilder().setName("badges").setDescription("Xem bộ sưu tập huy hiệu."),
  new SlashCommandBuilder().setName("progress").setDescription("Xem tiến trình của server."),
  new SlashCommandBuilder().setName("memory").setDescription("Xem ký ức gần đây của server."),
  new SlashCommandBuilder().setName("daily").setDescription("Nhận phần thưởng hằng ngày."),
  new SlashCommandBuilder().setName("settings").setDescription("Cấu hình Nexo cho server.").setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(s => s.setName("view").setDescription("Xem cấu hình hiện tại"))
    .addSubcommand(s => s.setName("set").setDescription("Thay đổi một thiết lập")
      .addStringOption(o => o.setName("key").setDescription("Thiết lập").setRequired(true).addChoices(
        { name: "XP", value: "xpEnabled" }, { name: "Daily", value: "dailyEnabled" }, { name: "Level-up channel", value: "levelUpChannelId" },
        { name: "Cooldown (giây)", value: "cooldownMs" }, { name: "XP tối thiểu", value: "xpMin" }, { name: "XP tối đa", value: "xpMax" },
        { name: "Màu embed", value: "embedColor" }, { name: "Ngôn ngữ", value: "language" }, { name: "Auto emoji", value: "autoEmoji" }
      ))
      .addStringOption(o => o.setName("value").setDescription("Giá trị mới").setRequired(true)))
    .addSubcommand(s => s.setName("reset").setDescription("Đưa cấu hình về mặc định")),
  new SlashCommandBuilder().setName("data").setDescription("Quản lý dữ liệu Nexo.").setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(s => s.setName("export").setDescription("Xuất dữ liệu server"))
    .addSubcommand(s => s.setName("backup").setDescription("Tạo backup dữ liệu"))
    .addSubcommand(s => s.setName("reset-user").setDescription("Reset dữ liệu một thành viên").addUserOption(o => o.setName("user").setDescription("Thành viên").setRequired(true)))
    .addSubcommand(s => s.setName("reset-server").setDescription("Reset toàn bộ dữ liệu server")),
  new SlashCommandBuilder().setName("shop").setDescription("Xem shop cosmetic Nexo."),
  new SlashCommandBuilder().setName("buy").setDescription("Mua cosmetic bằng Coin.").addStringOption(o => o.setName("item").setDescription("ID vật phẩm").setRequired(true)),
  new SlashCommandBuilder().setName("inventory").setDescription("Xem kho cosmetic của bạn."),
  new SlashCommandBuilder().setName("equip").setDescription("Trang bị cosmetic.").addStringOption(o => o.setName("item").setDescription("ID vật phẩm").setRequired(true)),
  new SlashCommandBuilder().setName("gift").setDescription("Tặng Coin cho thành viên.").addUserOption(o => o.setName("user").setDescription("Người nhận").setRequired(true)).addIntegerOption(o => o.setName("amount").setDescription("Số Coin").setMinValue(1).setMaxValue(1000).setRequired(true)),
  new SlashCommandBuilder().setName("rename").setDescription("Đổi tên Nexo.").addStringOption(o => o.setName("name").setDescription("Tên mới").setMinLength(2).setMaxLength(24).setRequired(true)).setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
].map(x => x.toJSON());

function progressBar(current, total, size = 12) { const ratio = total ? Math.min(1, current / total) : 0; const filled = Math.round(ratio * size); return `${"█".repeat(filled)}${"░".repeat(size - filled)} ${Math.floor(ratio * 100)}%`; }
function profileEmbed(member, user) {
  const need = xpNeeded(user.level);
  const badges = user.badges.length
    ? user.badges.map(id => { const b = config.badges.find(x => x.id === id); return b ? `${b.icon} ${b.name}` : id; }).join(" • ")
    : "Chưa có huy hiệu";
  const title = user.equipped?.title ? config.economy.shop.find(x => x.id === user.equipped.title)?.name : null;
  const frame = user.equipped?.frame ? config.economy.shop.find(x => x.id === user.equipped.frame)?.name : "Mặc định";
  return new EmbedBuilder()
    .setTitle(`${emoji.profile()} ${member.displayName}${title ? ` • ${title}` : ""}`)
    .setDescription(`**Level ${user.level}**\n${progressBar(user.xp, need)}\n${emoji.xp()} ${user.xp}/${need} XP đến Level ${user.level + 1}`)
    .addFields(
      { name: `${emoji.streak()} Streak`, value: `${user.daily.streak} ngày`, inline: true },
      { name: "🪙 Coin", value: `${user.coins || 0}`, inline: true },
      { name: `${emoji.badge()} Huy hiệu`, value: `${user.badges.length}/${config.badges.length}`, inline: true },
      { name: `${emoji.glow()} Evolution`, value: "Mở theo Level của Nexo", inline: true },
      { name: "🎨 Cosmetic", value: `Frame: ${frame}\nTitle: ${title || "Chưa trang bị"}`, inline: true },
      { name: `${emoji.badge()} Bộ sưu tập`, value: badges }
    )
    .setThumbnail(member.displayAvatarURL({ size: 256 }))
    .setColor(0x63c5da)
    .setFooter({ text: "Nexo v2.6 • Identity → Economy" });
}
function helpEmbed() { return new EmbedBuilder().setTitle(`${emoji.companion()} Nexo — Bắt đầu trong 60 giây`).setDescription("Nexo là companion của server. Bạn tương tác, nhận XP, lên level, hoàn thành quest và mở khóa thành tích.").addFields({ name: "🚀 Bắt đầu", value: "`/profile` — xem hồ sơ\n`/daily` — nhận XP hằng ngày\n`/quest list` — xem quest hôm nay" }, { name: "🏆 Tiến trình", value: "`/leaderboard` — bảng xếp hạng\n`/badges` — huy hiệu\n`/companion` — Nexo & evolution\n`/progress` — tiến trình server\n`/shop` — cosmetic\n`/inventory` — kho đồ\n`/profile` — xem Coin & cosmetic" }, { name: "🛠️ Admin", value: "`/settings view` — cấu hình\n`/settings set` — chỉnh XP, daily, channel...\n`/data export` — xuất dữ liệu" }, { name: "✨ Image Emoji", value: "Nexo có thể tự provision emoji nếu server cho phép." }).setColor(0x63c5da).setFooter({ text: "Nexo v2.4 • Tương tác → XP → Level → Unlock → Server" }); }
function settingsEmbed(guild) { const s=guild.settings; return new EmbedBuilder().setTitle("⚙️ Nexo Server Settings").addFields({name:"XP",value:`${s.xpEnabled ? "Bật" : "Tắt"} • Cooldown: ${s.cooldownMs ?? "mặc định"} ms • Range: ${s.xpMin ?? config.xp.messageMin}-${s.xpMax ?? config.xp.messageMax}`,inline:false},{name:"Daily",value:s.dailyEnabled?"Bật":"Tắt",inline:true},{name:"Level-up channel",value:s.levelUpChannelId?`<#${s.levelUpChannelId}>`:"Không chọn",inline:true},{name:"Embed color",value:s.embedColor,inline:true},{name:"Language",value:s.language,inline:true},{name:"Auto emoji",value:s.autoEmoji?"Bật":"Tắt",inline:true}).setColor(parseInt(s.embedColor.replace("#",""),16)); }
function parseSetting(key, value, interaction) { if (["xpEnabled","dailyEnabled","autoEmoji"].includes(key)) { if (!["on","off","true","false","bật","tắt"].includes(value.toLowerCase())) throw new Error("Giá trị phải là on/off."); return ["on","true","bật"].includes(value.toLowerCase()); } if (["cooldownMs","xpMin","xpMax"].includes(key)) { const n=Number(value); if (!Number.isInteger(n) || n<0 || n>3600000) throw new Error("Giá trị số không hợp lệ."); return key === "cooldownMs" ? n*1000 : n; } if (key === "levelUpChannelId") { const ch=interaction.guild.channels.cache.get(value.replace(/[<#>]/g,"")); if (!ch?.isTextBased()) throw new Error("Không tìm thấy text channel."); return ch.id; } if (key === "embedColor") { if (!/^#[0-9a-f]{6}$/i.test(value)) throw new Error("Màu phải có dạng #63c5da."); return value; } if (key === "language") { if (!config.settings.allowedLanguages.includes(value.toLowerCase())) throw new Error("Ngôn ngữ hỗ trợ: vi, en."); return value.toLowerCase(); } throw new Error("Thiết lập không hợp lệ."); }

async function handle(interaction) {
  const guildId=interaction.guildId; if(!guildId) return interaction.reply({content:"Lệnh này chỉ dùng trong server.",ephemeral:true});
  const guild=await db.getGuild(guildId,config); const user=await db.getUser(guildId,interaction.user.id);
  if(interaction.commandName==="help") return interaction.reply({embeds:[helpEmbed()]});
  if(interaction.commandName==="companion"){const s=stage(guild); return interaction.reply({embeds:[new EmbedBuilder().setTitle(`${s.icon} ${guild.companion.name}`).setDescription(s.description).addFields({name:"Level",value:String(guild.companion.level),inline:true},{name:"XP",value:`${guild.companion.xp}/${xpNeeded(guild.companion.level)}`,inline:true},{name:"Stage",value:s.name,inline:true},{name:"Interactions",value:String(guild.totalInteractions),inline:true}).setColor(0x63c5da)]});}
  if(interaction.commandName==="profile"){questProgress(user,"profile");const target=interaction.options.getMember("user")||interaction.member;const targetUser=await db.getUser(guildId,target.id);const badges=checkBadges(targetUser,guild);await db.saveUser(targetUser);await db.saveGuild(guild);return interaction.reply({content:badges.length?`${emoji.badge()} Mở khóa: ${badges.map(b=>`${b.icon} ${b.name}`).join(", ")}`:undefined,embeds:[profileEmbed(target,targetUser)]});}
  if(interaction.commandName==="leaderboard"){const type=interaction.options.getString("type")||"xp";const users=await db.getLeaderboard(guildId,type,10);const labels={xp:"XP",streak:"Streak",badges:"Badges"};if(!users.length)return interaction.reply({content:"Chưa có dữ liệu leaderboard.",ephemeral:true});const lines=await Promise.all(users.map(async(u,i)=>{const member=await interaction.guild.members.fetch(u.userId).catch(()=>null);const name=member?.displayName||`<@${u.userId}>`;const value=type==="streak"?`${u.daily.streak} ngày`:type==="badges"?`${u.badges.length} badge`:`Level ${u.level} • ${u.xp} XP`;return `**${i+1}.** ${name} — ${value}`;}));return interaction.reply({embeds:[new EmbedBuilder().setTitle(`${emoji.progress()} Leaderboard • ${labels[type]}`).setDescription(lines.join("\n")).setColor(0xf2c94c).setFooter({text:"Top 10 • Nexo v2.4"})]});}
  if(interaction.commandName==="quest"){ensureQuest(user);const sub=interaction.options.getSubcommand();if(sub==="claim"){let total=0,claimed=[];for(const q of config.quests)if(user.quest.progress[q.id]>=q.target&&!user.quest.claimed[q.id]){user.quest.claimed[q.id]=true;total+=q.reward;claimed.push(q.name);}if(!total)return interaction.reply({content:"Chưa có quest nào đủ điều kiện nhận thưởng.",ephemeral:true});const levels=addUserXp(user,total);addCompanionXp(guild,Math.floor(total/2));const badges=checkBadges(user,guild);await db.saveUser(user);await db.saveGuild(guild);return interaction.reply({content:`${emoji.reward()} Nhận **${total} XP** từ: ${claimed.join(", ")}${levels?`\n${emoji.xp()} Bạn lên Level **${user.level}**!`:""}${badges.length?`\n${emoji.badge()} ${badges.map(b=>`${b.icon} ${b.name}`).join(", ")}`:""}`});}const lines=config.quests.map(q=>`${user.quest.progress[q.id]>=q.target?emoji.check():emoji.empty()} **${q.name}** — ${user.quest.progress[q.id]}/${q.target} — +${q.reward} XP\n└ ${q.description}`);await db.saveUser(user);return interaction.reply({embeds:[new EmbedBuilder().setTitle(`${emoji.quest()} Daily Quests`).setDescription(lines.join("\n\n")).setFooter({text:"Dùng /quest claim khi quest hoàn thành."}).setColor(0x8ad6b8)]});}
  if(interaction.commandName==="badges"){const lines=config.badges.map(b=>`${user.badges.includes(b.id)?emoji.badge():emoji.locked()} ${b.icon} **${b.name}** — ${b.description}`);return interaction.reply({embeds:[new EmbedBuilder().setTitle(`${emoji.badge()} Nexo Badges`).setDescription(lines.join("\n")).setColor(0xf2c94c)]});}
  if(interaction.commandName==="progress"){const next=config.milestones.find(m=>!guild.milestones.includes(m.id));const unlocked=config.milestones.filter(m=>guild.milestones.includes(m.id)).map(m=>`${m.icon} ${m.name}`).join(" • ")||"Chưa có milestone";const nextText=next?`${next.icon} ${next.name} — còn ${Math.max(0,next.target-guild.totalInteractions)} interactions`:"Đã hoàn thành toàn bộ milestone hiện tại 🎉";return interaction.reply({embeds:[new EmbedBuilder().setTitle(`${emoji.progress()} Server Progress`).addFields({name:"Nexo",value:`${guild.companion.name} — Level ${guild.companion.level}`,inline:true},{name:"Tổng XP",value:String(guild.totalXp),inline:true},{name:"Interactions",value:String(guild.totalInteractions),inline:true},{name:"Milestone tiếp theo",value:nextText},{name:"Đã mở khóa",value:unlocked}).setColor(0x63c5da)]});}
  if(interaction.commandName==="memory"){const memories=await db.getMemories(guildId,8);const desc=memories.length?memories.map(m=>`${m.icon||emoji.memory()} **${m.title}**\n${m.text}`).join("\n\n"):"Server chưa có ký ức nào.";return interaction.reply({embeds:[new EmbedBuilder().setTitle(`${emoji.memory()} Nexo Memory`).setDescription(desc).setColor(0x8c7ae6)]});}
  if(interaction.commandName==="daily"){if(!guild.settings.dailyEnabled)return interaction.reply({content:"Admin đã tắt Daily cho server này.",ephemeral:true});const now=Date.now(),day=86400000;if(now-user.daily.lastClaim<day){const hours=Math.ceil((day-(now-user.daily.lastClaim))/3600000);return interaction.reply({content:`${emoji.wait()} Bạn đã điểm danh hôm nay. Quay lại sau khoảng ${hours} giờ.`,ephemeral:true});}const yesterday=user.daily.lastClaim&&now-user.daily.lastClaim<day*2;user.daily.streak=yesterday?user.daily.streak+1:1;user.daily.lastClaim=now;addUserXp(user,config.xp.daily);addCompanionXp(guild,Math.floor(config.xp.daily/2));questProgress(user,"daily");const badges=checkBadges(user,guild);await db.saveUser(user);await db.saveGuild(guild);return interaction.reply({content:`${emoji.sun()} Điểm danh thành công! **+${config.xp.daily} XP** • Streak: **${user.daily.streak}**${badges.length?`\n${emoji.badge()} ${badges.map(b=>`${b.icon} ${b.name}`).join(", ")}`:""}`});}
  if(interaction.commandName==="shop"){const lines=config.economy.shop.map(x=>`**${x.id}** — ${x.name} • 🪙 ${x.price}\n└ ${x.description}`);return interaction.reply({embeds:[new EmbedBuilder().setTitle("🛍️ Nexo Cosmetic Shop").setDescription(lines.join("\n\n")).setFooter({text:"Dùng /buy item:<ID> để mua."}).setColor(0xf2c94c)]});}
  if(interaction.commandName==="buy"){const id=interaction.options.getString("item",true);const item=config.economy.shop.find(x=>x.id===id);if(!item)return interaction.reply({content:"Không tìm thấy vật phẩm.",ephemeral:true});if(user.inventory.includes(id))return interaction.reply({content:"Bạn đã sở hữu vật phẩm này.",ephemeral:true});if(!(await db.spendCoins(guildId,interaction.user.id,item.price)))return interaction.reply({content:`Không đủ Coin. Cần 🪙 ${item.price}.`,ephemeral:true});user.inventory.push(id);await db.saveUser(user);return interaction.reply({content:`🛍️ Đã mua **${item.name}** với 🪙 ${item.price}.`});}
  if(interaction.commandName==="inventory"){const items=user.inventory.map(id=>config.economy.shop.find(x=>x.id===id)).filter(Boolean);return interaction.reply({embeds:[new EmbedBuilder().setTitle("🎒 Kho cosmetic").setDescription(items.length?items.map(x=>`• **${x.name}** — \`${x.id}\``).join("\n"):"Bạn chưa có cosmetic nào.").addFields({name:"🪙 Coin",value:String(user.coins||0)}).setColor(0x8c7ae6)]});}
  if(interaction.commandName==="equip"){const id=interaction.options.getString("item",true);const item=config.economy.shop.find(x=>x.id===id);if(!item||!user.inventory.includes(id))return interaction.reply({content:"Bạn chưa sở hữu vật phẩm này.",ephemeral:true});user.equipped[item.type]=id;await db.saveUser(user);return interaction.reply({content:`✨ Đã trang bị **${item.name}**.`});}
  if(interaction.commandName==="gift"){const target=interaction.options.getUser("user",true), amount=interaction.options.getInteger("amount",true);if(target.bot||target.id===interaction.user.id)return interaction.reply({content:"Chỉ có thể tặng Coin cho thành viên khác.",ephemeral:true});if(!(await db.spendCoins(guildId,interaction.user.id,amount)))return interaction.reply({content:"Bạn không đủ Coin.",ephemeral:true});await db.addCoins(guildId,target.id,amount);return interaction.reply({content:`🎁 ${interaction.user} đã tặng **🪙 ${amount}** cho ${target}.`});}
  if(interaction.commandName==="settings"){if(!interaction.memberPermissions.has(PermissionFlagsBits.ManageGuild))return interaction.reply({content:"Bạn cần quyền Manage Server.",ephemeral:true});const sub=interaction.options.getSubcommand();if(sub==="view")return interaction.reply({embeds:[settingsEmbed(guild)],ephemeral:true});if(sub==="reset"){guild.settings=db.defaultSettings();await db.saveGuild(guild);return interaction.reply({content:"⚙️ Đã đưa cấu hình Nexo về mặc định.",ephemeral:true});}try{const key=interaction.options.getString("key",true),value=interaction.options.getString("value",true);guild.settings[key]=parseSetting(key,value,interaction);if(key==="xpMin"&&guild.settings.xpMax!=null&&guild.settings.xpMin>guild.settings.xpMax)throw new Error("XP tối thiểu không được lớn hơn XP tối đa.");if(key==="xpMax"&&guild.settings.xpMin!=null&&guild.settings.xpMax<guild.settings.xpMin)throw new Error("XP tối đa không được nhỏ hơn XP tối thiểu.");await db.saveGuild(guild);return interaction.reply({content:`⚙️ Đã cập nhật **${key}** → **${guild.settings[key]}**.`,ephemeral:true});}catch(e){return interaction.reply({content:`⚠️ ${e.message}`,ephemeral:true});}}
  if(interaction.commandName==="data") {
    if(!interaction.memberPermissions.has(PermissionFlagsBits.ManageGuild)) return interaction.reply({content:"Bạn cần quyền Manage Server.",ephemeral:true});
    const sub=interaction.options.getSubcommand();
    if(sub==="export") {
      const payload=await db.exportGuild(guildId,config);
      const buffer=Buffer.from(JSON.stringify(payload,null,2));
      return interaction.reply({content:"📦 Dữ liệu server đã được xuất.",files:[new AttachmentBuilder(buffer,{name:`nexo-${guildId}-export.json`})],ephemeral:true});
    }
    if(sub==="backup") {
      const file=await db.backup(`guild-${guildId}`);
      return interaction.reply({content:"💾 Backup đã tạo: "+file,ephemeral:true});
    }
    if(sub==="reset-user") {
      const target=interaction.options.getUser("user",true); await db.resetUser(guildId,target.id);
      return interaction.reply({content:`♻️ Đã reset dữ liệu Nexo của ${target}.`,ephemeral:true});
    }
    if(sub==="reset-server") {
      if(!interaction.memberPermissions.has(PermissionFlagsBits.Administrator)) return interaction.reply({content:"Reset server yêu cầu quyền Administrator.",ephemeral:true});
      await db.resetGuild(guildId,config);
      return interaction.reply({content:"⚠️ Đã reset toàn bộ dữ liệu Nexo của server.",ephemeral:true});
    }
  }
  if(interaction.commandName==="rename"){const name=interaction.options.getString("name",true).trim();if(!interaction.memberPermissions.has(PermissionFlagsBits.ManageGuild))return interaction.reply({content:"Bạn cần quyền Manage Server.",ephemeral:true});guild.companion.name=name;await db.saveGuild(guild);await db.addMemory(guildId,{title:"Nexo đổi tên",text:`Companion đã được đổi tên thành **${name}**.`,icon:emoji.glow(),createdAt:Date.now()});return interaction.reply({content:`${emoji.glow()} Nexo giờ có tên **${name}**.`});}
}
module.exports={commandBuilders:builders,handleCommand:handle,helpEmbed};
