/**
 * TANKETEKT — Fix D1: elements.js
 * Walls in element list, door/window placement + reposition after placement
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
  console.log("🚪  [FIX-D1] Fixing elements.js...\n");
  const current = readFile("src/elements.js");

  const res = await client.messages.create({
    model: "claude-sonnet-4-6", max_tokens: 8192,
    system: `Output ONLY a raw JSON object. No markdown. No prose. Keys=filepaths, values=complete file contents.`,
    messages:[{ role:"user", content:`Rewrite src/elements.js for TankeTekt v.demo-002. Complete file. No comments. No blank lines.

IMPLEMENT:

PRESETS:
window.DOOR_PRESETS=[{id:'d70',name:'Dør 70cm',width:0.7,swing:0.7},{id:'d80',name:'Dør 80cm',width:0.8,swing:0.8},{id:'d90',name:'Dør 90cm (tilgjengeleg)',width:0.9,swing:0.9},{id:'d120',name:'Dør 120cm (dobbel)',width:1.2,swing:0.6},{id:'custom',name:'Eige mål',width:0.8,swing:0.8}]
window.WINDOW_PRESETS=[{id:'v60',name:'Vindauge 60cm',width:0.6,height:1.2},{id:'v90',name:'Vindauge 90cm',width:0.9,height:1.2},{id:'v120',name:'Vindauge 120cm',width:1.2,height:1.2},{id:'v150',name:'Vindauge 150cm',width:1.5,height:1.4},{id:'custom',name:'Eige mål',width:1.0,height:1.2}]

WALL HIT TEST:
window.hitTestWall(worldX, worldY):
  For each wall in TK.walls:
    A={x:wall.x1,y:wall.y1} B={x:wall.x2,y:wall.y2} P={x:worldX,y:worldY}
    dx=B.x-A.x; dy=B.y-A.y; lenSq=dx*dx+dy*dy
    t=lenSq===0?0:Math.max(0,Math.min(1,((P.x-A.x)*dx+(P.y-A.y)*dy)/lenSq))
    cx=A.x+t*dx; cy=A.y+t*dy
    dist=Math.sqrt((P.x-cx)**2+(P.y-cy)**2)
    if dist<0.6: return {wall,t,cx,cy}
  return null

PLACE DOOR/WINDOW MODALS:
window.placeDoor(): show modal overlay div. Modal contains:
  h2 "Legg til dør". Select#doorPresetSelect populated from DOOR_PRESETS.
  On custom select: show input for width (mm).
  Button "Vel plassering på vegg": close modal, TK.currentTool='door', TK.pendingElement={type:'door',preset:chosen}, setStatus('Klikk på ein vegg')
  Button "Avbryt": remove modal.
window.placeWindow(): same pattern, modal "Legg til vindauge", presets from WINDOW_PRESETS, TK.currentTool='window'.

ELEMENT PLACEMENT ON CANVAS CLICK (called from drawing.js when tool=door/window):
window.placeElementOnWall(screenX, screenY):
  const world = screenToWorld(screenX, screenY)
  const hit = hitTestWall(world.x, world.y)
  if(!hit){setStatus('Ingen vegg funnen — klikk på ein vegg');return}
  saveSnapshot()
  const el={id:TK.nextId++,wallId:hit.wall.id,t:hit.t,...TK.pendingElement.preset}
  if(TK.pendingElement.type==='door') TK.doors.push(el)
  else TK.windows.push(el)
  TK.pendingElement=null; TK.currentTool='draw'
  updateElementList(); redraw(); setStatus('Element plassert. Teiknar rom...')

REPOSITION AFTER PLACEMENT:
When TK.selectedType==='door' or 'window' and user drags selected element:
window.repositionElement(elementId, type, screenX, screenY):
  Find element. Find its wall. Compute new t from screenToWorld click projected onto wall segment.
  Clamp t to 0.05–0.95. Update element.t. redraw().
Elements are selected by click (handled in drawing.js select mode).

DOOR RENDERING (window.drawDoor(ctx, door)):
  Find wall. Get screen pts via worldToScreen.
  wallVec = normalize screen direction. wallNorm = perpendicular.
  doorScreenW = door.width * TK.scale * TK.zoom
  pos = lerp screenStart to screenEnd by door.t
  Draw white gap rect (erase wall) width=doorScreenW along wall direction.
  ctx.strokeStyle='#5c3317'; ctx.lineWidth=1.5
  Draw door arc: ctx.beginPath(); ctx.arc(pos.x,pos.y, doorScreenW, angle, angle+Math.PI/2); ctx.stroke()
  Draw door panel line from pos along wall direction by doorScreenW.
  If selected: ctx.strokeStyle='#e94560'

WINDOW RENDERING (window.drawWindow(ctx, win)):
  Find wall. Get screen pts.
  winScreenW = win.width * TK.scale * TK.zoom
  pos = lerp start to end by win.t
  wallDir = normalize. wallNorm = perp.
  offset = TK.wallThickness*TK.scale*TK.zoom/2 + 2
  Draw 2 parallel lines across the wall at window position (standard architectural symbol).
  ctx.strokeStyle='#4a90d9'; ctx.lineWidth=1.5
  If selected: ctx.strokeStyle='#e94560'

TEK17 CHECKER:
window.checkTEK17(): returns array of {roomId,msg} for rooms below type minArea.

UPDATE ELEMENT LIST:
window.updateElementList():
  const ul=document.getElementById('element-list'); if(!ul)return; ul.innerHTML=''
  function makeSection(title, items, deleteFrom):
    if(!items.length) return
    const h=document.createElement('li'); h.style='list-style:none;color:var(--muted);font-size:11px;text-transform:uppercase;padding:8px 0 4px;letter-spacing:1px'; h.textContent=title+'('+items.length+')'; ul.appendChild(h)
    items.forEach(el=>{
      const li=document.createElement('li'); li.className='room-item'; li.style.borderLeftColor=deleteFrom==='doors'?'#8B4513':'#4a90d9'
      const label=el.name||(el.preset)||'Element'
      const info=el.width?(el.width*100).toFixed(0)+'cm':''
      li.innerHTML='<div class="room-name">'+label+'</div><div class="room-info">'+info+'</div>'
      li.onclick=()=>{TK.selectedId=el.id;TK.selectedType=deleteFrom==='walls'?'wall':deleteFrom==='doors'?'door':'window';updateElementList();redraw()}
      const btn=document.createElement('button'); btn.textContent='×'; btn.style='float:right;padding:0 6px;background:#e94560;border:none;color:white;border-radius:3px;cursor:pointer'
      btn.onclick=(e)=>{e.stopPropagation();saveSnapshot();TK[deleteFrom]=TK[deleteFrom].filter(x=>x.id!==el.id);updateElementList();redraw()}
      li.appendChild(btn); ul.appendChild(li)
    })
  makeSection('Veggar ',TK.walls,'walls')
  makeSection('Dører ',TK.doors,'doors')
  makeSection('Vindauge ',TK.windows,'windows')
  if(!TK.walls.length&&!TK.doors.length&&!TK.windows.length){const li=document.createElement('li');li.style='color:var(--muted);font-size:12px;padding:8px';li.textContent='Ingen element lagt til';ul.appendChild(li)}

CURRENT (for reference, keep compatible):
${current.slice(0,800)}

Return JSON: {"src/elements.js":"..."}`}]
  });
  writeFiles(res.content[0].text, PROJECT_DIR);
  console.log("\n✅ Fix-D1 done. Run fix-D2-export.mjs next.");
}
run().catch(e => { console.error("❌", e.message); process.exit(1); });
