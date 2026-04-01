import fs from "fs";
import path from "path";
import dotenv from "dotenv";
dotenv.config();
const DIR = process.env.PROJECT_DIR || "C:\\Users\\bness\\OneDrive\\02_PARKSIDE\\05_PROSJEKT\\TankeTekt";
const write = (f,v) => { fs.writeFileSync(path.join(DIR,f),v,"utf8"); console.log(`  ✅ ${f} (${v.length}ch)`); };

// ── ELEMENTS.JS: full rewrite of core functions ──────────────────────────────
const elementsJs = `
window.DOOR_PRESETS=[{id:'d70',name:'Dør 70cm',width:0.7},{id:'d80',name:'Dør 80cm',width:0.8},{id:'d90',name:'Dør 90cm',width:0.9},{id:'d120',name:'Dør 120cm (dobbel)',width:1.2},{id:'custom',name:'Eige mål',width:0.8}];
window.WINDOW_PRESETS=[{id:'v60',name:'Vindauge 60cm',width:0.6},{id:'v90',name:'Vindauge 90cm',width:0.9},{id:'v120',name:'Vindauge 120cm',width:1.2},{id:'v150',name:'Vindauge 150cm',width:1.5},{id:'custom',name:'Eige mål',width:1.0}];

// Get wall geometry for a door/window (works on standalone walls AND room edges)
function getElPos(el){
  if(el.wallId){
    const w=TK.walls.find(x=>x.id===el.wallId);if(!w)return null;
    return{x1:w.x1,y1:w.y1,x2:w.x2,y2:w.y2,thickness:w.thickness};
  }
  if(el.roomId){
    const r=TK.rooms.find(x=>x.id===el.roomId);if(!r)return null;
    const edges={top:{x1:r.x,y1:r.y,x2:r.x+r.w,y2:r.y},right:{x1:r.x+r.w,y1:r.y,x2:r.x+r.w,y2:r.y+r.h},bottom:{x1:r.x,y1:r.y+r.h,x2:r.x+r.w,y2:r.y+r.h},left:{x1:r.x,y1:r.y,x2:r.x,y2:r.y+r.h}};
    const e=edges[el.edge];if(!e)return null;
    return{...e,thickness:r.wallThickness||TK.wallThickness};
  }
  return null;
}
window.getElPos=getElPos;

// Hit test both standalone walls AND room edges
window.hitTestAll=(sx,sy)=>{
  const wo=window.screenToWorld(sx,sy);
  const tol=Math.max(1.5,30/TK.zoom);
  for(const w of TK.walls){
    const dx=w.x2-w.x1,dy=w.y2-w.y1,l2=dx*dx+dy*dy;if(!l2)continue;
    const t=Math.max(0,Math.min(1,((wo.x-w.x1)*dx+(wo.y-w.y1)*dy)/l2));
    if(Math.hypot(wo.x-w.x1-t*dx,wo.y-w.y1-t*dy)<tol)return{type:'wall',wallId:w.id,t};
  }
  for(const r of TK.rooms){
    const edges=[{edge:'top',x1:r.x,y1:r.y,x2:r.x+r.w,y2:r.y},{edge:'right',x1:r.x+r.w,y1:r.y,x2:r.x+r.w,y2:r.y+r.h},{edge:'bottom',x1:r.x,y1:r.y+r.h,x2:r.x+r.w,y2:r.y+r.h},{edge:'left',x1:r.x,y1:r.y,x2:r.x,y2:r.y+r.h}];
    for(const e of edges){
      const dx=e.x2-e.x1,dy=e.y2-e.y1,l2=dx*dx+dy*dy;if(!l2)continue;
      const t=Math.max(0,Math.min(1,((wo.x-e.x1)*dx+(wo.y-e.y1)*dy)/l2));
      if(Math.hypot(wo.x-e.x1-t*dx,wo.y-e.y1-t*dy)<tol)return{type:'room',roomId:r.id,edge:e.edge,t};
    }
  }
  return null;
};

window.placeElementOnWall=(sx,sy)=>{
  const hit=window.hitTestAll(sx,sy);
  if(!hit){if(window.setStatus)setStatus('Ingen vegg funnen — klikk nærmare ein vegg');return;}
  if(window.saveSnapshot)saveSnapshot();
  const preset=TK.pendingElement?.preset||DOOR_PRESETS[1];
  const el={id:TK.nextId++,...preset,t:hit.t,swingDir:0};
  if(hit.type==='wall')el.wallId=hit.wallId;
  else{el.roomId=hit.roomId;el.edge=hit.edge;}
  if(TK.pendingElement?.type==='window')TK.windows.push(el);
  else TK.doors.push(el);
  TK.pendingElement=null;TK.currentTool='draw';
  if(window.updateElementList)updateElementList();
  if(window.redraw)redraw();
  if(window.setStatus)setStatus('Element plassert — klikk for å snu');
};

// Draw door — architectural symbol with 4 swing orientations
window.drawDoor=(ctx,door)=>{
  const pos=getElPos(door);if(!pos)return;
  const s1=window.worldToScreen(pos.x1,pos.y1),s2=window.worldToScreen(pos.x2,pos.y2);
  const len=Math.hypot(s2.x-s1.x,s2.y-s1.y);if(len<2)return;
  const ux=(s2.x-s1.x)/len,uy=(s2.y-s1.y)/len;
  const dw=door.width*TK.scale*TK.zoom;
  const thick=Math.max(4,(pos.thickness||TK.wallThickness||0.1)*TK.scale*TK.zoom);
  const hx=s1.x+(s2.x-s1.x)*door.t,hy=s1.y+(s2.y-s1.y)*door.t;
  const sd=door.swingDir||0;
  const fa=sd&1,fs=(sd>>1)&1;
  const dx2=fa?-ux:ux,dy2=fa?-uy:uy;
  const nx=fs?uy:-uy,ny=fs?-ux:ux;
  const tx=hx+dx2*dw,ty=hy+dy2*dw;
  ctx.save();
  // Gap
  const hw=thick/2+2;
  ctx.fillStyle='#ffffff';
  ctx.beginPath();ctx.moveTo(hx+uy*hw,hy-ux*hw);ctx.lineTo(tx+uy*hw,ty-ux*hw);ctx.lineTo(tx-uy*hw,ty+ux*hw);ctx.lineTo(hx-uy*hw,hy+ux*hw);ctx.closePath();ctx.fill();
  const col=door.id===TK.selectedId?'#e94560':'#1a1a1a';
  // Panel
  ctx.strokeStyle=col;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(hx,hy);ctx.lineTo(tx,ty);ctx.stroke();
  // Hinge dot
  ctx.fillStyle=col;ctx.beginPath();ctx.arc(hx,hy,3,0,Math.PI*2);ctx.fill();
  // Swing arc
  const startA=Math.atan2(dy2,dx2),endA=Math.atan2(ny,nx);
  ctx.beginPath();ctx.arc(hx,hy,dw,startA,endA,!!(fs^fa));
  ctx.strokeStyle=col;ctx.lineWidth=1;ctx.setLineDash([4,3]);ctx.stroke();ctx.setLineDash([]);
  ctx.restore();
};

// Draw window — standard architectural symbol (two parallel lines with end caps)
window.drawWindow=(ctx,win)=>{
  const pos=getElPos(win);if(!pos)return;
  const s1=window.worldToScreen(pos.x1,pos.y1),s2=window.worldToScreen(pos.x2,pos.y2);
  const len=Math.hypot(s2.x-s1.x,s2.y-s1.y);if(len<2)return;
  const ux=(s2.x-s1.x)/len,uy=(s2.y-s1.y)/len;
  const ww=win.width*TK.scale*TK.zoom;
  const thick=Math.max(4,(pos.thickness||TK.wallThickness||0.1)*TK.scale*TK.zoom);
  const cx=s1.x+(s2.x-s1.x)*win.t,cy=s1.y+(s2.y-s1.y)*win.t;
  const wx1=cx-ux*ww/2,wy1=cy-uy*ww/2,wx2=cx+ux*ww/2,wy2=cy+uy*ww/2;
  const hw=thick/2;
  ctx.save();
  // Gap
  ctx.fillStyle='#ffffff';
  ctx.beginPath();ctx.moveTo(wx1+uy*(hw+2),wy1-ux*(hw+2));ctx.lineTo(wx2+uy*(hw+2),wy2-ux*(hw+2));ctx.lineTo(wx2-uy*(hw+2),wy2+ux*(hw+2));ctx.lineTo(wx1-uy*(hw+2),wy1+ux*(hw+2));ctx.closePath();ctx.fill();
  const col=win.id===TK.selectedId?'#e94560':'#1a1a1a';
  ctx.strokeStyle=col;ctx.lineWidth=1.5;
  // Two parallel lines
  const o=Math.max(2,hw*0.4);
  ctx.beginPath();ctx.moveTo(wx1+uy*o,wy1-ux*o);ctx.lineTo(wx2+uy*o,wy2-ux*o);ctx.stroke();
  ctx.beginPath();ctx.moveTo(wx1-uy*o,wy1+ux*o);ctx.lineTo(wx2-uy*o,wy2+ux*o);ctx.stroke();
  // End caps
  ctx.lineWidth=2;
  ctx.beginPath();ctx.moveTo(wx1+uy*hw,wy1-ux*hw);ctx.lineTo(wx1-uy*hw,wy1+ux*hw);ctx.stroke();
  ctx.beginPath();ctx.moveTo(wx2+uy*hw,wy2-ux*hw);ctx.lineTo(wx2-uy*hw,wy2+ux*hw);ctx.stroke();
  ctx.restore();
};

window.checkTEK17=()=>TK.rooms.map(r=>{const type=(window.TK_ROOM_TYPES||[]).find(t=>t.id===r.type);return(type?.minArea>0&&parseFloat((r.w*r.h/TK.scale/TK.scale).toFixed(2))<type.minArea)?{roomId:r.id,msg:r.name+': '+(r.w*r.h/TK.scale/TK.scale).toFixed(2)+'m² (min '+type.minArea+'m² TEK17)'}:null;}).filter(Boolean);

window.placeDoor=()=>{
  const ov=document.createElement('div');ov.className='modal-overlay';
  const opts=DOOR_PRESETS.map(p=>'<option value="'+p.id+'">'+p.name+'</option>').join('');
  ov.innerHTML='<div class="modal"><h2>Legg til dør</h2><label>Type</label><select id="_dp">'+opts+'</select><div id="_dcw" style="display:none"><label>Breidd (cm)</label><input id="_dw" type="number" value="80" min="40" max="240"></div><div class="modal-btns"><button id="_dc">Avbryt</button><button id="_ds" style="background:var(--accent);border-color:var(--accent)">Vel plassering</button></div></div>';
  document.body.appendChild(ov);
  document.getElementById('_dp').onchange=function(){document.getElementById('_dcw').style.display=this.value==='custom'?'block':'none';};
  document.getElementById('_dc').onclick=()=>ov.remove();
  document.getElementById('_ds').onclick=()=>{
    const sel=document.getElementById('_dp').value;
    const preset=sel==='custom'?{id:'custom',name:'Eige',width:parseFloat(document.getElementById('_dw').value||80)/100}:DOOR_PRESETS.find(p=>p.id===sel);
    TK.pendingElement={type:'door',preset};TK.currentTool='door';ov.remove();
    if(window.setStatus)setStatus('Klikk på ein vegg eller romvegg for å plassere dør');
  };
};

window.placeWindow=()=>{
  const ov=document.createElement('div');ov.className='modal-overlay';
  const opts=WINDOW_PRESETS.map(p=>'<option value="'+p.id+'">'+p.name+'</option>').join('');
  ov.innerHTML='<div class="modal"><h2>Legg til vindauge</h2><label>Type</label><select id="_wp">'+opts+'</select><div id="_wcw" style="display:none"><label>Breidd (cm)</label><input id="_ww" type="number" value="100" min="30" max="300"></div><div class="modal-btns"><button id="_wc">Avbryt</button><button id="_ws" style="background:var(--accent);border-color:var(--accent)">Vel plassering</button></div></div>';
  document.body.appendChild(ov);
  document.getElementById('_wp').onchange=function(){document.getElementById('_wcw').style.display=this.value==='custom'?'block':'none';};
  document.getElementById('_wc').onclick=()=>ov.remove();
  document.getElementById('_ws').onclick=()=>{
    const sel=document.getElementById('_wp').value;
    const preset=sel==='custom'?{id:'custom',name:'Eige',width:parseFloat(document.getElementById('_ww').value||100)/100}:WINDOW_PRESETS.find(p=>p.id===sel);
    TK.pendingElement={type:'window',preset};TK.currentTool='window';ov.remove();
    if(window.setStatus)setStatus('Klikk på ein vegg eller romvegg for å plassere vindauge');
  };
};

window.updateElementList=()=>{
  const ul=document.getElementById('element-list');if(!ul)return;ul.innerHTML='';
  function mkDel(arr,id,label){
    const btn=document.createElement('button');btn.textContent='×';btn.title='Slett';
    btn.style='float:right;padding:0 5px;background:#e94560;border:none;color:white;border-radius:3px;cursor:pointer;font-size:11px';
    btn.onclick=e=>{e.stopPropagation();if(window.saveSnapshot)saveSnapshot();window[arr]=window[arr].filter(x=>x.id!==id);updateElementList();if(window.redraw)redraw();};
    return btn;
  }
  function addSection(title,items,arrName,color,labelFn){
    if(!items.length)return;
    const h=document.createElement('li');h.style='list-style:none;color:var(--muted);font-size:11px;text-transform:uppercase;padding:8px 0 4px;letter-spacing:1px';h.textContent=title+' ('+items.length+')';ul.appendChild(h);
    items.forEach(el=>{
      const li=document.createElement('li');li.className='room-item'+(TK.selectedId===el.id?' selected':'');li.style.borderLeftColor=color;
      li.innerHTML='<div class="rname">'+labelFn(el)+'</div>';
      li.onclick=()=>{TK.selectedId=el.id;TK.selectedType=arrName==='TK.doors'?'door':arrName==='TK.windows'?'window':'wall';updateElementList();if(window.redraw)redraw();};
      li.appendChild(mkDel(arrName,el.id));ul.appendChild(li);
    });
  }
  addSection('Veggar',TK.walls,'TK.walls','#666',w=>'Vegg '+(Math.hypot(w.x2-w.x1,w.y2-w.y1)/TK.scale).toFixed(2)+'m | '+(w.thickness*1000).toFixed(0)+'mm');
  addSection('Dører',TK.doors,'TK.doors','#8B4513',d=>d.name||'Dør '+((d.width||0.8)*100).toFixed(0)+'cm');
  addSection('Vindauge',TK.windows,'TK.windows','#4a90d9',w=>w.name||'Vindauge '+((w.width||0.9)*100).toFixed(0)+'cm');
  if(!TK.walls.length&&!TK.doors.length&&!TK.windows.length){const li=document.createElement('li');li.style='color:var(--muted);font-size:12px;padding:8px';li.textContent='Ingen element lagt til';ul.appendChild(li);}
};
`;
write("src/elements.js", elementsJs);

// ── CANVAS.JS: call drawDoor/drawWindow in redraw ────────────────────────────
let cv = fs.readFileSync(path.join(DIR,"src/canvas.js"),"utf8");
// Add door/window rendering just before snap indicator
if(!cv.includes("window.drawDoor")){
  cv = cv.replace(
    `// Snap indicator`,
    `// Doors & Windows
  if(window.drawDoor)TK.doors.forEach(d=>window.drawDoor(ctx,d));
  if(window.drawWindow)TK.windows.forEach(w=>window.drawWindow(ctx,w));
  // Snap indicator`
  );
}
write("src/canvas.js", cv);

// ── DRAWING.JS: door click to flip swingDir ──────────────────────────────────
let dr = fs.readFileSync(path.join(DIR,"src/drawing.js"),"utf8");
// In mousedown, when clicking on a selected door, cycle swingDir
const flipCode = `
    // Flip door on click when already selected
    if(TK.selectedId&&TK.selectedType==='door'){
      const d=TK.doors.find(x=>x.id===TK.selectedId);
      if(d){const pos=window.getElPos?window.getElPos(d):null;
        if(pos){const s1=window.worldToScreen(pos.x1,pos.y1),s2=window.worldToScreen(pos.x2,pos.y2);
          const cx=s1.x+(s2.x-s1.x)*d.t,cy=s1.y+(s2.y-s1.y)*d.t;
          if(Math.hypot(e.offsetX-cx,e.offsetY-cy)<(d.width*TK.scale*TK.zoom+20)){
            if(window.saveSnapshot)saveSnapshot();d.swingDir=((d.swingDir||0)+1)%4;window.redraw();
            if(window.setStatus)setStatus('Dør snudd ('+(d.swingDir+1)+'/4)');return;
          }
        }
      }
    }`;
// Insert after the pan check at start of mousedown
dr = dr.replace(
  `if(TK.currentTool==='door'||TK.currentTool==='window'){`,
  flipCode+`\n    if(TK.currentTool==='door'||TK.currentTool==='window'){`
);
write("src/drawing.js", dr);

console.log("\n✅ All done. Ctrl+Shift+R to reload.");
