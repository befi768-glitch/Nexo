require('dotenv').config();
const {Client,GatewayIntentBits,Events}=require('discord.js');
const db=require('./db'),c=require('./config');const {handle}=require('./commands');const {addUserXp,addCompanionXp,messageReward}=require('./systems/xp');const {progress}=require('./systems/quests');const {check}=require('./systems/badges');
const client=new Client({intents:[GatewayIntentBits.Guilds,GatewayIntentBits.GuildMessages,GatewayIntentBits.MessageContent]});
client.once(Events.ClientReady,x=>console.log(`PQT Companion V1 online as ${x.user.tag}`));
client.on(Events.InteractionCreate,async i=>{if(!i.isChatInputCommand())return;try{await handle(i)}catch(e){console.error(e);const p={content:'Đã xảy ra lỗi khi xử lý lệnh.',ephemeral:true};if(i.replied||i.deferred)await i.followUp(p);else await i.reply(p)}});
client.on(Events.MessageCreate,m=>{if(!m.guild||m.author.bot)return;const g=db.getGuild(m.guild.id,c),u=db.getUser(m.guild.id,m.author.id),r=messageReward(u);if(!r)return;addUserXp(u,r);addCompanionXp(g,Math.max(1,Math.floor(r/2)));g.totalInteractions++;progress(u,'chat-10');const bs=check(u);db.save();if(bs.length)console.log(`[BADGE] ${m.author.tag}: ${bs.map(b=>b.name).join(', ')}`)});
client.login(process.env.DISCORD_TOKEN);
