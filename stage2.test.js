import assert from 'node:assert/strict';
import {createCampaign} from '../js/data.js';
import {harvestProvince,purchasePickaxe} from '../js/gathering.js';
import {processCharacterInfluence} from '../js/characters.js';
import {advanceTurn} from '../js/turns.js';

const state=createCampaign('mafia',{playerId:'newparrot'});
assert.equal(state.kingdoms.mafia.population,1345);
assert.equal(state.kingdoms.farlands.population,127);
assert(state.provinces.find(p=>p.owner==='farlands'&&p.capital).x>=940,'Farlands must be at the far edge of the map');
assert.equal(state.kingdoms.null.population,137);
assert.equal(state.kingdoms.newparrot.population,200);
assert.equal(state.kingdoms.clown.soldiers,4200);
assert.equal(state.provinces.find(p=>p.owner==='clown'&&p.capital).realm,'Nether');
assert.equal(state.characters.null.influence,92);
const beforeNull=state.kingdoms.null.population;
const joinReports=processCharacterInfluence(state);
assert.equal(state.kingdoms.null.population-beforeNull,3,'Null leader influence 92 attracts 3 people/month');
assert(joinReports.some(x=>x.includes('Null Army')));

// Gathering all local resources is functional and restricted to player-owned provinces.
const capital=state.provinces.find(p=>p.owner==='newparrot'&&p.terrain==='Mountains');
const wooden=harvestProvince(state,capital.id);
assert.equal(wooden.ok,true);
assert(wooden.yields.some(x=>x.startsWith('Diamond Ore +')));
assert.equal(harvestProvince(state,capital.id).ok,false,'one harvest per province per month');

// Diamond pickaxe mining yield must exceed wooden pickaxe yield.
const woodenOre=Number(wooden.yields.find(x=>x.startsWith('Diamond Ore')).split('+')[1]);
state.turn++;
state.inventory['Diamond Ore']=8;state.inventory.Iron=10;
assert.equal(purchasePickaxe(state,'diamond').ok,true);
assert.equal(state.activeTool,'diamond');
const diamond=harvestProvince(state,capital.id);
const diamondOre=Number(diamond.yields.find(x=>x.startsWith('Diamond Ore')).split('+')[1]);
assert(diamondOre>woodenOre,`diamond ${diamondOre} should be greater than wooden ${woodenOre}`);

// Monthly simulation keeps the new food and cattle economy active.
const previousTurn=state.turn;advanceTurn(state);
assert.equal(state.turn,previousTurn+1);
assert(state.foodStores && typeof state.foodStores.newparrot==='number');
assert(state.cattle && typeof state.cattle.newparrot==='number');
console.log('Stage 2 tests passed: campaigns, character immigration, all-resource gathering, pickaxe multipliers, harvest limits, monthly food/cattle economy.');

// Stage 1 regression coverage: all campaigns remain constructible and AI still runs.
for (const id of ['old','civil','mafia']) {
  const campaign=createCampaign(id);
  assert.equal(Object.keys(campaign.kingdoms).length,id==='mafia'?11:10);
  assert.equal(campaign.provinces.length,22);
}
const prime=createCampaign('prime_null');
assert.equal(prime.playerId,'null');
assert.equal(prime.travel.locationId,'outer_end_gate');
assert.equal(Object.keys(prime.kingdoms).length,5,'Prime Null Time is a separate campaign roster');
assert.equal(prime.kingdoms.null.soldiers,10000);
assert.equal(prime.kingdoms.cindercrest.soldiers,2500);
assert.equal(prime.kingdoms.cindercrest.skill,96);
assert.equal(prime.kingdoms.zam.soldiers,50);
assert.equal(prime.kingdoms.zam.skill,99);
assert.equal(prime.kingdoms.zam.vault.diamondBlocks,4096);
assert.equal(prime.kingdoms.zam.vault.goldBlocks,4096);
assert.equal(prime.kingdoms.royal.soldiers,200);
assert.equal(prime.kingdoms.clown.soldiers,3000);
assert(prime.kingdoms.clown.vault.netheriteBlocks>10000);
assert(prime.provinces.some(p=>p.owner==='null'&&p.realm==='End'));
assert(prime.provinces.some(p=>p.owner==='clown'&&p.realm==='Nether'));
const custom=createCampaign('mafia',{mapSize:'ultra',customCivilization:{enabled:true,name:'Test Republic',flag:'⚑',color:'#123456',location:'farlands'}});
assert.equal(custom.provinces.length,61);
assert.equal(custom.playerId,'custom');
assert.equal(custom.kingdoms.custom.name,'Test Republic');
assert.equal(custom.provinces.find(p=>p.id==='custom_capital').x,940);
const small=createCampaign('prime_null',{mapSize:'small'});
assert.equal(small.provinces.length,12);
const aiState=createCampaign('mafia');
const oldDevelopment=aiState.provinces.find(p=>p.owner==='mafia').development;
const oldRandom=Math.random;Math.random=()=>0;
advanceTurn(aiState);Math.random=oldRandom;
assert(aiState.turn===2,'Next Turn advances the month and turn counter');
assert(aiState.events.length>1,'turn report is recorded');
assert(Object.values(aiState.kingdoms).every(k=>Number.isFinite(k.treasury)),'AI and economy keep valid treasuries');

// Save/load preserves the expanded Stage 2 state in browser localStorage.
globalThis.localStorage={data:{},getItem(k){return this.data[k]??null;},setItem(k,v){this.data[k]=v;}};
const {saveSlot,loadSlot}=await import('../js/save.js');
saveSlot(2,state);
const restored=loadSlot(2);
assert.equal(restored.characters.null.influence,92);
assert.equal(restored.inventory['Diamond Ore'],state.inventory['Diamond Ore']);
assert.equal(restored.tools.diamond,true);
console.log('Stage 1 regression and save/load tests passed.');

// Stage 3 exploration: travel, cave guardian, hidden End Portal and famous landmarks.
const {WORLD_SITES,startTravel,exploreCave,activateEndPortal,enterEndPortal}=await import('../js/exploration.js');
const expedition=createCampaign('mafia');
assert(WORLD_SITES.some(s=>s.name==='Tomb of the Mafia'));
assert(WORLD_SITES.some(s=>s.name==='Null Citadel'));
assert.equal(startTravel(expedition,'whispering_caverns').ok,true);
advanceTurn(expedition);
assert.equal(expedition.travel.locationId,'whispering_caverns','party arrives after the journey turn');
const caveResult=exploreCave(expedition,'whispering_caverns');
assert.equal(caveResult.ok,true);
assert.equal(expedition.caves.whispering_caverns.skeletonAlive,false);
assert.equal(expedition.caves.whispering_caverns.portalFound,true);
expedition.inventory['Eye of Ender']=12;
assert.equal(activateEndPortal(expedition).ok,true);
assert.equal(expedition.endPortal.activated,true);
assert.equal(enterEndPortal(expedition).ok,true);
assert.equal(expedition.travel.locationId,'outer_end_gate');
assert.equal(expedition.kingdoms.null.leader,'Spoke');
assert.equal(expedition.characters.null.leftHandTotem,true);
const {craftEyeOfEnder,craftBlazePowder,buildNetherPortal,farmMob,defeatEnderDragon,claimEnd,craftHopper,checkSpokeTotem}=await import('../js/exploration.js');
const crafting=createCampaign('mafia');
crafting.inventory['Ender Pearl']=1;crafting.inventory['Blaze Powder']=1;
assert.equal(craftEyeOfEnder(crafting).ok,true);assert.equal(crafting.inventory['Eye of Ender'],1);
crafting.inventory['Blaze Rod']=1;assert.equal(craftBlazePowder(crafting).ok,true);assert.equal(crafting.inventory['Blaze Powder'],2);
crafting.inventory.Iron=5;assert.equal(craftHopper(crafting).ok,true);assert.equal(crafting.inventory.Hopper,1);
crafting.inventory.Obsidian=12;crafting.inventory.Flint=1;crafting.inventory.Iron=1;
assert.equal(buildNetherPortal(crafting).ok,true);assert.equal(crafting.travel.locationId,'crimson_keep');
const clownStart=createCampaign('mafia');clownStart.playerId='clown';const {initializeExploration}=await import('../js/exploration.js');initializeExploration(clownStart);assert.equal(clownStart.travel.locationId,'crimson_keep');assert.equal(clownStart.netherPortal.entered,true);
crafting.inventory.Cobblestone=34;crafting.inventory.Redstone=2;crafting.inventory.Diamond=2;crafting.inventory.Hopper=1;
assert.equal(farmMob(crafting,'nether_blaze').ok,true);assert.equal(crafting.inventory['Blaze Rod'],1);
const endgame=createCampaign('mafia');endgame.travel.locationId='outer_end_gate';endgame.endPortal.entered=true;endgame.kingdoms.newparrot.soldiers=150;
assert.equal(defeatEnderDragon(endgame).ok,true);assert.equal(claimEnd(endgame,true).ok,true);assert.equal(endgame.endPortal.endClaimed,true);
const nullCollapse=createCampaign('mafia');nullCollapse.kingdoms.null.soldiers=0;assert.match(checkSpokeTotem(nullCollapse),/Spoke popped the totem/);assert.equal(nullCollapse.kingdoms.null.eliminated,true);
console.log('Stage 3 tests passed: Eye of Ender recipe, Nether portal, mob-farm costs and drops, Spoke’s totem, dragon victory and End claim.');
