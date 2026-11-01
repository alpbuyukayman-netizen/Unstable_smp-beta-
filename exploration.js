export const WORLD_SITES = [
  {id:"mafia_tomb",name:"Tomb of the Mafia",kind:"Famous Site",x:505,y:535,realm:"Overworld",description:"A sealed monument tied to the Invisible Mafia's rise. Rumours say its deepest chamber holds old records."},
  {id:"null_citadel",name:"Null Citadel",kind:"Capital Landmark",x:220,y:210,realm:"Overworld",description:"The fortified seat of the Null Army, watched over by its influential commander."},
  {id:"parrot_sky_gardens",name:"Parrot Sky Gardens",kind:"Famous Site",x:400,y:405,realm:"Overworld",description:"A highland sanctuary known for colourful gardens and old banners."},
  {id:"immortal_keep",name:"Immortal Keep",kind:"Capital Landmark",x:735,y:70,realm:"Overworld",description:"The stronghold of the Immortal Empire, famous for its vast stores and ancient halls."},
  {id:"crimson_keep",name:"Crimson Keep",kind:"Capital Landmark",x:90,y:590,realm:"Nether",description:"ClownPierce's Nether fortress, overlooking the crimson wastes."},
  {id:"ancient_library",name:"Ancient Library",kind:"Famous Site",x:550,y:225,realm:"Overworld",description:"A ruined archive containing maps, chronicles and clues to forgotten places."},
  {id:"whispering_caverns",name:"Whispering Caverns",kind:"Cave Entrance",x:315,y:250,realm:"Overworld",description:"A deep cave system with an unusual echo. Something is guarding its lower tunnels.",caveId:"whispering_caverns"},
  {id:"deepstone_cave",name:"Deepstone Cave",kind:"Cave Entrance",x:715,y:420,realm:"Overworld",description:"A mineral-rich cave with narrow passages and old mining marks.",caveId:"deepstone_cave"},
  {id:"outer_end_gate",name:"Outer End Gate",kind:"Realm Landmark",x:855,y:585,realm:"End",description:"A distant gateway among the End islands, reachable after the ancient portal is activated."}
];

export const MOB_SPAWNS = [
  {id:"overworld_enderman_1",name:"Enderman",realm:"Overworld",siteId:"ancient_library",loot:"Ender Pearl",count:1},
  {id:"overworld_enderman_2",name:"Enderman",realm:"Overworld",siteId:"null_citadel",loot:"Ender Pearl",count:1},
  {id:"overworld_enderman_3",name:"Enderman",realm:"Overworld",siteId:"mafia_tomb",loot:"Ender Pearl",count:1},
  {id:"nether_blaze",name:"Blaze",realm:"Nether",siteId:"crimson_keep",loot:"Blaze Rod",count:1},
  {id:"cave_skeleton",name:"Skeleton",realm:"Overworld",siteId:"whispering_caverns",loot:"Bone",count:1}
];
const FARM_COST={"Cobblestone":34,"Redstone":2,"Diamond":2,"Hopper":1};
export function initializeExploration(state){
  state.travel ||= {journey:null,locationId:state.playerId==="clown"?"crimson_keep":"parrot_sky_gardens"};
  if(state.playerId==="clown"&&state.travel.locationId==="parrot_sky_gardens")state.travel.locationId="crimson_keep";
  if(state.playerId==="clown"){state.netherPortal ||= {};state.netherPortal.built=true;state.netherPortal.entered=true;}
  state.discoveredSites ||= [];
  state.caves ||= {
    whispering_caverns:{discovered:true,skeletonAlive:true,cleared:false,portalFound:false},
    deepstone_cave:{discovered:false,skeletonAlive:false,cleared:false,portalFound:false}
  };
  state.endPortal ||= {activated:false,entered:false,dragonDefeated:false,endClaimed:false};
  state.netherPortal ||= {built:false,entered:false};
  state.mobSpawns ||= {};MOB_SPAWNS.forEach(m=>{state.mobSpawns[m.id] ||= {farmed:false,available:true};});
  state.playerId ||= "newparrot";
  if(state.characters?.null){state.characters.null.name="Spoke";state.characters.null.leftHandTotem=true;}
  return state;
}

export function startTravel(state,siteId){
  initializeExploration(state);
  const site=WORLD_SITES.find(s=>s.id===siteId);
  if(!site)return {ok:false,message:"That destination is not on the map."};
  if(state.travel.journey)return {ok:false,message:"Your party is already travelling."};
  if(site.realm==="End"&&!state.endPortal.entered)return {ok:false,message:"The End Gate is beyond the sealed portal. Activate and enter the underground End Portal first."};
  if(site.realm==="Nether"&&!state.netherPortal.entered&&state.playerId!=="clown")return {ok:false,message:"Build and enter your Nether Portal before travelling to Nether locations."};
  if(site.realm==="Nether"&&state.kingdoms[state.playerId].provinces.every(id=>state.provinces.find(p=>p.id===id)?.realm!=="Nether")){
    // Nether destinations are reachable by a longer expedition; no ownership requirement.
  }
  const from=WORLD_SITES.find(s=>s.id===state.travel.locationId);
  const distance=Math.hypot((from?.x??400)-site.x,(from?.y??400)-site.y);
  const turns=Math.max(1,Math.ceil(distance/330));
  state.travel.journey={siteId,turnsLeft:turns,totalTurns:turns};
  state.events.unshift({turn:state.turn,text:`${state.characters[state.playerId]?.name||"Your leader"} began travelling to ${site.name} (${turns} month${turns===1?"":"s"}).`});
  return {ok:true,message:`Journey to ${site.name} started. Arrival in ${turns} month${turns===1?"":"s"}.`};
}

export function advanceTravel(state){
  initializeExploration(state);
  const journey=state.travel.journey;if(!journey)return null;
  journey.turnsLeft--;
  if(journey.turnsLeft>0)return `${WORLD_SITES.find(s=>s.id===journey.siteId).name}: ${journey.turnsLeft} month(s) remaining.`;
  const site=WORLD_SITES.find(s=>s.id===journey.siteId);
  state.travel.locationId=site.id;state.travel.journey=null;
  if(!state.discoveredSites.includes(site.id))state.discoveredSites.push(site.id);
  return `Your party arrived at ${site.name}. ${site.description}`;
}

export function exploreCave(state,caveId){
  initializeExploration(state);
  const cave=state.caves[caveId];
  if(!cave)return {ok:false,message:"Unknown cave."};
  const site=WORLD_SITES.find(s=>s.caveId===caveId);
  if(state.travel.locationId!==site.id)return {ok:false,message:`Travel to ${site.name} before exploring it.`};
  cave.discovered=true;
  if(cave.skeletonAlive){
    if((state.kingdoms[state.playerId].soldiers||0)<20)return {ok:false,message:"Your expedition needs at least 20 soldiers to handle the skeleton encounter."};
    state.kingdoms[state.playerId].soldiers-=5;
    cave.skeletonAlive=false;cave.cleared=true;
    if(caveId==="whispering_caverns")cave.portalFound=true;
    state.events.unshift({turn:state.turn,text:`The expedition overcame the skeleton guardian in ${site.name}. A hidden chamber was revealed.`});
    return {ok:true,message:cave.portalFound?"Skeleton defeated! An underground End Portal chamber has been discovered.":"The cave is now safe to explore."};
  }
  cave.cleared=true;
  return {ok:true,message:"The cave has been explored. No guardian remains."};
}

export function craftEyeOfEnder(state){
  initializeExploration(state);
  const need={"Ender Pearl":1,"Blaze Powder":1};
  for(const [item,n] of Object.entries(need))if((state.inventory[item]||0)<n)return {ok:false,message:`Crafting an Eye of Ender needs ${n} ${item}. You have ${state.inventory[item]||0}.`};
  for(const [item,n] of Object.entries(need))state.inventory[item]-=n;
  state.inventory["Eye of Ender"]=(state.inventory["Eye of Ender"]||0)+1;
  return {ok:true,message:"Crafted 1 Eye of Ender from 1 Ender Pearl and 1 Blaze Powder."};
}
export function craftBlazePowder(state){
  initializeExploration(state);
  if((state.inventory["Blaze Rod"]||0)<1)return {ok:false,message:"You need a Blaze Rod from a Blaze in the Nether."};
  state.inventory["Blaze Rod"]--;state.inventory["Blaze Powder"]=(state.inventory["Blaze Powder"]||0)+2;
  return {ok:true,message:"Crafted 2 Blaze Powder from 1 Blaze Rod."};
}
export function buildNetherPortal(state){
  initializeExploration(state);
  if(state.playerId==="clown"){state.netherPortal.built=true;state.netherPortal.entered=true;return {ok:true,message:"ClownPierce's Empire begins in the Nether. No portal is needed."};}
  const need={"Obsidian":12,"Flint":1,"Iron":1};
  for(const [item,n] of Object.entries(need))if((state.inventory[item]||0)<n)return {ok:false,message:`Nether Portal needs ${n} ${item}. You have ${state.inventory[item]||0}.`};
  for(const [item,n] of Object.entries(need))state.inventory[item]-=n;
  state.netherPortal.built=true;state.netherPortal.entered=true;state.travel.locationId="crimson_keep";
  state.discoveredSites.push("crimson_keep");
  return {ok:true,message:"Nether Portal built and entered! Your expedition has reached the Nether."};
}
export function refreshMobSpawns(state){initializeExploration(state);MOB_SPAWNS.forEach(m=>{state.mobSpawns[m.id].available=true;state.mobSpawns[m.id].farmed=false;});}
export function farmMob(state,mobId){
  initializeExploration(state);
  const mob=MOB_SPAWNS.find(m=>m.id===mobId);const spawn=state.mobSpawns[mobId];
  if(!mob||!spawn?.available)return {ok:false,message:"That mob is not available to farm."};
  if(state.travel.locationId!==mob.siteId)return {ok:false,message:`Travel to ${WORLD_SITES.find(s=>s.id===mob.siteId).name} to find this mob.`};
  for(const [item,unit] of Object.entries(FARM_COST)){const n=unit*mob.count;if((state.inventory[item]||0)<n)return {ok:false,message:`Farming ${mob.count} ${mob.name} costs ${n} ${item}. Unit cost per mob: 34 Cobblestone, 2 Redstone, 1 Hopper and 2 Diamonds. You have ${state.inventory[item]||0}.`};}
  for(const [item,unit] of Object.entries(FARM_COST))state.inventory[item]-=unit*mob.count;
  state.inventory[mob.loot]=(state.inventory[mob.loot]||0)+mob.count;
  spawn.farmed=true;spawn.available=false;
  state.events.unshift({turn:state.turn,text:`A mob farm was built for ${mob.name}. It produced ${mob.count} ${mob.loot}.`});
  return {ok:true,message:`Farmed ${mob.name}! +${mob.count} ${mob.loot}.`};
}
export function activateEndPortal(state){
  initializeExploration(state);
  const cave=state.caves.whispering_caverns;
  if(state.travel.locationId!=="whispering_caverns")return {ok:false,message:"Your party must be at the Whispering Caverns."};
  if(!cave.portalFound)return {ok:false,message:"The underground portal is still hidden. Explore the lower cave first."};
  if(state.endPortal.activated)return {ok:false,message:"The End Portal is already active."};
  const costs={"Eye of Ender":12};
  for(const [resource,amount] of Object.entries(costs))if((state.inventory[resource]||0)<amount)return {ok:false,message:`The portal needs ${amount} ${resource}. You have ${state.inventory[resource]||0}.`};
  for(const [resource,amount] of Object.entries(costs))state.inventory[resource]-=amount;
  state.endPortal.activated=true;
  state.events.unshift({turn:state.turn,text:"The ancient underground End Portal has been activated beneath the Whispering Caverns."});
  return {ok:true,message:"End Portal activated with 12 Eyes of Ender! Your army can enter the End."};
}

export function enterEndPortal(state){
  initializeExploration(state);
  if(state.travel.locationId!=="whispering_caverns")return {ok:false,message:"Travel to the underground portal first."};
  if(!state.endPortal.activated)return {ok:false,message:"The End Portal is not active yet."};
  state.endPortal.entered=true;state.travel.locationId="outer_end_gate";
  if(!state.discoveredSites.includes("outer_end_gate"))state.discoveredSites.push("outer_end_gate");
  state.events.unshift({turn:state.turn,text:"Your expedition passed through the underground End Portal and reached the Outer End."});
  return {ok:true,message:"Your army has entered the End and reached the Outer End Gate."};
}

export function defeatEnderDragon(state){
  initializeExploration(state);
  if(!state.endPortal.entered||state.travel.locationId!=="outer_end_gate")return {ok:false,message:"Your army must be in the End to challenge the Ender Dragon."};
  const army=state.kingdoms[state.playerId];
  if((army.soldiers||0)<100)return {ok:false,message:"Bring at least 100 soldiers to challenge the Ender Dragon."};
  if(state.endPortal.dragonDefeated)return {ok:false,message:"The Ender Dragon has already been defeated."};
  army.soldiers-=30;state.endPortal.dragonDefeated=true;
  state.events.unshift({turn:state.turn,text:"Your army defeated the Ender Dragon and opened the choice to claim the End."});
  return {ok:true,message:"The Ender Dragon is defeated! Decide whether your kingdom will claim the End."};
}
export function claimEnd(state,claim){
  initializeExploration(state);
  if(!state.endPortal.dragonDefeated)return {ok:false,message:"Defeat the Ender Dragon first."};
  if(claim){state.endPortal.endClaimed=true;const p=state.provinces.find(x=>x.id==="p21");if(p){p.owner=state.playerId;const k=state.kingdoms[state.playerId];if(!k.provinces.includes(p.id))k.provinces.push(p.id);}state.events.unshift({turn:state.turn,text:`${state.kingdoms[state.playerId].name} claimed the entire End dimension.`});return {ok:true,message:"The End is yours! Your kingdom now controls the End dimension."};}
  state.travel.locationId="whispering_caverns";state.endPortal.entered=false;
  return {ok:true,message:"Your army chose not to claim the End and returned through the portal."};
}
export function checkSpokeTotem(state){
  const nullKingdom=state.kingdoms?.null;const spoke=state.characters?.null;
  if(!nullKingdom||nullKingdom.eliminated||!spoke?.leftHandTotem)return null;
  const capital=state.provinces.find(p=>p.owner==="null"&&p.capital);
  if((nullKingdom.soldiers||0)<=0||!capital){
    spoke.leftHandTotem=false;nullKingdom.eliminated=true;nullKingdom.population=0;nullKingdom.soldiers=0;nullKingdom.provinces=[];
    state.provinces.filter(p=>p.owner==="null").forEach(p=>{p.owner=state.playerId;p.capital=false;const own=state.kingdoms[state.playerId];if(!own.provinces.includes(p.id))own.provinces.push(p.id);});
    return "Spoke popped the totem in his left hand. The Null Army vanished from the server.";
  }
  return null;
}

export function craftHopper(state){
  initializeExploration(state);
  if((state.inventory.Iron||0)<5)return {ok:false,message:"A Hopper costs 5 Iron."};
  state.inventory.Iron-=5;state.inventory.Hopper=(state.inventory.Hopper||0)+1;
  return {ok:true,message:"Crafted 1 Hopper from 5 Iron."};
}

export function processDiamondOre(state){
  initializeExploration(state);
  if((state.inventory["Diamond Ore"]||0)<1)return {ok:false,message:"You need 1 Diamond Ore to process into 1 Diamond."};
  state.inventory["Diamond Ore"]--;state.inventory.Diamond=(state.inventory.Diamond||0)+1;
  return {ok:true,message:"Processed 1 Diamond Ore into 1 Diamond."};
}
