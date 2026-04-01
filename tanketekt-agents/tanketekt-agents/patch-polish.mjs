import fs from "fs";
import path from "path";
import dotenv from "dotenv";
dotenv.config();
const DIR = process.env.PROJECT_DIR || "C:\\Users\\bness\\OneDrive\\02_PARKSIDE\\05_PROSJEKT\\TankeTekt";
const read = f => fs.readFileSync(path.join(DIR,f),"utf8");
const write = (f,v) => { fs.writeFileSync(path.join(DIR,f),v,"utf8"); console.log(`  ✅ ${f} (${v.length}ch)`); };

// ── 1. CANVAS.JS ─────────────────────────────────────────────────────────────
let cv = read("src/canvas.js");

// Consistent wall color for rooms — replace color-based wall fill with flat dark
cv = cv.replace(
  /const wallCol=sel\?'rgba\(233,69,96,0\.85\)':.*?;/,
  `const wallCol=sel?'rgba(233,69,96,0.85)':'#2d2d2d';`
);
// Room interior: white fill (no room-type color fill)
cv = cv.replace(
  /ctx\.fillStyle=type\.color\+'22';/,
  `ctx.fillStyle='#f5f5f5';`
);
// Door swing arc — reinstate, guard with TK.showDoorSwing flag
cv = cv.replace(
  `// Swing arc removed — direction indicator omitted`,
  `// Swing arc
  if(TK.showDoorSwing!==false){
    const startA2=Math.atan2(dy2,dx2),endA2=Math.atan2(ny,nx);
    ctx.beginPath();ctx.arc(hx,hy,dw,startA2,endA2,!!(fs^fa));
    ctx.strokeStyle=col;ctx.lineWidth=1;ctx.setLineDash([4,3]);ctx.stroke();ctx.setLineDash([]);
  }`
);
write("src/canvas.js", cv);

// ── 2. DRAWING.JS ─────────────────────────────────────────────────────────────
let dr = read("src/drawing.js");

// Fix deselection: check draw/wall tool AFTER hit test (reorder mousedown)
// Replace: draw/wall tools return early before hit test
// Fix: only return early if NOT clicking on already-selected item
// Simple fix: in draw/wall mode, first check if clicking on body of existing element
// If yes → select it. If no → start drawing.
dr = dr.replace(
  `if(TK.currentTool==='draw'){TK._draw={start:snap(e.offsetX,e.offsetY,e.shiftKey),active:true};return;}
    if(TK.currentTool==='wall'){TK._wall={start:snap(e.offsetX,e.offsetY,e.shiftKey),active:true};return;}`,
  `// Hit test before draw — allows deselect by clicking empty space
    {const wo2=window.screenToWorld(e.offsetX,e.offsetY);
    let preHit=null;
    for(const r of TK.rooms){if(wo2.x>=r.x&&wo2.x<=r.x+r.w&&wo2.y>=r.y&&wo2.y<=r.y+r.h){preHit={id:r.id,type:'room'};break;}}
    if(!preHit)for(const w of TK.walls){const dx=w.x2-w.x1,dy=w.y2-w.y1,l2=dx*dx+dy*dy;if(!l2)continue;const t=Math.max(0,Math.min(1,((wo2.x-w.x1)*dx+(wo2.y-w.y1)*dy)/l2));if(Math.hypot(wo2.x-w.x1-t*dx,wo2.y-w.y1-t*dy)<w.thickness*TK.scale*2){preHit={id:w.id,type:'wall'};break;}}
    if(preHit){TK.selectedId=preHit.id;TK.selectedType=preHit.type;if(window.updateSidebar)updateSidebar();if(window.updateWallList)updateWallList();window.redraw();return;}
    else{TK.selectedId=null;TK.selectedType=null;if(window.updateSidebar)updateSidebar();window.redraw();}}
    if(TK.currentTool==='draw'){TK._draw={start:snap(e.offsetX,e.offsetY,e.shiftKey),active:true};return;}
    if(TK.currentTool==='wall'){TK._wall={start:snap(e.offsetX,e.offsetY,e.shiftKey),active:true};return;}`
);

// Add snapping when moving rooms
dr = dr.replace(
  `r.x=TK._moveEl.origX+dx; r.y=TK._moveEl.origY+dy;`,
  `if(!e.shiftKey&&window.snapPoint){
          // snap top-left corner
          const snapped=window.snapPoint(
            e.offsetX - (TK._moveEl.startSX - window.worldToScreen(TK._moveEl.origX,TK._moveEl.origY).x),
            e.offsetY - (TK._moveEl.startSY - window.worldToScreen(TK._moveEl.origX,TK._moveEl.origY).y),
            false
          );
          r.x=snapped.x; r.y=snapped.y;
        } else { r.x=TK._moveEl.origX+dx; r.y=TK._moveEl.origY+dy; }`
);

// Remove ghost tool handling (replace with direct place)
dr = dr.replace(
  /if\(TK\.currentTool==='ghost'&&TK\.ghostObject&&TK\._ghostMoved\)[\s\S]*?return;\s*\}/,
  `// ghost removed`
);
dr = dr.replace(
  /if\(TK\.currentTool==='ghost'&&TK\.ghostObject\)\{[\s\S]*?return;\s*\}/g,
  `// ghost removed`
);
write("src/drawing.js", dr);

// ── 3. ELEMENTS.JS: door flip in right panel ──────────────────────────────────
let el = read("src/elements.js");
// Add showDoorSwing default
el = `window.TK&&(window.TK.showDoorSwing!==undefined||(window.TK.showDoorSwing=true));\n`+el;
// Update element list to show flip controls for selected door
el = el.replace(
  `addSection('Dører',TK.doors,'TK.doors','#8B4513',d=>d.name||'Dør '+((d.width||0.8)*100).toFixed(0)+'cm');`,
  `addSection('Dører',TK.doors,'TK.doors','#8B4513',d=>{
    const lbl=d.name||'Dør '+((d.width||0.8)*100).toFixed(0)+'cm';
    if(TK.selectedId===d.id){
      // Add flip controls after rendering via timeout
      setTimeout(()=>{
        const li=ul.querySelector('.door-flip-'+d.id);
        if(li){
          const ctrl=document.createElement('div');
          ctrl.style='margin-top:4px;display:flex;gap:4px;flex-wrap:wrap';
          const swings=['↖','↗','↙','↘'];
          [0,1,2,3].forEach(i=>{
            const b=document.createElement('button');
            b.textContent=swings[i];b.title='Svingretning '+( i+1);
            b.style='padding:2px 6px;font-size:14px;background:'+(d.swingDir===i?'var(--hi)':'var(--surface)');
            b.onclick=e=>{e.stopPropagation();if(window.saveSnapshot)saveSnapshot();d.swingDir=i;if(window.redraw)redraw();if(window.updateElementList)updateElementList();};
            ctrl.appendChild(b);
          });
          const sw=document.createElement('button');
          sw.textContent=TK.showDoorSwing?'Skjul sving':'Vis sving';
          sw.style='padding:2px 6px;font-size:10px';
          sw.onclick=e=>{e.stopPropagation();TK.showDoorSwing=!TK.showDoorSwing;if(window.redraw)redraw();};
          ctrl.appendChild(sw);
          li.appendChild(ctrl);
        }
      },0);
    }
    return lbl;
  });
  // Mark door items for flip controls
  setTimeout(()=>{TK.doors.forEach(d=>{const items=ul.querySelectorAll('.room-item');items.forEach(li=>{if(li.querySelector('.rname')?.textContent?.includes(d.name||'Dør'))li.classList.add('door-flip-'+d.id);});});},0);
  void(`
);
write("src/elements.js", el);

// ── 4. APP.JS: replace ghost modals with direct-place, add help modal ─────────
let app = read("src/app.js");
// Replace promptRoomDims to place directly at canvas center (no ghost)
app = app.replace(
  /window\.promptRoomDims=\(\)=>\{[\s\S]*?\};\s*window\.promptWallDims/,
  `window.promptRoomDims=()=>{
  const types=(window.TK_ROOM_TYPES||[]);
  const opts=types.map(t=>'<option value="'+t.id+'">'+t.name+'</option>').join('');
  const ov=document.createElement('div');ov.className='modal-overlay';
  ov.innerHTML='<div class="modal"><h2>Nytt rom med mål</h2><label>Lengd (m)</label><input id="_rl" type="number" value="4.0" step="0.05" min="0.5"><label>Breidd (m)</label><input id="_rb" type="number" value="3.0" step="0.05" min="0.5"><label>Type</label><select id="_rtp">'+opts+'</select><div class="modal-btns"><button id="_rpc">Avbryt</button><button id="_rpp" style="background:var(--accent);border-color:var(--accent)">Plasser</button></div></div>';
  document.body.appendChild(ov);
  document.getElementById('_rpc').onclick=()=>ov.remove();
  document.getElementById('_rpp').onclick=()=>{
    const l=parseFloat(document.getElementById('_rl').value)||4;
    const b2=parseFloat(document.getElementById('_rb').value)||3;
    const tid=document.getElementById('_rtp').value;
    const tp=types.find(t=>t.id===tid)||types[7];
    const cv2=document.getElementById('floorplan');
    const wo2=window.screenToWorld?window.screenToWorld(cv2.width/2,cv2.height/2):{x:l*TK.scale/2,y:b2*TK.scale/2};
    if(window.saveSnapshot)saveSnapshot();
    const rid=TK.nextId++;
    TK.rooms.push({id:rid,name:tp.name+' '+rid,type:tid,x:wo2.x-l*TK.scale/2,y:wo2.y-b2*TK.scale/2,w:l*TK.scale,h:b2*TK.scale,color:tp.color,wallThickness:TK.wallThickness});
    TK.selectedId=rid;TK.selectedType='room';
    ov.remove();if(window.updateSidebar)updateSidebar();if(window.redraw)redraw();
    if(window.setStatus)setStatus('Rom plassert — dra for å flytte');
  };
};
window.promptWallDims`
);
app = app.replace(
  /window\.promptWallDims=\(\)=>\{[\s\S]*?\};\s*document\.addEventListener\('DOMContentLoaded'/,
  `window.promptWallDims=()=>{
  const ov=document.createElement('div');ov.className='modal-overlay';
  ov.innerHTML='<div class="modal"><h2>Ny vegg med mål</h2><label>Lengd (m)</label><input id="_wl2" type="number" value="3.0" step="0.05" min="0.1"><label>Tykkleik</label><select id="_wth2"><option value="0.098">Innv. 98mm</option><option value="0.148">Innv. 148mm</option><option value="0.198" selected>Utv. 198mm</option><option value="0.248">Utv. 248mm</option></select><div class="modal-btns"><button id="_wpc2">Avbryt</button><button id="_wpp2" style="background:var(--accent);border-color:var(--accent)">Plasser</button></div></div>';
  document.body.appendChild(ov);
  document.getElementById('_wpc2').onclick=()=>ov.remove();
  document.getElementById('_wpp2').onclick=()=>{
    const l=parseFloat(document.getElementById('_wl2').value)||3;
    const th=parseFloat(document.getElementById('_wth2').value)||0.198;
    const cv3=document.getElementById('floorplan');
    const wo3=window.screenToWorld?window.screenToWorld(cv3.width/2,cv3.height/2):{x:200,y:200};
    if(window.saveSnapshot)saveSnapshot();
    const wid=TK.nextId++;
    TK.walls.push({id:wid,x1:wo3.x-l*TK.scale/2,y1:wo3.y,x2:wo3.x+l*TK.scale/2,y2:wo3.y,thickness:th});
    TK.selectedId=wid;TK.selectedType='wall';
    ov.remove();if(window.updateWallList)updateWallList();if(window.redraw)redraw();
    if(window.setStatus)setStatus('Vegg plassert — dra for å flytte');
  };
};
document.addEventListener('DOMContentLoaded'`
);

// Replace help modal with comprehensive version
app = app.replace(
  /btnVis\.onclick[\s\S]*?btnVis\.classList\.remove\('active'\)\}\}\)/,
  `btnVis.onclick=e=>{e.stopPropagation();visPanel.classList.toggle('open');btnVis.classList.toggle('active');}
  document.addEventListener('click',e=>{if(!visPanel.contains(e.target)&&e.target!==btnVis){visPanel.classList.remove('open');btnVis.classList.remove('active')}})`
);

// Add comprehensive help modal
if(!app.includes('showHelpModal')){
  app = app.replace(
    `document.getElementById('btnHelp').onclick`,
    `window.showHelpModal=()=>{
  const ov=document.createElement('div');ov.className='modal-overlay';ov.style.alignItems='flex-start;padding-top:40px';
  ov.innerHTML=\`<div class="modal" style="max-width:520px;max-height:80vh;overflow-y:auto">
  <h2 style="margin-bottom:16px">TankeTekt — Hurtigtastar & Hjelp</h2>
  <h3 style="color:var(--muted);font-size:11px;text-transform:uppercase;margin-bottom:6px">Teikneverkty</h3>
  <table style="width:100%;font-size:12px;border-collapse:collapse;margin-bottom:12px">
  <tr><td style="padding:3px 8px 3px 0;color:var(--muted)">Teikn rom</td><td>Klikk + dra på canvas</td></tr>
  <tr><td style="padding:3px 8px 3px 0;color:var(--muted)">Teikn vegg</td><td>Klikk startpunkt, slipp ved endepunkt</td></tr>
  <tr><td style="padding:3px 8px 3px 0;color:var(--muted)">Rom med mål</td><td>✛ Rom-knapp — skriv inn mål, plassert i midten</td></tr>
  <tr><td style="padding:3px 8px 3px 0;color:var(--muted)">Dør/Vindauge</td><td>Vel type → klikk på vegg eller romvegg</td></tr>
  <tr><td style="padding:3px 8px 3px 0;color:var(--muted)">Snapping</td><td>Automatisk — hald Shift for fri plassering</td></tr>
  </table>
  <h3 style="color:var(--muted);font-size:11px;text-transform:uppercase;margin-bottom:6px">Redigering</h3>
  <table style="width:100%;font-size:12px;border-collapse:collapse;margin-bottom:12px">
  <tr><td style="padding:3px 8px 3px 0;color:var(--muted)">Flytt element</td><td>Vel → klikk+dra innside</td></tr>
  <tr><td style="padding:3px 8px 3px 0;color:var(--muted)">Endre storleik rom</td><td>Vel → dra kvitt handtak i hjørne/kant</td></tr>
  <tr><td style="padding:3px 8px 3px 0;color:var(--muted)">Endre veggendepunkt</td><td>Vel vegg → dra rundt endepunkt</td></tr>
  <tr><td style="padding:3px 8px 3px 0;color:var(--muted)">Snu dør</td><td>Vel dør → bruk ↖↗↙↘ i høgre panel</td></tr>
  <tr><td style="padding:3px 8px 3px 0;color:var(--muted)">Endre romtype</td><td>Dobbelklikk på rom</td></tr>
  </table>
  <h3 style="color:var(--muted);font-size:11px;text-transform:uppercase;margin-bottom:6px">Hurtigtastar</h3>
  <table style="width:100%;font-size:12px;border-collapse:collapse;margin-bottom:12px">
  <tr><td style="padding:3px 8px 3px 0;color:var(--muted);font-family:monospace">Ctrl+Z / Ctrl+Y</td><td>Angre / Gjer om</td></tr>
  <tr><td style="padding:3px 8px 3px 0;color:var(--muted);font-family:monospace">Ctrl+C / Ctrl+V</td><td>Kopier / Lim inn (rom)</td></tr>
  <tr><td style="padding:3px 8px 3px 0;color:var(--muted);font-family:monospace">Delete</td><td>Slett valt element</td></tr>
  <tr><td style="padding:3px 8px 3px 0;color:var(--muted);font-family:monospace">Escape</td><td>Avbryt / fjern val</td></tr>
  <tr><td style="padding:3px 8px 3px 0;color:var(--muted);font-family:monospace">D</td><td>Nytt rom med mål-dialog</td></tr>
  <tr><td style="padding:3px 8px 3px 0;color:var(--muted);font-family:monospace">Scroll</td><td>Zoom inn/ut</td></tr>
  <tr><td style="padding:3px 8px 3px 0;color:var(--muted);font-family:monospace">Alt+drag</td><td>Panorér canvas</td></tr>
  </table>
  <h3 style="color:var(--muted);font-size:11px;text-transform:uppercase;margin-bottom:6px">Eksport</h3>
  <table style="width:100%;font-size:12px;border-collapse:collapse;margin-bottom:12px">
  <tr><td style="padding:3px 8px 3px 0;color:var(--muted)">PNG</td><td>Eksporterer canvas som bilete</td></tr>
  <tr><td style="padding:3px 8px 3px 0;color:var(--muted)">PDF</td><td>Vektor-PDF med optional arealtabell</td></tr>
  <tr><td style="padding:3px 8px 3px 0;color:var(--muted)">Lagre</td><td>Lagrar prosjekt som .json-fil</td></tr>
  </table>
  <div class="modal-btns"><button onclick="this.closest('.modal-overlay').remove()" style="background:var(--accent);border-color:var(--accent)">Lukk</button></div>
  </div>\`;
  document.body.appendChild(ov);
  ov.onclick=e=>{if(e.target===ov)ov.remove();};
};
document.getElementById('btnHelp').onclick`
  );
}
app = app.replace(
  /document\.getElementById\('btnHelp'\)\.onclick=\(\)=>\{.*?\}/,
  `document.getElementById('btnHelp').onclick=()=>showHelpModal()`
);
write("src/app.js", app);
console.log("\n✅ Done. Ctrl+Shift+R to reload.");
