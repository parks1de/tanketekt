
(function(){
const cv=document.getElementById('floorplan');
const wrap=cv.parentElement;
const ctx=cv.getContext('2d');

function resize(){cv.width=wrap.offsetWidth||800;cv.height=wrap.offsetHeight||600;redraw();}
new ResizeObserver(resize).observe(wrap);
setTimeout(resize,60);

window.worldToScreen=(wx,wy)=>({x:wx*TK.zoom+TK.panX,y:wy*TK.zoom+TK.panY});
window.screenToWorld=(sx,sy)=>({x:(sx-TK.panX)/TK.zoom,y:(sy-TK.panY)/TK.zoom});

function isEdgeJoined(r,edge){
  const tol=4;
  return TK.rooms.some(r2=>{
    if(r2.id===r.id)return false;
    const yOv=r2.y<r.y+r.h-tol&&r2.y+r2.h>r.y+tol;
    const xOv=r2.x<r.x+r.w-tol&&r2.x+r2.w>r.x+tol;
    if(edge==='right')return Math.abs((r.x+r.w)-r2.x)<tol&&yOv;
    if(edge==='left')return Math.abs(r.x-(r2.x+r2.w))<tol&&yOv;
    if(edge==='bottom')return Math.abs((r.y+r.h)-r2.y)<tol&&xOv;
    if(edge==='top')return Math.abs(r.y-(r2.y+r2.h))<tol&&xOv;
    return false;
  });
}

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
    // Length label moved to dimension lines
  });

  // Rooms
  TK.rooms.forEach(r=>{
    const s=worldToScreen(r.x,r.y);const rw=r.w*TK.zoom,rh=r.h*TK.zoom;
    const type=(window.TK_ROOM_TYPES||[]).find(t=>t.id===r.type)||{color:'#aaaaaa'};
    const sel=r.id===TK.selectedId;
    ctx.fillStyle=type.color+'33';ctx.fillRect(s.x,s.y,rw,rh);
    
    // Draw room walls — always draw full walls; thin separator at shared edges
    const rwt=(r.wallThickness||TK.wallThickness||0.1)*TK.scale*TK.zoom;
    const hwt=rwt/2;
    const inMulti=TK.selectedIds&&TK.selectedIds.includes(r.id)&&!sel;
    const wallCol=sel?'rgba(233,69,96,0.85)':inMulti?'rgba(35,134,54,0.8)':'#2d2d2d';
    const innerW=rw-rwt,innerH=rh-rwt;
    const jT=isEdgeJoined(r,'top'),jR=isEdgeJoined(r,'right'),jB=isEdgeJoined(r,'bottom'),jL=isEdgeJoined(r,'left');
    ctx.fillStyle=wallCol;
    ctx.fillRect(s.x-hwt,s.y-hwt,rwt,rwt);ctx.fillRect(s.x+rw-hwt,s.y-hwt,rwt,rwt);
    ctx.fillRect(s.x+rw-hwt,s.y+rh-hwt,rwt,rwt);ctx.fillRect(s.x-hwt,s.y+rh-hwt,rwt,rwt);
    if(innerW>0)ctx.fillRect(s.x+hwt,s.y-hwt,innerW,rwt);
    if(innerH>0)ctx.fillRect(s.x+rw-hwt,s.y+hwt,rwt,innerH);
    if(innerW>0)ctx.fillRect(s.x+hwt,s.y+rh-hwt,innerW,rwt);
    if(innerH>0)ctx.fillRect(s.x-hwt,s.y+hwt,rwt,innerH);
    if(innerW>0&&innerH>0){ctx.fillStyle='#f5f5f5';ctx.fillRect(s.x+hwt,s.y+hwt,innerW,innerH);}
    // Thin separator line at shared edges (shows room boundary without removing wall)
    ctx.strokeStyle='rgba(160,160,160,0.6)';ctx.lineWidth=0.8;ctx.setLineDash([3,3]);
    if(jT&&innerW>0){ctx.beginPath();ctx.moveTo(s.x+hwt,s.y);ctx.lineTo(s.x+rw-hwt,s.y);ctx.stroke();}
    if(jR&&innerH>0){ctx.beginPath();ctx.moveTo(s.x+rw,s.y+hwt);ctx.lineTo(s.x+rw,s.y+rh-hwt);ctx.stroke();}
    if(jB&&innerW>0){ctx.beginPath();ctx.moveTo(s.x+hwt,s.y+rh);ctx.lineTo(s.x+rw-hwt,s.y+rh);ctx.stroke();}
    if(jL&&innerH>0){ctx.beginPath();ctx.moveTo(s.x,s.y+hwt);ctx.lineTo(s.x,s.y+rh-hwt);ctx.stroke();}
    ctx.setLineDash([]);
    if(sel){ctx.strokeStyle='#e94560';ctx.lineWidth=2;ctx.strokeRect(s.x-hwt,s.y-hwt,rw+rwt,rh+rwt);}
    else if(inMulti){ctx.strokeStyle='#238636';ctx.lineWidth=2;ctx.strokeRect(s.x-hwt,s.y-hwt,rw+rwt,rh+rwt);}
    if(TK.showRoomLabels&&rw>40){ctx.fillStyle='#222';ctx.font='bold 13px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(r.name,s.x+rw/2,s.y+rh/2-(TK.showAreaLabels?8:0));}
    if(TK.showAreaLabels&&rw>50){const a=(r.w*r.h/TK.scale/TK.scale).toFixed(2)+' m²';ctx.fillStyle='#666';ctx.font='11px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(a,s.x+rw/2,s.y+rh/2+(TK.showRoomLabels?8:0));}
    if(sel){
      const handles=[[s.x-hwt,s.y-hwt],[s.x+rw/2,s.y-hwt],[s.x+rw+hwt,s.y-hwt],[s.x+rw+hwt,s.y+rh/2],[s.x+rw+hwt,s.y+rh+hwt],[s.x+rw/2,s.y+rh+hwt],[s.x-hwt,s.y+rh+hwt],[s.x-hwt,s.y+rh/2]];
      handles.forEach(([hx,hy])=>{ctx.fillStyle='white';ctx.strokeStyle='#e94560';ctx.lineWidth=1.5;ctx.fillRect(hx-5,hy-5,10,10);ctx.strokeRect(hx-5,hy-5,10,10);});
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

  // Dimension lines (all walls)
  if(TK.showOuterDims||TK.showInnerDims) drawAllDims(ctx);
  // Doors & Windows
  if(window.drawDoor)TK.doors.forEach(d=>window.drawDoor(ctx,d));
  if(window.drawWindow)TK.windows.forEach(w=>window.drawWindow(ctx,w));
  // Ghost door/window preview on hover
  if(window._doorGhost&&(TK.currentTool==='door'||TK.currentTool==='window')&&TK.pendingElement&&TK.pendingElement.preset){
    const gp=window._doorGhost;const preset=TK.pendingElement.preset;
    const ghost={id:-1,width:preset.width,t:gp.t};
    if(gp.type==='wall')ghost.wallId=gp.wallId;else{ghost.roomId=gp.roomId;ghost.edge=gp.edge;}
    ctx.save();ctx.globalAlpha=0.45;
    if(TK.pendingElement.type==='window'&&window.drawWindow)window.drawWindow(ctx,ghost);
    else if(window.drawDoor)window.drawDoor(ctx,ghost);
    ctx.restore();
  }
  
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

// ── DIMENSION LINE SYSTEM ────────────────────────────────────────────────────
window._dimHitAreas = []; // [{id, cx, cy, r, ref}] for drag detection

function drawDimLine(ctx, sx1, sy1, sx2, sy2, labelM, offPx, onx, ony, refId, refType){
  const len = Math.hypot(sx2-sx1, sy2-sy1);
  if(len < 20) return;
  const ux=(sx2-sx1)/len, uy=(sy2-sy1)/len;
  // Dim line endpoints
  const d1x=sx1+onx*offPx, d1y=sy1+ony*offPx;
  const d2x=sx2+onx*offPx, d2y=sy2+ony*offPx;
  const col = '#555';
  ctx.save();
  ctx.strokeStyle=col; ctx.lineWidth=0.8; ctx.setLineDash([]);
  // Witness lines
  [[sx1,sy1,d1x,d1y],[sx2,sy2,d2x,d2y]].forEach(([ax,ay,bx,by])=>{
    ctx.beginPath(); ctx.moveTo(ax+onx*3,ay+ony*3); ctx.lineTo(bx+onx*6,by+ony*6); ctx.stroke();
  });
  // Main dim line
  ctx.strokeStyle='#333'; ctx.lineWidth=1;
  ctx.beginPath(); ctx.moveTo(d1x,d1y); ctx.lineTo(d2x,d2y); ctx.stroke();
  // Arrowheads (ticks)
  const A=7;
  [[d1x,d1y,1],[d2x,d2y,-1]].forEach(([x,y,dir])=>{
    ctx.beginPath();
    ctx.moveTo(x,y);
    ctx.lineTo(x+dir*ux*A-uy*3, y+dir*uy*A+ux*3);
    ctx.moveTo(x,y);
    ctx.lineTo(x+dir*ux*A+uy*3, y+dir*uy*A-ux*3);
    ctx.stroke();
  });
  // Label
  const mx=(d1x+d2x)/2, my=(d1y+d2y)/2;
  const ang=Math.atan2(uy,ux);
  ctx.translate(mx,my);
  ctx.rotate(ang>Math.PI/2||ang<-Math.PI/2?ang+Math.PI:ang);
  ctx.fillStyle='rgba(255,255,255,0.92)'; ctx.fillRect(-22,-7,44,13);
  ctx.fillStyle='#222'; ctx.font='bold 10px sans-serif';
  ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillText(labelM,0,2);
  ctx.restore();
  // Store hit area for drag (midpoint of witness line region)
  const hx=(sx1+sx2)/2+onx*(offPx*0.5);
  const hy=(sy1+sy2)/2+ony*(offPx*0.5);
  window._dimHitAreas.push({hx,hy,onx,ony,refId,refType,r:10});
}

function drawAllDims(ctx){
  window._dimHitAreas=[];
  const WALL_COL='#555';
  function dimLine(x1,y1,x2,y2,lbl,offPx,nx,ny,rid,rtype){
    const len=Math.hypot(x2-x1,y2-y1);if(len<15)return;
    const ux=(x2-x1)/len,uy=(y2-y1)/len;
    const d1x=x1+nx*offPx,d1y=y1+ny*offPx,d2x=x2+nx*offPx,d2y=y2+ny*offPx;
    ctx.save();ctx.strokeStyle=WALL_COL;ctx.lineWidth=0.8;
    [[x1,y1,d1x,d1y],[x2,y2,d2x,d2y]].forEach(([ax,ay,bx,by])=>{ctx.beginPath();ctx.moveTo(ax+nx*2,ay+ny*2);ctx.lineTo(bx+nx*5,by+ny*5);ctx.stroke();});
    ctx.strokeStyle='#333';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(d1x,d1y);ctx.lineTo(d2x,d2y);ctx.stroke();
    const A=7;[[d1x,d1y,1],[d2x,d2y,-1]].forEach(([x,y,dir])=>{ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+dir*ux*A-uy*3,y+dir*uy*A+ux*3);ctx.moveTo(x,y);ctx.lineTo(x+dir*ux*A+uy*3,y+dir*uy*A-ux*3);ctx.stroke();});
    const mx=(d1x+d2x)/2,my=(d1y+d2y)/2;
    const ang=Math.atan2(uy,ux);ctx.translate(mx,my);ctx.rotate(ang>Math.PI/2||ang<-Math.PI/2?ang+Math.PI:ang);
    ctx.fillStyle='rgba(255,255,255,0.92)';ctx.fillRect(-22,-7,44,13);ctx.fillStyle='#222';ctx.font='bold 10px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(lbl,0,2);
    ctx.restore();
    window._dimHitAreas.push({hx:(x1+x2)/2+nx*(offPx*0.5),hy:(y1+y2)/2+ny*(offPx*0.5),onx:nx,ony:ny,refId:rid,refType:rtype,r:10});
  }
  TK.rooms.forEach(r=>{
    if(!r.dimOffsets)r.dimOffsets={top:40,right:40,bottom:40,left:40};
    const s=worldToScreen(r.x,r.y),rw=r.w*TK.zoom,rh=r.h*TK.zoom;
    const wt=(r.wallThickness||TK.wallThickness||0.1),hwt=wt*TK.scale*TK.zoom/2;
    if(TK.showOuterDims){
      dimLine(s.x-hwt,s.y-hwt,s.x+rw+hwt,s.y-hwt,((r.w/TK.scale)+wt).toFixed(2)+'m',r.dimOffsets.top,0,-1,r.id,'room-top');
      dimLine(s.x+rw+hwt,s.y-hwt,s.x+rw+hwt,s.y+rh+hwt,((r.h/TK.scale)+wt).toFixed(2)+'m',r.dimOffsets.right,1,0,r.id,'room-right');
      dimLine(s.x-hwt,s.y+rh+hwt,s.x+rw+hwt,s.y+rh+hwt,((r.w/TK.scale)+wt).toFixed(2)+'m',r.dimOffsets.bottom,0,1,r.id,'room-bottom');
      dimLine(s.x-hwt,s.y-hwt,s.x-hwt,s.y+rh+hwt,((r.h/TK.scale)+wt).toFixed(2)+'m',r.dimOffsets.left,-1,0,r.id,'room-left');
    }
    if(TK.showInnerDims){
      const iw=rw-wt*TK.scale*TK.zoom,ih=rh-wt*TK.scale*TK.zoom;
      if(iw>30&&ih>30){
        const ix=s.x+hwt,iy=s.y+hwt;
        const lmI=(iw/TK.zoom/TK.scale).toFixed(2)+'m',hmI=(ih/TK.zoom/TK.scale).toFixed(2)+'m';
        // Inner dims go INTO the room (positive offsets from inner wall faces)
        dimLine(ix,iy,ix+iw,iy,lmI,22,0,1,r.id,'room-in-top');
        dimLine(ix,iy,ix,iy+ih,hmI,22,1,0,r.id,'room-in-left');
      }
    }
  });
  if(TK.showOuterDims) TK.walls.forEach(w=>{
    if(w.dimOffset===undefined)w.dimOffset=40;
    const s1=worldToScreen(w.x1,w.y1),s2=worldToScreen(w.x2,w.y2);
    const len=Math.hypot(s2.x-s1.x,s2.y-s1.y);if(len<10)return;
    const ux2=(s2.x-s1.x)/len,uy2=(s2.y-s1.y)/len;
    dimLine(s1.x,s1.y,s2.x,s2.y,(Math.hypot(w.x2-w.x1,w.y2-w.y1)/TK.scale).toFixed(2)+'m',w.dimOffset,-uy2,ux2,w.id,'wall');
  });
}
// ── END DIMENSION LINE SYSTEM ────────────────────────────────────────────────

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
  const hwt=(r.wallThickness||TK.wallThickness||0.1)*TK.scale*TK.zoom/2;
  const hs=[{x:s.x-hwt,y:s.y-hwt,cursor:'nw-resize'},{x:s.x+rw/2,y:s.y-hwt,cursor:'n-resize'},{x:s.x+rw+hwt,y:s.y-hwt,cursor:'ne-resize'},{x:s.x+rw+hwt,y:s.y+rh/2,cursor:'e-resize'},{x:s.x+rw+hwt,y:s.y+rh+hwt,cursor:'se-resize'},{x:s.x+rw/2,y:s.y+rh+hwt,cursor:'s-resize'},{x:s.x-hwt,y:s.y+rh+hwt,cursor:'sw-resize'},{x:s.x-hwt,y:s.y+rh/2,cursor:'w-resize'}];
  return hs.find(h=>Math.abs(h.x-sx)<12&&Math.abs(h.y-sy)<12)||null;
};
window.getWallHandle=(w,sx,sy)=>{
  const s1=worldToScreen(w.x1,w.y1),s2=worldToScreen(w.x2,w.y2);
  if(Math.abs(s1.x-sx)<10&&Math.abs(s1.y-sy)<10)return 'start';
  if(Math.abs(s2.x-sx)<10&&Math.abs(s2.y-sy)<10)return 'end';
  return null;
};
})();
