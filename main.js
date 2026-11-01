import {CAMPAIGNS,createCampaign} from "./data.js";
import {WorldMap} from "./map.js";
import {advanceTurn} from "./turns.js";
import {saveSlot,loadSlot,getSaves,hasSaves} from "./save.js";
import {UI} from "./ui.js";
import {harvestProvince,purchasePickaxe,selectPickaxe,getPickaxes} from "./gathering.js";
import {initializeExploration,startTravel,exploreCave,activateEndPortal,enterEndPortal,craftEyeOfEnder,craftBlazePowder,buildNetherPortal,farmMob,defeatEnderDragon,claimEnd,craftHopper,processDiamondOre} from "./exploration.js";

class GameApp{
  constructor(){
    this.ui=new UI(this);this.state=null;this.map=new WorldMap(document.getElementById("world-map"),id=>this.selectProvince(id));
    this.bind();this.ui.campaignCards();this.updateContinue();
  }
  bind(){
    const $=id=>document.getElementById(id);
    $("new-game").onclick=()=>{this.ui.campaignCards();this.ui.showScreen("campaign-screen");};
    $("campaign-open").onclick=()=>{this.ui.campaignCards();this.ui.showScreen("campaign-screen");};
    $("settings-open").onclick=()=>this.ui.showScreen("settings-screen");
    document.querySelectorAll("[data-screen]").forEach(b=>b.onclick=()=>this.ui.showScreen(b.dataset.screen));
    $("continue-game").onclick=()=>this.openSlots("load");
    $("next-turn").onclick=()=>this.nextTurn();
    $("zoom-in").onclick=()=>this.map.zoom(1.2);$("zoom-out").onclick=()=>this.map.zoom(.83);$("zoom-reset").onclick=()=>this.map.reset();
    document.querySelectorAll(".mode-button").forEach(b=>b.onclick=()=>{document.querySelectorAll(".mode-button").forEach(x=>x.classList.remove("active"));b.classList.add("active");this.state.mapMode=b.dataset.mode;this.map.render(this.state);this.ui.render(this.state);});
    $("save-open").onclick=()=>this.openSlots("save");$("load-open").onclick=()=>this.openSlots("load");
    $("game-menu").onclick=()=>this.openSlots("menu");$("return-menu").onclick=()=>this.ui.showScreen("main-menu");
    $("ui-scale").oninput=e=>{document.documentElement.style.fontSize=e.target.value+"%";$("scale-value").textContent=e.target.value+"%";localStorage.setItem("unstable-ui-scale",e.target.value);};
    const scale=localStorage.getItem("unstable-ui-scale");if(scale){$("ui-scale").value=scale;$("ui-scale").dispatchEvent(new Event("input"));}
  }
  startCampaign(id,playerId="newparrot",options={}){
    this.state=createCampaign(id,{...options,playerId});this.state.playerId=this.state.playerId||playerId;
    if(this.state.playerId==="clown"){this.state.travel.locationId="crimson_keep";this.state.netherPortal={built:true,entered:true};}
    else if(id==="prime_null"&&this.state.playerId==="null"){this.state.travel.locationId="outer_end_gate";this.state.endPortal.entered=true;}
    else if(this.state.playerId==="custom"&&options.customCivilization?.location==="nether"){this.state.travel.locationId="crimson_keep";this.state.netherPortal={built:true,entered:true};}
    else{this.state.travel.locationId="parrot_sky_gardens";}initializeExploration(this.state);this.state.activeTool="wooden";this.state.selectedKingdom=null;this.state.selectedProvince=null;this.map.selected=null;this.map.reset();this.enterGame();this.toast(`${CAMPAIGNS[id].name} started.`);
  }
  enterGame(){this.ui.showScreen("game-screen");this.map.render(this.state);this.ui.render(this.state);this.updateContinue();}
  selectProvince(id){this.state.selectedProvince=id;this.state.selectedKingdom=null;this.ui.render(this.state);}
  selectKingdom(id){this.state.selectedKingdom=id;this.state.selectedProvince=null;this.map.selected=null;this.map.render(this.state);this.ui.render(this.state);}
  activeToolLabel(){const tier=this.state?.activeTool&&this.state.tools[this.state.activeTool]?this.state.activeTool:(this.state?.tools?.diamond?"diamond":this.state?.tools?.iron?"iron":this.state?.tools?.stone?"stone":"wooden");return getPickaxes()[tier].label;}
  gather(id){const result=harvestProvince(this.state,id);this.toast(result.message);this.ui.render(this.state);}
  craftPickaxe(tier){const result=purchasePickaxe(this.state,tier);this.toast(result.message);this.ui.render(this.state);}
  equipPickaxe(tier){const result=selectPickaxe(this.state,tier);this.toast(result.message);this.ui.render(this.state);}
  travelTo(siteId){const r=startTravel(this.state,siteId);this.toast(r.message);this.ui.render(this.state);}
  exploreCave(id){const r=exploreCave(this.state,id);this.toast(r.message);this.ui.render(this.state);}
  activatePortal(){const r=activateEndPortal(this.state);this.toast(r.message);this.ui.render(this.state);}
  enterPortal(){const r=enterEndPortal(this.state);this.toast(r.message);this.ui.render(this.state);}
  craftEye(){const r=craftEyeOfEnder(this.state);this.toast(r.message);this.ui.render(this.state);}
  craftPowder(){const r=craftBlazePowder(this.state);this.toast(r.message);this.ui.render(this.state);}
  craftHopper(){const r=craftHopper(this.state);this.toast(r.message);this.ui.render(this.state);}
  processDiamond(){const r=processDiamondOre(this.state);this.toast(r.message);this.ui.render(this.state);}
  buildNether(){const r=buildNetherPortal(this.state);this.toast(r.message);this.map.render(this.state);this.ui.render(this.state);}
  farmMob(id){const yes=window.confirm("Do you want to farm this mob? This costs 34 Cobblestone, 2 Redstone, 1 Hopper and 2 Diamonds.");if(!yes)return;const r=farmMob(this.state,id);this.toast(r.message);this.ui.render(this.state);}
  dragon(){const r=defeatEnderDragon(this.state);this.toast(r.message);this.ui.render(this.state);}
  endChoice(){if(!this.state.endPortal.dragonDefeated)return;const take=window.confirm("Do you want to take the End for your kingdom and your army?");if(take){const r=claimEnd(this.state,true);this.toast(r.message);}else{const sure=window.confirm("Are you sure you want to leave the End without claiming it? Press OK to leave through the portal, or Cancel to claim the End.");const r=claimEnd(this.state,!sure);this.toast(sure?r.message:"You changed your mind and claimed the End.");}this.map.render(this.state);this.ui.render(this.state);}
  nextTurn(){const reports=advanceTurn(this.state);this.map.render(this.state);this.ui.render(this.state);this.toast(`Turn ${this.state.turn}: ${reports.length} world updates.`);}
  updateContinue(){document.getElementById("continue-game").disabled=!hasSaves();}
  toast(msg){const t=document.getElementById("toast");t.textContent=msg;t.classList.add("show");clearTimeout(this.toastTimer);this.toastTimer=setTimeout(()=>t.classList.remove("show"),2200);}
  openSlots(mode){
    const root=document.getElementById("modal-root");const saves=getSaves();
    root.innerHTML=`<div class="modal-backdrop"><div class="modal"><h3>${mode==="save"?"Save Game":mode==="load"?"Load Game":"Game Menu"}</h3><p>${mode==="save"?"Choose a slot to preserve this campaign.":"Choose a saved campaign to continue."}</p><div class="slot-list">${[1,2,3].map(n=>{const s=saves[n];return `<div class="slot"><span>Slot ${n}<br><small>${s?`${s.state.campaignName} · ${s.state.year}, ${s.state.month}`:"Empty slot"}</small></span><div class="slot-actions">${mode==="save"&&this.state?`<button data-save="${n}">Save here</button>`:""}${s?`<button data-load="${n}">Load</button>`:""}</div></div>`;}).join("")}</div><div class="modal-footer"><button id="modal-close">Close</button></div></div></div>`;
    root.querySelector("#modal-close").onclick=()=>root.innerHTML="";
    root.querySelectorAll("[data-save]").forEach(b=>b.onclick=()=>{saveSlot(b.dataset.save,this.state);root.innerHTML="";this.updateContinue();this.toast(`Saved to slot ${b.dataset.save}.`);});
    root.querySelectorAll("[data-load]").forEach(b=>b.onclick=()=>{const loaded=loadSlot(b.dataset.load);if(loaded){this.state=loaded;initializeExploration(this.state);this.state.characters ||= Object.fromEntries(Object.values(loaded.kingdoms).map(k=>[k.id,{id:`char_${k.id}`,name:k.leader,kingdomId:k.id,role:"Leader",influence:Math.max(0,Math.min(100,k.influence??50))}]));this.state.inventory ||= {};this.state.tools ||= {wooden:true,stone:false,iron:false,diamond:false};this.state.lastHarvestTurn ||= {};this.state.activeTool ||= "wooden";this.map.selected=loaded.selectedProvince;root.innerHTML="";this.enterGame();this.toast(`Loaded slot ${b.dataset.load}.`);}});
  }
}
new GameApp();
