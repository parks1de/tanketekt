import fs from "fs";
import path from "path";
import dotenv from "dotenv";
dotenv.config();
const DIR = process.env.PROJECT_DIR || "C:\\Users\\bness\\OneDrive\\02_PARKSIDE\\05_PROSJEKT\\TankeTekt";

// ── CANVAS.JS ──────────────────────────────────────────────────────────────
const canvasJs = `
(function(){
const cv=document.getElementById('floorplan');
const wrap=cv.parentElement;
const ctx=cv.getContext('2d');

function resize(){cv.width=wrap.offsetWidth||800;cv.height=wrap.offsetHeight||600;redraw();}
new ResizeObserver(resize).observe(wrap);
setTimeout(resize,60);

window.worldToScreen=(wx,wy)=>({x:wx*TK.zoom+TK.panX,y:wy*TK.zoom+TK.panY});
window.screenToWorld=(sx,sy)=>({x:(sx-TK.panX)/TK.zoom,y:(sy-TK.panY)/TK.zoom});

function drawArrow(x1,y1,x2,y2,lbl){
  ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();
  const dx=x2-x1,dy=y2-y1,len=Math.sqrt(dx*dx+dy*dy);if(len<2)return;
  const ux=dx/len,uy=dy/len;
  [[x1,y1,1],[x2,y2,-1]].forEach(([x,y,d])=>{
    ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+d*(ux*6-uy*3),y+d*(uy*6+ux*3));ctx.lineTo(x+d*(ux*6+uy*3),y+d*(uy*6-ux*3));ctx.closePath();ctx.fill();
  });
  if(lbl){ctx.save();ctx.translate((x1+x2)/2,(y1+y2)/2);if(Math.abs(dx)<Math.abs(dy))ctx.rotate(-Math.PI/2);ctx.fillStyle='rgba(255,255,255,0.85)';ctx.fillRect(-16,-8,32,12);ctx.fillStyle='#333';ctx.font='9px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(lbl,0,2);ctx.restore();}
}

function redraw(){
  const W=cv.width,H=cv.height;
  ctx.clearRect(0,0,W,H);
  ctx.fillStyle='#ffffff';ctx.fillRect(0,0,W,H);

  // Grid
  if(TK.showGrid){
    const step=TK.scale*TK.zoom;
    const ox=((TK.panX%step)+step)%step;
    const oy=((TK.panY%step)+step)%step;
    ctx.strokeStyle='#e0e0e0';ctx.lineWidth=0.5;
    for(let x=ox;x<W;x+=step){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}
    for(let y=oy;y<H;y+=step){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}
    const step5=step*5;
    const ox5=((TK.panX%(step5))+step5)%step5;
    const oy5=((TK.panY%(step5))+step5)%step5;
    ctx.strokeStyle='#cccccc';ctx.lineWidth=0.8;
    for(let x=ox5;x<W;x+=step5){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}
    for(let y=oy5;y<H;y+=step5){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}
  }

  // Walls
  TK.walls.forEach(w=>{
    const s1=worldToScreen(w.x1,w.y1),s2=worldToScreen(w.x2,w.y2);
    const dx=s2.x-s1.x,dy=s2.y-s1.y,len=Math.sqrt(dx*dx+dy*dy);if(len<1)return;
    const nx=-dy/len,ny=dx/len,hw=w.thickness*TK.scale*TK.zoom/2;
    const pts=[[s1.x+nx*hw,s1.y+ny*hw],[s2.x+nx*hw,s2.y+ny*hw],[s2.x-nx*hw,s2.y-ny*hw],[s1.x-nx*hw,s1.y-ny*hw]];
    ctx.beginPath();ctx.moveTo(pts[0][0],pts[0][1]);pts.forEach(p=>ctx.lineTo(p[0],p[1]));ctx.closePath();
    ctx.fillStyle=w.id===TK.selectedId?'rgba(233,69,96,0.7)':(w.thickness>=0.15?'#1a1a1a':w.thickness>=0.09?'#444':'#777');
    ctx.fill();
    if(len>50){
      const lbl=(Math.sqrt((w.x2-w.x1)**2+(w.y2-w.y1)**2)/TK.scale).toFixed(2)+'m';
      ctx.save();ctx.translate((s1.x+s2.x)/2,(s1.y+s2.y)/2);
      const a=Math.atan2(dy,dx);ctx.rotate(a>Math.PI/2||a<-Math.PI/2?a+Math.PI:a);
      ctx.fillStyle='rgba(255,255,255,0.85)';ctx.fillRect(-18,-7,36,11);
      ctx.fillStyle='#333';ctx.font='bold 9px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(lbl,0,1);
      ctx.restore();
    }
  });

  // Rooms
  TK.rooms.forEach(r=>{
    const s=worldToScreen(r.x,r.y);const rw=r.w*TK.zoom,rh=r.h*TK.zoom;
    const type=(window.TK_ROOM_TYPES||[]).find(t=>t.id===r.type)||{color:'#aaaaaa'};
    const sel=r.id===TK.selectedId;
    ctx.fillStyle=type.color+'33';ctx.fillRect(s.x,s.y,rw,rh);
    ctx.strokeStyle=sel?'#e94560':type.color;ctx.lineWidth=sel?3:2;ctx.strokeRect(s.x,s.y,rw,rh);
    if(TK.showRoomLabels&&rw>40){ctx.fillStyle='#222';ctx.font='bold 13px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(r.name,s.x+rw/2,s.y+rh/2-(TK.showAreaLabels?8:0));}
    if(TK.showAreaLabels&&rw>50){const a=(r.w*r.h/TK.scale/TK.scale).toFixed(2)+' m²';ctx.fillStyle='#666';ctx.font='11px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(a,s.x+rw/2,s.y+rh/2+(TK.showRoomLabels?8:0));}
    if(sel&&TK.showOuterDims){
      ctx.strokeStyle='#888';ctx.fillStyle='#888';ctx.lineWidth=1;
      const off=20;
      drawArrow(s.x,s.y+rh+off,s.x+rw,s.y+rh+off,(r.w/TK.scale).toFixed(2)+'m');
      drawArrow(s.x+rw+off,s.y,s.x+rw+off,s.y+rh,(r.h/TK.scale).toFixed(2)+'m');
    }
    if(sel){
      const handles=[[s.x,s.y],[s.x+rw/2,s.y],[s.x+rw,s.y],[s.x+rw,s.y+rh/2],[s.x+rw,s.y+rh],[s.x+rw/2,s.y+rh],[s.x,s.y+rh],[s.x,s.y+rh/2]];
      handles.forEach(([hx,hy])=>{ctx.fillStyle='white';ctx.strokeStyle='#e94560';ctx.lineWidth=1.5;ctx.fillRect(hx-4,hy-4,8,8);ctx.strokeRect(hx-4,hy-4,8,8);});
    }
  });

  // Active preview
  if(window.activePreview){
    const p=window.activePreview;
    ctx.setLineDash([6,3]);ctx.strokeStyle='#e94560';ctx.lineWidth=2;
    if(p.type==='room'){const s=worldToScreen(p.x,p.y);ctx.strokeRect(s.x,s.y,p.w*TK.zoom,p.h*TK.zoom);ctx.fillStyle='rgba(233,69,96,0.08)';ctx.fillRect(s.x,s.y,p.w*TK.zoom,p.h*TK.zoom);}
    if(p.type==='wall'){const s1=worldToScreen(p.x1,p.y1),s2=worldToScreen(p.x2,p.y2);ctx.beginPath();ctx.moveTo(s1.x,s1.y);ctx.lineTo(s2.x,s2.y);ctx.stroke();}
    ctx.setLineDash([]);
  }

  // Snap indicator
  if(window.snapIndicator){const s=worldToScreen(window.snapIndicator.x,window.snapIndicator.y);ctx.beginPath();ctx.arc(s.x,s.y,6,0,Math.PI*2);ctx.strokeStyle='#00cc66';ctx.lineWidth=2;ctx.stroke();}

  // Scale bar
  const targets=[0.1,0.25,0.5,1,2,5,10,20,50];
  let bestM=1;for(const m of targets){const px=m*TK.scale*TK.zoom;if(px>=60&&px<=150){bestM=m;break;}}
  const barPx=bestM*TK.scale*TK.zoom;
  const bx=W-barPx-20,by=H-24;
  ctx.fillStyle='rgba(255,255,255,0.85)';ctx.fillRect(bx-4,by-4,barPx+8,18);
  ctx.strokeStyle='#333';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(bx,by+8);ctx.lineTo(bx,by+2);ctx.lineTo(bx+barPx,by+2);ctx.lineTo(bx+barPx,by+8);ctx.stroke();
  ctx.fillStyle='#333';ctx.font='10px sans-serif';ctx.textAlign='center';ctx.fillText(bestM+'m',bx+barPx/2,by+14);

  // North arrow
  const nx2=W-40,ny2=40;
  ctx.save();ctx.translate(nx2,ny2);
  ctx.beginPath();ctx.moveTo(0,-16);ctx.lineTo(6,8);ctx.lineTo(0,4);ctx.lineTo(-6,8);ctx.closePath();
  ctx.fillStyle='#e94560';ctx.fill();
  ctx.fillStyle='#333';ctx.font='bold 10px sans-serif';ctx.textAlign='center';ctx.fillText('N',0,-20);
  ctx.restore();

  // Scale info
  const si=document.getElementById('scaleInfo');if(si)si.textContent='Zoom: '+TK.zoom.toFixed(2)+'x | 1m = '+(TK.scale*TK.zoom).toFixed(0)+'px';
}
window.redraw=redraw;

// Zoom
cv.addEventListener('wheel',e=>{
  e.preventDefault();
  const factor=e.deltaY<0?1.12:0.89;
  const nz=Math.max(0.05,Math.min(20,TK.zoom*factor));
  TK.panX=e.offsetX-(e.offsetX-TK.panX)*(nz/TK.zoom);
  TK.panY=e.offsetY-(e.offsetY-TK.panY)*(nz/TK.zoom);
  TK.zoom=nz;redraw();
},{passive:false});

// Zoom to fit
window.zoomToFit=()=>{
  if(!TK.rooms.length&&!TK.walls.length){TK.zoom=1;TK.panX=0;TK.panY=0;redraw();return;}
  let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
  TK.rooms.forEach(r=>{minX=Math.min(minX,r.x);minY=Math.min(minY,r.y);maxX=Math.max(maxX,r.x+r.w);maxY=Math.max(maxY,r.y+r.h);});
  TK.walls.forEach(w=>{minX=Math.min(minX,w.x1,w.x2);minY=Math.min(minY,w.y1,w.y2);maxX=Math.max(maxX,w.x1,w.x2);maxY=Math.max(maxY,w.y1,w.y2);});
  const pad=80,bw=maxX-minX,bh=maxY-minY;
  TK.zoom=Math.min((cv.width-pad*2)/bw,(cv.height-pad*2)/bh,5);
  TK.panX=(cv.width-bw*TK.zoom)/2-minX*TK.zoom;
  TK.panY=(cv.height-bh*TK.zoom)/2-minY*TK.zoom;
  redraw();
};

window.getResizeHandle=(r,sx,sy)=>{
  const s=worldToScreen(r.x,r.y);const rw=r.w*TK.zoom,rh=r.h*TK.zoom;
  const hs=[{x:s.x,y:s.y,cursor:'nw-resize'},{x:s.x+rw/2,y:s.y,cursor:'n-resize'},{x:s.x+rw,y:s.y,cursor:'ne-resize'},{x:s.x+rw,y:s.y+rh/2,cursor:'e-resize'},{x:s.x+rw,y:s.y+rh,cursor:'se-resize'},{x:s.x+rw/2,y:s.y+rh,cursor:'s-resize'},{x:s.x,y:s.y+rh,cursor:'sw-resize'},{x:s.x,y:s.y+rh/2,cursor:'w-resize'}];
  return hs.find(h=>Math.abs(h.x-sx)<8&&Math.abs(h.y-sy)<8)||null;
};
window.getWallHandle=(w,sx,sy)=>{
  const s1=worldToScreen(w.x1,w.y1),s2=worldToScreen(w.x2,w.y2);
  if(Math.abs(s1.x-sx)<10&&Math.abs(s1.y-sy)<10)return 'start';
  if(Math.abs(s2.x-sx)<10&&Math.abs(s2.y-sy)<10)return 'end';
  return null;
};
})();
`;

// ── DRAWING.JS ─────────────────────────────────────────────────────────────
const drawingJs = `
(function(){
function snap(sx,sy,shift){
  if(shift)return window.screenToWorld(sx,sy);
  const SNAP=15/TK.zoom;
  const w=window.screenToWorld(sx,sy);
  let best=null,bestD=SNAP;
  const chk=(px,py)=>{const d=Math.hypot(w.x-px,w.y-py);if(d<bestD){bestD=d;best={x:px,y:py};}};
  TK.rooms.forEach(r=>{
    chk(r.x,r.y);chk(r.x+r.w,r.y);chk(r.x,r.y+r.h);chk(r.x+r.w,r.y+r.h);
    chk(r.x+r.w/2,r.y);chk(r.x+r.w/2,r.y+r.h);chk(r.x,r.y+r.h/2);chk(r.x+r.w,r.y+r.h/2);
    [[r.x,r.y,r.x+r.w,r.y],[r.x+r.w,r.y,r.x+r.w,r.y+r.h],[r.x,r.y+r.h,r.x+r.w,r.y+r.h],[r.x,r.y,r.x,r.y+r.h]].forEach(([ax,ay,bx,by])=>{
      const dx=bx-ax,dy=by-ay,l2=dx*dx+dy*dy;if(!l2)return;
      const t=Math.max(0,Math.min(1,((w.x-ax)*dx+(w.y-ay)*dy)/l2));chk(ax+t*dx,ay+t*dy);
    });
  });
  TK.walls.forEach(wl=>{
    chk(wl.x1,wl.y1);chk(wl.x2,wl.y2);chk((wl.x1+wl.x2)/2,(wl.y1+wl.y2)/2);
    const dx=wl.x2-wl.x1,dy=wl.y2-wl.y1,l2=dx*dx+dy*dy;if(!l2)return;
    const t=Math.max(0,Math.min(1,((w.x-wl.x1)*dx+(w.y-wl.y1)*dy)/l2));chk(wl.x1+t*dx,wl.y1+t*dy);
  });
  window.snapIndicator=best;
  return best||w;
}
window.snapPoint=snap;

document.addEventListener('DOMContentLoaded',()=>{
  const cv=document.getElementById('floorplan');
  if(!cv){console.error('canvas#floorplan not found');return;}

  cv.addEventListener('mousedown',e=>{
    if(e.altKey||e.button===1){TK._pan={sx:e.offsetX,sy:e.offsetY,px:TK.panX,py:TK.panY};return;}
    if(TK.currentTool==='door'||TK.currentTool==='window'){TK._placeStart={x:e.offsetX,y:e.offsetY};return;}
    if(TK.currentTool==='draw'){TK._draw={start:snap(e.offsetX,e.offsetY,e.shiftKey),active:true};return;}
    if(TK.currentTool==='wall'){TK._wall={start:snap(e.offsetX,e.offsetY,e.shiftKey),active:true};return;}
    if(TK.selectedType==='room'&&TK.selectedId){
      const r=TK.rooms.find(x=>x.id===TK.selectedId);
      if(r){const h=window.getResizeHandle(r,e.offsetX,e.offsetY);if(h){TK._resize={h,startX:e.offsetX,startY:e.offsetY,orig:{...r}};return;}}
    }
    if(TK.selectedType==='wall'&&TK.selectedId){
      const wl=TK.walls.find(x=>x.id===TK.selectedId);
      if(wl){const wh=window.getWallHandle(wl,e.offsetX,e.offsetY);if(wh){TK._wallEnd={end:wh,wallId:wl.id};return;}}
    }
    const wo=window.screenToWorld(e.offsetX,e.offsetY);
    let hit=null;
    for(const r of TK.rooms){if(wo.x>=r.x&&wo.x<=r.x+r.w&&wo.y>=r.y&&wo.y<=r.y+r.h){hit={id:r.id,type:'room'};break;}}
    if(!hit)for(const wl of TK.walls){const dx=wl.x2-wl.x1,dy=wl.y2-wl.y1,l2=dx*dx+dy*dy;if(!l2)continue;const t=Math.max(0,Math.min(1,((wo.x-wl.x1)*dx+(wo.y-wl.y1)*dy)/l2));if(Math.hypot(wo.x-wl.x1-t*dx,wo.y-wl.y1-t*dy)<wl.thickness*TK.scale*2){hit={id:wl.id,type:'wall'};break;}}
    TK.selectedId=hit?.id||null;TK.selectedType=hit?.type||null;
    if(window.updateSidebar)updateSidebar();if(window.updateWallList)updateWallList();window.redraw();
  });

  cv.addEventListener('mousemove',e=>{
    const wo=window.screenToWorld(e.offsetX,e.offsetY);
    const ci=document.getElementById('coordInfo');if(ci)ci.textContent='X: '+(wo.x/TK.scale).toFixed(2)+'m  Y: '+(wo.y/TK.scale).toFixed(2)+'m';
    if(TK._pan){TK.panX=TK._pan.px+(e.offsetX-TK._pan.sx);TK.panY=TK._pan.py+(e.offsetY-TK._pan.sy);window.redraw();return;}
    if(TK._resize){
      const dx=(e.offsetX-TK._resize.startX)/TK.zoom,dy=(e.offsetY-TK._resize.startY)/TK.zoom;
      const r=TK.rooms.find(x=>x.id===TK.selectedId);if(!r)return;
      const o=TK._resize.orig,c=TK._resize.h.cursor;
      if(c.includes('e'))r.w=Math.max(50,o.w+dx);if(c.includes('s'))r.h=Math.max(50,o.h+dy);
      if(c.includes('w')){r.x=o.x+dx;r.w=Math.max(50,o.w-dx);}if(c.includes('n')){r.y=o.y+dy;r.h=Math.max(50,o.h-dy);}
      window.redraw();return;
    }
    if(TK._wallEnd){const s=snap(e.offsetX,e.offsetY,e.shiftKey);const wl=TK.walls.find(x=>x.id===TK._wallEnd.wallId);if(wl){if(TK._wallEnd.end==='start'){wl.x1=s.x;wl.y1=s.y;}else{wl.x2=s.x;wl.y2=s.y;}}window.redraw();return;}
    if(TK._draw?.active){const s=snap(e.offsetX,e.offsetY,e.shiftKey);window.activePreview={type:'room',x:Math.min(TK._draw.start.x,s.x),y:Math.min(TK._draw.start.y,s.y),w:Math.abs(s.x-TK._draw.start.x),h:Math.abs(s.y-TK._draw.start.y)};window.redraw();return;}
    if(TK._wall?.active){const s=snap(e.offsetX,e.offsetY,e.shiftKey);window.activePreview={type:'wall',x1:TK._wall.start.x,y1:TK._wall.start.y,x2:s.x,y2:s.y,thickness:TK.wallThickness};window.redraw();return;}
    window.snapIndicator=null;
  });

  cv.addEventListener('mouseup',e=>{
    if(TK._pan){TK._pan=null;return;}
    if(TK._resize){window.saveSnapshot();TK._resize=null;return;}
    if(TK._wallEnd){window.saveSnapshot();TK._wallEnd=null;return;}
    if(TK._draw?.active){
      TK._draw.active=false;window.activePreview=null;
      const s=snap(e.offsetX,e.offsetY,e.shiftKey);
      const w=Math.abs(s.x-TK._draw.start.x),h=Math.abs(s.y-TK._draw.start.y);
      if(w>50&&h>50){window.saveSnapshot();const tp=(window.TK_ROOM_TYPES||[])[7]||{color:'#aaa',id:'anna'};TK.rooms.push({id:TK.nextId++,name:'Rom '+TK.nextId,type:tp.id,x:Math.min(TK._draw.start.x,s.x),y:Math.min(TK._draw.start.y,s.y),w,h,color:tp.color});if(window.updateSidebar)updateSidebar();}
      TK._draw=null;window.redraw();return;
    }
    if(TK._wall?.active){
      TK._wall.active=false;window.activePreview=null;
      const s=snap(e.offsetX,e.offsetY,e.shiftKey);
      const dx=s.x-TK._wall.start.x,dy=s.y-TK._wall.start.y;
      if(Math.hypot(dx,dy)>20){window.saveSnapshot();TK.walls.push({id:TK.nextId++,x1:TK._wall.start.x,y1:TK._wall.start.y,x2:s.x,y2:s.y,thickness:TK.wallThickness});if(window.updateWallList)updateWallList();}
      TK._wall=null;window.redraw();return;
    }
    if((TK.currentTool==='door'||TK.currentTool==='window')&&TK._placeStart){
      if(Math.hypot(e.offsetX-TK._placeStart.x,e.offsetY-TK._placeStart.y)<8&&window.placeElementOnWall)window.placeElementOnWall(e.offsetX,e.offsetY);
      TK._placeStart=null;return;
    }
  });

  cv.addEventListener('dblclick',e=>{
    const wo=window.screenToWorld(e.offsetX,e.offsetY);
    const r=TK.rooms.find(r=>wo.x>=r.x&&wo.x<=r.x+r.w&&wo.y>=r.y&&wo.y<=r.y+r.h);
    if(!r)return;
    const ov=document.createElement('div');ov.className='modal-overlay';
    const opts=(window.TK_ROOM_TYPES||[]).map(t=>'<option value="'+t.id+'"'+(t.id===r.type?' selected':'')+'>'+t.name+'</option>').join('');
    ov.innerHTML='<div class="modal"><h2>Endre rom</h2><label>Namn</label><input id="_rn" value="'+r.name+'"><label>Type</label><select id="_rt">'+opts+'</select><div class="modal-btns"><button id="_rc">Avbryt</button><button id="_rs" style="background:var(--accent);border-color:var(--accent)">Lagre</button></div></div>';
    document.body.appendChild(ov);
    document.getElementById('_rc').onclick=()=>ov.remove();
    document.getElementById('_rs').onclick=()=>{
      const nm=document.getElementById('_rn').value.trim()||r.name;
      const tp=(window.TK_ROOM_TYPES||[]).find(t=>t.id===document.getElementById('_rt').value)||{id:'anna',color:'#aaa'};
      window.saveSnapshot();r.name=nm;r.type=tp.id;r.color=tp.color;ov.remove();if(window.updateSidebar)updateSidebar();window.redraw();
    };
  });

  window.deleteSelected=()=>{if(!TK.selectedId)return;window.saveSnapshot();TK.rooms=TK.rooms.filter(r=>r.id!==TK.selectedId);TK.walls=TK.walls.filter(w=>w.id!==TK.selectedId);TK.selectedId=null;if(window.updateSidebar)updateSidebar();if(window.updateWallList)updateWallList();window.redraw();};
  window.copySelected=()=>{const r=TK.rooms.find(x=>x.id===TK.selectedId);if(r)TK.clipboard={...r};};
  window.pasteClipboard=()=>{if(!TK.clipboard)return;window.saveSnapshot();TK.rooms.push({...TK.clipboard,id:TK.nextId++,x:TK.clipboard.x+TK.scale*0.5,y:TK.clipboard.y+TK.scale*0.5});if(window.updateSidebar)updateSidebar();window.redraw();};
});
})();
`;

fs.writeFileSync(path.join(DIR, "src/canvas.js"), canvasJs, "utf8");
console.log("✅ src/canvas.js written (" + canvasJs.length + " chars)");
fs.writeFileSync(path.join(DIR, "src/drawing.js"), drawingJs, "utf8");
console.log("✅ src/drawing.js written (" + drawingJs.length + " chars)");
console.log("\n✅ Done. Hard-refresh browser (Ctrl+Shift+R)");
