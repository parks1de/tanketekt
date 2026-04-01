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
  if(!c.startsWith("{"))return console.log("  ⚠️ skipped: "+text.slice(0,80));
  const files=JSON.parse(c);
  for(const [p,v] of Object.entries(files)){const f=path.join(DIR,p);fs.mkdirSync(path.dirname(f),{recursive:true});fs.writeFileSync(f,v,"utf8");console.log(`  ✅ ${p} (${v.length}ch)`);}
}
async function run(){
  console.log("✏️  [FIX-I2] drawing.js...\n");
  const res = await client.messages.create({ model:"claude-sonnet-4-6", max_tokens:8192,
    system:`Output ONLY raw JSON object. No markdown. Keys=filepaths, values=complete file contents.`,
    messages:[{role:"user",content:`Write complete src/drawing.js for TankeTekt v.demo-002. No comments. No blank lines.

Depends on window.TK, TK_ROOM_TYPES, saveSnapshot, updateSidebar, updateWallList, setStatus, setTool, redraw, worldToScreen, screenToWorld from other files.

ON DOMCONTENTLOADED:
const canvas=document.getElementById('floorplan')
Attach: mousedown, mousemove, mouseup, dblclick, wheel (wheel handled by canvas.js — skip here), contextmenu(prevent default).

SNAP FUNCTION:
window.snapPoint=(sx,sy,shiftHeld)=>{
  if(shiftHeld)return screenToWorld(sx,sy)
  const SNAP=15
  const sw=SNAP/TK.zoom
  const w=screenToWorld(sx,sy)
  let best=null,bestD=sw
  const check=(px,py)=>{const d=Math.sqrt((w.x-px)**2+(w.y-py)**2);if(d<bestD){bestD=d;best={x:px,y:py}}}
  TK.rooms.forEach(r=>{
    check(r.x,r.y);check(r.x+r.w,r.y);check(r.x,r.y+r.h);check(r.x+r.w,r.y+r.h)
    check(r.x+r.w/2,r.y);check(r.x+r.w/2,r.y+r.h);check(r.x,r.y+r.h/2);check(r.x+r.w,r.y+r.h/2)
    const ex=[{x:r.x,y:r.y,ex:r.x+r.w,ey:r.y},{x:r.x+r.w,y:r.y,ex:r.x+r.w,ey:r.y+r.h},{x:r.x,y:r.y+r.h,ex:r.x+r.w,ey:r.y+r.h},{x:r.x,y:r.y,ex:r.x,ey:r.y+r.h}]
    ex.forEach(e=>{const dx=e.ex-e.x;const dy=e.ey-e.y;const t2=Math.max(0,Math.min(1,((w.x-e.x)*dx+(w.y-e.y)*dy)/(dx*dx+dy*dy)));check(e.x+t2*dx,e.y+t2*dy)})
  })
  TK.walls.forEach(wall=>{
    check(wall.x1,wall.y1);check(wall.x2,wall.y2)
    check((wall.x1+wall.x2)/2,(wall.y1+wall.y2)/2)
    const dx=wall.x2-wall.x1;const dy=wall.y2-wall.y1;const len2=dx*dx+dy*dy
    if(len2>0){const t2=Math.max(0,Math.min(1,((w.x-wall.x1)*dx+(w.y-wall.y1)*dy)/len2));check(wall.x1+t2*dx,wall.y1+t2*dy)}
  })
  window.snapIndicator=best
  return best||w
}

MOUSEDOWN:
canvas.addEventListener('mousedown',e=>{
  if(e.altKey||e.button===1){TK._pan={sx:e.offsetX,sy:e.offsetY,px:TK.panX,py:TK.panY};return}
  if(TK.currentTool==='door'||TK.currentTool==='window'){TK._placeStart={x:e.offsetX,y:e.offsetY};return}
  if(TK.currentTool==='draw'){const s=snapPoint(e.offsetX,e.offsetY,e.shiftKey);TK._draw={start:s,active:true};return}
  if(TK.currentTool==='wall'){const s=snapPoint(e.offsetX,e.offsetY,e.shiftKey);TK._wall={start:s,active:true};return}
  if(TK.selectedType==='room'&&TK.selectedId){
    const r=TK.rooms.find(x=>x.id===TK.selectedId)
    if(r&&window.getResizeHandle){const h=getResizeHandle(r,e.offsetX,e.offsetY);if(h){TK._resize={h,orig:{...r}};return}}
  }
  if(TK.selectedType==='wall'&&TK.selectedId){
    const w=TK.walls.find(x=>x.id===TK.selectedId)
    if(w&&window.getWallHandle){const wh=getWallHandle(w,e.offsetX,e.offsetY);if(wh){TK._wallEnd={end:wh,wallId:w.id};return}}
  }
  const wo=screenToWorld(e.offsetX,e.offsetY)
  let hit=null
  TK.rooms.forEach(r=>{if(wo.x>=r.x&&wo.x<=r.x+r.w&&wo.y>=r.y&&wo.y<=r.y+r.h)hit={id:r.id,type:'room'}})
  if(!hit)TK.walls.forEach(w=>{const dx=w.x2-w.x1;const dy=w.y2-w.y1;const len2=dx*dx+dy*dy;if(len2===0)return;const t2=Math.max(0,Math.min(1,((wo.x-w.x1)*dx+(wo.y-w.y1)*dy)/len2));const cx=w.x1+t2*dx;const cy=w.y1+t2*dy;if(Math.sqrt((wo.x-cx)**2+(wo.y-cy)**2)<w.thickness*TK.scale*2)hit={id:w.id,type:'wall'}})
  TK.selectedId=hit?.id||null;TK.selectedType=hit?.type||null
  updateSidebar();if(window.updateWallList)updateWallList();redraw()
})

MOUSEMOVE:
canvas.addEventListener('mousemove',e=>{
  const wo=screenToWorld(e.offsetX,e.offsetY)
  const ci=document.getElementById('coordInfo');if(ci)ci.textContent='X: '+(wo.x/TK.scale).toFixed(2)+'m  Y: '+(wo.y/TK.scale).toFixed(2)+'m'
  if(TK._pan){TK.panX=TK._pan.px+(e.offsetX-TK._pan.sx);TK.panY=TK._pan.py+(e.offsetY-TK._pan.sy);redraw();return}
  if(TK._resize){
    const dx=(e.offsetX-TK._resize.prevX||0)/TK.zoom;const dy=(e.offsetY-TK._resize.prevY||0)/TK.zoom
    TK._resize.prevX=e.offsetX;TK._resize.prevY=e.offsetY
    if(!TK._resize.prevX){TK._resize.prevX=e.offsetX;TK._resize.prevY=e.offsetY;return}
    const r=TK.rooms.find(x=>x.id===TK.selectedId);if(!r)return
    const h=TK._resize.h.cursor
    if(h==='e-resize')r.w=Math.max(50,TK._resize.orig.w+(e.offsetX-TK._resize.startX)/TK.zoom)
    else if(h==='s-resize')r.h=Math.max(50,TK._resize.orig.h+(e.offsetY-TK._resize.startY)/TK.zoom)
    else if(h==='se-resize'){r.w=Math.max(50,TK._resize.orig.w+(e.offsetX-TK._resize.startX)/TK.zoom);r.h=Math.max(50,TK._resize.orig.h+(e.offsetY-TK._resize.startY)/TK.zoom)}
    redraw();return
  }
  if(TK._wallEnd){const s=snapPoint(e.offsetX,e.offsetY,e.shiftKey);const w=TK.walls.find(x=>x.id===TK._wallEnd.wallId);if(w){if(TK._wallEnd.end==='start'){w.x1=s.x;w.y1=s.y}else{w.x2=s.x;w.y2=s.y}};redraw();return}
  if(TK._draw?.active){const s=snapPoint(e.offsetX,e.offsetY,e.shiftKey);window.activePreview={type:'room',x:Math.min(TK._draw.start.x,s.x),y:Math.min(TK._draw.start.y,s.y),w:Math.abs(s.x-TK._draw.start.x),h:Math.abs(s.y-TK._draw.start.y)};redraw();return}
  if(TK._wall?.active){const s=snapPoint(e.offsetX,e.offsetY,e.shiftKey);window.activePreview={type:'wall',x1:TK._wall.start.x,y1:TK._wall.start.y,x2:s.x,y2:s.y,thickness:TK.wallThickness};redraw();return}
  window.snapIndicator=null
})

MOUSEUP:
canvas.addEventListener('mouseup',e=>{
  if(TK._pan){TK._pan=null;return}
  if(TK._resize){saveSnapshot();TK._resize=null;return}
  if(TK._wallEnd){saveSnapshot();TK._wallEnd=null;return}
  if(TK._draw?.active){
    TK._draw.active=false;window.activePreview=null
    const s=snapPoint(e.offsetX,e.offsetY,e.shiftKey)
    const w=Math.abs(s.x-TK._draw.start.x);const h=Math.abs(s.y-TK._draw.start.y)
    if(w>50&&h>50){saveSnapshot();const tp=TK_ROOM_TYPES[7];TK.rooms.push({id:TK.nextId++,name:'Rom '+TK.nextId,type:'anna',x:Math.min(TK._draw.start.x,s.x),y:Math.min(TK._draw.start.y,s.y),w,h,color:tp.color});updateSidebar()}
    TK._draw=null;redraw();return
  }
  if(TK._wall?.active){
    TK._wall.active=false;window.activePreview=null
    const s=snapPoint(e.offsetX,e.offsetY,e.shiftKey)
    const dx=s.x-TK._wall.start.x;const dy=s.y-TK._wall.start.y
    if(Math.sqrt(dx*dx+dy*dy)>20){saveSnapshot();TK.walls.push({id:TK.nextId++,x1:TK._wall.start.x,y1:TK._wall.start.y,x2:s.x,y2:s.y,thickness:TK.wallThickness});if(window.updateWallList)updateWallList()}
    TK._wall=null;redraw();return
  }
  if((TK.currentTool==='door'||TK.currentTool==='window')&&TK._placeStart){
    const dx=Math.abs(e.offsetX-TK._placeStart.x);const dy=Math.abs(e.offsetY-TK._placeStart.y)
    if(dx<8&&dy<8&&window.placeElementOnWall)placeElementOnWall(e.offsetX,e.offsetY)
    TK._placeStart=null;return
  }
})

DBLCLICK:
canvas.addEventListener('dblclick',e=>{
  const wo=screenToWorld(e.offsetX,e.offsetY)
  const r=TK.rooms.find(r=>wo.x>=r.x&&wo.x<=r.x+r.w&&wo.y>=r.y&&wo.y<=r.y+r.h)
  if(!r)return
  const ov=document.createElement('div');ov.className='modal-overlay'
  const opts=TK_ROOM_TYPES.map(t=>'<option value="'+t.id+'"'+(t.id===r.type?' selected':'')+'>'+t.name+'</option>').join('')
  ov.innerHTML='<div class="modal"><h2>Endre rom</h2><label>Namn</label><input id="rEditName" value="'+r.name+'"><label>Type</label><select id="rEditType">'+opts+'</select><div class="modal-btns"><button id="rEditCancel">Avbryt</button><button id="rEditSave" style="background:var(--accent);border-color:var(--accent)">Lagre</button></div></div>'
  document.body.appendChild(ov)
  document.getElementById('rEditCancel').onclick=()=>ov.remove()
  document.getElementById('rEditSave').onclick=()=>{
    const nm=document.getElementById('rEditName').value.trim()||r.name
    const tp=TK_ROOM_TYPES.find(t=>t.id===document.getElementById('rEditType').value)||TK_ROOM_TYPES[7]
    saveSnapshot();r.name=nm;r.type=tp.id;r.color=tp.color;ov.remove();updateSidebar();redraw()
  }
})

window.deleteSelected=()=>{if(!TK.selectedId)return;saveSnapshot();TK.rooms=TK.rooms.filter(r=>r.id!==TK.selectedId);TK.walls=TK.walls.filter(w=>w.id!==TK.selectedId);TK.selectedId=null;updateSidebar();if(window.updateWallList)updateWallList();redraw()}
window.copySelected=()=>{const r=TK.rooms.find(x=>x.id===TK.selectedId);if(r){TK.clipboard={...r};setStatus('Kopiert!')}}
window.pasteClipboard=()=>{if(!TK.clipboard)return;saveSnapshot();TK.rooms.push({...TK.clipboard,id:TK.nextId++,x:TK.clipboard.x+TK.scale*0.5,y:TK.clipboard.y+TK.scale*0.5});updateSidebar();redraw()}

Return JSON: {"src/drawing.js":"..."}`}]
  });
  write(res.content[0].text);
  console.log("\n✅ Fix-I2 done.");
}
run().catch(e=>{console.error("❌",e.message);process.exit(1);});
