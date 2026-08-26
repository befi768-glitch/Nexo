import { db } from "../db.js";
import { assertCanPlay, lockForTwelveHours } from "./playerState.js";

const MAX_CHARGES = 5;
const RECHARGE_MS = 30 * 60 * 1000;
const SESSION_MS = 90 * 1000;

type Choice = {
  id: string;
  label: string;
  result: string;
  coin: number;
  reputation: number;
  hp?: number;
  xp?: number;
  worldDanger: number;
  worldTrust: number;
  identity?: Partial<Record<"compassion"|"ruthlessness"|"curiosity"|"knowledge", number>>;
  memory?: { key: string; value: string };
  faction?: { id: string; delta: number };
};

type Adventure = {
  id: string;
  title: string;
  description: string;
  weight?: number;
  minDanger?: number;
  maxDanger?: number;
  requiresMemory?: string;
  choices: Choice[];
};

export const ADVENTURES: Adventure[] = [
  { id:"road_lantern", title:"🏮 Ngọn đèn bên đường", description:"Một ngọn đèn cháy giữa nơi đáng lẽ không có ai sống. Ánh sáng lay động dù gió đã ngừng.", choices:[
    {id:"approach",label:"🏮 Tiến lại gần",result:"Bạn thấy một người phụ nữ đang sửa chiếc đèn cũ.",coin:20,reputation:3,hp:-3,xp:12,worldDanger:-1,worldTrust:3,identity:{curiosity:2,knowledge:1},memory:{key:"met_lantern_keeper",value:"Bạn từng gặp người giữ đèn."}},
    {id:"observe",label:"👁️ Quan sát từ xa",result:"Bạn nhận ra chiếc đèn đang đánh dấu một con đường bí mật.",coin:10,reputation:1,hp:-2,xp:18,worldDanger:1,worldTrust:0,identity:{knowledge:3}},
    {id:"leave",label:"🚶 Đi tiếp",result:"Bạn không muốn can thiệp vào chuyện chưa hiểu.",coin:5,reputation:1,hp:0,xp:6,worldDanger:2,worldTrust:-2,identity:{ruthlessness:1}}
  ]},
  { id:"wounded_stranger", title:"🌲 Người lạ bị thương", description:"Một người lạ nằm bên vệ đường. Anh ta vẫn còn tỉnh và liên tục nhìn về phía rừng.", choices:[
    {id:"help",label:"❤️ Giúp người đó",result:"Bạn băng bó vết thương và đưa anh ta đến nơi an toàn.",coin:25,reputation:5,hp:-8,xp:20,worldDanger:-3,worldTrust:5,identity:{compassion:4},memory:{key:"saved_stranger",value:"Bạn đã cứu một người lạ bên rừng."},faction:{id:"forest_wardens",delta:3}},
    {id:"search",label:"💰 Lục túi",result:"Bạn tìm thấy vài đồng coin rồi rời đi trước khi anh ta kịp phản ứng.",coin:80,reputation:-8,hp:-4,xp:12,worldDanger:4,worldTrust:-6,identity:{ruthlessness:4}},
    {id:"ask",label:"❓ Hỏi chuyện",result:"Anh ta kể rằng trong rừng có thứ gì đó đang thức dậy.",coin:10,reputation:2,hp:-5,xp:24,worldDanger:2,worldTrust:2,identity:{knowledge:3},memory:{key:"heard_forest_warning",value:"Bạn từng nghe cảnh báo về thứ đang thức dậy trong rừng."}}
  ]},
  { id:"merchant_caravan", title:"🐎 Đoàn thương nhân", description:"Một đoàn thương nhân dừng lại trước vùng đất có quá nhiều dấu chân ma thú.", choices:[
    {id:"escort",label:"🛡️ Hộ tống",result:"Bạn giúp đoàn thương nhân vượt qua vùng nguy hiểm.",coin:55,reputation:5,hp:-12,xp:30,worldDanger:-4,worldTrust:6,identity:{compassion:2},faction:{id:"wandering_merchants",delta:5},memory:{key:"helped_merchants",value:"Đoàn thương nhân nhớ rằng bạn từng giúp họ."}},
    {id:"watch",label:"👁️ Theo dõi",result:"Bạn phát hiện một người trong đoàn đang giấu thứ gì đó.",coin:20,reputation:1,hp:-6,xp:28,worldDanger:2,worldTrust:1,identity:{curiosity:3,knowledge:2},memory:{key:"noticed_merchant_secret",value:"Bạn từng nhận ra bí mật trong một đoàn thương nhân."}},
    {id:"avoid",label:"🚶 Tránh mặt",result:"Bạn không muốn dính vào chuyện của người khác.",coin:8,reputation:1,hp:0,xp:8,worldDanger:3,worldTrust:-3,identity:{ruthlessness:1}}
  ]},
  { id:"forest_cry", title:"🕳️ Tiếng khóc trong hang", description:"Một tiếng khóc yếu ớt vọng ra từ hang đá. Không có dấu chân đi vào, nhưng có rất nhiều dấu chân đi ra.", minDanger:10, choices:[
    {id:"enter",label:"🔦 Đi vào",result:"Bạn bước vào bóng tối và tìm thấy dấu vết của một nghi lễ cũ.",coin:25,reputation:3,hp:-15,xp:35,worldDanger:5,worldTrust:1,identity:{curiosity:4,knowledge:3},memory:{key:"entered_crying_cave",value:"Bạn đã bước vào hang đá nơi tiếng khóc vang lên."}},
    {id:"call",label:"📢 Gọi từ ngoài",result:"Tiếng khóc ngừng lại. Một giọng nói thì thầm tên bạn.",coin:15,reputation:2,hp:-5,xp:22,worldDanger:1,worldTrust:2,identity:{knowledge:2}},
    {id:"leave",label:"🚶 Rời đi",result:"Bạn chọn không tìm hiểu thêm.",coin:5,reputation:1,hp:0,xp:7,worldDanger:2,worldTrust:-1,identity:{ruthlessness:1}}
  ]},
  { id:"temple_sigil", title:"⛩️ Ký hiệu trên đá", description:"Một phiến đá cổ có cùng ký hiệu xuất hiện trong giấc mơ của bạn.", minDanger:25, choices:[
    {id:"touch",label:"✋ Chạm vào",result:"Ký hiệu nóng lên rồi tắt. Trong đầu bạn còn lại một cái tên.",coin:20,reputation:5,hp:-10,xp:40,worldDanger:-2,worldTrust:4,identity:{knowledge:5,curiosity:2},memory:{key:"touched_old_sigil",value:"Bạn đã chạm vào một ký hiệu cổ và nghe thấy một cái tên."}},
    {id:"copy",label:"📜 Ghi lại",result:"Bạn ghi lại ký hiệu mà không chạm vào nó.",coin:15,reputation:2,hp:-3,xp:25,worldDanger:1,worldTrust:2,identity:{knowledge:4}},
    {id:"break",label:"⚒️ Phá phiến đá",result:"Bạn phá hủy thứ mình không hiểu. Một tiếng động vọng lên từ dưới đất.",coin:40,reputation:-4,hp:-12,xp:28,worldDanger:10,worldTrust:-6,identity:{ruthlessness:4}}
  ]},
  { id:"lantern_return", title:"🕯️ Người giữ đèn", description:"Bạn gặp lại người giữ chiếc đèn. Cô ấy nhìn bạn như thể đã biết bạn sẽ quay lại.", requiresMemory:"met_lantern_keeper", choices:[
    {id:"talk",label:"💬 Nói chuyện",result:"Cô ấy kể về một cánh cửa chỉ mở cho người đã từng đi lạc.",coin:35,reputation:6,hp:-4,xp:35,worldDanger:-1,worldTrust:5,identity:{knowledge:3,curiosity:3},memory:{key:"heard_lost_door",value:"Người giữ đèn đã kể cho bạn về cánh cửa của những kẻ đi lạc."}},
    {id:"ask_light",label:"🔎 Hỏi về ngọn đèn",result:"Cô ấy đưa bạn một mảnh kính đen rồi quay đi.",coin:20,reputation:3,hp:-3,xp:32,worldDanger:1,worldTrust:3,identity:{curiosity:4},memory:{key:"received_black_glass",value:"Bạn nhận một mảnh kính đen từ người giữ đèn."}}
  ]},
  { id:"blood_moon_watch", title:"🌑 Trăng Máu", description:"Mặt trăng đỏ bất thường. Trong vài phút, những cái bóng trên mặt đất không còn khớp với chủ nhân của chúng.", minDanger:70, weight:2, choices:[
    {id:"watch",label:"👁️ Nhìn lên",result:"Bạn thấy một hình bóng đứng trên mặt trăng.",coin:35,reputation:8,hp:-20,xp:55,worldDanger:7,worldTrust:0,identity:{curiosity:5,knowledge:3},memory:{key:"survived_blood_moon",value:"Bạn từng nhìn thấy hình bóng trên mặt trăng đỏ."}},
    {id:"hide",label:"🌑 Ẩn mình",result:"Bạn sống sót qua đêm mà không nhìn thấy điều gì rõ ràng.",coin:20,reputation:2,hp:-6,xp:24,worldDanger:-2,worldTrust:1,identity:{knowledge:2}},
    {id:"follow_shadow",label:"🚶 Đi theo cái bóng",result:"Bạn đi theo một cái bóng không có người sở hữu.",coin:50,reputation:-2,hp:-25,xp:65,worldDanger:10,worldTrust:-4,identity:{ruthlessness:2,curiosity:5},memory:{key:"followed_shadow",value:"Bạn từng đi theo một cái bóng không có chủ."}}
  ]}
];

function validateAdventureConsequences() {
  for (const adventure of ADVENTURES) {
    for (const choice of adventure.choices) {
      const positive = (choice.coin > 0) || (choice.reputation > 0) || ((choice.hp ?? 0) > 0) || ((choice.xp ?? 0) > 0) || (choice.worldTrust > 0) || (choice.worldDanger < 0);
      const negative = (choice.coin < 0) || (choice.reputation < 0) || ((choice.hp ?? 0) < 0) || (choice.worldTrust < 0) || (choice.worldDanger > 0);
      if (!positive || !negative) throw new Error(`INVALID_ADVENTURE_BALANCE:${adventure.id}:${choice.id}`);
    }
  }
}
validateAdventureConsequences();

function clamp(n:number){ return Math.max(0,Math.min(100,n)); }

async function refreshCharges(playerId:string) {
  let state = await db.explorationState.findUnique({where:{playerId}});
  if (!state) state = await db.explorationState.create({data:{playerId,charges:MAX_CHARGES,maxCharges:MAX_CHARGES}});
  if (state.charges >= state.maxCharges || !state.rechargeAt) return state;
  const now = Date.now();
  const elapsed = now - state.rechargeAt.getTime();
  const gained = Math.floor(elapsed / RECHARGE_MS);
  if (gained <= 0) return state;
  const charges = Math.min(state.maxCharges,state.charges+gained);
  const rechargeAt = charges >= state.maxCharges ? null : new Date(state.rechargeAt.getTime()+gained*RECHARGE_MS);
  return db.explorationState.update({where:{playerId},data:{charges,rechargeAt}});
}

async function eligibleAdventures(playerId:string,guildId:string) {
  const player = await db.player.findUnique({where:{id:playerId},include:{memories:true}});
  const world = await db.worldState.upsert({where:{guildId},create:{guildId},update:{}});
  const completed = await db.choiceLog.findMany({where:{playerId},select:{eventId:true}});
  const done = new Set(completed.map(x=>x.eventId));
  const memory = new Set(player?.memories.map(x=>x.key) ?? []);
  return ADVENTURES.filter(a => !done.has(a.id) && (a.minDanger === undefined || world.forestDanger >= a.minDanger) && (a.maxDanger === undefined || world.forestDanger <= a.maxDanger) && (!a.requiresMemory || memory.has(a.requiresMemory)));
}

export async function getAdventureForPlayer(discordId:string,guildId:string) {
  const player = await assertCanPlay(discordId)({where:{discordId}});
  if (!player) throw new Error("PLAYER_NOT_FOUND");
  const existing = await db.adventureSession.findFirst({where:{playerId:player.id,status:"ACTIVE"}});
  if (existing) {
    if (existing.expiresAt <= new Date()) {
      await db.adventureSession.update({where:{id:existing.id},data:{status:"EXPIRED"}});
    } else {
      const adventure = ADVENTURES.find(a=>a.id===existing.adventureId);
      if (adventure) return {adventure,session:existing};
    }
  }
  const state = await refreshCharges(player.id);
  if (state.charges <= 0) throw new Error("NO_EXPLORATION");
  const pool = await eligibleAdventures(player.id,guildId);
  if (!pool.length) throw new Error("NO_ADVENTURES");
  const total = pool.reduce((s,a)=>s+(a.weight ?? 1),0);
  let roll = Math.random()*total;
  const adventure = pool.find(a => (roll -= (a.weight ?? 1)) <= 0) ?? pool[pool.length-1];
  const expiresAt = new Date(Date.now()+SESSION_MS);
  const session = await db.$transaction(async tx=>{
    await tx.explorationState.update({where:{playerId:player.id},data:{charges:{decrement:1},rechargeAt:state.charges>=state.maxCharges ? new Date(Date.now()+RECHARGE_MS) : state.rechargeAt ?? new Date(Date.now()+RECHARGE_MS)}});
    return tx.adventureSession.create({data:{playerId:player.id,guildId,adventureId:adventure.id,expiresAt}});
  });
  return {adventure,session};
}

export async function applyChoice(discordId:string, adventureId:string, choiceId:string, guildId:string) {
  const player = await assertCanPlay(discordId);
  const session = await db.adventureSession.findFirst({where:{playerId:player.id,status:"ACTIVE"}});
  if (!session || session.adventureId !== adventureId) throw new Error("ADVENTURE_NOT_ACTIVE");
  if (session.expiresAt <= new Date()) {
    await db.adventureSession.update({where:{id:session.id},data:{status:"EXPIRED"}});
    throw new Error("ADVENTURE_EXPIRED");
  }
  const adventure = ADVENTURES.find(a=>a.id===adventureId);
  const choice = adventure?.choices.find(c=>c.id===choiceId);
  if (!adventure || !choice) throw new Error("INVALID_CHOICE");

  const result = await db.$transaction(async tx=>{
    const claimed = await tx.adventureSession.updateMany({where:{id:session.id,status:"ACTIVE"},data:{status:"COMPLETED",completedAt:new Date()}});
    if (claimed.count !== 1) throw new Error("ADVENTURE_ALREADY_DONE");
    const hpDelta = choice.hp ?? 0;
    const xpDelta = choice.xp ?? 0;
    const nextHp = Math.max(0, Math.min(player.maxHp, player.hp + hpDelta));
    const gameplayLockedUntil = nextHp <= 0 ? lockForTwelveHours() : null;
    const updated = await tx.player.update({where:{id:player.id},data:{hp:nextHp,gameplayLockedUntil,xp:{increment:xpDelta},coin:{increment:choice.coin},reputation:{increment:choice.reputation},compassion:{increment:choice.identity?.compassion ?? 0},ruthlessness:{increment:choice.identity?.ruthlessness ?? 0},curiosity:{increment:choice.identity?.curiosity ?? 0},knowledge:{increment:choice.identity?.knowledge ?? 0}}});
    const currentWorld = await tx.worldState.upsert({where:{guildId},create:{guildId},update:{}});
    const world = await tx.worldState.update({where:{guildId},data:{forestDanger:clamp(currentWorld.forestDanger + choice.worldDanger),forestTrust:clamp(currentWorld.forestTrust + choice.worldTrust)}});
    await tx.choiceLog.create({data:{playerId:player.id,eventId:adventure.id,choiceId,result:choice.result}});
    if (choice.memory) await tx.playerMemory.upsert({where:{playerId_key:{playerId:player.id,key:choice.memory.key}},create:{playerId:player.id,key:choice.memory.key,value:choice.memory.value},update:{value:choice.memory.value}});
    if (choice.faction) await tx.factionStanding.upsert({where:{playerId_factionId:{playerId:player.id,factionId:choice.faction.id}},create:{playerId:player.id,factionId:choice.faction.id,value:choice.faction.delta},update:{value:{increment:choice.faction.delta}}});
    return {updated,world};
  });

  // Card discovery is deliberately separate from the reward. It is rare and condition-based.
  const refreshed = await db.player.findUnique({where:{id:player.id},include:{cards:true,memories:true}});
  const known = new Set(refreshed?.cards.map(c=>c.cardId) ?? []);
  const mem = new Set(refreshed?.memories.map(m=>m.key) ?? []);
  let cardId: string | null = null;
  const world = await db.worldState.findUnique({where:{guildId}});
  // Card discovery is deliberately rare and separate from Adventure rewards.
  // Common cards are discoverable early, but never guaranteed.
  const curiosityBonus = Math.min(0.04, (refreshed?.curiosity ?? 0) * 0.002);
  if (!known.has("ember") && adventureId === "road_lantern" && Math.random() < 0.07 + curiosityBonus) cardId = "ember";
  else if (!known.has("iron_guard") && adventureId === "wounded_stranger" && choiceId === "help" && Math.random() < 0.06 + curiosityBonus) cardId = "iron_guard";
  else if (!known.has("wanderer") && adventureId === "merchant_caravan" && choiceId === "watch" && Math.random() < 0.055 + curiosityBonus) cardId = "wanderer";
  else if (world?.forestDanger >= 70 && mem.has("survived_blood_moon") && !known.has("blood_moon") && Math.random() < 0.08) cardId = "blood_moon";
  else if (mem.has("received_black_glass") && !known.has("moon_seer") && Math.random() < 0.05) cardId = "moon_seer";
  else if (mem.has("entered_crying_cave") && !known.has("thorn_beast") && Math.random() < 0.04) cardId = "thorn_beast";

  let discoveredCard:any = null;
  if (cardId) {
    discoveredCard = await db.playerCard.upsert({where:{playerId_cardId:{playerId:player.id,cardId}},create:{playerId:player.id,cardId,memory:`Discovered during ${adventure.title}`},update:{}});
  }
  return {
    adventure,
    choice,
    world: result.world,
    ko: result.updated.hp === 0,
    lockedUntil: result.updated.gameplayLockedUntil,
    discoveredCard: discoveredCard ? await db.playerCard.findUnique({where:{id:discoveredCard.id},include:{card:true}}) : null
  };
}
