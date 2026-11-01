export function processCharacterInfluence(state){
  const reports=[];
  for(const character of Object.values(state.characters||{})){
    const kingdom=state.kingdoms[character.kingdomId];if(!kingdom)continue;
    // Influence attracts newcomers to the faction a character belongs to.
    const arrivals=Math.floor(Math.max(0,character.influence-20)/20);
    if(arrivals>0){
      kingdom.population+=arrivals;
      const capital=state.provinces.find(p=>p.owner===kingdom.id&&p.capital)||state.provinces.find(p=>p.owner===kingdom.id);
      if(capital)capital.population+=arrivals;
      reports.push(`${arrivals} people joined ${kingdom.name} because of ${character.name}'s influence (${character.influence}).`);
    }
  }
  return reports;
}
