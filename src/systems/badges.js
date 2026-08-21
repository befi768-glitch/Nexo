const c=require('../config');
function award(u,id){if(u.badges.includes(id))return false;u.badges.push(id);return true}
function check(u){const ids=[];if(award(u,'first-contact'))ids.push('first-contact');if(u.level>=5&&award(u,'level-5'))ids.push('level-5');if(u.level>=10&&award(u,'level-10'))ids.push('level-10');if(u.daily.streak>=7&&award(u,'daily-7'))ids.push('daily-7');return ids.map(id=>c.badges.find(b=>b.id===id)).filter(Boolean)}
module.exports={check};
