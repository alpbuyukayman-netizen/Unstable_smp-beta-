import {WORLD_SITES} from "./exploration.js";
const NS = "http://www.w3.org/2000/svg";
const el = (name,attrs={}) => { const n=document.createElementNS(NS,name); Object.entries(attrs).forEach(([k,v])=>n.setAttribute(k,v)); return n; };
const shapes = [
  "M20 30 L155 15 L205 80 L165 160 L70 170 L15 105 Z",
  "M165 15 L315 10 L355 85 L285 155 L165 160 L205 80 Z",
  "M315 10 L475 20 L505 95 L435 165 L285 155 L355 85 Z",
  "M475 20 L635 10 L685 95 L590 165 L435 165 L505 95 Z",
  "M635 10 L805 30 L835 120 L735 185 L590 165 L685 95 Z",
  "M805 30 L975 95 L980 230 L850 260 L735 185 L835 120 Z",
  "M15 105 L70 170 L165 160 L150 270 L45 315 L5 230 Z",
  "M165 160 L285 155 L305 250 L235 325 L150 270 Z",
  "M285 155 L435 165 L450 275 L365 330 L305 250 Z",
  "M435 165 L590 165 L615 270 L525 340 L450 275 Z",
  "M590 165 L735 185 L760 285 L665 345 L615 270 Z",
  "M735 185 L850 260 L980 230 L985 380 L860 400 L760 285 Z",
  "M5 230 L45 315 L150 270 L155 405 L65 475 L5 390 Z",
  "M150 270 L235 325 L305 250 L320 405 L235 470 L155 405 Z",
  "M305 250 L365 330 L450 275 L475 405 L390 475 L320 405 Z",
  "M450 275 L525 340 L615 270 L640 420 L555 485 L475 405 Z",
  "M615 270 L665 345 L760 285 L790 435 L700 505 L640 420 Z",
  "M760 285 L860 400 L985 380 L980 520 L850 550 L790 435 Z",
  "M120 470 L235 470 L290 560 L210 625 L85 590 L65 475 Z",
  "M390 475 L555 485 L610 575 L500 635 L350 595 L290 560 Z",
  "M30 550 L115 535 L160 590 L110 640 L35 615 Z",
  "M790 545 L875 535 L940 590 L900 635 L815 620 Z"
];
export class WorldMap {
  constructor(svg, onProvince) {
    this.svg=svg; this.layer=svg.querySelector("#province-layer"); this.art=svg.querySelector("#map-art"); this.labels=svg.querySelector("#map-labels"); this.onProvince=onProvince; this.selected=null; this.scale=1; this.tx=0; this.ty=0;
    this.group=el("g"); this.svg.appendChild(this.group);
    this.art.remove(); this.layer.remove(); this.labels.remove();
    this.group.append(this.art=this.svg.querySelector("#map-art"),this.layer=this.svg.querySelector("#province-layer"),this.labels=this.svg.querySelector("#map-labels"));
    this.addDecor(); this.bindPanZoom();
  }
  addDecor(){
    const continents=[["M40 65 Q120 -5 230 40 T440 45 L480 140 Q400 200 270 180 T60 210 Z","#315f50"],["M560 45 Q720 -5 910 80 L965 210 Q900 300 790 280 T590 205 Z","#426b51"],["M40 280 Q170 230 310 300 L380 450 Q260 520 80 470 Z","#42664b"],["M440 300 Q620 240 820 330 L950 490 Q820 580 610 510 L480 450 Z","#536c4c"]];
    continents.forEach(([d,c])=>this.art.appendChild(el("path",{d,fill:c,opacity:.36,stroke:"#8ca77b","stroke-width":3})));
    for(let i=0;i<30;i++){const x=(i*137)%970+10,y=(i*83)%600+15;this.art.appendChild(el("path",{d:`M${x} ${y+10} l-8 -14 m8 14 l9 -14`,stroke:"#9caf77","stroke-width":2,opacity:.4}));}
    this.art.appendChild(el("path",{d:"M70 585 Q145 545 220 585",stroke:"#b65b50","stroke-width":3,fill:"none",opacity:.6}));
    this.art.appendChild(el("path",{d:"M790 590 Q850 555 925 590",stroke:"#b8a5d0","stroke-width":3,fill:"none",opacity:.7}));
  }
  render(state){
    this.state=state; this.layer.innerHTML="";this.labels.innerHTML="";
    state.provinces.forEach((p,i)=>{
      const d=shapes[i] || (()=>{const x=p.x,y=p.y,w=48,h=34;return `M${x-w} ${y-h} L${x+w} ${y-h} L${x+w+10} ${y} L${x+w} ${y+h} L${x-w} ${y+h} L${x-w-10} ${y} Z`;})();
      const k=state.kingdoms[p.owner]; const path=el("path",{d,class:"province"+(this.selected===p.id?" selected":""),fill:state.mapMode==="terrain"?this.terrainColor(p.terrain):state.mapMode==="population"?this.populationColor(p.population):k.color, "data-id":p.id});
      path.addEventListener("click",e=>{e.stopPropagation();this.selected=p.id;this.onProvince(p.id);this.render(state);});
      this.layer.appendChild(path);
      const label=el("text",{x:p.x,y:p.y,class:"province-label"});label.textContent=p.name;this.labels.appendChild(label);
      if(p.capital){const star=el("path",{d:`M${p.x} ${p.y-18} l3 7 7 1 -5 5 1 7 -6 -4 -6 4 1 -7 -5 -5 7 -1 Z`,class:"capital-star"});this.labels.appendChild(star);}
    });
    WORLD_SITES.forEach(site=>{
      const g=el("g",{class:"world-site-marker"});
      const cave=site.kind.includes("Cave");
      g.appendChild(el("circle",{cx:site.x,cy:site.y-24,r:cave?11:9,fill:cave?"#263e4a":"#e4b95f",stroke:cave?"#b5d2d8":"#3b3020","stroke-width":2,opacity:.96}));
      const label=el("text",{x:site.x,y:site.y-20,class:"site-marker-icon"});label.textContent=cave?"⌁":"✦";g.appendChild(label);
      const title=el("title");title.textContent=`${site.name} · ${site.kind}`;g.appendChild(title);this.labels.appendChild(g);
    });
    this.group.setAttribute("transform",`translate(${this.tx} ${this.ty}) scale(${this.scale})`);
  }
  terrainColor(t){return ({Forest:"#47734f",Mountains:"#8b8c82",Farmland:"#b59b4e",Desert:"#b78c54",Ocean:"#326b83","Nether Wastes":"#9c4d43","End Islands":"#8b83a8"})[t]||"#627b72";}
  populationColor(n){return n>700?"#b54f56":n>350?"#d39b4e":n>180?"#6d9d70":"#487d91";}
  bindPanZoom(){
    const viewport=this.svg.parentElement;let down=null;
    viewport.addEventListener("pointerdown",e=>{if(e.target.closest(".province"))return;down={x:e.clientX-this.tx,y:e.clientY-this.ty};viewport.classList.add("dragging");viewport.setPointerCapture(e.pointerId);});
    viewport.addEventListener("pointermove",e=>{if(!down)return;this.tx=e.clientX-down.x;this.ty=e.clientY-down.y;this.group.setAttribute("transform",`translate(${this.tx} ${this.ty}) scale(${this.scale})`);});
    const stop=()=>{down=null;viewport.classList.remove("dragging");};viewport.addEventListener("pointerup",stop);viewport.addEventListener("pointercancel",stop);
    viewport.addEventListener("wheel",e=>{e.preventDefault();this.zoom(e.deltaY<0?1.12:.89);},{passive:false});
  }
  zoom(f){this.scale=Math.max(.65,Math.min(2.5,this.scale*f));this.group.setAttribute("transform",`translate(${this.tx} ${this.ty}) scale(${this.scale})`);}
  reset(){this.scale=1;this.tx=0;this.ty=0;this.group.setAttribute("transform","translate(0 0) scale(1)");}
}
