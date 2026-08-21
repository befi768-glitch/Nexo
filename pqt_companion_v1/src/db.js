const fs=require('node:fs'),path=require('node:path');
const dir=path.join(process.cwd(),'data'),file=path.join(dir,'database.json');
const defaults={guilds:{},users:{}};
function load(){fs.mkdirSync(dir,{recursive:true});if(!fs.existsSync(file)){fs.writeFileSync(file,JSON.stringify(defaults,null,2));return structuredClone(defaults)}try{return JSON.parse(fs.readFileSync(file,'utf8'))}catch{return structuredClone(defaults)}}
let data=load();
function save(){fs.mkdirSync(dir,{recursive:true});const tmp=file+'.tmp';fs.writeFileSync(tmp,JSON.stringify(data,null,2));fs.renameSync(tmp,file)}
function getGuild(id,c){if(!data.guilds[id]){data.guilds[id]={id,companion:{name:c.companion.defaultName,level:1,xp:0,createdAt:Date.now()},totalXp:0,totalInteractions:0};save()}return data.guilds[id]}
function getUser(guildId,userId){const k=`${guildId}:${userId}`;if(!data.users[k]){data.users[k]={guildId,userId,xp:0,level:1,badges:[],daily:{lastClaim:0,streak:0},quest:{date:'',progress:{},claimed:{}},lastMessageXp:0};save()}return data.users[k]}
module.exports={getGuild,getUser,save};
