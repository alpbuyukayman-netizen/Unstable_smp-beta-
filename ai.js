export function processAI(state){
  const reports=[];
  for(const k of Object.values(state.kingdoms)){
    if(k.id===state.playerId)continue;
    const owned=state.provinces.filter(p=>p.owner===k.id);
    // Distinct personalities influence priorities and keep the world from snowballing.
    if(k.personality==="builder" || k.personality==="cautious" || k.personality==="diplomatic"){
      const candidates=owned.filter(p=>p.development<4);
      if(candidates.length && k.treasury>=35 && Math.random()<({builder:.8,cautious:.45,diplomatic:.55}[k.personality])){
        const p=candidates[(state.turn+k.id.length)%candidates.length];p.development++;k.treasury-=35;
        reports.push(`${k.name} improved ${p.name}.`);
      }
    }
    const leader=state.characters?.[k.id];
    if(k.personality==="ambitious" && k.treasury>=50 && leader && leader.influence<100 && Math.random()<.35){
      leader.influence=Math.min(100,leader.influence+2);k.treasury-=20;reports.push(`${leader.name} increased their influence to ${leader.influence}.`);
    }
    if(k.personality==="aggressive" && Math.random()<.22){
      const neighbors=state.provinces.filter(p=>p.owner!==k.id && p.owner!=="neutral" && Math.abs(p.x-(owned[0]?.x||0))<180 && Math.abs(p.y-(owned[0]?.y||0))<180);
      if(neighbors.length){const target=neighbors[(state.turn+k.id.length)%neighbors.length];const defender=state.kingdoms[target.owner];if(defender && defender.provinces.length>1 && leader && leader.influence>70){const old=defender.name;target.owner=k.id;k.provinces.push(target.id);defender.provinces=defender.provinces.filter(id=>id!==target.id);leader.influence=Math.max(0,leader.influence-8);reports.push(`${k.name} annexed ${target.name} from ${old} after a border crisis.`);}}
    }
    if(!reports.some(r=>r.startsWith(k.name)) && Math.random()<.3){k.treasury+=5;}
  }
  return reports;
}
