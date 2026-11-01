export function kingdomStats(state,k){
  const provinces=state.provinces.filter(p=>p.owner===k.id);
  return {...k,provinces:provinces.map(p=>p.id),provinceCount:provinces.length,territoryPopulation:provinces.reduce((n,p)=>n+p.population,0)};
}
export function relationLabel(a,b){
  if(a.id===b.id)return "Your realm";
  const score=((a.id.length*7+b.id.length*11)%5);
  return ["Neutral","Cautious","Friendly","Neutral","Rival"][score];
}
export function formatNumber(n){return Math.round(n).toLocaleString("en-US");}
