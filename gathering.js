const PICKAXES = {wooden:{label:"Wooden Pickaxe",multiplier:1,cost:null},stone:{label:"Stone Pickaxe",multiplier:1.5,cost:{Stone:12}},iron:{label:"Iron Pickaxe",multiplier:2,cost:{Iron:12,Stone:12}},diamond:{label:"Diamond Pickaxe",multiplier:3.5,cost:{"Diamond Ore":8,Iron:8}}};
const MINING = new Set(["Stone","Iron","Coal","Diamond Ore","Quartz","Ancient Debris","Glowstone","Nether Gold","End Stone","Obsidian","Redstone","Cobblestone","Flint","Gravel"]);
export function getPickaxes(){return PICKAXES;}
export function harvestProvince(state,provinceId){
  const p=state.provinces.find(x=>x.id===provinceId); if(!p) return {ok:false,message:"Select a province first."};
  if(p.owner!==state.playerId) return {ok:false,message:"You can only gather resources in your own provinces."};
  if(state.lastHarvestTurn[provinceId]===state.turn) return {ok:false,message:"This province has already been harvested this month."};
  const tool=state.activeTool&&state.tools[state.activeTool]?state.activeTool:"wooden";
  const multiplier=PICKAXES[tool].multiplier; const yields=[];
  for(const resource of p.resources){
    const base=resource==="Livestock"?2:resource==="Grain"?8:resource==="Timber"?6:resource==="Fish"?5:resource==="Cobblestone"?12:resource==="Gravel"?5:resource==="Flint"?2:3;
    const amount=Math.max(1,Math.floor(base*(MINING.has(resource)?multiplier:1)*(1+p.development*.12)));
    state.inventory[resource]=(state.inventory[resource]||0)+amount; yields.push(`${resource} +${amount}`);
  }
  state.lastHarvestTurn[provinceId]=state.turn;
  return {ok:true,message:`Gathered in ${p.name}: ${yields.join(", ")}.`,yields,tool};
}
export function purchasePickaxe(state,tier){
  const item=PICKAXES[tier];if(!item)return {ok:false,message:"Unknown pickaxe."};
  if(state.tools[tier])return {ok:false,message:`You already own a ${item.label}.`};
  for(const [resource,cost] of Object.entries(item.cost))if((state.inventory[resource]||0)<cost)return {ok:false,message:`Need ${cost} ${resource} to craft this pickaxe.`};
  for(const [resource,cost] of Object.entries(item.cost))state.inventory[resource]-=cost;
  state.tools[tier]=true;state.activeTool=tier;return {ok:true,message:`Crafted ${item.label}. Mining yield is now faster.`};
}
export function selectPickaxe(state,tier){if(!state.tools[tier])return {ok:false,message:"You have not crafted that pickaxe yet."};state.activeTool=tier;return {ok:true,message:`Equipped ${PICKAXES[tier].label}.`};}
