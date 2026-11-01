import {kingdomStats,relationLabel,formatNumber} from "./kingdoms.js";
import {monthName} from "./turns.js";
import {WORLD_SITES,MOB_SPAWNS} from "./exploration.js";
export class UI{
  constructor(app){this.app=app;}
  $(id){return document.getElementById(id);}
  showScreen(id){document.querySelectorAll(".screen").forEach(s=>s.classList.remove("active"));this.$(id).classList.add("active");}
  render(state){
    const player=state.kingdoms[state.playerId];
    this.$("campaign-label").textContent=state.campaignName;
    this.$("date-label").textContent=`${monthName(state.month)} ${state.year}`;
    this.$("turn-label").textContent=`Turn ${state.turn}`;
    this.$("treasury-label").textContent=formatNumber(player.treasury);
    this.$("population-label").textContent=formatNumber(player.population);
    this.$("influence-label").textContent=state.characters?.[player.id]?.influence ?? 0;
    this.$("campaign-description").textContent=`${state.description} Map: ${(state.mapSize||"medium").replace("ultra","ultra deluxe")} · ${state.provinces.length} territories.`;
    this.$("faction-count").textContent=`${Object.keys(state.kingdoms).length} FACTIONS`;
    this.$("kingdom-list").innerHTML="";
    Object.values(state.kingdoms).forEach(k=>{
      const b=document.createElement("button");b.className="kingdom-item"+(state.selectedKingdom===k.id?" selected":"");b.innerHTML=`<i class="faction-swatch" style="background:${k.color}"></i><span>${k.flag} ${k.name}</span><small>${k.provinces.length}</small>`;
      b.addEventListener("click",()=>this.app.selectKingdom(k.id));this.$("kingdom-list").appendChild(b);
    });
    this.$("diplomacy-list").innerHTML="";
    Object.values(state.kingdoms).filter(k=>k.id!==state.playerId).slice(0,6).forEach(k=>{
      const row=document.createElement("div");row.className="diplomacy-row";row.innerHTML=`<span>${k.flag} ${k.name}</span><span class="relation">${relationLabel(player,k)}</span>`;this.$("diplomacy-list").appendChild(row);
    });
    this.$("event-feed").innerHTML=state.events.slice(0,8).map(e=>`<div class="event"><time>T${e.turn}</time><span>${escapeHTML(e.text)}</span></div>`).join("");
    this.$("event-count").textContent=`${state.events.length} EVENTS`;
    this.$("map-world-label").textContent=`${state.mapMode==="political"?"POLITICAL":state.mapMode==="terrain"?"TERRAIN":"POPULATION"} MAP · ${(state.mapSize||"medium").toUpperCase()}`;
    this.renderExploration(state);
    if(state.selectedProvince)this.renderProvince(state,state.provinces.find(p=>p.id===state.selectedProvince));
    else if(state.selectedKingdom)this.renderKingdom(state,state.kingdoms[state.selectedKingdom]);
    else this.emptyDetails();
  }
  renderExploration(state){
    const root=this.$("exploration-content");if(!root)return;
    const current=WORLD_SITES.find(s=>s.id===state.travel?.locationId);
    const journey=state.travel?.journey;
    const options=WORLD_SITES.filter(s=>(s.realm!=="End"||state.endPortal?.entered)&&(s.realm!=="Nether"||state.netherPortal?.entered||state.playerId==="clown")).map(s=>`<option value="${s.id}">${s.name} · ${s.kind}</option>`).join("");
    const atCave=current?.caveId;const cave=atCave?state.caves?.[atCave]:null;const portal=state.caves?.whispering_caverns;
    const mobs=MOB_SPAWNS.filter(m=>m.siteId===current?.id&&state.mobSpawns?.[m.id]?.available);
    const inv=state.inventory||{};
    root.innerHTML=`<div class="detail-section"><h4>EXPEDITION LOCATION</h4><p><b>${current?.name||"Unknown location"}</b> · ${current?.realm||"Overworld"}</p>${journey?`<p class="travel-status">Travelling to ${WORLD_SITES.find(s=>s.id===journey.siteId)?.name||"destination"} · ${journey.turnsLeft} month(s) left</p>`:`<label class="tiny" for="travel-destination">Choose a destination</label><select id="travel-destination" class="travel-select">${options}</select><button class="subtle-button" id="travel-start">Start journey</button>`}</div>
      <div class="detail-section"><h4>FAMOUS PLACES & CAVES</h4><div class="site-list">${WORLD_SITES.map(site=>`<div class="site-row"><span>${site.kind.includes("Cave")?"⌁":"✦"} ${site.name}</span><small>${state.discoveredSites?.includes(site.id)?"Discovered":site.realm}</small></div>`).join("")}</div></div>
      <div class="detail-section"><h4>PORTAL & CRAFTING</h4><p>Inventory: Obsidian ${inv.Obsidian||0} · Flint ${inv.Flint||0} · Iron ${inv.Iron||0} · Diamonds ${inv.Diamond||0} · Diamond Ore ${inv["Diamond Ore"]||0} · Eyes of Ender ${inv["Eye of Ender"]||0} · Ender Pearls ${inv["Ender Pearl"]||0} · Blaze Rods ${inv["Blaze Rod"]||0} · Blaze Powder ${inv["Blaze Powder"]||0}</p><button class="subtle-button" id="nether-build">${state.netherPortal?.entered?"Nether Portal entered":"Build Nether Portal (12 Obsidian + Flint and Steel)"}</button><div class="tool-grid"><button class="subtle-button" id="hopper-craft">Craft Hopper (5 Iron)</button><button class="subtle-button" id="diamond-process">Process Diamond Ore (1:1)</button><button class="subtle-button" id="blaze-powder">Craft Blaze Powder (1 Blaze Rod → 2 Powder)</button><button class="subtle-button" id="eye-craft">Craft Eye of Ender (1 Pearl + 1 Powder)</button></div><p class="tiny">Eyes of Ender are crafted from Blaze Powder and Ender Pearls. Find Blazes in the Nether and Endermen in the Overworld.</p></div>
      ${atCave?`<div class="detail-section"><h4>CAVE EXPLORATION</h4><p>${cave?.skeletonAlive?"⚠ Skeleton guardian detected in the lower tunnels.":cave?.cleared?"The cave is cleared and safe to inspect.":"Unexplored passages lie ahead."}</p><button class="subtle-button" id="cave-explore" ${cave?.cleared?"disabled":""}>${cave?.skeletonAlive?"Confront skeleton guardian":"Explore cave"}</button></div>`:""}
      ${mobs.length?`<div class="detail-section"><h4>MOBS FOUND HERE</h4>${mobs.map(m=>`<p>${m.name} · Drop: ${m.loot}</p><button class="subtle-button" data-farm-mob="${m.id}">Do you want to farm this?</button>`).join("")}<p class="tiny">Each spawned mob costs 34 Cobblestone, 2 Redstone, 1 Hopper and 2 Diamonds to farm.</p></div>`:""}
      ${state.travel?.locationId==="whispering_caverns"&&portal?.portalFound?`<div class="detail-section"><h4>UNDERGROUND END PORTAL</h4><p>${state.endPortal.activated?"The ancient portal is active.":"A hidden End Portal has been uncovered. It requires 12 Eyes of Ender."}</p>${!state.endPortal.activated?`<button class="subtle-button" id="portal-activate">Insert 12 Eyes of Ender</button>`:`<button class="subtle-button" id="portal-enter">Enter the End</button>`}</div>`:""}
      ${state.travel?.locationId==="outer_end_gate"?`<div class="detail-section"><h4>THE END DIMENSION</h4>${!state.endPortal.dragonDefeated?`<p>Your army has reached the End. Bring at least 100 soldiers to challenge the Ender Dragon.</p><button class="subtle-button" id="dragon-fight">Challenge the Ender Dragon</button>`:`<p>The Ender Dragon has been defeated. The dimension is yours to claim—or you can leave.</p><button class="subtle-button" id="end-choice">Choose the fate of the End</button>`}</div>`:""}`;
    const travel=this.$("travel-start");if(travel)travel.onclick=()=>this.app.travelTo(this.$("travel-destination").value);
    const explore=this.$("cave-explore");if(explore)explore.onclick=()=>this.app.exploreCave(atCave);
    const activate=this.$("portal-activate");if(activate)activate.onclick=()=>this.app.activatePortal();
    const enter=this.$("portal-enter");if(enter)enter.onclick=()=>this.app.enterPortal();
    const nether=this.$("nether-build");if(nether&&!state.netherPortal?.entered)nether.onclick=()=>this.app.buildNether();
    const hopper=this.$("hopper-craft");if(hopper)hopper.onclick=()=>this.app.craftHopper();
    const diamond=this.$("diamond-process");if(diamond)diamond.onclick=()=>this.app.processDiamond();
    const powder=this.$("blaze-powder");if(powder)powder.onclick=()=>this.app.craftPowder();
    const eye=this.$("eye-craft");if(eye)eye.onclick=()=>this.app.craftEye();
    root.querySelectorAll("[data-farm-mob]").forEach(b=>b.onclick=()=>this.app.farmMob(b.dataset.farmMob));
    const dragon=this.$("dragon-fight");if(dragon)dragon.onclick=()=>this.app.dragon();
    const choice=this.$("end-choice");if(choice)choice.onclick=()=>this.app.endChoice();
  }
  renderProvince(state,p){
    if(!p){this.emptyDetails();return;}
    const k=state.kingdoms[p.owner];this.$("detail-heading").textContent="PROVINCE INTEL";this.$("detail-type").textContent=p.realm.toUpperCase();
    this.$("details-content").innerHTML=`<div class="detail-flag">${k.flag}</div><div class="detail-name">${p.name}</div><div class="detail-sub">${p.realm} · ${k.name}</div><div class="stat-grid">
      <div class="stat"><small>Population</small><b>${formatNumber(p.population)}</b></div><div class="stat"><small>Development</small><b>Level ${p.development}/4</b></div>
      <div class="stat"><small>Terrain</small><b>${p.terrain}</b></div><div class="stat"><small>Capital</small><b>${p.capital?"Yes":"No"}</b></div></div>
      <div class="detail-section"><h4>GOVERNING POWER</h4><p>${k.flag} ${k.name}</p><p>Leader: ${k.leader}${k.id==="null"?" · Totem in left hand · if popped, Null is eliminated":""}</p><p>Government: ${k.government}</p></div>
      <div class="detail-section"><h4>LOCAL RESOURCES</h4><p>${p.resources.join(" · ")}</p></div>
      ${p.owner===state.playerId?`<div class="detail-section"><h4>GATHERING</h4><p>Equipped: ${this.app.activeToolLabel()}</p><button class="primary action-wide" id="gather-province" ${state.lastHarvestTurn[p.id]===state.turn?"disabled":""}>Gather all local resources</button><p class="tiny">Once per province each month. Pickaxe tier increases mined materials.</p></div>`:""}
      <div class="detail-section"><h4>YOUR STORED RESOURCES</h4><p>${Object.entries(state.inventory||{}).filter(([,v])=>v>0).map(([n,v])=>`${n}: ${formatNumber(v)}`).join(" · ")||"No gathered resources yet."}</p></div>`;
    const gather=this.$("gather-province");if(gather)gather.onclick=()=>this.app.gather(p.id);
  }
  renderKingdom(state,k){
    const stats=kingdomStats(state,k);this.$("detail-heading").textContent="KINGDOM INTEL";this.$("detail-type").textContent="FACTION";
    this.$("details-content").innerHTML=`<div class="detail-flag">${k.flag}</div><div class="detail-name">${k.name}</div><div class="detail-sub">Led by ${k.leader}</div><div class="stat-grid">
      <div class="stat"><small>Population</small><b>${formatNumber(k.population)}</b></div><div class="stat"><small>Treasury</small><b>${formatNumber(k.treasury)}</b></div>
      <div class="stat"><small>Leader influence</small><b>${state.characters?.[k.id]?.influence ?? 0}/100</b></div><div class="stat"><small>Provinces</small><b>${stats.provinceCount}</b></div><div class="stat"><small>Soldiers</small><b>${formatNumber(k.soldiers)}</b></div></div>
      <div class="detail-section"><h4>LEADER CHARACTER</h4><p>${k.leader}${k.id==="null"?" · Carries a totem in his left hand; if it pops, the entire Null Army is eliminated":""} · Influence ${state.characters?.[k.id]?.influence ?? 0}/100</p><p>Higher character influence attracts more newcomers to this faction each month.</p></div><div class="detail-section"><h4>STATE INFORMATION</h4><p>Capital: ${k.capital}</p><p>Government: ${k.government}</p><p>AI personality: ${k.personality}</p><p>Skill rating: ${k.skill??60}/100</p><p>Realm: ${k.id==="clown"?"Nether":k.id==="null"&&state.campaignId==="prime_null"?"The End":"Overworld / other realms"}</p>${k.vault?`<p>Vault: ${formatNumber(k.vault.diamondBlocks||0)} Diamond Blocks · ${formatNumber(k.vault.goldBlocks||0)} Gold Blocks · ${formatNumber(k.vault.netheriteBlocks||0)} Netherite Blocks</p>`:""}</div>
      ${k.id===state.playerId?`<div class="detail-section"><h4>RESOURCE WORKSHOP</h4><p>Inventory: ${Object.entries(state.inventory||{}).filter(([,v])=>v>0).map(([n,v])=>`${n} ${v}`).join(" · ")||"Empty"}</p><p>Food stores: ${formatNumber(state.foodStores?.[k.id]||0)} · Cattle: ${formatNumber(state.cattle?.[k.id]||0)}</p><div class="tool-grid">${Object.keys(state.tools).filter(t=>state.tools[t]).map(t=>`<button class="subtle-button" data-equip="${t}" ${state.activeTool===t?"disabled":""}>${state.activeTool===t?"Equipped: ":"Equip "}${t} pickaxe</button>`).join("")}${["stone","iron","diamond"].filter(t=>!state.tools[t]).map(t=>`<button class="subtle-button" data-craft="${t}">Craft ${t} pickaxe</button>`).join("")}</div><p class="tiny">Wooden ×1 · Stone ×1.5 · Iron ×2 · Diamond ×3.5 mining yield. Pickaxes affect stone, ores and Nether/End minerals.</p></div>`:""}
      <div class="detail-section"><h4>DIPLOMACY</h4>${Object.values(state.kingdoms).filter(x=>x.id!==k.id).slice(0,5).map(x=>`<p>${x.flag} ${x.name}: ${relationLabel(k,x)}</p>`).join("")}</div>`;
    this.$("details-content").querySelectorAll("[data-craft]").forEach(b=>b.onclick=()=>this.app.craftPickaxe(b.dataset.craft));
    this.$("details-content").querySelectorAll("[data-equip]").forEach(b=>b.onclick=()=>this.app.equipPickaxe(b.dataset.equip));
  }
  emptyDetails(){this.$("detail-heading").textContent="PROVINCE INTEL";this.$("detail-type").textContent="INSPECTION";this.$("details-content").innerHTML=`<div class="empty-state"><div class="empty-icon">⌖</div><b>Select a province or kingdom</b><p>Choose a territory on the map or a faction in the list to inspect its people, terrain and ruler.</p></div>`;}
  campaignCards(){
    const campaignFactions={
      old:[["newparrot","Parrot's New Kingdom"],["clown","ClownPierce's Kingdom"],["mafia","Mafia"]],
      civil:[["newparrot","Parrot's New Kingdom"],["null","Null Army"],["mafia","Mafia"],["clown","ClownPierce's Kingdom"]],
      mafia:[["mafia","Mafia"],["farlands","Farlands Civilization"],["null","Null Army"],["clown","ClownPierce's Kingdom"],["newparrot","Parrot's New Kingdom"],["parrot","Parrot's Kingdom"],["immortal","Immortal Empire"],["monarchs","Monarchs"],["neverworm","Neverworm"],["warden","Warden Civilization"],["north","Northern Council"]],
      prime_null:[["null","Prime Null"],["cindercrest","Prime Cindercrest"],["zam","Zam Empire"],["royal","Royal Army"],["clown","ClownPierce's Army"]]
    };
    const campaigns=[
      ["old","Old Unstable SMP","Early settlements, small powers and a quieter frontier.","YEAR 100 · SETTLEMENTS"],
      ["civil","Civil War Era","Rival factions, unstable politics and competing claims.","YEAR 120 · CONFLICT"],
      ["mafia","Mafia Time","Mafia has 1,345 players. The Farlands Civilization has 127 and lives at the farthest edge of the map.","YEAR 150 · FARLANDS & MAFIA"],
      ["prime_null","Prime Null Time","A separate era: Null's 10,000 soldiers and the End, elite Cindercrest, wealthy Zam, the weakened Royal Army and ClownPierce's Nether army.","YEAR 175 · THE PRIME ERA"]
    ];
    this.$("campaign-cards").innerHTML=`<section class="campaign-card campaign-setup"><div class="eyebrow">WORLD SETUP</div><h3>Choose your map</h3><label class="setup-label">Map size<select id="map-size" class="travel-select"><option value="small">Small</option><option value="medium" selected>Medium</option><option value="big">Big</option><option value="ultra">Ultra Deluxe</option></select></label><label class="setup-check"><input type="checkbox" id="custom-enabled"> Create my own civilization</label><div id="custom-fields" class="custom-fields" hidden><label class="setup-label">Civilization name<input id="custom-name" class="travel-select" maxlength="28" value="My Civilization"></label><label class="setup-label">Flag (emoji or symbol)<input id="custom-flag" class="travel-select" maxlength="4" value="⚑"></label><label class="setup-label">Flag colour<input id="custom-color" type="color" value="#62a8a0"></label><label class="setup-label">Where do you live?<select id="custom-location" class="travel-select"><option value="center">Central Haven</option><option value="north">Northern Reach</option><option value="farlands">Farlands Frontier</option><option value="nether">Nether Gate</option></select></label></div><p class="tiny">Your own civilization is added to the selected campaign. It does not merge separate historical campaigns.</p></section>`+campaigns.map(([id,name,desc,meta])=>`<article class="campaign-card"><div class="eyebrow">SEPARATE CAMPAIGN</div><h3>${name}</h3><p>${desc}</p><label class="setup-label">Play as<select class="travel-select" id="faction-${id}">${campaignFactions[id].map(([fid,label])=>`<option value="${fid}" ${fid===(id==="prime_null"?"null":id==="mafia"?"mafia":"newparrot")?"selected":""}>${label}</option>`).join("")}</select></label><div class="campaign-meta">${meta}</div><button class="primary" data-campaign="${id}">Start Campaign →</button></article>`).join("");
    const toggle=this.$("custom-enabled"),fields=this.$("custom-fields");toggle.onchange=()=>{fields.hidden=!toggle.checked;};
    this.$("campaign-cards").querySelectorAll("[data-campaign]").forEach(b=>b.addEventListener("click",()=>{
      const id=b.dataset.campaign;const custom=this.$("custom-enabled").checked?{enabled:true,name:this.$("custom-name").value,flag:this.$("custom-flag").value,color:this.$("custom-color").value,location:this.$("custom-location").value}:null;
      this.app.startCampaign(id,this.$(`faction-${id}`).value,{mapSize:this.$("map-size").value,customCivilization:custom});
    }));
  }
}
function escapeHTML(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
