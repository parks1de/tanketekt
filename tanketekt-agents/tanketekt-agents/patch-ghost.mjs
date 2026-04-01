import fs from "fs";
import path from "path";
import dotenv from "dotenv";
dotenv.config();
const DIR = process.env.PROJECT_DIR || "C:\\Users\\bness\\OneDrive\\02_PARKSIDE\\05_PROSJEKT\\TankeTekt";
const write = (f,v) => { fs.writeFileSync(path.join(DIR,f),v,"utf8"); console.log(`  ✅ ${f} (${v.length}ch)`); };

// ── 1. APP.JS: add "Rom med mål" + "Vegg med mål" buttons + cascade delete ──
let app = fs.readFileSync(path.join(DIR,"src/app.js"),"utf8");

// Add cascade delete helper
const cascadeDelete = `
window.cascadeDelete=(id,type)=>{
  if(type==='room'){
    TK.doors=TK.doors.filter(d=>d.roomId!==id);
    TK.windows=TK.windows.filter(w=>w.roomId!==id);
    TK.rooms=TK.rooms.filter(r=>r.id!==id);
  } else if(type==='wall'){
    TK.doors=TK.doors.filter(d=>d.wallId!==id);
    TK.windows=TK.windows.filter(w=>w.wallId!==id);
    TK.walls=TK.walls.filter(w=>w.id!==id);
  }
  if(TK.selectedId===id)TK.selectedId=null;
  if(window.updateSidebar)updateSidebar();
  if(window.updateWallList)updateWallList();
  if(window.updateElementList)updateElementList();
  if(window.redraw)redraw();
};`;

if(!app.includes('cascadeDelete')){
  app = app.replace('window.TK={', cascadeDelete+'\nwindow.TK={');
}

// Replace deleteSelected to use cascade
app = app.replace(
  /window\.deleteSelected=\(\)=>\{if\(!TK\.selectedId\)return;.*?redraw\(\)\}/s,
  `window.deleteSelected=()=>{if(!TK.selectedId)return;saveSnapshot();cascadeDelete(TK.selectedId,TK.selectedType);}`
);

// Update room × buttons to use cascadeDelete
app = app.replace(
  `btn.onclick=e=>{e.stopPropagation();if(window.saveSnapshot)saveSnapshot();TK.rooms=TK.rooms.filter(x=>x.id!==r.id);if(TK.selectedId===r.id)TK.selectedId=null;updateSidebar();if(window.redraw)redraw()}`,
  `btn.onclick=e=>{e.stopPropagation();if(window.saveSnapshot)saveSnapshot();window.cascadeDelete(r.id,'room');}`
);

// Ghost object state
app = app.replace(
  'window.TK={rooms',
  'window.TK={ghostObject:null,rooms'
);

// Add ghost modal function
const ghostModal = `
window.promptRoomDims=()=>{
  const types=(window.TK_ROOM_TYPES||[]);
  const opts=types.map(t=>'<option value="'+t.id+'">'+t.name+'</option>').join('');
  const ov=document.createElement('div');ov.className='modal-overlay';
  ov.innerHTML='<div class="modal"><h2>Nytt rom med mål</h2><label>Lengd (m)</label><input id="_rl" type="number" value="4.0" step="0.1" min="0.5"><label>Breidd (m)</label><input id="_rb" type="number" value="3.0" step="0.1" min="0.5"><label>Type</label><select id="_rtp">'+opts+'</select><div class="modal-btns"><button id="_rpc">Avbryt</button><button id="_rpp" style="background:var(--accent);border-color:var(--accent)">Plasser →</button></div></div>';
  document.body.appendChild(ov);
  document.getElementById('_rpc').onclick=()=>ov.remove();
  document.getElementById('_rpp').onclick=()=>{
    const l=parseFloat(document.getElementById('_rl').value)||4;
    const b=parseFloat(document.getElementById('_rb').value)||3;
    const tid=document.getElementById('_rtp').value;
    const tp=types.find(t=>t.id===tid)||types[7];
    TK.ghostObject={type:'room',w:l*TK.scale,h:b*TK.scale,roomType:tid,color:tp.color,name:'Rom '+TK.nextId};
    TK.currentTool='ghost';
    ov.remove();
    if(window.setStatus)setStatus('Klikk for å plassere rom ('+l+'m × '+b+'m) — Shift for fri plassering');
  };
};
window.promptWallDims=()=>{
  const ov=document.createElement('div');ov.className='modal-overlay';
  ov.innerHTML='<div class="modal"><h2>Ny vegg med mål</h2><label>Lengd (m)</label><input id="_wl" type="number" value="3.0" step="0.1" min="0.1"><label>Tykkleik</label><select id="_wth"><option value="0.098">Innv. 98mm</option><option value="0.148">Innv. 148mm</option><option value="0.198" selected>Utv. 198mm</option><option value="0.248">Utv. 248mm</option></select><div class="modal-btns"><button id="_wpc">Avbryt</button><button id="_wpp" style="background:var(--accent);border-color:var(--accent)">Plasser →</button></div></div>';
  document.body.appendChild(ov);
  document.getElementById('_wpc').onclick=()=>ov.remove();
  document.getElementById('_wpp').onclick=()=>{
    const l=parseFloat(document.getElementById('_wl').value)||3;
    const th=parseFloat(document.getElementById('_wth').value)||0.198;
    TK.ghostObject={type:'wall',length:l*TK.scale,thickness:th};
    TK.currentTool='ghost';
    ov.remove();
    if(window.setStatus)setStatus('Klikk for å plassere vegg ('+l+'m) — Shift for fri plassering');
  };
};`;

if(!app.includes('promptRoomDims')){
  app = app.replace('document.addEventListener(\'DOMContentLoaded\'', ghostModal+'\ndocument.addEventListener(\'DOMContentLoaded\'');
}

// Wire keyboard shortcut D for "rom med mål"
app = app.replace(
  `else if(e.key==='Escape')`,
  `else if(e.key==='d'||e.key==='D'){if(window.promptRoomDims)promptRoomDims()}
    else if(e.key==='Escape')`
);

write("src/app.js", app);

// ── 2. INDEX.HTML: add "Rom med mål" + "Vegg med mål" buttons ──────────────
let html = fs.readFileSync(path.join(DIR,"index.html"),"utf8");
if(!html.includes('btnRoomDims')){
  html = html.replace(
    '<div class="tb-div"></div>\n    <button id="btnDoor"',
    `<button id="btnRoomDims" title="Nytt rom med eksakte mål (D)" onclick="promptRoomDims()">✛ Rom</button>
    <button id="btnWallDims" title="Ny vegg med eksakte mål" onclick="promptWallDims()">✛ Vegg</button>
    <div class="tb-div"></div>\n    <button id="btnDoor"`
  );
}
write("index.html", html);

// ── 3. CANVAS.JS: draw ghost object following cursor ─────────────────────────
let cv = fs.readFileSync(path.join(DIR,"src/canvas.js"),"utf8");
const ghostRender = `
  // Ghost object preview
  if(TK.ghostObject&&TK.ghostObject._cx!==undefined){
    const g=TK.ghostObject;
    ctx.save();ctx.globalAlpha=0.45;
    if(g.type==='room'){
      const s=worldToScreen(g._cx-g.w/2,g._cy-g.h/2);
      ctx.fillStyle=g.color||'#aaaaaa';ctx.fillRect(s.x,s.y,g.w*TK.zoom,g.h*TK.zoom);
      ctx.strokeStyle='#e94560';ctx.lineWidth=2;ctx.strokeRect(s.x,s.y,g.w*TK.zoom,g.h*TK.zoom);
      ctx.globalAlpha=0.9;ctx.fillStyle='#222';ctx.font='bold 12px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
      ctx.fillText(g.name,s.x+g.w*TK.zoom/2,s.y+g.h*TK.zoom/2);
    } else if(g.type==='wall'){
      const hw=g.length*TK.zoom/2;
      const s1=worldToScreen(g._cx-hw,g._cy),s2=worldToScreen(g._cx+hw,g._cy);
      const th=g.thickness*TK.scale*TK.zoom/2;
      ctx.fillStyle='#1a1a1a';
      ctx.fillRect(s1.x,s1.y-th,s2.x-s1.x,th*2);
    }
    ctx.restore();
  }`;

if(!cv.includes('Ghost object preview')){
  cv = cv.replace('// Snap indicator', ghostRender+'\n  // Snap indicator');
}
write("src/canvas.js", cv);

// ── 4. DRAWING.JS: ghost follows cursor + click to place ─────────────────────
let dr = fs.readFileSync(path.join(DIR,"src/drawing.js"),"utf8");

const ghostMove = `
    if(TK.currentTool==='ghost'&&TK.ghostObject){
      const wo=window.screenToWorld(e.offsetX,e.offsetY);
      const snapped=e.shiftKey?wo:snapPoint(e.offsetX,e.offsetY,false);
      TK.ghostObject._cx=snapped.x; TK.ghostObject._cy=snapped.y;
      window.redraw(); return;
    }`;

const ghostPlace = `
  if(TK.currentTool==='ghost'&&TK.ghostObject){
    const g=TK.ghostObject;
    const snapped=e.shiftKey?window.screenToWorld(e.offsetX,e.offsetY):snapPoint(e.offsetX,e.offsetY,false);
    if(window.saveSnapshot)saveSnapshot();
    if(g.type==='room'){
      const tp=(window.TK_ROOM_TYPES||[]).find(t=>t.id===g.roomType)||{id:'anna',color:'#aaa'};
      TK.rooms.push({id:TK.nextId++,name:g.name,type:tp.id,x:snapped.x-g.w/2,y:snapped.y-g.h/2,w:g.w,h:g.h,color:tp.color,wallThickness:TK.wallThickness});
      if(window.updateSidebar)updateSidebar();
    } else if(g.type==='wall'){
      TK.walls.push({id:TK.nextId++,x1:snapped.x-g.length/2,y1:snapped.y,x2:snapped.x+g.length/2,y2:snapped.y,thickness:g.thickness});
      if(window.updateWallList)updateWallList();
    }
    TK.ghostObject=null; TK.currentTool='draw';
    if(window.setTool)setTool('draw');
    window.redraw(); return;
  }`;

// Insert ghost move in mousemove (after dimDrag check)
if(!dr.includes('ghost&&TK.ghostObject')){
  dr = dr.replace(
    `const wo=window.screenToWorld(e.offsetX,e.offsetY);`,
    ghostMove+`\n    const wo=window.screenToWorld(e.offsetX,e.offsetY);`
  );
  // Insert ghost place at start of mouseup
  dr = dr.replace(
    `if(TK._dimDrag){`,
    ghostPlace+`\n  if(TK._dimDrag){`
  );
}

// Also cascade delete in drawing.js deleteSelected
dr = dr.replace(
  /window\.deleteSelected=\(\)=>\{.*?redraw\(\);?\}/s,
  `window.deleteSelected=()=>{if(!TK.selectedId)return;if(window.saveSnapshot)saveSnapshot();if(window.cascadeDelete)cascadeDelete(TK.selectedId,TK.selectedType||'room');};`
);

// Update wall × delete in updateWallList to cascade
dr = dr.replace(
  `TK.walls=TK.walls.filter(x=>x.id!==w.id);updateWallList();if(window.redraw)redraw()`,
  `cascadeDelete(w.id,'wall')`
);

write("src/drawing.js", dr);
console.log("\n✅ Done. Ctrl+Shift+R to reload.");
console.log("   Shortcuts: D = Rom med mål | Escape = avbryt ghost");
