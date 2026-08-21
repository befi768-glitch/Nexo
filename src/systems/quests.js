const c=require('../config');
function today(){return new Date().toISOString().slice(0,10)}
function ensureQuest(u){const d=today();if(u.quest.date!==d){u.quest.date=d;u.quest.progress={};u.quest.claimed={}}for(const q of c.quests)if(u.quest.progress[q.id]==null)u.quest.progress[q.id]=0}
function progress(u,id,n=1){ensureQuest(u);const q=c.quests.find(x=>x.id===id);if(!q)return false;u.quest.progress[id]=Math.min(q.target,u.quest.progress[id]+n);return true}
module.exports={today,ensureQuest,progress};
