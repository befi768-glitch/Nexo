const c=require('../config');
function xpNeeded(level){return 100+(level-1)*50}
function addUserXp(u,n){u.xp+=n;let leveled=false;while(u.xp>=xpNeeded(u.level)){u.xp-=xpNeeded(u.level);u.level++;leveled=true}return{leveled,level:u.level}}
function addCompanionXp(g,n){g.companion.xp+=n;g.totalXp+=n;let leveled=false;while(g.companion.xp>=xpNeeded(g.companion.level)){g.companion.xp-=xpNeeded(g.companion.level);g.companion.level++;leveled=true}return{leveled,level:g.companion.level}}
function messageReward(u){const now=Date.now();if(now-u.lastMessageXp<c.xp.messageCooldownMs)return 0;u.lastMessageXp=now;return Math.floor(Math.random()*(c.xp.messageMax-c.xp.messageMin+1))+c.xp.messageMin}
module.exports={xpNeeded,addUserXp,addCompanionXp,messageReward};
