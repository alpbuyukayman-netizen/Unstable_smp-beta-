import {processAI} from "./ai.js";
import {processCharacterInfluence} from "./characters.js";
import {advanceTravel,checkSpokeTotem,refreshMobSpawns} from "./exploration.js";
export function advanceTurn(state){
  state.month++;
  if(state.month>12){state.month=1;state.year++;}
  state.turn++;
  const reports=[];
  for(const p of state.provinces){
    const growth=Math.max(1,Math.round(p.population*(p.terrain==="Farmland"?.004:.002)));
    p.population+=growth;
  }
  for(const k of Object.values(state.kingdoms)){
    const owned=state.provinces.filter(p=>p.owner===k.id);
    const income=owned.reduce((sum,p)=>sum+4+p.development*2,0);
    k.treasury+=income;
    const growth=owned.reduce((sum,p)=>sum+Math.max(1,Math.round(p.population*.002)),0);
    k.population+=growth;
    const farms=owned.filter(p=>p.terrain==="Farmland");
    const cropFood=farms.reduce((sum,p)=>sum+Math.round(8+p.development*3),0);
    // Livestock provinces breed cattle; cattle add a modest food supply.
    const livestock=farms.reduce((sum,p)=>sum+(p.resources.includes("Livestock")?1:0),0);
    const foodProduced=cropFood+livestock*4;
    const foodNeeded=Math.ceil(k.population*.004);
    state.foodStores ||= {};
    state.foodStores[k.id]=(state.foodStores[k.id]||0)+foodProduced-foodNeeded;
    state.cattle ||= {};
    state.cattle[k.id]=(state.cattle[k.id]||0)+livestock;
    if(state.foodStores[k.id]<0){const shortage=Math.abs(state.foodStores[k.id]);k.population=Math.max(1,k.population-Math.ceil(shortage*.15));state.foodStores[k.id]=0;reports.push(`${k.name} faced a food shortage and lost population.`);}
    if(k.id===state.playerId)reports.push(`${k.name} earned ${income} treasury, produced ${foodProduced} food and ${livestock} cattle, and consumed ${foodNeeded} food.`);
  }
  const travelReport=advanceTravel(state);if(travelReport)reports.push(travelReport);
  refreshMobSpawns(state);
  reports.push(...processCharacterInfluence(state));
  reports.push(...processAI(state));
  const totemReport=checkSpokeTotem(state);if(totemReport)reports.push(totemReport);
  if(!reports.length)reports.push("A quiet month passes across the realms.");
  state.events.unshift(...reports.map(text=>({turn:state.turn,text})));
  state.events=state.events.slice(0,40);
  return reports;
}
export const monthName = n => new Date(2000,n-1,1).toLocaleString("en-US",{month:"long"});
