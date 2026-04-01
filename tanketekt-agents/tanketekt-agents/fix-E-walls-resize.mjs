/**
 * TANKETEKT — Fix E: Wall appearance + resize handles
 * Updates canvas.js (wall rendering) and drawing.js (resize drag logic)
 */
import Anthropic from "@anthropic-ai/sdk";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
dotenv.config();

const PROJECT_DIR = process.env.PROJECT_DIR ||
  "C:\\Users\\bness\\OneDrive\\02_PARKSIDE\\05_PROSJEKT\\TankeTekt";
const client = new Anthropic();

function readFile(rel) {
  const p = path.join(PROJECT_DIR, rel);
  return fs.existsSync(p) ? fs.readFileSync(p, "utf8") : "";
}
function writeFiles(text, dir) {
  let clean = text.trim().replace(/^```[a-z]*\n?/,"").replace(/\n?```$/,"").trim();
  if (!clean.startsWith('{')) { console.log("  ⚠️  Non-JSON skipped"); return 0; }
  const files = JSON.parse(clean);
  let count = 0;
  for (const [p, content] of Object.entries(files)) {
    const full = path.join(dir, p);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, content, "utf8");
    console.log(`  ✅ ${p} (${content.length} chars)`);
    count++;
  }
  return count;
}

async function run() {
  console.log("🏗️  [FIX-E] Fixing wall appearance + resize...\n");
  const canvasJs = readFile("src/canvas.js");
  const drawingJs = readFile("src/drawing.js");

  // Two separate calls to avoid token limits
  console.log("  📝 Pass 1: canvas.js wall rendering + resize handles");
  const res1 = await client.messages.create({
    model: "claude-sonnet-4-6", max_tokens: 8192,
    system: `Output ONLY a raw JSON object. No markdown. No prose. Keys=filepaths, values=complete file contents.`,
    messages:[{ role:"user", content:`Update src/canvas.js for TankeTekt v.demo-002. Keep ALL existing functionality. Add/fix the following. Return complete file.

WALL RENDERING — INDUSTRY STANDARD APPEARANCE:
Walls are rendered as filled rectangles (not just lines) based on thickness:

function drawWallSegment(ctx, wall):
  const s1=worldToScreen(wall.x1,wall.y1); const s2=worldToScreen(wall.x2,wall.y2)
  const dx=s2.x-s1.x; const dy=s2.y-s1.y
  const len=Math.sqrt(dx*dx+dy*dy); if(len<1)return
  const nx=-dy/len; const ny=dx/len
  const hw=wall.thickness*TK.scale*TK.zoom/2
  Visual style based on thickness:
    exterior (>=0.15m): fillColor='#1a1a1a', strokeColor='#000', lineWidth=0.5
    interior (>=0.09m): fillColor='#333333', strokeColor='#222', lineWidth=0.5
    partition (<0.09m): fillColor='#666666', strokeColor='#444', lineWidth=0.3
  Draw filled quad (4 corners):
    const pts=[ {x:s1.x+nx*hw,y:s1.y+ny*hw},{x:s2.x+nx*hw,y:s2.y+ny*hw},{x:s2.x-nx*hw,y:s2.y-ny*hw},{x:s1.x-nx*hw,y:s1.y-ny*hw} ]
    ctx.beginPath(); ctx.moveTo(pts[0].x,pts[0].y)
    pts.forEach(p=>ctx.lineTo(p.x,p.y)); ctx.closePath()
    if(wall.id===TK.selectedId) ctx.fillStyle='rgba(233,69,96,0.7)'
    else ctx.fillStyle=fillColor
    ctx.fill(); ctx.strokeStyle=strokeColor; ctx.lineWidth=lineWidth; ctx.stroke()
  Wall length label at midpoint:
    const mx=(s1.x+s2.x)/2; const my=(s1.y+s2.y)/2
    const lenM=(Math.sqrt((wall.x2-wall.x1)**2+(wall.y2-wall.y1)**2)/TK.scale).toFixed(2)+'m'
    if(len>40):
      ctx.save(); ctx.translate(mx,my)
      const angle=Math.atan2(dy,dx); ctx.rotate(angle>Math.PI/2||angle<-Math.PI/2?angle+Math.PI:angle)
      ctx.fillStyle='rgba(255,255,255,0.85)'; ctx.fillRect(-18,-8,36,11)
      ctx.fillStyle='#333'; ctx.font='bold 9px sans-serif'; ctx.textAlign='center'; ctx.fillText(lenM,0,1)
      ctx.restore()

RESIZE HANDLES for selected rooms:
function drawResizeHandles(ctx, room):
  const HANDLE=7
  const corners=[
    {x:room.x,y:room.y,cursor:'nw-resize'},
    {x:room.x+room.w,y:room.y,cursor:'ne-resize'},
    {x:room.x+room.w,y:room.y+room.h,cursor:'se-resize'},
    {x:room.x,y:room.y+room.h,cursor:'sw-resize'}
  ]
  const edges=[
    {x:room.x+room.w/2,y:room.y,cursor:'n-resize'},
    {x:room.x+room.w,y:room.y+room.h/2,cursor:'e-resize'},
    {x:room.x+room.w/2,y:room.y+room.h,cursor:'s-resize'},
    {x:room.x,y:room.y+room.h/2,cursor:'w-resize'}
  ]
  ;[...corners,...edges].forEach(h=>{
    const s=worldToScreen(h.x,h.y)
    ctx.fillStyle='white'; ctx.strokeStyle='#e94560'; ctx.lineWidth=1.5
    ctx.fillRect(s.x-HANDLE/2,s.y-HANDLE/2,HANDLE,HANDLE)
    ctx.strokeRect(s.x-HANDLE/2,s.y-HANDLE/2,HANDLE,HANDLE)
  })

WALL ENDPOINT HANDLES for selected walls:
function drawWallHandles(ctx, wall):
  [worldToScreen(wall.x1,wall.y1),worldToScreen(wall.x2,wall.y2)].forEach(s=>{
    ctx.fillStyle='white'; ctx.strokeStyle='#e94560'; ctx.lineWidth=1.5
    ctx.beginPath(); ctx.arc(s.x,s.y,6,0,Math.PI*2); ctx.fill(); ctx.stroke()
  })

In redraw(), after drawing each room: if room.id===TK.selectedId: drawResizeHandles(ctx,room)
After drawing each wall: if wall.id===TK.selectedId: drawWallHandles(ctx,wall)
After drawing all rooms/walls: draw doors (call window.drawDoor if defined), draw windows (call window.drawWindow if defined).

Expose window.getResizeHandle(room, screenX, screenY): checks if screen point is within 8px of any handle. Returns handle descriptor or null.
Expose window.getWallHandle(wall, screenX, screenY): returns 'start'|'end'|null.

KEEP: all existing redraw logic, grid, zoom/pan, scale bar, north arrow, display toggles, coordinate display, activePreview, zoomToFit, ResizeObserver.
ENSURE: window.redraw, window.worldToScreen, window.screenToWorld, window.zoomToFit all exposed.

CURRENT canvas.js (truncated for reference):
${canvasJs.slice(0,2000)}

Return JSON: {"src/canvas.js":"..."}`}]
  });
  writeFiles(res1.content[0].text, PROJECT_DIR);

  console.log("  📝 Pass 2: drawing.js resize + reposition logic");
  const res2 = await client.messages.create({
    model: "claude-sonnet-4-6", max_tokens: 8192,
    system: `Output ONLY a raw JSON object. No markdown. No prose. Keys=filepaths, values=complete file contents.`,
    messages:[{ role:"user", content:`Update src/drawing.js for TankeTekt v.demo-002. Keep ALL existing functionality. Add resize + reposition logic. Return complete file.

ADD RESIZE ROOMS:
In mousedown handler, BEFORE checking draw mode:
  If TK.selectedId and TK.selectedType==='room':
    const room=TK.rooms.find(r=>r.id===TK.selectedId)
    const handle=window.getResizeHandle?getResizeHandle(room,e.offsetX,e.offsetY):null
    if(handle):
      TK.resizing={roomId:room.id,handle,origRoom:{...room},startScreen:{x:e.offsetX,y:e.offsetY}}
      e.stopPropagation(); return (skip draw mode)

In mousemove handler, check TK.resizing first:
  if(TK.resizing):
    const dx=(e.offsetX-TK.resizing.startScreen.x)/TK.zoom
    const dy=(e.offsetY-TK.resizing.startScreen.y)/TK.zoom
    const r={...TK.resizing.origRoom}
    const h=TK.resizing.handle.cursor
    Apply delta based on handle type:
      'nw-resize': r.x+=dx;r.y+=dy;r.w-=dx;r.h-=dy
      'ne-resize': r.w+=dx;r.y+=dy;r.h-=dy
      'se-resize': r.w+=dx;r.h+=dy
      'sw-resize': r.x+=dx;r.w-=dx;r.h+=dy
      'n-resize': r.y+=dy;r.h-=dy
      'e-resize': r.w+=dx
      's-resize': r.h+=dy
      'w-resize': r.x+=dx;r.w-=dx
    Enforce min size: r.w=Math.max(50,r.w); r.h=Math.max(50,r.h)
    const idx=TK.rooms.findIndex(x=>x.id===r.id); TK.rooms[idx]=r
    redraw(); return

In mouseup handler:
  if(TK.resizing): saveSnapshot(); TK.resizing=null; return

ADD RESIZE WALLS:
In mousedown: if TK.selectedType==='wall':
  const wall=TK.walls.find(w=>w.id===TK.selectedId)
  const wh=window.getWallHandle?getWallHandle(wall,e.offsetX,e.offsetY):null
  if(wh): TK.draggingWallEnd={wallId:wall.id,end:wh,origWall:{...wall},startScreen:{x:e.offsetX,y:e.offsetY}}; return

In mousemove: if TK.draggingWallEnd:
  const world=screenToWorld(e.offsetX,e.offsetY)
  const snapped=snapPoint(e.offsetX,e.offsetY,e.shiftKey)
  const w=TK.walls.find(x=>x.id===TK.draggingWallEnd.wallId)
  if(TK.draggingWallEnd.end==='start'){w.x1=snapped.x;w.y1=snapped.y}
  else{w.x2=snapped.x;w.y2=snapped.y}
  redraw(); return

In mouseup: if TK.draggingWallEnd: saveSnapshot(); TK.draggingWallEnd=null; return

ADD REPOSITION DOOR/WINDOW:
In mousedown (select mode): if clicking near a door/window element:
  Check TK.doors and TK.windows for selection.
  If selected door/window: TK.draggingElement={id,type} for drag.
In mousemove: if TK.draggingElement:
  const world=screenToWorld(e.offsetX,e.offsetY)
  const hit=window.hitTestWall?hitTestWall(world.x,world.y):null
  if(hit && hit.wall.id === element.wallId): element.t=hit.t; redraw()
In mouseup: if TK.draggingElement: saveSnapshot(); TK.draggingElement=null

DOOR/WINDOW PLACEMENT ON CLICK (tool=door or window):
In mousedown when TK.currentTool==='door'||'window':
  TK._placeStart={x:e.offsetX,y:e.offsetY}
In mouseup when TK.currentTool==='door'||'window':
  const moved=Math.abs(e.offsetX-TK._placeStart?.x)+Math.abs(e.offsetY-TK._placeStart?.y)
  if(moved<8 && window.placeElementOnWall): placeElementOnWall(e.offsetX,e.offsetY)

KEEP ALL: wallThicknessSelect, snap logic, room draw mode, wall draw mode, select mode, dblclick modal, deleteSelected, copySelected, pasteClipboard, coordInfo update.

CURRENT drawing.js (truncated):
${drawingJs.slice(0,2000)}

Return JSON: {"src/drawing.js":"..."}`}]
  });
  writeFiles(res2.content[0].text, PROJECT_DIR);
  console.log("\n✅ Fix-E done. All fix agents complete.");
  console.log("🌐 Test index.html — then git-push-v002.bat");
}
run().catch(e => { console.error("❌", e.message); process.exit(1); });
