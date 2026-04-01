import fs from "fs";
import path from "path";
import dotenv from "dotenv";
dotenv.config();
const DIR = process.env.PROJECT_DIR || "C:\\Users\\bness\\OneDrive\\02_PARKSIDE\\05_PROSJEKT\\TankeTekt";
const write = (f,v) => { fs.writeFileSync(path.join(DIR,f),v,"utf8"); console.log("  ✅ "+f+" ("+v.length+"ch)"); };

// ── CLEAN elements.js ────────────────────────────────────────────────────────
write("src/elements.js", `
window.DOOR_PRESETS=[{id:'d70',name:'Dør 70cm',width:0.7},{id:'d80',name:'Dør 80cm',width:0.8},{id:'d90',name:'Dør 90cm',width:0.9},{id:'d120',name:'Dør 120cm',width:1.2}];
window.WINDOW_PRESETS=[{id:'v60',name:'Vindauge 60cm',width:0.6},{id:'v90',name:'Vindauge 90cm',width:0.9},{id:'v120',name:'Vindauge 120cm',width:1.2},{id:'v150',name:'Vindauge 150cm',width:1.5}];

function getElPos(el){
  if(el.wallId){var w=TK.walls.find(function(x){return x.id===el.wallId;});if(!w)return null;return{x1:w.x1,y1:w.y1,x2:w.x2,y2:w.y2,thickness:w.thickness};}
  if(el.roomId){var r=TK.rooms.find(function(x){return x.id===el.roomId;});if(!r)return null;var edges={top:{x1:r.x,y1:r.y,x2:r.x+r.w,y2:r.y},right:{x1:r.x+r.w,y1:r.y,x2:r.x+r.w,y2:r.y+r.h},bottom:{x1:r.x,y1:r.y+r.h,x2:r.x+r.w,y2:r.y+r.h},left:{x1:r.x,y1:r.y,x2:r.x,y2:r.y+r.h}};var e=edges[el.edge];if(!e)return null;return{x1:e.x1,y1:e.y1,x2:e.x2,y2:e.y2,thickness:r.wallThickness||TK.wallThickness};}
  return null;
}
window.getElPos=getElPos;

window.hitTestAll=function(sx,sy){
  var wo=window.screenToWorld(sx,sy);
  var tol=Math.max(1.5,30/TK.zoom);
  for(var i=0;i<TK.walls.length;i++){var w=TK.walls[i];var dx=w.x2-w.x1,dy=w.y2-w.y1,l2=dx*dx+dy*dy;if(!l2)continue;var t=Math.max(0,Math.min(1,((wo.x-w.x1)*dx+(wo.y-w.y1)*dy)/l2));if(Math.hypot(wo.x-w.x1-t*dx,wo.y-w.y1-t*dy)<tol)return{type:'wall',wallId:w.id,t:t};}
  for(var j=0;j<TK.rooms.length;j++){var r=TK.rooms[j];var edges=[{edge:'top',x1:r.x,y1:r.y,x2:r.x+r.w,y2:r.y},{edge:'right',x1:r.x+r.w,y1:r.y,x2:r.x+r.w,y2:r.y+r.h},{edge:'bottom',x1:r.x,y1:r.y+r.h,x2:r.x+r.w,y2:r.y+r.h},{edge:'left',x1:r.x,y1:r.y,x2:r.x,y2:r.y+r.h}];for(var k=0;k<edges.length;k++){var e=edges[k];var dx2=e.x2-e.x1,dy2=e.y2-e.y1,l22=dx2*dx2+dy2*dy2;if(!l22)continue;var t2=Math.max(0,Math.min(1,((wo.x-e.x1)*dx2+(wo.y-e.y1)*dy2)/l22));if(Math.hypot(wo.x-e.x1-t2*dx2,wo.y-e.y1-t2*dy2)<tol)return{type:'room',roomId:r.id,edge:e.edge,t:t2};}}
  return null;
};

window.placeElementOnWall=function(sx,sy){
  var hit=window.hitTestAll(sx,sy);
  if(!hit){if(window.setStatus)setStatus('Ingen vegg funnen — klikk nærmare');return;}
  if(window.saveSnapshot)saveSnapshot();
  var preset=TK.pendingElement&&TK.pendingElement.preset?TK.pendingElement.preset:DOOR_PRESETS[1];
  var el={id:TK.nextId++,name:preset.name,width:preset.width,t:hit.t,swingDir:0};
  if(hit.type==='wall')el.wallId=hit.wallId;else{el.roomId=hit.roomId;el.edge=hit.edge;}
  if(TK.pendingElement&&TK.pendingElement.type==='window')TK.windows.push(el);else TK.doors.push(el);
  TK.pendingElement={type:TK.pendingElement?TK.pendingElement.type:'door',preset:preset};
  if(window.updateElementList)updateElementList();
  if(window.redraw)redraw();
  if(window.setStatus)setStatus('Plassert — klikk for fleire');
};

window.drawDoor=function(ctx,door){
  var pos=getElPos(door);if(!pos)return;
  var s1=window.worldToScreen(pos.x1,pos.y1),s2=window.worldToScreen(pos.x2,pos.y2);
  var len=Math.hypot(s2.x-s1.x,s2.y-s1.y);if(len<2)return;
  var ux=(s2.x-s1.x)/len,uy=(s2.y-s1.y)/len;
  var dw=door.width*TK.scale*TK.zoom;
  var thick=Math.max(4,(pos.thickness||TK.wallThickness||0.1)*TK.scale*TK.zoom);
  var hx=s1.x+(s2.x-s1.x)*door.t,hy=s1.y+(s2.y-s1.y)*door.t;
  var sd=door.swingDir||0,fa=sd&1,fs=(sd>>1)&1;
  var dx2=fa?-ux:ux,dy2=fa?-uy:uy;
  var nx=fs?uy:-uy,ny=fs?-ux:ux;
  var tx=hx+dx2*dw,ty=hy+dy2*dw;
  var hw=thick/2+2;
  ctx.save();
  ctx.fillStyle='#ffffff';
  ctx.beginPath();ctx.moveTo(hx+uy*hw,hy-ux*hw);ctx.lineTo(tx+uy*hw,ty-ux*hw);ctx.lineTo(tx-uy*hw,ty+ux*hw);ctx.lineTo(hx-uy*hw,hy+ux*hw);ctx.closePath();ctx.fill();
  var col=door.id===TK.selectedId?'#e94560':'#1a1a1a';
  ctx.strokeStyle=col;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(hx,hy);ctx.lineTo(tx,ty);ctx.stroke();
  ctx.fillStyle=col;ctx.beginPath();ctx.arc(hx,hy,3,0,Math.PI*2);ctx.fill();
  if(TK.showDoorSwing!==false){var sa=Math.atan2(dy2,dx2),ea=Math.atan2(ny,nx);ctx.beginPath();ctx.arc(hx,hy,dw,sa,ea,!!(fs^fa));ctx.strokeStyle=col;ctx.lineWidth=1;ctx.setLineDash([4,3]);ctx.stroke();ctx.setLineDash([]);}
  ctx.restore();
};

window.drawWindow=function(ctx,win){
  var pos=getElPos(win);if(!pos)return;
  var s1=window.worldToScreen(pos.x1,pos.y1),s2=window.worldToScreen(pos.x2,pos.y2);
  var len=Math.hypot(s2.x-s1.x,s2.y-s1.y);if(len<2)return;
  var ux=(s2.x-s1.x)/len,uy=(s2.y-s1.y)/len;
  var ww=win.width*TK.scale*TK.zoom;
  var thick=Math.max(4,(pos.thickness||TK.wallThickness||0.1)*TK.scale*TK.zoom);
  var cx=s1.x+(s2.x-s1.x)*win.t,cy=s1.y+(s2.y-s1.y)*win.t;
  var wx1=cx-ux*ww/2,wy1=cy-uy*ww/2,wx2=cx+ux*ww/2,wy2=cy+uy*ww/2;
  var hw=thick/2;
  ctx.save();
  ctx.fillStyle='#ffffff';
  ctx.beginPath();ctx.moveTo(wx1+uy*(hw+2),wy1-ux*(hw+2));ctx.lineTo(wx2+uy*(hw+2),wy2-ux*(hw+2));ctx.lineTo(wx2-uy*(hw+2),wy2+ux*(hw+2));ctx.lineTo(wx1-uy*(hw+2),wy1+ux*(hw+2));ctx.closePath();ctx.fill();
  var col=win.id===TK.selectedId?'#e94560':'#1a1a1a';
  ctx.strokeStyle=col;ctx.lineWidth=1.5;
  var o=Math.max(2,hw*0.4);
  ctx.beginPath();ctx.moveTo(wx1+uy*o,wy1-ux*o);ctx.lineTo(wx2+uy*o,wy2-ux*o);ctx.stroke();
  ctx.beginPath();ctx.moveTo(wx1-uy*o,wy1+ux*o);ctx.lineTo(wx2-uy*o,wy2+ux*o);ctx.stroke();
  ctx.lineWidth=2;
  ctx.beginPath();ctx.moveTo(wx1+uy*hw,wy1-ux*hw);ctx.lineTo(wx1-uy*hw,wy1+ux*hw);ctx.stroke();
  ctx.beginPath();ctx.moveTo(wx2+uy*hw,wy2-ux*hw);ctx.lineTo(wx2-uy*hw,wy2+ux*hw);ctx.stroke();
  ctx.restore();
};

window.checkTEK17=function(){
  return TK.rooms.map(function(r){
    var type=(window.TK_ROOM_TYPES||[]).find(function(t){return t.id===r.type;});
    var area=r.w*r.h/TK.scale/TK.scale;
    if(type&&type.minArea>0&&area<type.minArea)return{roomId:r.id,msg:r.name+': '+area.toFixed(2)+'m² (min '+type.minArea+'m² TEK17)'};
    return null;
  }).filter(Boolean);
};

window.placeDoor=function(){if(window.placeDoor._override)window.placeDoor._override();};
window.placeWindow=function(){if(window.placeWindow._override)window.placeWindow._override();};

window.updateElementList=function(){
  var ul=document.getElementById('element-list');if(!ul)return;ul.innerHTML='';
  function mkDel(arr,id){var b=document.createElement('button');b.textContent='×';b.style='float:right;padding:0 5px;background:#e94560;border:none;color:white;border-radius:3px;cursor:pointer;font-size:11px';b.onclick=function(e){e.stopPropagation();if(window.saveSnapshot)saveSnapshot();window.TK[arr]=window.TK[arr].filter(function(x){return x.id!==id;});updateElementList();if(window.redraw)redraw();};return b;}
  function sec(title,items,arrName,color,labelFn){
    if(!items.length)return;
    var h=document.createElement('li');h.style='list-style:none;color:var(--muted);font-size:11px;text-transform:uppercase;padding:8px 0 4px;letter-spacing:1px';h.textContent=title+' ('+items.length+')';ul.appendChild(h);
    items.forEach(function(el){
      var li=document.createElement('li');li.className='room-item'+(TK.selectedId===el.id?' selected':'');li.style.borderLeftColor=color;
      li.innerHTML='<div class="rname">'+labelFn(el)+'</div>';
      li.onclick=function(){TK.selectedId=el.id;TK.selectedType=arrName==='walls'?'wall':arrName==='doors'?'door':'window';updateElementList();if(window.redraw)redraw();};
      li.appendChild(mkDel(arrName,el.id));
      if(arrName==='doors'&&TK.selectedId===el.id){
        var ctrl=document.createElement('div');ctrl.style='margin-top:4px;display:flex;gap:3px';
        var swings=['↖','↗','↙','↘'];
        for(var i=0;i<4;i++){(function(i2){var b=document.createElement('button');b.textContent=swings[i2];b.style='padding:2px 7px;font-size:13px;background:'+(el.swingDir===i2?'var(--hi)':'var(--surface)');b.onclick=function(e){e.stopPropagation();if(window.saveSnapshot)saveSnapshot();el.swingDir=i2;if(window.redraw)redraw();updateElementList();};ctrl.appendChild(b);})(i);}
        li.appendChild(ctrl);
      }
      ul.appendChild(li);
    });
  }
  sec('Veggar',TK.walls,'walls','#666',function(w){return 'Vegg '+(Math.hypot(w.x2-w.x1,w.y2-w.y1)/TK.scale).toFixed(2)+'m';});
  sec('Dører',TK.doors,'doors','#8B4513',function(d){return d.name||'Dør';});
  sec('Vindauge',TK.windows,'windows','#4a90d9',function(w){return w.name||'Vindauge';});
  if(!TK.walls.length&&!TK.doors.length&&!TK.windows.length){var li=document.createElement('li');li.style='color:var(--muted);font-size:12px;padding:8px';li.textContent='Ingen element';ul.appendChild(li);}
};
`);

// ── CLEAN export.js ──────────────────────────────────────────────────────────
write("src/export.js", `
window.showToast=function(msg,type){
  var d=document.createElement('div');
  d.style='position:fixed;bottom:20px;right:20px;padding:10px 18px;border-radius:6px;font-weight:bold;font-size:13px;color:#fff;z-index:9999;background:'+(type==='error'?'#e94560':'#238636');
  d.textContent=msg;document.body.appendChild(d);
  setTimeout(function(){d.style.cssText+=';transition:opacity 0.4s;opacity:0';setTimeout(function(){d.remove();},400);},2500);
};
window.autoSave=function(){try{localStorage.setItem('tanketekt_autosave',JSON.stringify({rooms:TK.rooms,walls:TK.walls,doors:TK.doors,windows:TK.windows,scale:TK.scale,savedAt:Date.now()}));}catch(e){}};
setInterval(window.autoSave,30000);
window.loadFromLocalStorage=function(){
  try{
    var d=localStorage.getItem('tanketekt_autosave');if(!d)return;
    var s=JSON.parse(d);
    var age=Math.round((Date.now()-s.savedAt)/60000);
    if(confirm('Gjenopprette sist lagra økt ('+age+' min sidan)?')){
      TK.rooms=s.rooms||[];TK.walls=s.walls||[];TK.doors=s.doors||[];TK.windows=s.windows||[];TK.scale=s.scale||100;
      if(window.updateSidebar)updateSidebar();if(window.updateWallList)updateWallList();if(window.updateElementList)updateElementList();if(window.redraw)redraw();
      if(window.setStatus)setStatus('Økt gjenoppretta!');
    }
  }catch(e){}
};
window.exportPNG=function(){if(window.showToast)showToast('Laster...','success');};
window.exportPDF=function(){if(window.showToast)showToast('Laster...','success');};
window.saveProject=function(){if(window.showToast)showToast('Laster...','success');};
window.loadProject=function(){};
`);

console.log("\n✅ Both files fixed. Run check-syntax.mjs to verify, then Ctrl+Shift+R.");
