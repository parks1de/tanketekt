/**
 * FIX-I: Core rendering + drawing bugs
 * Touches: src/canvas.js, src/drawing.js
 * Fixes: wall thickness rendering, room draw mode, door/window placement
 */
import Anthropic from "@anthropic-ai/sdk";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
dotenv.config();

const DIR = process.env.PROJECT_DIR || "C:\\Users\\bness\\OneDrive\\02_PARKSIDE\\05_PROSJEKT\\TankeTekt";
const client = new Anthropic();
const read = f => { const p=path.join(DIR,f); return fs.existsSync(p)?fs.readFileSync(p,"utf8"):""; };
function write(text) {
  let c=text.trim().replace(/^```[a-z]*\n?/,"").replace(/\n?```$/,"").trim();
  if(!c.startsWith("{"))return console.log("  ⚠️  skipped");
  const files=JSON.parse(c);
  for(const [p,v] of Object.entries(files)){
    const f=path.join(DIR,p); fs.mkdirSync(path.dirname(f),{recursive:true}); fs.writeFileSync(f,v,"utf8");
    console.log(`  ✅ ${p} (${v.length}ch)`);
  }
}

async function pass1(){
  console.log("  📝 Pass 1/2: canvas.js");
  const canvas=read("src/canvas.js");
  const app=read("src/app.js").slice(0,600);
  const res = await client.messages.create({ model:"claude-sonnet-4-6", max_tokens:8192,
    system:`Output ONLY raw JSON. No markdown. Keys=filepaths, values=complete file contents.`,
    messages:[{role:"user",content:`Rewrite src/canvas.js for TankeTekt v.demo-002. Fix all rendering bugs. Complete file.

CRITICAL WALL RENDERING FIX:
TK.wallThickness is in METERS (e.g. 0.198). TK.scale = 100 (px per meter). TK.zoom = current zoom.
Screen half-width: hw = (wall.thickness * TK.scale * TK.zoom) / 2
VERIFY: thickness=0.198, scale=100, zoom=1 → hw = 9.9px ✓ (reasonable wall width)
Wall visual style by thickness (meters):
  >=0.15m (exterior/grunnmur): fill #1a1a1a, looks thick and solid
  >=0.09m (interior): fill #444444
  <0.09m (partition): fill #777777
Draw wall as filled rotated rectangle (4-corner polygon). If selected: fill rgba(233,69,96,0.8).
Wall length label: only if screen length > 50px. Small white pill, 9px bold font.

ROOM RENDERING (keep simple and correct):
For each room in TK.rooms:
  s = worldToScreen(room.x, room.y). w = room.w*TK.zoom. h = room.h*TK.zoom.
  type = TK_ROOM_TYPES.find(t=>t.id===room.type)||TK_ROOM_TYPES[7]
  Fill: type.color at 20% opacity. Stroke: type.color 2px (selected: #e94560 3px).
  If TK.showRoomLabels && w>40: name centered, bold 13px #333.
  If TK.showAreaLabels && w>50: area bottom-center, 11px #666.
  If selected: draw 7px square handles at 4 corners + 4 edge midpoints (white fill, #e94560 stroke).
  If TK.showOuterDims && selected: draw dimension lines outside room.

CANVAS SETUP:
const canvas=document.getElementById('floorplan')
const wrap=canvas.parentElement
canvas.style.background='#ffffff'
ResizeObserver on wrap: canvas.width=wrap.offsetWidth; canvas.height=wrap.offsetHeight; redraw()
Initial: setTimeout(()=>{canvas.width=wrap.offsetWidth||800;canvas.height=wrap.offsetHeight||600;redraw()},50)

ZOOM: wheel on canvas. newZoom=Math.max(0.05,Math.min(20,TK.zoom*(e.deltaY<0?1.12:0.89))). Center on cursor.
PAN: Alt+drag or middle mouse drag.
GRID: if TK.showGrid, draw 1m grid (minor #e8e8e8 0.3px, major every 5m #cccccc 0.6px).
SCALE BAR: bottom-right. Pick round meter value giving 60-120px. White bg pill.
NORTH ARROW: top-right 50px from corner.
ACTIVE PREVIEW: dashed stroke, semi-transparent.
SNAP INDICATOR: green circle 6px at window.snapIndicator world position if set.

EXPOSE: window.redraw, window.worldToScreen, window.screenToWorld, window.zoomToFit, window.getResizeHandle, window.getWallHandle.

CURRENT canvas.js (ref): ${canvas.slice(0,1500)}
CURRENT app.js (ref): ${app}

Return JSON: {"src/canvas.js":"..."}`}]
  });
  write(res.content[0].text);
}

async function pass2(){
  console.log("  📝 Pass 2/2: drawing.js");
  const drawing=read("src/drawing.js");
  const res = await client.messages.create({ model:"claude-sonnet-4-6", max_tokens:8192,
    system:`Output ONLY raw JSON. No markdown. Keys=filepaths, values=complete file contents.`,
    messages:[{role:"user",content:`Rewrite src/drawing.js for TankeTekt v.demo-002. Fix all interaction bugs. Complete file.

MOUSEDOWN — strict priority order:
1. If Alt key OR middle button (e.button===1): start pan. Set TK._panning={sx:e.offsetX,sy:e.offsetY,px:TK.panX,py:TK.panY}. return.
2. If TK.currentTool==='door'||'window': TK._placeClickStart={x:e.offsetX,y:e.offsetY}. return.
3. If TK.currentTool==='draw': 
   world=screenToWorld(e.offsetX,e.offsetY). snapped=snapPoint(e.offsetX,e.offsetY,e.shiftKey).
   TK._drawing={start:snapped,active:true}. return.
4. If TK.currentTool==='wall':
   snapped=snapPoint(e.offsetX,e.offsetY,e.shiftKey). TK._wallDraw={start:snapped,active:true}. return.
5. If TK.currentTool==='select' OR no active tool:
   Check resize handle on selected room: if(TK.selectedType==='room'){ const r=TK.rooms.find(x=>x.id===TK.selectedId); const h=window.getResizeHandle?getResizeHandle(r,e.offsetX,e.offsetY):null; if(h){TK._resizing={handle:h,orig:{...r}};return} }
   Check wall handle: similar for selected wall.
   Hit test rooms (point-in-rect in world coords). Hit test walls (dist to segment).
   Set TK.selectedId, TK.selectedType. updateSidebar(). redraw().

MOUSEMOVE:
1. if TK._panning: TK.panX=TK._panning.px+(e.offsetX-TK._panning.sx); TK.panY=TK._panning.py+(e.offsetY-TK._panning.sy); redraw(); return.
2. if TK._resizing: apply delta to room dimensions (min 50px). redraw(); return.
3. if TK._drawing?.active: snapped=snapPoint(e.offsetX,e.offsetY,e.shiftKey); window.activePreview={type:'room',x:Math.min(TK._drawing.start.x,snapped.x),y:Math.min(TK._drawing.start.y,snapped.y),w:Math.abs(snapped.x-TK._drawing.start.x),h:Math.abs(snapped.y-TK._drawing.start.y)}; redraw(); return.
4. if TK._wallDraw?.active: snapped=snapPoint(e.offsetX,e.offsetY,e.shiftKey); window.activePreview={type:'wall',x1:TK._wallDraw.start.x,y1:TK._wallDraw.start.y,x2:snapped.x,y2:snapped.y,thickness:TK.wallThickness}; redraw(); return.
5. Update #coordInfo: world=screenToWorld(e.offsetX,e.offsetY); document.getElementById('coordInfo').textContent='X: '+(world.x/TK.scale).toFixed(2)+'m  Y: '+(world.y/TK.scale).toFixed(2)+'m'.

MOUSEUP:
1. if TK._panning: TK._panning=null; return.
2. if TK._resizing: saveSnapshot(); TK._resizing=null; return.
3. if TK._drawing?.active:
   TK._drawing.active=false; window.activePreview=null;
   const s=TK._drawing.start; const snapped=snapPoint(e.offsetX,e.offsetY,e.shiftKey);
   const w=Math.abs(snapped.x-s.x); const h=Math.abs(snapped.y-s.y);
   if(w>50&&h>50){ saveSnapshot(); const type=TK_ROOM_TYPES[7]; TK.rooms.push({id:TK.nextId++,name:'Rom '+TK.nextId,type:'anna',x:Math.min(s.x,snapped.x),y:Math.min(s.y,snapped.y),w,h,color:type.color}); updateSidebar(); if(window.updateWallList)updateWallList(); }
   redraw(); return.
4. if TK._wallDraw?.active:
   TK._wallDraw.active=false; window.activePreview=null;
   const s2=TK._wallDraw.start; const snapped2=snapPoint(e.offsetX,e.offsetY,e.shiftKey);
   const dx=snapped2.x-s2.x; const dy=snapped2.y-s2.y;
   if(Math.sqrt(dx*dx+dy*dy)>20){ saveSnapshot(); TK.walls.push({id:TK.nextId++,x1:s2.x,y1:s2.y,x2:snapped2.x,y2:snapped2.y,thickness:TK.wallThickness}); if(window.updateWallList)updateWallList(); }
   redraw(); return.
5. if TK.currentTool==='door'||'window':
   const dx2=Math.abs(e.offsetX-(TK._placeClickStart?.x||0)); const dy2=Math.abs(e.offsetY-(TK._placeClickStart?.y||0));
   if(dx2<8&&dy2<8&&window.placeElementOnWall) placeElementOnWall(e.offsetX,e.offsetY);
   return.

DBLCLICK: detect rooms. If hit: show room edit modal (name input + type select). saveSnapshot on save.
Prevent dblclick from triggering draw by checking timeDelta or using dblclick event separately (not mousedown).

SNAP: snapPoint(sx,sy,shift). If shift: return screenToWorld(sx,sy).
Check (world coords) within snapRadiusWorld=15/TK.zoom:
  Room corners, edge midpoints, wall endpoints, wall midpoints.
  Set window.snapIndicator to closest snap point (world coords) or null.
  Return snapped world point.

TOOL SETUP (DOMContentLoaded):
window.startDraw=()=>{TK.currentTool='draw';setTool('draw');setStatus('Teikn rom: klikk og dra')}
window.startWall=()=>{TK.currentTool='wall';setTool('wall');setStatus('Teikn vegg: klikk og dra')}
Populate #wallThicknessSelect with 4 Norwegian presets (values as METERS: 0.098, 0.148, 0.198, 0.248) + custom.
window.deleteSelected, window.copySelected, window.pasteClipboard as before.
Keyboard Delete→deleteSelected. Escape→cancel active drawing, reset tool to draw.

CURRENT drawing.js (ref): ${drawing.slice(0,1500)}

Return JSON: {"src/drawing.js":"..."}`}]
  });
  write(res.content[0].text);
}

async function run(){
  console.log("⚙️  [FIX-I] Core rendering + drawing bugs...\n");
  await pass1();
  await pass2();
  console.log("\n✅ Fix-I done.");
}
run().catch(e=>{console.error("❌",e.message);process.exit(1);});
