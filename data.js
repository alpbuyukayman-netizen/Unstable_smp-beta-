export const CAMPAIGNS = {
  old: {id:"old",name:"Old Unstable SMP",year:100,month:1,description:"Early settlements, smaller powers, limited population and basic infrastructure.",world:"THE OVERWORLD",populationScale:0.55},
  civil: {id:"civil",name:"Civil War Era",year:120,month:7,description:"Several competing factions, political instability and rival kingdoms struggle for influence.",world:"THE OVERWORLD",populationScale:0.8},
  mafia: {id:"mafia",name:"Mafia Time",year:150,month:3,description:"The Mafia controls the central era while the distant Farlands Civilization survives at the edge of the known map.",world:"THREE REALMS",populationScale:1},
  prime_null: {id:"prime_null",name:"Prime Null Time",year:175,month:1,description:"Null controls the End with 10,000 soldiers. Cindercrest, Zam and the weakened Royal Army compete with ClownPierce's Nether empire.",world:"THREE REALMS",populationScale:1}
};

const factionDefs = [
  ["mafia","Mafia","◈","#8f75c7","The Invisible One","Shadow Council","Mafia Capital",1345,520,74,"Oligarchy"],
  ["null","Null Army","⬟","#bd5665","Spoke","Military Directorate","Nullspire",137,260,92,"Military State"],
  ["parrot","Parrot's Kingdom","✦","#4caa83","Wembu","Parliament","Nesthaven",520,390,63,"Council"],
  ["newparrot","Parrot's New Kingdom","❖","#d0a64e","Jaden","Constitutional Crown","New Nest",200,310,58,"Monarchy"],
  ["immortal","Immortal Empire","♜","#5b86c7","The Immortal","Imperial Court","Everkeep",850,650,81,"Empire"],
  ["monarchs","Monarchs","♛","#b77d48","The Monarch","Royal Assembly","Crownspire",680,480,66,"Monarchy"],
  ["neverworm","Neverworm","⟁","#6b9a75","Neverworm","Worm Council","Deepburrow",410,270,49,"Collective"],
  ["warden","Warden Civilization","◉","#528e9c","The Warden","Elder Circle","Echo Basin",600,340,57,"Elder Council"],
  ["north","Northern Council","❄","#9baec4","Northern Speaker","Council","Frostgate",470,360,61,"Council"],
  ["clown","ClownPierce's Kingdom","☠","#d45b45","ClownPierce","Nether Throne","Crimson Keep",3800,900,88,"Warrior Kingdom"],
  ["farlands","Farlands Civilization","⌁","#7b9d62","Farlander","Frontier Council","Farlands Outpost",127,90,52,"Frontier Council"]
];
const primeNullDefs = [
  ["null","Prime Null","⬟","#bd5665","Spoke","Null High Command","End Citadel",10000,900,96,"Military State"],
  ["cindercrest","Prime Cindercrest","✹","#d47742","Cindercrest Captain","War Council","Cindercrest Keep",2500,650,95,"War Council"],
  ["zam","Zam Empire","✧","#d4bd59","Zam Emperor","Merchant Court","Zam Vault City",50,5000,99,"Merchant Empire"],
  ["royal","Royal Army","♜","#8c9fc4","Royal Commander","Royal Command","Royal Citadel",200,180,63,"Military Council"],
  ["clown","ClownPierce's Army","☠","#d45b45","ClownPierce","Nether Throne","Nether Dominion",3000,1200,94,"Warrior Kingdom"]
];
const provinceNames = ["Greenreach","Stonepass","Amberfield","Whisperwood","Highridge","Sunscar","Bluehaven","Mossvale","Ironford","Redwater","Frostholm","Goldmeadow","Ashen Coast","Crow's Rest","Dawnwatch","Deepwood","Windfall","Kingsmarch","Ravenmoor","Silverplain"];
const terrain = ["Forest","Mountains","Farmland","Forest","Mountains","Desert","Ocean","Farmland","Mountains","Farmland","Mountains","Farmland","Ocean","Forest","Farmland","Forest","Farmland","Mountains","Forest","Farmland"];
const ownerCycle = ["parrot","immortal","mafia","monarchs","newparrot","north","neverworm","warden","null","parrot","immortal","mafia","north","monarchs","newparrot","warden","neverworm","parrot","immortal","null"];
const primeOwnerCycle = ["null","cindercrest","zam","royal","clown","null","cindercrest","zam","royal","clown","null","cindercrest","zam","royal","clown","null","cindercrest","zam","royal","clown"];
const positions = [[70,65],[235,55],[400,70],[565,55],[735,70],[900,150],[55,230],[220,210],[385,220],[550,225],[715,235],[885,315],[70,400],[235,390],[400,405],[565,405],[730,420],[900,500],[170,550],[490,555]];
const mapCounts={small:12,medium:22,big:36,ultra:60};

function buildDefs(id){
  if(id==="prime_null") return primeNullDefs;
  if(id==="mafia") return factionDefs;
  return factionDefs.slice(0,10);
}

export function createCampaign(id, options={}) {
  const c=CAMPAIGNS[id]||CAMPAIGNS.mafia;
  const mapSize=mapCounts[options.mapSize]?options.mapSize:"medium";
  const defs=buildDefs(id);
  const kingdoms={};
  defs.forEach((d,i)=>{
    let pop=d[7];
    if(id==="old")pop=Math.max(55,Math.round(pop*c.populationScale));
    if(id==="civil")pop=Math.max(90,Math.round(pop*c.populationScale));
    if(id!=="mafia"&&id!=="prime_null"&&d[0]==="mafia")pop=1000;
    kingdoms[d[0]]={id:d[0],name:d[1],flag:d[2],color:d[3],leader:d[4],government:d[10],capital:d[6],population:pop,treasury:d[8],provinces:[],personality:id==="prime_null"?({null:"cautious",cindercrest:"aggressive",zam:"builder",royal:"cautious",clown:"aggressive"}[d[0]]||"builder"):( ["builder","cautious","diplomatic","ambitious","builder","ambitious","cautious","builder","diplomatic","aggressive","builder"][i]||"builder"),isPlayer:false,soldiers:id==="prime_null"?({null:10000,cindercrest:2500,zam:50,royal:200,clown:3000}[d[0]]||100):d[0]==="clown"?4200:Math.max(80,Math.round(pop*.12)),skill:id==="prime_null"?({null:80,cindercrest:96,zam:99,royal:62,clown:94}[d[0]]||60):60};
  });
  const ownerOrder=id==="prime_null"?primeOwnerCycle:ownerCycle;
  const provinceCount=mapCounts[mapSize];
  const provinces=[];
  for(let i=0;i<provinceCount;i++){
    const pos=positions[i]||[45+((i-20)%9)*108,45+Math.floor((i-20)/9)*90];
    const owner=i<defs.length?defs[i][0]:ownerOrder[(i+ (id==="old"?2:id==="civil"?5:0))%ownerOrder.length];
    const k=kingdoms[owner]?kingdoms[owner]:kingdoms[defs[0][0]];
    let t=terrain[i%terrain.length];
    if(owner==="newparrot")t="Mountains";
    const resources=t==="Farmland"?["Grain","Livestock","Seeds"]:t==="Mountains"?["Stone","Iron","Coal","Diamond Ore"]:t==="Forest"?["Timber","Game","Berries"]:t==="Desert"?["Stone","Herbs","Clay"]:["Fish","Trade","Salt"];
    provinces.push({id:`p${i}`,name:i<defs.length?k.capital:(provinceNames[i%provinceNames.length]+(i>=20?` ${Math.floor(i/20)+1}`:"")),x:pos[0],y:pos[1],owner,terrain:t,population:i<defs.length?Math.max(80,Math.round(k.population*.42)):Math.round((i%4===0?260:130)*(id==="old"?.65:id==="civil"?.85:1)),development:i%3+1,capital:i<defs.length,realm:"Overworld",resources:[...new Set([...resources,...(i<defs.length?["Cobblestone","Redstone","Obsidian","Flint","Gravel","Iron","Diamond Ore"]:[])])]});
    k.provinces.push(`p${i}`);
  }
  if(id==="mafia"){
    kingdoms.clown.vault={netheriteBlocks:64*64*2,ancientDebris:64*64*4};
    const far=provinces.find(p=>p.owner==="farlands");
    if(far){far.name="Farlands Outpost";far.x=965;far.y=40;far.terrain="Farlands";far.resources=["Stone","Coal","Diamond Ore","Ancient Ruins"];} 
    const clown=provinces.find(p=>p.owner==="clown");if(clown){clown.realm="Nether";clown.terrain="Nether Wastes";clown.resources=["Quartz","Ancient Debris","Glowstone","Nether Gold","Netherite Scrap","Netherite Blocks"];}
    if(provinces[provinceCount-1])provinces[provinceCount-1].owner="farlands";
    if(!kingdoms.farlands.provinces.includes(provinces[provinceCount-1].id))kingdoms.farlands.provinces.push(provinces[provinceCount-1].id);
  }
  if(id==="prime_null"){
    const nullEnd=provinces.find(p=>p.owner==="null");if(nullEnd){nullEnd.realm="End";nullEnd.terrain="End Islands";nullEnd.name="Prime End Citadel";nullEnd.resources=["End Stone","Purpur","Chorus Fruit"];}
    const clown=provinces.find(p=>p.owner==="clown");if(clown){clown.realm="Nether";clown.terrain="Nether Wastes";clown.name="Clown's Nether Fortress";clown.resources=["Netherite Blocks","Ancient Debris","Quartz","Glowstone","Nether Gold"];}
    kingdoms.zam.vault={diamondBlocks:64*64,goldBlocks:64*64,emeraldBlocks:64*32};
    kingdoms.clown.vault={netheriteBlocks:64*64*4,ancientDebris:64*64*8};
  } else {
    const clown=provinces.find(p=>p.owner==="clown");if(clown){clown.realm="Nether";clown.terrain="Nether Wastes";clown.resources=["Quartz","Ancient Debris","Glowstone","Nether Gold","Netherite Scrap","Netherite Blocks"];}
    if(provinces[20]){provinces[20].name="Crimson Expanse";provinces[20].owner="clown";provinces[20].realm="Nether";provinces[20].terrain="Nether Wastes";provinces[20].resources=["Quartz","Glowstone"];if(!kingdoms.clown.provinces.includes("p20"))kingdoms.clown.provinces.push("p20");}
    if(provinces[21]){provinces[21].name="Outer End";provinces[21].owner="null" in kingdoms?"null":defs[0][0];provinces[21].realm="End";provinces[21].terrain="End Islands";provinces[21].resources=["Chorus Fruit","End Stone","Purpur"];}
  }
  const characters=Object.fromEntries(defs.map((d,i)=>[d[0],{id:`char_${d[0]}`,name:d[4],kingdomId:d[0],role:"Leader",influence:id==="prime_null"?({null:98,cindercrest:90,zam:96,royal:55,clown:95}[d[0]]||60):d[9],...(d[0]==="null"?{leftHandTotem:true}:{})}]));
  const custom=options.customCivilization;
  let playerId=options.playerId||(id==="prime_null"?"null":id==="mafia"?"mafia":"newparrot");
  if(custom?.enabled){
    playerId="custom";
    const start=({farlands:[940,90,"Farlands Frontier"],north:[90,90,"Northern Reach"],nether:[90,590,"Nether Gate"],center:[500,320,"Central Haven"]})[custom.location]||[500,320,"Central Haven"];
    const customKingdom={id:"custom",name:String(custom.name||"My Civilization").slice(0,28),flag:String(custom.flag||"⚑").slice(0,4),color:/^#[0-9a-f]{6}$/i.test(custom.color||"")?custom.color:"#62a8a0",leader:"You",government:"Player-led Civilization",capital:start[2],population:300,treasury:500,provinces:["custom_capital"],personality:"builder",isPlayer:true,soldiers:100,skill:60};
    kingdoms.custom=customKingdom;characters.custom={id:"char_custom",name:"You",kingdomId:"custom",role:"Leader",influence:60};
    provinces.push({id:"custom_capital",name:start[2],x:start[0],y:start[1],owner:"custom",terrain:custom.location==="nether"?"Nether Wastes":"Farmland",population:300,development:2,capital:true,realm:custom.location==="nether"?"Nether":"Overworld",resources:["Grain","Livestock","Stone","Timber","Cobblestone","Redstone","Obsidian","Flint","Iron","Diamond Ore"]});
  }
  // Fix province ownership lists after all scenario-specific placements.
  Object.values(kingdoms).forEach(k=>k.provinces=[]);
  provinces.forEach(p=>{if(kingdoms[p.owner]&&!kingdoms[p.owner].provinces.includes(p.id))kingdoms[p.owner].provinces.push(p.id)});
  if(id==="prime_null"){
    const n=kingdoms.null;n.population=10000;n.soldiers=10000;
    kingdoms.cindercrest.population=2500;kingdoms.cindercrest.soldiers=2500;
    kingdoms.zam.population=50;kingdoms.zam.soldiers=50;
    kingdoms.royal.population=200;kingdoms.royal.soldiers=200;
    kingdoms.clown.population=3000;kingdoms.clown.soldiers=3000;
  }
  return {campaignId:id,campaignName:c.name,description:c.description,year:c.year,month:c.month,turn:1,playerId,kingdoms,characters,inventory:{},foodStores:{},cattle:{},tools:{wooden:true,stone:false,iron:false,diamond:false},activeTool:"wooden",lastHarvestTurn:{},provinces,events:[{turn:1,text:`${c.name} begins. The realm's powers take their positions.`}],selectedProvince:null,selectedKingdom:null,mapMode:"political",mapSize,travel:{journey:null,locationId:playerId==="clown"?"crimson_keep":id==="prime_null"&&playerId==="null"?"outer_end_gate":"parrot_sky_gardens"},discoveredSites:[],caves:{whispering_caverns:{discovered:true,skeletonAlive:true,cleared:false,portalFound:false},deepstone_cave:{discovered:false,skeletonAlive:false,cleared:false,portalFound:false}},endPortal:{activated:false,entered:id==="prime_null",dragonDefeated:false,endClaimed:false},netherPortal:{built:playerId==="clown",entered:playerId==="clown"},mobSpawns:{}};
}
