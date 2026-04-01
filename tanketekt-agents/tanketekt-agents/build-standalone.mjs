import fs from "fs";
import path from "path";
import dotenv from "dotenv";
dotenv.config();
const DIR = process.env.PROJECT_DIR || "C:\\Users\\bness\\OneDrive\\02_PARKSIDE\\05_PROSJEKT\\TankeTekt";

// Read existing JS files to preserve all the canvas/drawing work
const readF = f => { try { return fs.readFileSync(path.join(DIR,f),"utf8"); } catch(e) { return ""; } };
const canvasJs = readF("src/canvas.js");
const drawingJs = readF("src/drawing.js");
const appJs = readF("src/app.js");

const html = `<!DOCTYPE html>
<html lang="no">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>TankeTekt v.demo-002</title>
<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
<style>
*{box-sizing:border-box;margin:0;padding:0}
:root{--bg:#0d1117;--sur:#161b22;--bdr:#30363d;--acc:#238636;--hi:#e94560;--tx:#c9d1d9;--mu:#8b949e}
body{display:flex;flex-direction:column;height:100vh;background:var(--bg);color:var(--tx);font-family:system-ui,sans-serif;overflow:hidden;font-size:13px}
#tb{display:flex;align-items:center;gap:5px;padding:5px 10px;background:var(--sur);border-bottom:1px solid var(--bdr);flex-shrink:0;flex-wrap:wrap}
.td{width:1px;height:22px;background:var(--bdr);margin:0 4px}
#main{display:flex;flex:1;overflow:hidden}
#wrap{flex:1;overflow:hidden;display:flex;background:#fff}
#floorplan{flex:1;display:block;background:#fff;cursor:crosshair}
#sb{width:260px;background:var(--sur);border-left:1px solid var(--bdr);overflow-y:auto;display:flex;flex-direction:column;flex-shrink:0}
#stbar{display:flex;justify-content:space-between;padding:3px 12px;background:var(--sur);border-top:1px solid var(--bdr);font-size:11px;color:var(--tx);flex-shrink:0}
button{background:var(--sur);color:var(--tx);border:1px solid var(--bdr);border-radius:4px;padding:4px 9px;cursor:pointer;font-size:12px;display:inline-flex;align-items:center;gap:4px;white-space:nowrap}
button:hover{background:var(--acc);border-color:var(--acc)}
button.active{background:var(--hi);border-color:var(--hi);color:#fff}
select{background:var(--sur);color:var(--tx);border:1px solid var(--bdr);border-radius:4px;padding:4px 6px;font-size:12px}
.bexp{background:var(--acc);border-color:var(--acc);font-weight:600}
.bexp:hover{filter:brightness(1.15)}
.vw{position:relative}
#vp{display:none;position:absolute;top:calc(100% + 4px);left:0;background:var(--sur);border:1px solid var(--bdr);border-radius:6px;padding:10px 14px;z-index:200;min-width:150px;box-shadow:0 4px 16px rgba(0,0,0,0.5)}
#vp.open{display:block}
#vp label{display:flex;align-items:center;gap:8px;padding:4px 0;cursor:pointer;font-size:12px}
#vp input[type=checkbox]{accent-color:var(--acc);width:14px;height:14px}
.tabs{display:flex;border-bottom:1px solid var(--bdr);flex-shrink:0}
.tab{flex:1;background:none;border:none;border-bottom:2px solid transparent;color:var(--mu);padding:7px 4px;font-size:11px;cursor:pointer;border-radius:0;display:block;white-space:nowrap}
.tab:hover{background:rgba(255,255,255,0.04)}
.tab.active{color:var(--tx);border-bottom-color:var(--hi)}
.tp{display:none;padding:8px;overflow-y:auto}
.tp.active{display:block}
.ri{list-style:none;padding:6px 8px;border-radius:4px;cursor:pointer;border-left:4px solid #888;margin-bottom:4px;font-size:12px}
.ri:hover,.ri.sel{background:rgba(35,134,54,0.15)}
.rn{font-weight:bold;margin-bottom:2px}
.ri2{color:var(--mu);font-size:11px}
.tw{color:#e6a817;font-size:11px;padding:3px 0}
.mo{position:fixed;inset:0;background:rgba(0,0,0,0.75);display:flex;align-items:center;justify-content:center;z-index:1000}
.md{background:var(--sur);border:1px solid var(--bdr);border-radius:8px;padding:24px;min-width:280px;max-width:460px;max-height:85vh;overflow-y:auto}
.md h2{margin-bottom:14px;font-size:14px}
.md label{display:block;font-size:11px;color:var(--mu);margin-bottom:3px;margin-top:8px}
.md input,.md select{width:100%;background:var(--bg);color:var(--tx);border:1px solid var(--bdr);border-radius:4px;padding:7px;font-size:13px}
.mdb{display:flex;gap:8px;justify-content:flex-end;margin-top:14px}
.mdb button{padding:6px 16px}
ul{list-style:none;padding:0;margin:0}
</style>
</head>
<body>
<div id="tb">
  <select id="wts"></select>
  <button id="bDr" class="active" onclick="setTool('draw');setStatus('Teikn rom: klikk og dra')">✏️ Teikn rom</button>
  <button id="bWl" onclick="setTool('wall');setStatus('Teikn vegg: klikk og dra')">📐 Teikn vegg</button>
  <button onclick="promptRoomDims()">✛ Rom</button>
  <div class="td"></div>
  <button id="bDo" onclick="placeDoor()">🚪 Dør</button>
  <button id="bWi" onclick="placeWindow()">🪟 Vindauge</button>
  <div class="td"></div>
  <div class="vw">
    <button id="bVs" onclick="toggleVis(this)">Vis ▾</button>
    <div id="vp">
      <label><input type="checkbox" id="cbG" checked onchange="TK.showGrid=this.checked;redraw()"> Rutenett</label>
      <label><input type="checkbox" id="cbO" checked onchange="TK.showOuterDims=this.checked;redraw()"> Ytre mål</label>
      <label><input type="checkbox" id="cbI" onchange="TK.showInnerDims=this.checked;redraw()"> Indre mål</label>
      <label><input type="checkbox" id="cbA" checked onchange="TK.showAreaLabels=this.checked;redraw()"> Areal</label>
      <label><input type="checkbox" id="cbL" checked onchange="TK.showRoomLabels=this.checked;redraw()"> Romnamn</label>
    </div>
  </div>
  <button onclick="undo()">↩ Angre</button>
  <button onclick="redo()">↪ Gjer om</button>
  <div style="flex:1"></div>
  <button onclick="zoomToFit()">⊞ Tilpass</button>
  <button onclick="promptRoomDims()">Ny</button>
  <button onclick="doSave()">💾 Lagre</button>
  <div class="td"></div>
  <button class="bexp" onclick="doPNG()">PNG</button>
  <button class="bexp" onclick="doPDFDialog()">PDF</button>
  <input id="fi" type="file" accept=".json" style="display:none" onchange="doLoad(this.files[0])">
  <button onclick="showHelp()">?</button>
</div>
<div id="main">
  <div id="wrap"><canvas id="floorplan" style="display:block;cursor:crosshair"></canvas></div>
  <div id="sb">
    <div class="tabs">
      <button class="tab active" onclick="switchTab('rooms',this)">Rom</button>
      <button class="tab" onclick="switchTab('walls',this)">Veggar</button>
      <button class="tab" onclick="switchTab('els',this)">Dør/Vind.</button>
    </div>
    <div id="tp-rooms" class="tp active"><ul id="rlist"></ul><div id="tek17"></div></div>
    <div id="tp-walls" class="tp"><ul id="wlist"></ul></div>
    <div id="tp-els" class="tp"><ul id="elist"></ul></div>
  </div>
</div>
<div id="stbar"><span id="scInfo"></span><span id="coInfo"></span><span id="stMsg">Teikn rom: klikk og dra</span></div>

<script>
// ── STATE ────────────────────────────────────────────────────────────────────
var TK={rooms:[],walls:[],doors:[],windows:[],history:[],redoStack:[],scale:100,zoom:1,panX:0,panY:0,showGrid:true,showOuterDims:true,showInnerDims:false,showAreaLabels:true,showRoomLabels:true,showDoorSwing:true,selectedId:null,selectedType:null,currentTool:'draw',wallThickness:0.198,nextId:1,clipboard:null};
var TK_ROOM_TYPES=[{id:'stove',name:'Stove',color:'#4a90d9',minArea:15},{id:'soverom',name:'Soverom',color:'#7b68ee',minArea:7},{id:'kjokken',name:'Kjøken',color:'#e8a838',minArea:6},{id:'bad',name:'Bad/WC',color:'#4ecdc4',minArea:2.5},{id:'gang',name:'Gang',color:'#95a5a6',minArea:0},{id:'bod',name:'Bod',color:'#a0826d',minArea:0},{id:'kontor',name:'Kontor',color:'#5dade2',minArea:0},{id:'anna',name:'Anna',color:'#aaaaaa',minArea:0}];
window.TK=TK;window.TK_ROOM_TYPES=TK_ROOM_TYPES;

function px2m(px){return(px/TK.scale).toFixed(2);}
function roomArea(r){return(r.w*r.h/TK.scale/TK.scale).toFixed(2);}
function saveSnapshot(){TK.history.push(JSON.stringify({rooms:TK.rooms,walls:TK.walls,doors:TK.doors,windows:TK.windows}));if(TK.history.length>50)TK.history.shift();TK.redoStack=[];autoSave();}
function undo(){if(!TK.history.length)return;TK.redoStack.push(JSON.stringify({rooms:TK.rooms,walls:TK.walls,doors:TK.doors,windows:TK.windows}));var s=JSON.parse(TK.history.pop());TK.rooms=s.rooms;TK.walls=s.walls;TK.doors=s.doors;TK.windows=s.windows;updateSidebar();updateWallList();updateElList();redraw();}
function redo(){if(!TK.redoStack.length)return;TK.history.push(JSON.stringify({rooms:TK.rooms,walls:TK.walls,doors:TK.doors,windows:TK.windows}));var s=JSON.parse(TK.redoStack.pop());TK.rooms=s.rooms;TK.walls=s.walls;TK.doors=s.doors;TK.windows=s.windows;updateSidebar();updateWallList();updateElList();redraw();}
function setStatus(m){var e=document.getElementById('stMsg');if(e)e.textContent=m;}
function setTool(t){TK.currentTool=t;['bDr','bWl'].forEach(function(id){var b=document.getElementById(id);if(b)b.classList.remove('active');});var m={draw:'bDr',wall:'bWl'};if(m[t]){var b=document.getElementById(m[t]);if(b)b.classList.add('active');}}
function switchTab(id,btn){document.querySelectorAll('.tab,.tp').forEach(function(x){x.classList.remove('active');});btn.classList.add('active');document.getElementById('tp-'+id).classList.add('active');}
function toggleVis(btn){var p=document.getElementById('vp');p.classList.toggle('open');btn.classList.toggle('active');}
document.addEventListener('click',function(e){var p=document.getElementById('vp'),b=document.getElementById('bVs');if(p&&b&&!p.contains(e.target)&&e.target!==b){p.classList.remove('open');b.classList.remove('active');}});
function showToast(msg,type){var d=document.createElement('div');d.style='position:fixed;bottom:20px;right:20px;padding:10px 18px;border-radius:6px;font-weight:700;font-size:13px;color:#fff;z-index:9999;background:'+(type==='error'?'#e94560':'#238636');d.textContent=msg;document.body.appendChild(d);setTimeout(function(){d.style.cssText+=';transition:opacity 0.4s;opacity:0';setTimeout(function(){d.remove();},400);},2500);}
function cascadeDelete(id,type){if(type==='room'){TK.doors=TK.doors.filter(function(d){return d.roomId!==id;});TK.windows=TK.windows.filter(function(w){return w.roomId!==id;});TK.rooms=TK.rooms.filter(function(r){return r.id!==id;});}else if(type==='wall'){TK.doors=TK.doors.filter(function(d){return d.wallId!==id;});TK.windows=TK.windows.filter(function(w){return w.wallId!==id;});TK.walls=TK.walls.filter(function(w){return w.id!==id;});}else if(type==='door'){TK.doors=TK.doors.filter(function(d){return d.id!==id;});}else if(type==='window'){TK.windows=TK.windows.filter(function(w){return w.id!==id;});}if(TK.selectedId===id)TK.selectedId=null;updateSidebar();updateWallList();updateElList();redraw();}
function updateSidebar(){var ul=document.getElementById('rlist');if(!ul)return;ul.innerHTML='';TK.rooms.forEach(function(r){var tp=TK_ROOM_TYPES.find(function(t){return t.id===r.type;})||TK_ROOM_TYPES[7];var area=roomArea(r);var warn=tp.minArea>0&&parseFloat(area)<tp.minArea?' ⚠️':'';var li=document.createElement('li');li.className='ri'+(TK.selectedId===r.id?' sel':'');li.style.borderLeftColor=tp.color;li.innerHTML='<div class="rn">'+r.name+warn+'</div><div class="ri2">'+px2m(r.w)+'m × '+px2m(r.h)+'m | '+area+' m²</div>';var db=document.createElement('button');db.textContent='×';db.style='float:right;padding:0 5px;background:#e94560;border:none;color:#fff;border-radius:3px;cursor:pointer;font-size:11px';db.onclick=function(e){e.stopPropagation();saveSnapshot();cascadeDelete(r.id,'room');};li.onclick=function(){TK.selectedId=r.id;TK.selectedType='room';updateSidebar();redraw();};li.appendChild(db);ul.appendChild(li);});var w2=document.getElementById('tek17');if(!w2)return;w2.innerHTML='';TK.rooms.forEach(function(r){var tp=TK_ROOM_TYPES.find(function(t){return t.id===r.type;});if(tp&&tp.minArea>0&&parseFloat(roomArea(r))<tp.minArea){var d=document.createElement('div');d.className='tw';d.textContent='⚠️ '+r.name+': '+roomArea(r)+'m² (min '+tp.minArea+'m²)';w2.appendChild(d);}});}
function updateWallList(){var ul=document.getElementById('wlist');if(!ul)return;ul.innerHTML='';if(!TK.walls.length){var e=document.createElement('li');e.style='color:var(--mu);font-size:12px;padding:8px';e.textContent='Ingen veggar';ul.appendChild(e);return;}TK.walls.forEach(function(w){var len=(Math.hypot(w.x2-w.x1,w.y2-w.y1)/TK.scale).toFixed(2);var li=document.createElement('li');li.className='ri'+(TK.selectedId===w.id?' sel':'');li.style.borderLeftColor='#666';li.innerHTML='<div class="rn">Vegg '+w.id+'</div><div class="ri2">'+len+'m | '+(w.thickness*1000).toFixed(0)+'mm</div>';var db=document.createElement('button');db.textContent='×';db.style='float:right;padding:0 5px;background:#e94560;border:none;color:#fff;border-radius:3px;cursor:pointer;font-size:11px';db.onclick=function(e){e.stopPropagation();saveSnapshot();cascadeDelete(w.id,'wall');};li.onclick=function(){TK.selectedId=w.id;TK.selectedType='wall';updateWallList();redraw();};li.appendChild(db);ul.appendChild(li);});}
function updateElList(){var ul=document.getElementById('elist');if(!ul)return;ul.innerHTML='';function sec(title,items,type,col,lbl){if(!items.length)return;var h=document.createElement('li');h.style='list-style:none;color:var(--mu);font-size:10px;text-transform:uppercase;padding:7px 0 3px;letter-spacing:1px';h.textContent=title+' ('+items.length+')';ul.appendChild(h);items.forEach(function(el){var li=document.createElement('li');li.className='ri'+(TK.selectedId===el.id?' sel':'');li.style.borderLeftColor=col;li.innerHTML='<div class="rn">'+lbl(el)+'</div>';var db=document.createElement('button');db.textContent='×';db.style='float:right;padding:0 5px;background:#e94560;border:none;color:#fff;border-radius:3px;cursor:pointer;font-size:11px';db.onclick=function(e){e.stopPropagation();saveSnapshot();cascadeDelete(el.id,type);};li.onclick=function(){TK.selectedId=el.id;TK.selectedType=type;updateElList();redraw();};li.appendChild(db);if(type==='door'&&TK.selectedId===el.id){var ctrl=document.createElement('div');ctrl.style='margin-top:4px;display:flex;gap:3px';['↖','↗','↙','↘'].forEach(function(s,i){var b=document.createElement('button');b.textContent=s;b.style='padding:2px 7px;font-size:13px;background:'+(el.swingDir===i?'var(--hi)':'var(--sur)');b.onclick=function(e){e.stopPropagation();saveSnapshot();el.swingDir=i;redraw();updateElList();};ctrl.appendChild(b);});li.appendChild(ctrl);}ul.appendChild(li);});}sec('Veggar',TK.walls,'wall','#666',function(w){return'Vegg '+(Math.hypot(w.x2-w.x1,w.y2-w.y1)/TK.scale).toFixed(2)+'m';});sec('Dører',TK.doors,'door','#8B4513',function(d){return d.name||'Dør';});sec('Vindauge',TK.windows,'window','#4a90d9',function(w){return w.name||'Vindauge';});if(!TK.walls.length&&!TK.doors.length&&!TK.windows.length){var e=document.createElement('li');e.style='color:var(--mu);font-size:12px;padding:8px';e.textContent='Ingen element';ul.appendChild(e);}}

// Wall thickness select
(function(){var s=document.getElementById('wts');s.innerHTML='<option value="0.098">Innv. 98mm</option><option value="0.148">Innv. 148mm</option><option value="0.198" selected>Utv. 198mm</option><option value="0.248">Utv. 248mm</option><option value="custom">Eige mål...</option>';s.onchange=function(){if(this.value==='custom'){var v=prompt('Veggtykkleik mm:');if(v&&!isNaN(v))TK.wallThickness=parseFloat(v)/1000;}else TK.wallThickness=parseFloat(this.value);};})();

// ── CANVAS ───────────────────────────────────────────────────────────────────
var cv=document.getElementById('floorplan');
var ctx=cv.getContext('2d');
var wrap=document.getElementById('wrap');
new ResizeObserver(function(){cv.width=wrap.offsetWidth||800;cv.height=wrap.offsetHeight||600;redraw();}).observe(wrap);
setTimeout(function(){cv.width=wrap.offsetWidth||800;cv.height=wrap.offsetHeight||600;redraw();},60);

function w2s(wx,wy){return{x:wx*TK.zoom+TK.panX,y:wy*TK.zoom+TK.panY};}
function s2w(sx,sy){return{x:(sx-TK.panX)/TK.zoom,y:(sy-TK.panY)/TK.zoom};}
window.worldToScreen=w2s;window.screenToWorld=s2w;

function redraw(){
  var W=cv.width,H=cv.height;
  ctx.clearRect(0,0,W,H);ctx.fillStyle='#ffffff';ctx.fillRect(0,0,W,H);
  if(TK.showGrid){
    var step=TK.scale*TK.zoom;
    var ox=((TK.panX%step)+step)%step,oy=((TK.panY%step)+step)%step;
    ctx.strokeStyle='#e0e0e0';ctx.lineWidth=0.5;
    for(var x=ox;x<W;x+=step){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}
    for(var y=oy;y<H;y+=step){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}
    var s5=step*5,ox5=((TK.panX%s5)+s5)%s5,oy5=((TK.panY%s5)+s5)%s5;
    ctx.strokeStyle='#cccccc';ctx.lineWidth=0.8;
    for(var x2=ox5;x2<W;x2+=s5){ctx.beginPath();ctx.moveTo(x2,0);ctx.lineTo(x2,H);ctx.stroke();}
    for(var y2=oy5;y2<H;y2+=s5){ctx.beginPath();ctx.moveTo(0,y2);ctx.lineTo(W,y2);ctx.stroke();}
  }
  // Walls
  TK.walls.forEach(function(w){
    var s1=w2s(w.x1,w.y1),s2=w2s(w.x2,w.y2);
    var len=Math.hypot(s2.x-s1.x,s2.y-s1.y);if(len<1)return;
    var nx=-(s2.y-s1.y)/len,ny=(s2.x-s1.x)/len,hw=w.thickness*TK.scale*TK.zoom/2;
    var pts=[[s1.x+nx*hw,s1.y+ny*hw],[s2.x+nx*hw,s2.y+ny*hw],[s2.x-nx*hw,s2.y-ny*hw],[s1.x-nx*hw,s1.y-ny*hw]];
    ctx.beginPath();ctx.moveTo(pts[0][0],pts[0][1]);pts.forEach(function(p){ctx.lineTo(p[0],p[1]);});ctx.closePath();
    ctx.fillStyle=w.id===TK.selectedId?'rgba(233,69,96,0.7)':'#2d2d2d';ctx.fill();
    if(len>50&&TK.showOuterDims){var lbl=(Math.hypot(w.x2-w.x1,w.y2-w.y1)/TK.scale).toFixed(2)+'m';var mx=(s1.x+s2.x)/2,my=(s1.y+s2.y)/2;var ang=Math.atan2(s2.y-s1.y,s2.x-s1.x);ctx.save();ctx.translate(mx,my);ctx.rotate(ang>Math.PI/2||ang<-Math.PI/2?ang+Math.PI:ang);ctx.fillStyle='rgba(255,255,255,0.9)';ctx.fillRect(-18,-7,36,11);ctx.fillStyle='#333';ctx.font='bold 9px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(lbl,0,1);ctx.restore();}
  });
  // Rooms
  TK.rooms.forEach(function(r){
    var s=w2s(r.x,r.y),rw=r.w*TK.zoom,rh=r.h*TK.zoom;
    var tp=TK_ROOM_TYPES.find(function(t){return t.id===r.type;})||TK_ROOM_TYPES[7];
    var wt=r.wallThickness||TK.wallThickness||0.1,hwt=wt*TK.scale*TK.zoom/2;
    var sel=r.id===TK.selectedId;
    ctx.fillStyle=sel?'rgba(233,69,96,0.85)':'#2d2d2d';
    ctx.fillRect(s.x-hwt,s.y-hwt,rw+wt*TK.scale*TK.zoom,rh+wt*TK.scale*TK.zoom);
    ctx.fillStyle='#f5f5f5';
    if(rw-wt*TK.scale*TK.zoom>0&&rh-wt*TK.scale*TK.zoom>0)ctx.fillRect(s.x+hwt,s.y+hwt,rw-wt*TK.scale*TK.zoom,rh-wt*TK.scale*TK.zoom);
    if(sel){ctx.strokeStyle='#e94560';ctx.lineWidth=2;ctx.strokeRect(s.x-hwt,s.y-hwt,rw+wt*TK.scale*TK.zoom,rh+wt*TK.scale*TK.zoom);}
    if(TK.showRoomLabels&&rw>40){ctx.fillStyle='#222';ctx.font='bold 13px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(r.name,s.x+rw/2,s.y+rh/2-(TK.showAreaLabels?8:0));}
    if(TK.showAreaLabels&&rw>50){ctx.fillStyle='#666';ctx.font='11px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(roomArea(r)+' m²',s.x+rw/2,s.y+rh/2+(TK.showRoomLabels?8:0));}
    if(sel){drawResizeHandles(s.x,s.y,rw,rh,hwt);}
    drawDims(ctx,r);
  });
  // Doors/windows
  TK.doors.forEach(function(d){drawDoor(ctx,d);});
  TK.windows.forEach(function(w){drawWin(ctx,w);});
  // Preview
  if(window._prev){
    var p=window._prev;ctx.save();ctx.setLineDash([6,3]);ctx.strokeStyle='#e94560';ctx.lineWidth=2;
    if(p.type==='room'){var s2=w2s(p.x,p.y);ctx.strokeRect(s2.x,s2.y,p.w*TK.zoom,p.h*TK.zoom);ctx.fillStyle='rgba(233,69,96,0.08)';ctx.fillRect(s2.x,s2.y,p.w*TK.zoom,p.h*TK.zoom);}
    if(p.type==='wall'){var s1b=w2s(p.x1,p.y1),s2b=w2s(p.x2,p.y2);ctx.beginPath();ctx.moveTo(s1b.x,s1b.y);ctx.lineTo(s2b.x,s2b.y);ctx.stroke();}
    ctx.setLineDash([]);ctx.restore();
  }
  if(window._snap){var ss=w2s(window._snap.x,window._snap.y);ctx.beginPath();ctx.arc(ss.x,ss.y,6,0,Math.PI*2);ctx.strokeStyle='#00cc66';ctx.lineWidth=2;ctx.stroke();}
  // Scale bar
  var targets=[0.1,0.25,0.5,1,2,5,10,20];var bm=1;for(var i=0;i<targets.length;i++){var px=targets[i]*TK.scale*TK.zoom;if(px>=60&&px<=150){bm=targets[i];break;}}
  var bp=bm*TK.scale*TK.zoom,bx=W-bp-20,by=H-24;
  ctx.fillStyle='rgba(255,255,255,0.85)';ctx.fillRect(bx-4,by-4,bp+8,18);ctx.strokeStyle='#333';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(bx,by+8);ctx.lineTo(bx,by+2);ctx.lineTo(bx+bp,by+2);ctx.lineTo(bx+bp,by+8);ctx.stroke();
  ctx.fillStyle='#333';ctx.font='10px sans-serif';ctx.textAlign='center';ctx.fillText(bm+'m',bx+bp/2,by+14);
  var si=document.getElementById('scInfo');if(si)si.textContent='Zoom: '+TK.zoom.toFixed(2)+'x';
}
window.redraw=redraw;

function drawResizeHandles(sx,sy,rw,rh,hwt){
  var hs=[[sx-hwt,sy-hwt],[sx+rw/2,sy-hwt],[sx+rw+hwt,sy-hwt],[sx+rw+hwt,sy+rh/2],[sx+rw+hwt,sy+rh+hwt],[sx+rw/2,sy+rh+hwt],[sx-hwt,sy+rh+hwt],[sx-hwt,sy+rh/2]];
  hs.forEach(function(h){ctx.fillStyle='#fff';ctx.strokeStyle='#e94560';ctx.lineWidth=1.5;ctx.fillRect(h[0]-4,h[1]-4,8,8);ctx.strokeRect(h[0]-4,h[1]-4,8,8);});
}

// Dim line system
window._dimHits=[];
function dimLine(x1,y1,x2,y2,lbl,off,nx,ny,rid,rt){
  var len=Math.hypot(x2-x1,y2-y1);if(len<15)return;
  var ux=(x2-x1)/len,uy=(y2-y1)/len;
  var d1x=x1+nx*off,d1y=y1+ny*off,d2x=x2+nx*off,d2y=y2+ny*off;
  ctx.save();ctx.strokeStyle='#555';ctx.lineWidth=0.8;
  [[x1,y1,d1x,d1y],[x2,y2,d2x,d2y]].forEach(function(e){ctx.beginPath();ctx.moveTo(e[0]+nx*2,e[1]+ny*2);ctx.lineTo(e[2]+nx*5,e[3]+ny*5);ctx.stroke();});
  ctx.strokeStyle='#333';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(d1x,d1y);ctx.lineTo(d2x,d2y);ctx.stroke();
  var A=7;[[d1x,d1y,1],[d2x,d2y,-1]].forEach(function(e){ctx.beginPath();ctx.moveTo(e[0],e[1]);ctx.lineTo(e[0]+e[2]*ux*A-uy*3,e[1]+e[2]*uy*A+ux*3);ctx.moveTo(e[0],e[1]);ctx.lineTo(e[0]+e[2]*ux*A+uy*3,e[1]+e[2]*uy*A-ux*3);ctx.stroke();});
  var mx=(d1x+d2x)/2,my=(d1y+d2y)/2,ang=Math.atan2(uy,ux);
  ctx.translate(mx,my);ctx.rotate(ang>Math.PI/2||ang<-Math.PI/2?ang+Math.PI:ang);
  ctx.fillStyle='rgba(255,255,255,0.92)';ctx.fillRect(-22,-7,44,13);ctx.fillStyle='#222';ctx.font='bold 10px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(lbl,0,2);
  ctx.restore();
  window._dimHits.push({hx:(x1+x2)/2+nx*off*0.5,hy:(y1+y2)/2+ny*off*0.5,nx:nx,ny:ny,rid:rid,rt:rt,off:off});
}
function drawDims(c2,r){
  window._dimHits=window._dimHits||[];
  if(!r.dimO)r.dimO={t:40,r:40,b:40,l:40};
  var s=w2s(r.x,r.y),rw=r.w*TK.zoom,rh=r.h*TK.zoom;
  var wt=r.wallThickness||TK.wallThickness||0.1,hwt=wt*TK.scale*TK.zoom/2;
  if(TK.showOuterDims){
    dimLine(s.x-hwt,s.y-hwt,s.x+rw+hwt,s.y-hwt,((r.w/TK.scale)+wt).toFixed(2)+'m',-r.dimO.t,0,-1,r.id,'rt');
    dimLine(s.x+rw+hwt,s.y-hwt,s.x+rw+hwt,s.y+rh+hwt,((r.h/TK.scale)+wt).toFixed(2)+'m',r.dimO.r,1,0,r.id,'rr');
    dimLine(s.x-hwt,s.y+rh+hwt,s.x+rw+hwt,s.y+rh+hwt,((r.w/TK.scale)+wt).toFixed(2)+'m',r.dimO.b,0,1,r.id,'rb');
    dimLine(s.x-hwt,s.y-hwt,s.x-hwt,s.y+rh+hwt,((r.h/TK.scale)+wt).toFixed(2)+'m',-r.dimO.l,-1,0,r.id,'rl');
  }
  if(TK.showInnerDims){
    var iw=rw-wt*TK.scale*TK.zoom,ih=rh-wt*TK.scale*TK.zoom;
    if(iw>15&&ih>15){
      dimLine(s.x+hwt,s.y+hwt,s.x+hwt+iw,s.y+hwt,(iw/TK.zoom/TK.scale).toFixed(2)+'m',-20,0,-1,r.id,'rit');
      dimLine(s.x+hwt,s.y+hwt,s.x+hwt,s.y+hwt+ih,(ih/TK.zoom/TK.scale).toFixed(2)+'m',-20,-1,0,r.id,'ril');
    }
  }
}

// ── COORDINATE HELPERS ───────────────────────────────────────────────────────
function getElPos(el){
  if(el.wallId){var w=TK.walls.find(function(x){return x.id===el.wallId;});if(!w)return null;return{x1:w.x1,y1:w.y1,x2:w.x2,y2:w.y2,thickness:w.thickness};}
  if(el.roomId){var r=TK.rooms.find(function(x){return x.id===el.roomId;});if(!r)return null;var E={top:{x1:r.x,y1:r.y,x2:r.x+r.w,y2:r.y},right:{x1:r.x+r.w,y1:r.y,x2:r.x+r.w,y2:r.y+r.h},bottom:{x1:r.x,y1:r.y+r.h,x2:r.x+r.w,y2:r.y+r.h},left:{x1:r.x,y1:r.y,x2:r.x,y2:r.y+r.h}};var e=E[el.edge];if(!e)return null;return{x1:e.x1,y1:e.y1,x2:e.x2,y2:e.y2,thickness:r.wallThickness||TK.wallThickness};}
  return null;
}
function drawDoor(ctx2,door){
  var pos=getElPos(door);if(!pos)return;
  var s1=w2s(pos.x1,pos.y1),s2=w2s(pos.x2,pos.y2);
  var len=Math.hypot(s2.x-s1.x,s2.y-s1.y);if(len<2)return;
  var ux=(s2.x-s1.x)/len,uy=(s2.y-s1.y)/len;
  var dw=door.width*TK.scale*TK.zoom,thick=Math.max(4,(pos.thickness||0.1)*TK.scale*TK.zoom);
  var hx=s1.x+(s2.x-s1.x)*door.t,hy=s1.y+(s2.y-s1.y)*door.t;
  var sd=door.swingDir||0,fa=sd&1,fs=(sd>>1)&1;
  var dx2=fa?-ux:ux,dy2=fa?-uy:uy,nx=fs?uy:-uy,ny=fs?-ux:ux;
  var tx=hx+dx2*dw,ty=hy+dy2*dw,hw=thick/2+2;
  ctx2.save();
  ctx2.fillStyle='#fff';ctx2.beginPath();ctx2.moveTo(hx+uy*hw,hy-ux*hw);ctx2.lineTo(tx+uy*hw,ty-ux*hw);ctx2.lineTo(tx-uy*hw,ty+ux*hw);ctx2.lineTo(hx-uy*hw,hy+ux*hw);ctx2.closePath();ctx2.fill();
  var col=door.id===TK.selectedId?'#e94560':'#1a1a1a';
  ctx2.strokeStyle=col;ctx2.lineWidth=2;ctx2.beginPath();ctx2.moveTo(hx,hy);ctx2.lineTo(tx,ty);ctx2.stroke();
  ctx2.fillStyle=col;ctx2.beginPath();ctx2.arc(hx,hy,3,0,Math.PI*2);ctx2.fill();
  if(TK.showDoorSwing){var sa=Math.atan2(dy2,dx2),ea=Math.atan2(ny,nx);ctx2.beginPath();ctx2.arc(hx,hy,dw,sa,ea,!!(fs^fa));ctx2.strokeStyle=col;ctx2.lineWidth=1;ctx2.setLineDash([4,3]);ctx2.stroke();ctx2.setLineDash([]);}
  ctx2.restore();
}
function drawWin(ctx2,win){
  var pos=getElPos(win);if(!pos)return;
  var s1=w2s(pos.x1,pos.y1),s2=w2s(pos.x2,pos.y2);
  var len=Math.hypot(s2.x-s1.x,s2.y-s1.y);if(len<2)return;
  var ux=(s2.x-s1.x)/len,uy=(s2.y-s1.y)/len;
  var ww=win.width*TK.scale*TK.zoom,thick=Math.max(4,(pos.thickness||0.1)*TK.scale*TK.zoom);
  var cx=s1.x+(s2.x-s1.x)*win.t,cy=s1.y+(s2.y-s1.y)*win.t;
  var wx1=cx-ux*ww/2,wy1=cy-uy*ww/2,wx2=cx+ux*ww/2,wy2=cy+uy*ww/2,hw=thick/2;
  ctx2.save();ctx2.fillStyle='#fff';ctx2.beginPath();ctx2.moveTo(wx1+uy*(hw+2),wy1-ux*(hw+2));ctx2.lineTo(wx2+uy*(hw+2),wy2-ux*(hw+2));ctx2.lineTo(wx2-uy*(hw+2),wy2+ux*(hw+2));ctx2.lineTo(wx1-uy*(hw+2),wy1+ux*(hw+2));ctx2.closePath();ctx2.fill();
  var col=win.id===TK.selectedId?'#e94560':'#1a1a1a',o=Math.max(2,hw*0.4);
  ctx2.strokeStyle=col;ctx2.lineWidth=1.5;
  ctx2.beginPath();ctx2.moveTo(wx1+uy*o,wy1-ux*o);ctx2.lineTo(wx2+uy*o,wy2-ux*o);ctx2.stroke();
  ctx2.beginPath();ctx2.moveTo(wx1-uy*o,wy1+ux*o);ctx2.lineTo(wx2-uy*o,wy2+ux*o);ctx2.stroke();
  ctx2.lineWidth=2;ctx2.beginPath();ctx2.moveTo(wx1+uy*hw,wy1-ux*hw);ctx2.lineTo(wx1-uy*hw,wy1+ux*hw);ctx2.stroke();ctx2.beginPath();ctx2.moveTo(wx2+uy*hw,wy2-ux*hw);ctx2.lineTo(wx2-uy*hw,wy2+ux*hw);ctx2.stroke();
  ctx2.restore();
}

// Zoom
cv.addEventListener('wheel',function(e){e.preventDefault();var f=e.deltaY<0?1.12:0.89,nz=Math.max(0.05,Math.min(20,TK.zoom*f));TK.panX=e.offsetX-(e.offsetX-TK.panX)*(nz/TK.zoom);TK.panY=e.offsetY-(e.offsetY-TK.panY)*(nz/TK.zoom);TK.zoom=nz;redraw();},{passive:false});

function zoomToFit(){if(!TK.rooms.length&&!TK.walls.length){TK.zoom=1;TK.panX=0;TK.panY=0;redraw();return;}var minX=1e9,minY=1e9,maxX=-1e9,maxY=-1e9;TK.rooms.forEach(function(r){minX=Math.min(minX,r.x);minY=Math.min(minY,r.y);maxX=Math.max(maxX,r.x+r.w);maxY=Math.max(maxY,r.y+r.h);});TK.walls.forEach(function(w){minX=Math.min(minX,w.x1,w.x2);minY=Math.min(minY,w.y1,w.y2);maxX=Math.max(maxX,w.x1,w.x2);maxY=Math.max(maxY,w.y1,w.y2);});var pad=80,bw=maxX-minX,bh=maxY-minY;TK.zoom=Math.min((cv.width-pad*2)/bw,(cv.height-pad*2)/bh,5);TK.panX=(cv.width-bw*TK.zoom)/2-minX*TK.zoom;TK.panY=(cv.height-bh*TK.zoom)/2-minY*TK.zoom;redraw();}
function getResHandle(r,sx,sy){var s=w2s(r.x,r.y),rw=r.w*TK.zoom,rh=r.h*TK.zoom,hwt=(r.wallThickness||TK.wallThickness||0.1)*TK.scale*TK.zoom/2;var hs=[{x:s.x-hwt,y:s.y-hwt,c:'nw'},{x:s.x+rw/2,y:s.y-hwt,c:'n'},{x:s.x+rw+hwt,y:s.y-hwt,c:'ne'},{x:s.x+rw+hwt,y:s.y+rh/2,c:'e'},{x:s.x+rw+hwt,y:s.y+rh+hwt,c:'se'},{x:s.x+rw/2,y:s.y+rh+hwt,c:'s'},{x:s.x-hwt,y:s.y+rh+hwt,c:'sw'},{x:s.x-hwt,y:s.y+rh/2,c:'w'}];return hs.find(function(h){return Math.abs(h.x-sx)<8&&Math.abs(h.y-sy)<8;})||null;}
function getWallHandle(w,sx,sy){var s1=w2s(w.x1,w.y1),s2=w2s(w.x2,w.y2);if(Math.hypot(s1.x-sx,s1.y-sy)<10)return'start';if(Math.hypot(s2.x-sx,s2.y-sy)<10)return'end';return null;}

// ── SNAP ─────────────────────────────────────────────────────────────────────
function snap(sx,sy,shift){
  if(shift){window._snap=null;return s2w(sx,sy);}
  var SNAP=20/TK.zoom,wo=s2w(sx,sy),best=null,bestD=SNAP;
  function chk(px,py){var d=Math.hypot(wo.x-px,wo.y-py);if(d<bestD){bestD=d;best={x:px,y:py};}}
  TK.rooms.forEach(function(r){chk(r.x,r.y);chk(r.x+r.w,r.y);chk(r.x,r.y+r.h);chk(r.x+r.w,r.y+r.h);chk(r.x+r.w/2,r.y);chk(r.x+r.w/2,r.y+r.h);chk(r.x,r.y+r.h/2);chk(r.x+r.w,r.y+r.h/2);[[r.x,r.y,r.x+r.w,r.y],[r.x+r.w,r.y,r.x+r.w,r.y+r.h],[r.x,r.y+r.h,r.x+r.w,r.y+r.h],[r.x,r.y,r.x,r.y+r.h]].forEach(function(e){var dx=e[2]-e[0],dy=e[3]-e[1],l2=dx*dx+dy*dy;if(!l2)return;var t=Math.max(0,Math.min(1,((wo.x-e[0])*dx+(wo.y-e[1])*dy)/l2));chk(e[0]+t*dx,e[1]+t*dy);});});
  TK.walls.forEach(function(w){chk(w.x1,w.y1);chk(w.x2,w.y2);chk((w.x1+w.x2)/2,(w.y1+w.y2)/2);var dx=w.x2-w.x1,dy=w.y2-w.y1,l2=dx*dx+dy*dy;if(!l2)return;var t=Math.max(0,Math.min(1,((wo.x-w.x1)*dx+(wo.y-w.y1)*dy)/l2));chk(w.x1+t*dx,w.y1+t*dy);});
  window._snap=best;return best||wo;
}
function hitTestAll(sx,sy){var wo=s2w(sx,sy),tol=Math.max(1.5,30/TK.zoom);for(var i=0;i<TK.walls.length;i++){var w=TK.walls[i];var dx=w.x2-w.x1,dy=w.y2-w.y1,l2=dx*dx+dy*dy;if(!l2)continue;var t=Math.max(0,Math.min(1,((wo.x-w.x1)*dx+(wo.y-w.y1)*dy)/l2));if(Math.hypot(wo.x-w.x1-t*dx,wo.y-w.y1-t*dy)<tol)return{type:'wall',wallId:w.id,t:t};}for(var j=0;j<TK.rooms.length;j++){var r=TK.rooms[j];var edges=[{edge:'top',x1:r.x,y1:r.y,x2:r.x+r.w,y2:r.y},{edge:'right',x1:r.x+r.w,y1:r.y,x2:r.x+r.w,y2:r.y+r.h},{edge:'bottom',x1:r.x,y1:r.y+r.h,x2:r.x+r.w,y2:r.y+r.h},{edge:'left',x1:r.x,y1:r.y,x2:r.x,y2:r.y+r.h}];for(var k=0;k<edges.length;k++){var e=edges[k];var dx2=e.x2-e.x1,dy2=e.y2-e.y1,l22=dx2*dx2+dy2*dy2;if(!l22)continue;var t2=Math.max(0,Math.min(1,((wo.x-e.x1)*dx2+(wo.y-e.y1)*dy2)/l22));if(Math.hypot(wo.x-e.x1-t2*dx2,wo.y-e.y1-t2*dy2)<tol)return{type:'room',roomId:r.id,edge:e.edge,t:t2};}}return null;}

// ── MOUSE INTERACTION ─────────────────────────────────────────────────────────
var _state={};
cv.addEventListener('mousedown',function(e){
  if(e.altKey||e.button===1){_state.pan={sx:e.offsetX,sy:e.offsetY,px:TK.panX,py:TK.panY};return;}
  if(TK.currentTool==='door'||TK.currentTool==='window'){_state.placeStart={x:e.offsetX,y:e.offsetY};return;}
  // Resize handles (highest priority)
  if(TK.selectedId&&TK.selectedType==='room'){var r=TK.rooms.find(function(x){return x.id===TK.selectedId;});if(r){var h=getResHandle(r,e.offsetX,e.offsetY);if(h){_state.resize={h:h,startX:e.offsetX,startY:e.offsetY,orig:JSON.parse(JSON.stringify(r))};return;}}}
  if(TK.selectedId&&TK.selectedType==='wall'){var w=TK.walls.find(function(x){return x.id===TK.selectedId;});if(w){var wh=getWallHandle(w,e.offsetX,e.offsetY);if(wh){_state.wallEnd={end:wh,wallId:w.id};return;}}}
  // Hit test for select/move
  var wo=s2w(e.offsetX,e.offsetY),hit=null;
  for(var i=0;i<TK.rooms.length;i++){var r=TK.rooms[i];if(wo.x>=r.x&&wo.x<=r.x+r.w&&wo.y>=r.y&&wo.y<=r.y+r.h){hit={id:r.id,type:'room'};break;}}
  if(!hit)for(var j=0;j<TK.walls.length;j++){var w2=TK.walls[j];var dx=w2.x2-w2.x1,dy=w2.y2-w2.y1,l2=dx*dx+dy*dy;if(!l2)continue;var t=Math.max(0,Math.min(1,((wo.x-w2.x1)*dx+(wo.y-w2.y1)*dy)/l2));if(Math.hypot(wo.x-w2.x1-t*dx,wo.y-w2.y1-t*dy)<w2.thickness*TK.scale*2){hit={id:w2.id,type:'wall'};break;}}
  if(hit&&hit.id===TK.selectedId){
    // Start move
    if(hit.type==='room'){var r2=TK.rooms.find(function(x){return x.id===hit.id;});_state.move={type:'room',id:hit.id,sx:e.offsetX,sy:e.offsetY,ox:r2.x,oy:r2.y};}
    else{var w3=TK.walls.find(function(x){return x.id===hit.id;});_state.move={type:'wall',id:hit.id,sx:e.offsetX,sy:e.offsetY,ox1:w3.x1,oy1:w3.y1,ox2:w3.x2,oy2:w3.y2};}
    return;
  }
  // Select or deselect
  TK.selectedId=hit?hit.id:null;TK.selectedType=hit?hit.type:null;
  updateSidebar();updateWallList();redraw();
  if(TK.currentTool==='draw'&&!hit){var sn=snap(e.offsetX,e.offsetY,e.shiftKey);_state.draw={start:sn,active:true};}
  else if(TK.currentTool==='wall'&&!hit){var sn2=snap(e.offsetX,e.offsetY,e.shiftKey);_state.wallDraw={start:sn2,active:true};}
});
cv.addEventListener('mousemove',function(e){
  var ci=document.getElementById('coInfo');if(ci){var wo2=s2w(e.offsetX,e.offsetY);ci.textContent='X: '+(wo2.x/TK.scale).toFixed(2)+'m  Y: '+(wo2.y/TK.scale).toFixed(2)+'m';}
  if(_state.pan){TK.panX=_state.pan.px+(e.offsetX-_state.pan.sx);TK.panY=_state.pan.py+(e.offsetY-_state.pan.sy);redraw();return;}
  if(_state.resize){var dx=(e.offsetX-_state.resize.startX)/TK.zoom,dy=(e.offsetY-_state.resize.startY)/TK.zoom,r=TK.rooms.find(function(x){return x.id===TK.selectedId;}),o=_state.resize.orig,c=_state.resize.h.c;if(r){if(c.includes('e'))r.w=Math.max(50,o.w+dx);if(c.includes('s'))r.h=Math.max(50,o.h+dy);if(c.includes('w')){r.x=o.x+dx;r.w=Math.max(50,o.w-dx);}if(c.includes('n')){r.y=o.y+dy;r.h=Math.max(50,o.h-dy);}}redraw();return;}
  if(_state.wallEnd){var sn3=snap(e.offsetX,e.offsetY,e.shiftKey),w4=TK.walls.find(function(x){return x.id===_state.wallEnd.wallId;});if(w4){if(_state.wallEnd.end==='start'){w4.x1=sn3.x;w4.y1=sn3.y;}else{w4.x2=sn3.x;w4.y2=sn3.y;}}redraw();return;}
  if(_state.move){var ddx=(e.offsetX-_state.move.sx)/TK.zoom,ddy=(e.offsetY-_state.move.sy)/TK.zoom;if(_state.move.type==='room'){var rm=TK.rooms.find(function(x){return x.id===_state.move.id;});if(rm){rm.x=_state.move.ox+ddx;rm.y=_state.move.oy+ddy;}}else{var wm=TK.walls.find(function(x){return x.id===_state.move.id;});if(wm){wm.x1=_state.move.ox1+ddx;wm.y1=_state.move.oy1+ddy;wm.x2=_state.move.ox2+ddx;wm.y2=_state.move.oy2+ddy;}}redraw();return;}
  if(_state.draw&&_state.draw.active){var sn4=snap(e.offsetX,e.offsetY,e.shiftKey);window._prev={type:'room',x:Math.min(_state.draw.start.x,sn4.x),y:Math.min(_state.draw.start.y,sn4.y),w:Math.abs(sn4.x-_state.draw.start.x),h:Math.abs(sn4.y-_state.draw.start.y)};redraw();return;}
  if(_state.wallDraw&&_state.wallDraw.active){var sn5=snap(e.offsetX,e.offsetY,e.shiftKey);window._prev={type:'wall',x1:_state.wallDraw.start.x,y1:_state.wallDraw.start.y,x2:sn5.x,y2:sn5.y,thickness:TK.wallThickness};redraw();return;}
  window._snap=null;
});
cv.addEventListener('mouseup',function(e){
  if(_state.pan){_state.pan=null;return;}
  if(_state.resize){saveSnapshot();_state.resize=null;return;}
  if(_state.wallEnd){saveSnapshot();_state.wallEnd=null;return;}
  if(_state.move){saveSnapshot();_state.move=null;updateSidebar();updateWallList();redraw();return;}
  if(_state.draw&&_state.draw.active){
    _state.draw.active=false;window._prev=null;
    var sn6=snap(e.offsetX,e.offsetY,e.shiftKey),w5=Math.abs(sn6.x-_state.draw.start.x),h5=Math.abs(sn6.y-_state.draw.start.y);
    if(w5>50&&h5>50){saveSnapshot();var tp2=TK_ROOM_TYPES[7];TK.rooms.push({id:TK.nextId++,name:'Rom '+TK.nextId,type:'anna',x:Math.min(_state.draw.start.x,sn6.x),y:Math.min(_state.draw.start.y,sn6.y),w:w5,h:h5,color:tp2.color,wallThickness:TK.wallThickness});updateSidebar();}
    _state.draw=null;window._snap=null;redraw();return;
  }
  if(_state.wallDraw&&_state.wallDraw.active){
    _state.wallDraw.active=false;window._prev=null;
    var sn7=snap(e.offsetX,e.offsetY,e.shiftKey),ddx2=sn7.x-_state.wallDraw.start.x,ddy2=sn7.y-_state.wallDraw.start.y;
    if(Math.hypot(ddx2,ddy2)>20){saveSnapshot();TK.walls.push({id:TK.nextId++,x1:_state.wallDraw.start.x,y1:_state.wallDraw.start.y,x2:sn7.x,y2:sn7.y,thickness:TK.wallThickness});updateWallList();}
    _state.wallDraw=null;window._snap=null;redraw();return;
  }
  if((TK.currentTool==='door'||TK.currentTool==='window')&&_state.placeStart){
    if(Math.hypot(e.offsetX-_state.placeStart.x,e.offsetY-_state.placeStart.y)<10){
      var hit2=hitTestAll(e.offsetX,e.offsetY);
      if(!hit2){setStatus('Ingen vegg — klikk nærmare');_state.placeStart=null;return;}
      saveSnapshot();
      var preset=TK.pendingElement&&TK.pendingElement.preset?TK.pendingElement.preset:{id:'d80',name:'Dør 80cm',width:0.8};
      var newEl={id:TK.nextId++,name:preset.name,width:preset.width,t:hit2.t,swingDir:0};
      if(hit2.type==='wall')newEl.wallId=hit2.wallId;else{newEl.roomId=hit2.roomId;newEl.edge=hit2.edge;}
      if(TK.currentTool==='window')TK.windows.push(newEl);else TK.doors.push(newEl);
      if(TK.pendingElement)TK.pendingElement={type:TK.currentTool,preset:preset};
      updateElList();redraw();setStatus('Plassert! Klikk for fleire.');
    }
    _state.placeStart=null;
  }
});
cv.addEventListener('dblclick',function(e){
  var wo3=s2w(e.offsetX,e.offsetY),r=TK.rooms.find(function(r){return wo3.x>=r.x&&wo3.x<=r.x+r.w&&wo3.y>=r.y&&wo3.y<=r.y+r.h;});
  if(!r)return;
  var ov=document.createElement('div');ov.className='mo';
  var opts=TK_ROOM_TYPES.map(function(t){return'<option value="'+t.id+'"'+(t.id===r.type?' selected':'')+'>'+t.name+'</option>';}).join('');
  ov.innerHTML='<div class="md"><h2>Endre rom</h2><label>Namn</label><input id="_rn4" value="'+r.name+'"><label>Type</label><select id="_rt4">'+opts+'</select><div class="mdb"><button onclick="this.closest(\'.mo\').remove()">Avbryt</button><button onclick="var tp3=TK_ROOM_TYPES.find(function(t){return t.id===document.getElementById(\'_rt4\').value;})||TK_ROOM_TYPES[7];saveSnapshot();r.name=document.getElementById(\'_rn4\').value||r.name;r.type=tp3.id;r.color=tp3.color;this.closest(\'.mo\').remove();updateSidebar();redraw();" style="background:var(--acc);border-color:var(--acc)">Lagre</button></div></div>';
  document.body.appendChild(ov);ov.onclick=function(e){if(e.target===ov)ov.remove();};
});
document.addEventListener('keydown',function(e){
  if(e.ctrlKey&&e.key==='z'){e.preventDefault();undo();}
  else if(e.ctrlKey&&e.key==='y'){e.preventDefault();redo();}
  else if(e.ctrlKey&&e.key==='c'){var r=TK.rooms.find(function(x){return x.id===TK.selectedId;});if(r)TK.clipboard=JSON.parse(JSON.stringify(r));}
  else if(e.ctrlKey&&e.key==='v'){if(TK.clipboard){saveSnapshot();var c=JSON.parse(JSON.stringify(TK.clipboard));c.id=TK.nextId++;c.x+=TK.scale*0.5;c.y+=TK.scale*0.5;TK.rooms.push(c);updateSidebar();redraw();}}
  else if(e.key==='Delete'){if(TK.selectedId){saveSnapshot();cascadeDelete(TK.selectedId,TK.selectedType);}}
  else if(e.key==='d'||e.key==='D'){promptRoomDims();}
  else if(e.key==='Escape'){TK.currentTool='draw';setTool('draw');TK.pendingElement=null;window._prev=null;window._snap=null;TK.selectedId=null;updateSidebar();redraw();}
});

// ── EXPORT / SAVE ─────────────────────────────────────────────────────────────
function doPNG(){
  if(!TK.rooms.length&&!TK.walls.length){showToast('Ingen element!','error');return;}
  var prev=TK.selectedId;TK.selectedId=null;redraw();
  setTimeout(function(){var a=document.createElement('a');a.href=cv.toDataURL('image/png');a.download='tanketekt.png';document.body.appendChild(a);a.click();document.body.removeChild(a);TK.selectedId=prev;redraw();showToast('PNG eksportert! 🖼️');},120);
}
function doPDFDialog(){
  if(!TK.rooms.length&&!TK.walls.length){showToast('Ingen element!','error');return;}
  if(!window.jspdf){showToast('jsPDF manglar','error');return;}
  var ov=document.createElement('div');ov.className='mo';
  ov.innerHTML='<div class="md"><h2>PDF-eksport</h2><label style="display:flex;align-items:center;gap:8px;margin:8px 0"><input type="checkbox" id="_pt" checked> Inkluder arealtabell</label><label>Teikna av (valg.)</label><input id="_pa" placeholder="Namn..."><div class="mdb"><button onclick="this.closest(\'.mo\').remove()">Avbryt</button><button onclick="doPDF(document.getElementById(\'_pt\').checked,document.getElementById(\'_pa\').value.trim());this.closest(\'.mo\').remove();" style="background:var(--acc);border-color:var(--acc)">Eksporter</button></div></div>';
  document.body.appendChild(ov);
}
function doPDF(inclTable,drawnBy){
  var doc=new window.jspdf.jsPDF({orientation:'landscape',unit:'mm',format:'a4'});
  var W=297,H=210,M=15;
  var minX=1e9,minY=1e9,maxX=-1e9,maxY=-1e9;
  TK.rooms.forEach(function(r){minX=Math.min(minX,r.x);minY=Math.min(minY,r.y);maxX=Math.max(maxX,r.x+r.w);maxY=Math.max(maxY,r.y+r.h);});
  TK.walls.forEach(function(w){minX=Math.min(minX,w.x1,w.x2);minY=Math.min(minY,w.y1,w.y2);maxX=Math.max(maxX,w.x1,w.x2);maxY=Math.max(maxY,w.y1,w.y2);});
  var bw=maxX-minX,bh=maxY-minY,dW=inclTable?192:262,dH=168;
  var sf=Math.min(dW/(bw/TK.scale*1000),dH/(bh/TK.scale*1000))*0.88;
  function mm(px){return px/TK.scale*1000*sf;}
  var ox=M+(dW-bw/TK.scale*1000*sf)/2-mm(minX),oy=22+(dH-bh/TK.scale*1000*sf)/2-mm(minY);
  doc.setFont('helvetica','bold');doc.setFontSize(12);doc.setTextColor(0);doc.text('TankeTekt',M,11);
  doc.setFont('helvetica','normal');doc.setFontSize(8);doc.setTextColor(100);
  doc.text(new Date().toLocaleDateString('no'),W-M,11,{align:'right'});
  if(drawnBy)doc.text('Teikna av: '+drawnBy,W-M,16,{align:'right'});
  doc.setDrawColor(200);doc.setLineWidth(0.3);doc.line(M,19,W-M,19);
  TK.rooms.forEach(function(r){
    var xp=ox+mm(r.x),yp=oy+mm(r.y),wp=mm(r.w),hp=mm(r.h);
    var wl=Math.max(0.4,mm((r.wallThickness||TK.wallThickness||0.1)*TK.scale)*0.6);
    doc.setFillColor(245,245,245);doc.rect(xp,yp,wp,hp,'F');
    doc.setDrawColor(45,45,45);doc.setLineWidth(wl);doc.rect(xp,yp,wp,hp,'S');
    doc.setFont('helvetica','bold');doc.setFontSize(Math.max(5,Math.min(8,wp*0.4)));doc.setTextColor(30);doc.text(r.name,xp+wp/2,yp+hp/2-1,{align:'center'});
    doc.setFont('helvetica','normal');doc.setFontSize(5);doc.setTextColor(100);doc.text((r.w*r.h/TK.scale/TK.scale).toFixed(2)+' m²',xp+wp/2,yp+hp/2+3,{align:'center'});
  });
  TK.walls.forEach(function(w){doc.setDrawColor(45,45,45);doc.setLineWidth(Math.max(0.4,mm(w.thickness*TK.scale)*0.5));doc.line(ox+mm(w.x1),oy+mm(w.y1),ox+mm(w.x2),oy+mm(w.y2));});
  doc.setFontSize(6);doc.setTextColor(150);doc.text('TankeTekt',W/2,H-3,{align:'center'});
  if(inclTable){
    var tx=M+dW+3,ty=22,trh=5;
    doc.setFillColor(40,40,40);doc.rect(tx,ty,55,6.5,'F');doc.setFont('helvetica','bold');doc.setFontSize(7);doc.setTextColor(255);doc.text('ROM',tx+2,ty+4.5);doc.text('m²',tx+48,ty+4.5,{align:'right'});
    ty+=6.5;var tot=0;
    TK.rooms.forEach(function(r,i){var a=parseFloat((r.w*r.h/TK.scale/TK.scale).toFixed(2));tot+=a;if(i%2===0){doc.setFillColor(248,248,248);doc.rect(tx,ty,55,trh,'F');}doc.setFont('helvetica','normal');doc.setFontSize(6);doc.setTextColor(0);var nm=r.name.length>14?r.name.slice(0,13)+'…':r.name;doc.text(nm,tx+2,ty+3.5);doc.text(a.toFixed(2),tx+48,ty+3.5,{align:'right'});ty+=trh;});
    doc.setFillColor(200,200,200);doc.rect(tx,ty,55,6,'F');doc.setFont('helvetica','bold');doc.setFontSize(7);doc.setTextColor(0);doc.text('TOTAL',tx+2,ty+4.3);doc.text(tot.toFixed(2),tx+48,ty+4.3,{align:'right'});
    doc.setDrawColor(160);doc.setLineWidth(0.3);doc.rect(tx,22,55,ty+6-22,'S');
  }
  doc.save('tanketekt.pdf');showToast('PDF eksportert! 📄');
}
function doSave(){
  var d=JSON.stringify({version:'v.demo-002',rooms:TK.rooms,walls:TK.walls,doors:TK.doors,windows:TK.windows,scale:TK.scale},null,2);
  var a=document.createElement('a');a.href='data:application/json,'+encodeURIComponent(d);a.download='tanketekt.json';document.body.appendChild(a);a.click();document.body.removeChild(a);showToast('Lagra! 💾');
}
function doLoad(file){if(!file)return;var reader=new FileReader();reader.onload=function(e){try{var d=JSON.parse(e.target.result);if(!Array.isArray(d.rooms))throw new Error('Ugyldig');saveSnapshot();TK.rooms=d.rooms||[];TK.walls=d.walls||[];TK.doors=d.doors||[];TK.windows=d.windows||[];TK.scale=d.scale||100;updateSidebar();updateWallList();updateElList();redraw();showToast('Lasta inn!');}catch(err){showToast('Feil: '+err.message,'error');}};reader.readAsText(file);}
function autoSave(){try{localStorage.setItem('tanketekt_autosave',JSON.stringify({rooms:TK.rooms,walls:TK.walls,doors:TK.doors,windows:TK.windows,scale:TK.scale,savedAt:Date.now()}));}catch(e){}}
setInterval(autoSave,30000);
(function(){try{var d=localStorage.getItem('tanketekt_autosave');if(!d)return;var s=JSON.parse(d);var age=Math.round((Date.now()-s.savedAt)/60000);if((s.rooms&&s.rooms.length)||(s.walls&&s.walls.length)){if(confirm('Gjenopprette sist lagra økt ('+age+' min sidan)?')){TK.rooms=s.rooms||[];TK.walls=s.walls||[];TK.doors=s.doors||[];TK.windows=s.windows||[];TK.scale=s.scale||100;updateSidebar();updateWallList();updateElList();redraw();}}}catch(e){}})();

// ── MODALS ────────────────────────────────────────────────────────────────────
function placeDoor(){
  var P=window.DOOR_PRESETS||[{id:'d70',name:'Dør 70cm',width:0.7},{id:'d80',name:'Dør 80cm',width:0.8},{id:'d90',name:'Dør 90cm',width:0.9},{id:'d120',name:'Dør 120cm',width:1.2}];
  var ov=document.createElement('div');ov.className='mo';
  ov.innerHTML='<div class="md"><h2>Legg til dør</h2><label>Type</label><select id="_dsel">'+P.map(function(p){return'<option value="'+p.id+'">'+p.name+'</option>';}).join('')+'</select><div class="mdb"><button onclick="this.closest(\'.mo\').remove()">Avbryt</button><button id="_dok" style="background:var(--acc);border-color:var(--acc)">Vel plassering</button></div></div>';
  document.body.appendChild(ov);
  document.getElementById('_dok').onclick=function(){var sel=document.getElementById('_dsel').value;var preset=P.find(function(p){return p.id===sel;})||P[1];TK.pendingElement={type:'door',preset:preset};TK.currentTool='door';ov.remove();setStatus('Klikk på vegg for å plassere dør');};
}
function placeWindow(){
  var P=window.WINDOW_PRESETS||[{id:'v60',name:'Vindauge 60cm',width:0.6},{id:'v90',name:'Vindauge 90cm',width:0.9},{id:'v120',name:'Vindauge 120cm',width:1.2},{id:'v150',name:'Vindauge 150cm',width:1.5}];
  var ov=document.createElement('div');ov.className='mo';
  ov.innerHTML='<div class="md"><h2>Legg til vindauge</h2><label>Type</label><select id="_wsel">'+P.map(function(p){return'<option value="'+p.id+'">'+p.name+'</option>';}).join('')+'</select><div class="mdb"><button onclick="this.closest(\'.mo\').remove()">Avbryt</button><button id="_wok" style="background:var(--acc);border-color:var(--acc)">Vel plassering</button></div></div>';
  document.body.appendChild(ov);
  document.getElementById('_wok').onclick=function(){var sel=document.getElementById('_wsel').value;var preset=P.find(function(p){return p.id===sel;})||P[1];TK.pendingElement={type:'window',preset:preset};TK.currentTool='window';ov.remove();setStatus('Klikk på vegg for å plassere vindauge');};
}
function promptRoomDims(){
  var ov=document.createElement('div');ov.className='mo';
  var opts=TK_ROOM_TYPES.map(function(t){return'<option value="'+t.id+'">'+t.name+'</option>';}).join('');
  ov.innerHTML='<div class="md"><h2>Nytt rom med mål</h2><label>Lengd (m)</label><input id="_rl5" type="number" value="4.0" step="0.05" min="0.5"><label>Breidd (m)</label><input id="_rb5" type="number" value="3.0" step="0.05" min="0.5"><label>Type</label><select id="_rt5">'+opts+'</select><div class="mdb"><button onclick="this.closest(\'.mo\').remove()">Avbryt</button><button id="_rok" style="background:var(--acc);border-color:var(--acc)">Plasser</button></div></div>';
  document.body.appendChild(ov);
  document.getElementById('_rok').onclick=function(){
    var l=parseFloat(document.getElementById('_rl5').value)||4,b=parseFloat(document.getElementById('_rb5').value)||3;
    var tid=document.getElementById('_rt5').value,tp=TK_ROOM_TYPES.find(function(t){return t.id===tid;})||TK_ROOM_TYPES[7];
    var wo4=s2w(cv.width/2,cv.height/2);saveSnapshot();var rid=TK.nextId++;
    TK.rooms.push({id:rid,name:tp.name+' '+rid,type:tid,x:wo4.x-l*TK.scale/2,y:wo4.y-b*TK.scale/2,w:l*TK.scale,h:b*TK.scale,color:tp.color,wallThickness:TK.wallThickness});
    TK.selectedId=rid;TK.selectedType='room';ov.remove();updateSidebar();redraw();setStatus('Plassert — dra for å flytte');
  };
}
function showHelp(){
  var ov=document.createElement('div');ov.className='mo';
  ov.innerHTML='<div class="md" style="max-width:460px"><h2 style="margin-bottom:12px">Hjelp & Hurtigtastar</h2><table style="width:100%;font-size:12px;border-collapse:collapse"><tr><th colspan="2" style="text-align:left;color:var(--mu);padding:8px 0 4px;font-size:10px;text-transform:uppercase;font-weight:normal">Teikneverkty</th></tr><tr><td style="padding:3px 10px 3px 0;color:var(--mu)">Teikn rom</td><td>Klikk + dra</td></tr><tr><td style="padding:3px 10px 3px 0;color:var(--mu)">✛ Rom med mål</td><td>Mål-dialog → dra til posisjon</td></tr><tr><td style="padding:3px 10px 3px 0;color:var(--mu)">Teikn vegg</td><td>Klikk start → dra → slipp</td></tr><tr><td style="padding:3px 10px 3px 0;color:var(--mu)">Dør / Vindauge</td><td>Klikk på vegg eller romkant</td></tr><tr><td style="padding:3px 10px 3px 0;color:var(--mu)">Snapping</td><td>Auto · Shift = fri</td></tr><tr><th colspan="2" style="text-align:left;color:var(--mu);padding:8px 0 4px;font-size:10px;text-transform:uppercase;font-weight:normal">Redigering</th></tr><tr><td style="padding:3px 10px 3px 0;color:var(--mu)">Flytt element</td><td>Vel → klikk+dra</td></tr><tr><td style="padding:3px 10px 3px 0;color:var(--mu)">Endre storleik rom</td><td>Vel → dra handtak</td></tr><tr><td style="padding:3px 10px 3px 0;color:var(--mu)">Snu dør</td><td>Vel dør → ↖↗↙↘ i høgre panel</td></tr><tr><td style="padding:3px 10px 3px 0;color:var(--mu)">Endre romtype/namn</td><td>Dobbelklikk</td></tr><tr><th colspan="2" style="text-align:left;color:var(--mu);padding:8px 0 4px;font-size:10px;text-transform:uppercase;font-weight:normal">Hurtigtastar</th></tr><tr><td style="padding:3px 10px 3px 0;color:var(--mu);font-family:monospace">Ctrl+Z / Y</td><td>Angre / Gjer om</td></tr><tr><td style="padding:3px 10px 3px 0;color:var(--mu);font-family:monospace">Delete</td><td>Slett valt element</td></tr><tr><td style="padding:3px 10px 3px 0;color:var(--mu);font-family:monospace">D</td><td>Nytt rom med mål</td></tr><tr><td style="padding:3px 10px 3px 0;color:var(--mu);font-family:monospace">Escape</td><td>Avbryt / fjern val</td></tr><tr><td style="padding:3px 10px 3px 0;color:var(--mu);font-family:monospace">Scroll</td><td>Zoom inn/ut</td></tr><tr><td style="padding:3px 10px 3px 0;color:var(--mu);font-family:monospace">Alt+drag</td><td>Panorér</td></tr></table><div class="mdb" style="margin-top:14px"><button onclick="this.closest(\'.mo\').remove()" style="background:var(--acc);border-color:var(--acc)">Lukk</button></div></div>';
  document.body.appendChild(ov);ov.onclick=function(e){if(e.target===ov)ov.remove();};
}
</script>
</body>
</html>`;

fs.writeFileSync(path.join(DIR,"index.html"), html, "utf8");
console.log("✅ index.html completely rewritten as single self-contained file");
console.log("   "+html.length+" chars, zero external JS dependencies");
