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
  if(!c.startsWith("{"))return console.log("  ⚠️ skipped");
  const files=JSON.parse(c);
  for(const [p,v] of Object.entries(files)){const f=path.join(DIR,p);fs.mkdirSync(path.dirname(f),{recursive:true});fs.writeFileSync(f,v,"utf8");console.log(`  ✅ ${p}`);}
}
async function run(){
  console.log("🔧 [FIX-H2] app.js...\n");
  const res = await client.messages.create({ model:"claude-sonnet-4-6", max_tokens:8192,
    system:`Output ONLY raw JSON object. No markdown. Keys=filepaths, values=complete file contents.`,
    messages:[{role:"user",content:`Write complete src/app.js for TankeTekt v.demo-002. No comments. No blank lines.

window.TK={rooms:[],walls:[],doors:[],windows:[],history:[],redoStack:[],scale:100,zoom:1.0,panX:0,panY:0,showGrid:true,showOuterDims:true,showInnerDims:false,showAreaLabels:true,showRoomLabels:true,selectedId:null,selectedType:null,currentTool:'draw',wallThickness:0.198,nextId:1,clipboard:null,showNorthArrow:true}
window.TK_ROOM_TYPES=[{id:'stove',name:'Stove',color:'#4a90d9',minArea:15},{id:'soverom',name:'Soverom',color:'#7b68ee',minArea:7},{id:'kjokken',name:'Kjøken',color:'#e8a838',minArea:6},{id:'bad',name:'Bad/WC',color:'#4ecdc4',minArea:2.5},{id:'gang',name:'Gang/Entre',color:'#95a5a6',minArea:0},{id:'bod',name:'Bod',color:'#a0826d',minArea:0},{id:'kontor',name:'Kontor',color:'#5dade2',minArea:0},{id:'anna',name:'Anna',color:'#aaaaaa',minArea:0}]
window.px2m=(px)=>(px/TK.scale).toFixed(2)
window.roomArea=(r)=>(r.w*r.h/(TK.scale*TK.scale)).toFixed(2)
window.saveSnapshot=()=>{TK.history.push(JSON.stringify({rooms:TK.rooms,walls:TK.walls,doors:TK.doors,windows:TK.windows}));if(TK.history.length>50)TK.history.shift();TK.redoStack=[];autoSave()}
window.undo=()=>{if(!TK.history.length)return;TK.redoStack.push(JSON.stringify({rooms:TK.rooms,walls:TK.walls,doors:TK.doors,windows:TK.windows}));const s=JSON.parse(TK.history.pop());TK.rooms=s.rooms;TK.walls=s.walls;TK.doors=s.doors;TK.windows=s.windows;updateSidebar();updateWallList();if(window.updateElementList)updateElementList();if(window.redraw)redraw()}
window.redo=()=>{if(!TK.redoStack.length)return;TK.history.push(JSON.stringify({rooms:TK.rooms,walls:TK.walls,doors:TK.doors,windows:TK.windows}));const s=JSON.parse(TK.redoStack.pop());TK.rooms=s.rooms;TK.walls=s.walls;TK.doors=s.doors;TK.windows=s.windows;updateSidebar();updateWallList();if(window.updateElementList)updateElementList();if(window.redraw)redraw()}
window.setStatus=(msg)=>{const e=document.getElementById('statusMsg');if(e)e.textContent=msg}
window.setTool=(tool)=>{TK.currentTool=tool;['btnDraw','btnWall'].forEach(id=>{const b=document.getElementById(id);if(b)b.classList.remove('active')});if(tool==='draw'){const b=document.getElementById('btnDraw');if(b)b.classList.add('active')}if(tool==='wall'){const b=document.getElementById('btnWall');if(b)b.classList.add('active')}}
window.updateSidebar=()=>{
  const list=document.getElementById('room-list');if(!list)return;list.innerHTML='';
  TK.rooms.forEach(r=>{const type=TK_ROOM_TYPES.find(t=>t.id===r.type)||TK_ROOM_TYPES[7];const area=roomArea(r);const warn=type.minArea>0&&parseFloat(area)<type.minArea?' ⚠️':'';const li=document.createElement('li');li.className='room-item'+(TK.selectedId===r.id?' selected':'');li.style.borderLeftColor=type.color;li.innerHTML='<div class="rname">'+r.name+warn+'</div><div class="rinfo">'+px2m(r.w)+'m × '+px2m(r.h)+'m | '+area+' m²</div>';li.onclick=()=>{TK.selectedId=r.id;TK.selectedType='room';updateSidebar();if(window.redraw)redraw()};list.appendChild(li)});
  const wEl=document.getElementById('tek17-warnings');if(!wEl)return;wEl.innerHTML='';
  TK.rooms.forEach(r=>{const type=TK_ROOM_TYPES.find(t=>t.id===r.type)||TK_ROOM_TYPES[7];if(type.minArea>0&&parseFloat(roomArea(r))<type.minArea){const d=document.createElement('div');d.className='tek17-warn';d.textContent='⚠️ '+r.name+': '+roomArea(r)+'m² (min '+type.minArea+'m² TEK17)';wEl.appendChild(d)}})
}
window.updateWallList=()=>{
  const list=document.getElementById('wall-list');if(!list)return;list.innerHTML='';
  if(!TK.walls.length){const li=document.createElement('li');li.style='color:var(--muted);font-size:12px;padding:8px';li.textContent='Ingen veggar';list.appendChild(li);return}
  TK.walls.forEach(w=>{const len=Math.sqrt((w.x2-w.x1)**2+(w.y2-w.y1)**2)/TK.scale;const li=document.createElement('li');li.className='room-item'+(TK.selectedId===w.id?' selected':'');li.style.borderLeftColor='#666';li.innerHTML='<div class="rname">Vegg '+w.id+'</div><div class="rinfo">'+len.toFixed(2)+'m | '+(w.thickness*1000).toFixed(0)+'mm</div>';const btn=document.createElement('button');btn.textContent='×';btn.style='float:right;padding:0 5px;background:#e94560;border:none;color:white;border-radius:3px;cursor:pointer;font-size:11px';btn.onclick=e=>{e.stopPropagation();saveSnapshot();TK.walls=TK.walls.filter(x=>x.id!==w.id);updateWallList();if(window.redraw)redraw()};li.appendChild(btn);li.onclick=()=>{TK.selectedId=w.id;TK.selectedType='wall';updateWallList();if(window.redraw)redraw()};list.appendChild(li)})
}
window.autoSave=()=>{try{localStorage.setItem('tanketekt_autosave',JSON.stringify({rooms:TK.rooms,walls:TK.walls,doors:TK.doors,windows:TK.windows,scale:TK.scale,savedAt:Date.now()}))}catch(e){}}
window.loadFromLocalStorage=()=>{try{const d=localStorage.getItem('tanketekt_autosave');if(!d)return;const s=JSON.parse(d);const age=Math.round((Date.now()-s.savedAt)/60000);if(confirm('Gjenopprette sist lagra økt ('+age+' min sidan)?')){TK.rooms=s.rooms||[];TK.walls=s.walls||[];TK.doors=s.doors||[];TK.windows=s.windows||[];TK.scale=s.scale||100;updateSidebar();updateWallList();if(window.updateElementList)updateElementList();if(window.redraw)redraw();setStatus('Økt gjenoppretta!')}}catch(e){}}
window.redraw=()=>{}
window.deleteSelected=()=>{if(!TK.selectedId)return;saveSnapshot();TK.rooms=TK.rooms.filter(r=>r.id!==TK.selectedId);TK.walls=TK.walls.filter(w=>w.id!==TK.selectedId);TK.doors=TK.doors.filter(d=>d.id!==TK.selectedId);TK.windows=TK.windows.filter(w=>w.id!==TK.selectedId);TK.selectedId=null;updateSidebar();updateWallList();if(window.updateElementList)updateElementList();if(window.redraw)redraw()}
window.copySelected=()=>{const r=TK.rooms.find(x=>x.id===TK.selectedId);if(r){TK.clipboard=JSON.parse(JSON.stringify(r));setStatus('Kopiert!')}}
window.pasteClipboard=()=>{if(!TK.clipboard)return;saveSnapshot();const c={...TK.clipboard,id:TK.nextId++,x:TK.clipboard.x+TK.scale*0.5,y:TK.clipboard.y+TK.scale*0.5};TK.rooms.push(c);updateSidebar();if(window.redraw)redraw()}
window.placeDoor=()=>{}
window.placeWindow=()=>{}
window.exportPNG=()=>{}
window.exportPDF=()=>{}
window.saveProject=()=>{}
window.loadProject=()=>{}
window.updateElementList=()=>{}
window.zoomToFit=()=>{}
document.addEventListener('DOMContentLoaded',()=>{
  const ws=document.getElementById('wallThicknessSelect');
  if(ws){ws.innerHTML='<option value="0.098">Innv. lettvegge 98mm</option><option value="0.148">Innv. 148mm</option><option value="0.198" selected>Utv. yttervegg 198mm</option><option value="0.248">Utv. yttervegg 248mm</option><option value="custom">Eige mål...</option>';ws.onchange=function(){if(this.value==='custom'){const v=prompt('Veggtykkleik i mm:');if(v&&!isNaN(v))TK.wallThickness=parseFloat(v)/1000}else TK.wallThickness=parseFloat(this.value)}}
  document.getElementById('btnDraw').onclick=()=>{setTool('draw');setStatus('Teikn rom: klikk og dra')}
  document.getElementById('btnWall').onclick=()=>{setTool('wall');setStatus('Teikn vegg: klikk og dra')}
  document.getElementById('btnUndo').onclick=()=>undo()
  document.getElementById('btnRedo').onclick=()=>redo()
  document.getElementById('btnDoor').onclick=()=>{if(window.placeDoor)placeDoor()}
  document.getElementById('btnWindow').onclick=()=>{if(window.placeWindow)placeWindow()}
  document.getElementById('btnZoomFit').onclick=()=>{if(window.zoomToFit)zoomToFit()}
  document.getElementById('btnNew').onclick=()=>{if(confirm('Nytt prosjekt? Ulagra endringar går tapt.')){TK.rooms=[];TK.walls=[];TK.doors=[];TK.windows=[];TK.selectedId=null;TK.history=[];TK.redoStack=[];localStorage.removeItem('tanketekt_autosave');updateSidebar();updateWallList();if(window.updateElementList)updateElementList();if(window.redraw)redraw();setStatus('Nytt prosjekt klart')}}
  document.getElementById('btnSave').onclick=()=>{if(window.saveProject)saveProject()}
  document.getElementById('btnPNG').onclick=()=>{if(window.exportPNG)exportPNG()}
  document.getElementById('btnPDF').onclick=()=>{if(window.exportPDF)exportPDF()}
  document.getElementById('fileInput').onchange=function(){if(this.files[0]&&window.loadProject)loadProject(this.files[0])}
  const btnVis=document.getElementById('btnVis');const visPanel=document.getElementById('visPanel');
  btnVis.onclick=e=>{e.stopPropagation();visPanel.classList.toggle('open');btnVis.classList.toggle('active')}
  document.addEventListener('click',e=>{if(!visPanel.contains(e.target)&&e.target!==btnVis){visPanel.classList.remove('open');btnVis.classList.remove('active')}})
  document.getElementById('cbGrid').onchange=function(){TK.showGrid=this.checked;if(window.redraw)redraw()}
  document.getElementById('cbOuter').onchange=function(){TK.showOuterDims=this.checked;if(window.redraw)redraw()}
  document.getElementById('cbInner').onchange=function(){TK.showInnerDims=this.checked;if(window.redraw)redraw()}
  document.getElementById('cbArea').onchange=function(){TK.showAreaLabels=this.checked;if(window.redraw)redraw()}
  document.getElementById('cbLabels').onchange=function(){TK.showRoomLabels=this.checked;if(window.redraw)redraw()}
  document.querySelectorAll('.tab').forEach(t=>t.onclick=()=>{document.querySelectorAll('.tab,.tab-pane').forEach(x=>x.classList.remove('active'));t.classList.add('active');document.getElementById('tab-'+t.dataset.tab).classList.add('active')})
  document.addEventListener('keydown',e=>{if(e.ctrlKey&&e.key==='z'){e.preventDefault();undo()}else if(e.ctrlKey&&e.key==='y'){e.preventDefault();redo()}else if(e.ctrlKey&&e.key==='c')copySelected();else if(e.ctrlKey&&e.key==='v')pasteClipboard();else if(e.key==='Delete')deleteSelected();else if(e.key==='Escape'){TK.currentTool='draw';setTool('draw');window.activePreview=null;window.snapIndicator=null;if(window.redraw)redraw()}})
  setTool('draw');setStatus('Teikn rom: klikk og dra')
  setInterval(autoSave,30000)
  setTimeout(loadFromLocalStorage,500)
})

Return JSON: {"src/app.js":"..."}`}]
  });
  write(res.content[0].text);
  console.log("\n✅ H2 done. Now run fix-I-core.mjs.");
}
run().catch(e=>{console.error("❌",e.message);process.exit(1);});
