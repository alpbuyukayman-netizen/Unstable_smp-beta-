const KEY="unstableSmpRiseOfKingdoms.saves.v1";
export function getSaves(){try{return JSON.parse(localStorage.getItem(KEY)||"{}");}catch{return {};}}
export function saveSlot(slot,state){
  const saves=getSaves();saves[slot]={savedAt:new Date().toISOString(),state:JSON.parse(JSON.stringify(state))};localStorage.setItem(KEY,JSON.stringify(saves));return saves[slot];
}
export function loadSlot(slot){return getSaves()[slot]?.state||null;}
export function hasSaves(){return Object.keys(getSaves()).length>0;}
