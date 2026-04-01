
(function(){
function snap(sx,sy,shift){
  if(shift)return window.screenToWorld(sx,sy);
  const SNAP=20/TK.zoom;
  const w=window.screenToWorld(sx,sy);
  let best=null,bestD=SNAP;
  const chk=(px,py)=>{const d=Math.hypot(w.x-px,w.y-py);if(d<bestD){bestD=d;best={x:px,y:py};}};
  if(TK.snapToGrid){const gs=TK.scale*0.5;chk(Math.round(w.x/gs)*gs,Math.round(w.y/gs)*gs);}
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
    
  
  
  // RESIZE HANDLES — check first, highest priority
  if(TK.selectedId&&TK.selectedType==='room'){
    const rr=TK.rooms.find(x=>x.id===TK.selectedId);
    if(rr&&window.getResizeHandle){
      const hh=window.getResizeHandle(rr,e.offsetX,e.offsetY);
      if(hh){TK._resize={h:hh,startX:e.offsetX,startY:e.offsetY,orig:{...rr}};return;}
    }
  }
  if(TK.selectedId&&TK.selectedType==='wall'){
    const ww=TK.walls.find(x=>x.id===TK.selectedId);
    if(ww&&window.getWallHandle){
      const wh=window.getWallHandle(ww,e.offsetX,e.offsetY);
      if(wh){TK._wallEnd={end:wh,wallId:ww.id};return;}
    }
  }
  // Drag-move: click body of selected element to move it
  if(TK.selectedId&&!TK._resize&&!TK._wallEnd){
    const wo2=window.screenToWorld(e.offsetX,e.offsetY);
    if(TK.selectedType==='room'){
      const r=TK.rooms.find(x=>x.id===TK.selectedId);
      if(r&&wo2.x>r.x&&wo2.x<r.x+r.w&&wo2.y>r.y&&wo2.y<r.y+r.h){
        const origPos={};(TK.selectedIds||[]).forEach(id=>{const r2=TK.rooms.find(x=>x.id===id);if(r2)origPos[id]={x:r2.x,y:r2.y};});
        TK._moveEl={type:'room',id:r.id,startSX:e.offsetX,startSY:e.offsetY,origX:r.x,origY:r.y,origPositions:origPos};return;
      }
    }
    if(TK.selectedType==='wall'){
      const w=TK.walls.find(x=>x.id===TK.selectedId);
      if(w){const dx=w.x2-w.x1,dy=w.y2-w.y1,l2=dx*dx+dy*dy;if(l2>0){const t=Math.max(0,Math.min(1,((wo2.x-w.x1)*dx+(wo2.y-w.y1)*dy)/l2));const cx=w.x1+t*dx,cy=w.y1+t*dy;if(Math.hypot(wo2.x-cx,wo2.y-cy)<w.thickness*TK.scale*3){TK._moveEl={type:'wall',id:w.id,startSX:e.offsetX,startSY:e.offsetY,ox1:w.x1,oy1:w.y1,ox2:w.x2,oy2:w.y2};return;}}}
    }
    if(TK.selectedType==='door'||TK.selectedType==='window'){
      // Door/window: move to new wall on click+drag
      const arr=TK.selectedType==='door'?TK.doors:TK.windows;
      const el=arr.find(x=>x.id===TK.selectedId);
      if(el&&window.getElPos){const pos=window.getElPos(el);if(pos){const s1=window.worldToScreen(pos.x1,pos.y1),s2=window.worldToScreen(pos.x2,pos.y2);const cx=(s1.x+s2.x)*el.t+(s1.x*(1-el.t)),cy=(s1.y+s2.y)*el.t+(s1.y*(1-el.t));if(Math.hypot(e.offsetX-cx,e.offsetY-cy)<30){TK._moveEl={type:TK.selectedType,id:el.id};return;}}}
    }
  }
  // Check dim line drag start
  if(TK.showOuterDims&&window._dimHitAreas){
    for(const h of window._dimHitAreas){
      if(Math.hypot(e.offsetX-h.hx,e.offsetY-h.hy)<h.r+8){
        TK._dimDrag={...h,startX:e.offsetX,startY:e.offsetY};
        return;
      }
    }
  }
    if(e.altKey||e.button===1){TK._pan={sx:e.offsetX,sy:e.offsetY,px:TK.panX,py:TK.panY};return;}
    
    // Flip door on click when already selected
    if(TK.selectedId&&TK.selectedType==='door'){
      const d=TK.doors.find(x=>x.id===TK.selectedId);
      if(d){const pos=window.getElPos?window.getElPos(d):null;
        if(pos){const s1=window.worldToScreen(pos.x1,pos.y1),s2=window.worldToScreen(pos.x2,pos.y2);
          const cx=s1.x+(s2.x-s1.x)*d.t,cy=s1.y+(s2.y-s1.y)*d.t;
          if(Math.hypot(e.offsetX-cx,e.offsetY-cy)<(d.width*TK.scale*TK.zoom+20)){
            // swingDir removed
          }
        }
      }
    }
    if(TK.currentTool==='door'||TK.currentTool==='window'){TK._placeStart={x:e.offsetX,y:e.offsetY};return;}
    // Hit test before draw — allows deselect by clicking empty space
    {const wo2=window.screenToWorld(e.offsetX,e.offsetY);
    let preHit=null;
    for(const r of TK.rooms){if(wo2.x>=r.x&&wo2.x<=r.x+r.w&&wo2.y>=r.y&&wo2.y<=r.y+r.h){preHit={id:r.id,type:'room'};break;}}
    if(!preHit)for(const w of TK.walls){const dx=w.x2-w.x1,dy=w.y2-w.y1,l2=dx*dx+dy*dy;if(!l2)continue;const t=Math.max(0,Math.min(1,((wo2.x-w.x1)*dx+(wo2.y-w.y1)*dy)/l2));if(Math.hypot(wo2.x-w.x1-t*dx,wo2.y-w.y1-t*dy)<w.thickness*TK.scale*2){preHit={id:w.id,type:'wall'};break;}}
    if(preHit){
      if(e.shiftKey){
        if(!TK.selectedIds)TK.selectedIds=[];
        const idx=TK.selectedIds.indexOf(preHit.id);
        if(idx>=0){TK.selectedIds.splice(idx,1);if(TK.selectedId===preHit.id){TK.selectedId=TK.selectedIds[0]||null;TK.selectedType=TK.selectedId?TK.selectedType:null;}}
        else{TK.selectedIds.push(preHit.id);TK.selectedId=preHit.id;TK.selectedType=preHit.type;}
      } else {
        TK.selectedId=preHit.id;TK.selectedType=preHit.type;TK.selectedIds=[preHit.id];
        if(preHit.type==='room'&&window.getResizeHandle){const r2=TK.rooms.find(x=>x.id===preHit.id);if(r2){const hh2=window.getResizeHandle(r2,e.offsetX,e.offsetY);if(hh2){TK._resize={h:hh2,startX:e.offsetX,startY:e.offsetY,orig:{...r2}};if(window.updateSidebar)updateSidebar();window.redraw();return;}}}
      }
      if(window.updateSidebar)updateSidebar();if(window.updateWallList)updateWallList();window.redraw();return;
    }
    else{if(!e.shiftKey){TK.selectedId=null;TK.selectedType=null;TK.selectedIds=[];}if(window.updateSidebar)updateSidebar();window.redraw();}}
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
    
    
  // ghost removed
  if(TK._dimDrag){
      const dd=TK._dimDrag;
      const delta=(e.offsetX-dd.startX)*dd.onx+(e.offsetY-dd.startY)*dd.ony;
      if(dd.refType==='wall'){
        const w=TK.walls.find(x=>x.id===dd.refId);
        if(w) w.dimOffset=Math.max(18,(w.dimOffset||40)+delta);
      } else if(dd.refType.startsWith('room-')){
        const edge=dd.refType.split('-')[1];
        const r=TK.rooms.find(x=>x.id===dd.refId);
        if(r){if(!r.dimOffsets)r.dimOffsets={top:40,right:40,bottom:40,left:40};r.dimOffsets[edge]=Math.max(18,r.dimOffsets[edge]+delta);}
      }
      TK._dimDrag.startX=e.offsetX; TK._dimDrag.startY=e.offsetY;
      window.redraw(); return;
    }
    
    // ghost removed
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
    if(TK._moveEl){
      const dx=(e.offsetX-TK._moveEl.startSX)/TK.zoom;
      const dy=(e.offsetY-TK._moveEl.startSY)/TK.zoom;
      if(TK._moveEl.type==='room'){
        const r=TK.rooms.find(x=>x.id===TK._moveEl.id);
        if(r){
          const snapped=e.shiftKey?{x:TK._moveEl.origX+dx,y:TK._moveEl.origY+dy}:window.snapPoint?window.snapPoint(e.offsetX-(TK._moveEl.origX+r.w/2-TK.panX)*TK.zoom/TK.zoom,e.offsetY-(TK._moveEl.origY+r.h/2-TK.panY)*TK.zoom/TK.zoom,false):{x:TK._moveEl.origX+dx,y:TK._moveEl.origY+dy};
          if(!e.shiftKey&&window.snapPoint){
          // Try snapping all 4 corners of the moving room; pick best
          const origTL=window.worldToScreen(TK._moveEl.origX,TK._moveEl.origY);
          const dpx=e.offsetX-TK._moveEl.startSX,dpy=e.offsetY-TK._moveEl.startSY;
          const savedX=r.x,savedY=r.y;r.x=-99999;r.y=-99999; // exclude self from snap targets
          let bestSnap=null,bestDist=Infinity;
          [[0,0],[r.w,0],[0,r.h],[r.w,r.h]].forEach(([cdx,cdy])=>{
            const sx=origTL.x+dpx+cdx*TK.zoom,sy=origTL.y+dpy+cdy*TK.zoom;
            const raw=window.screenToWorld(sx,sy);
            const sn=window.snapPoint(sx,sy,false);
            const d=Math.hypot(sn.x-raw.x,sn.y-raw.y);
            if(d>0.5&&d<bestDist){bestDist=d;bestSnap={x:sn.x-cdx,y:sn.y-cdy};}
          });
          r.x=savedX;r.y=savedY;
          if(bestSnap){r.x=bestSnap.x;r.y=bestSnap.y;}
          else{r.x=TK._moveEl.origX+dpx/TK.zoom;r.y=TK._moveEl.origY+dpy/TK.zoom;}
        } else { r.x=TK._moveEl.origX+dx; r.y=TK._moveEl.origY+dy; }
        }
        if(r&&TK._moveEl.origPositions){const moveDX=r.x-TK._moveEl.origX,moveDY=r.y-TK._moveEl.origY;Object.entries(TK._moveEl.origPositions).forEach(([id,pos])=>{if(parseInt(id)===TK._moveEl.id)return;const r2=TK.rooms.find(x=>x.id===parseInt(id));if(r2){r2.x=pos.x+moveDX;r2.y=pos.y+moveDY;}});}
      } else if(TK._moveEl.type==='wall'){
        const w=TK.walls.find(x=>x.id===TK._moveEl.id);
        if(w){w.x1=TK._moveEl.ox1+dx;w.y1=TK._moveEl.oy1+dy;w.x2=TK._moveEl.ox2+dx;w.y2=TK._moveEl.oy2+dy;}
      } else if(TK._moveEl.type==='door'||TK._moveEl.type==='window'){
        const arr=TK._moveEl.type==='door'?TK.doors:TK.windows;
        const el=arr.find(x=>x.id===TK._moveEl.id);
        if(el&&window.hitTestAll){const hit=window.hitTestAll(e.offsetX,e.offsetY);if(hit){if(hit.type==='wall'){el.wallId=hit.wallId;delete el.roomId;delete el.edge;}else{el.roomId=hit.roomId;el.edge=hit.edge;delete el.wallId;}el.t=hit.t;}}
      }
      window.redraw(); return;
    }
    if(TK._resize){
      document.getElementById('floorplan').style.cursor=TK._resize.h.cursor;
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
    // Ghost preview for door/window placement
    if(TK.currentTool==='door'||TK.currentTool==='window'){
      window._doorGhost=window.hitTestAll?window.hitTestAll(e.offsetX,e.offsetY):null;
      window.redraw();
    } else {window._doorGhost=null;}
    window.snapIndicator=null;
    {const cvEl=document.getElementById('floorplan');
    let cur='crosshair';
    if(TK._moveEl)cur='grabbing';
    else if(TK._resize)cur=TK._resize.h.cursor;
    else if(TK.selectedId&&TK.selectedType==='room'){
      const r3=TK.rooms.find(x=>x.id===TK.selectedId);
      if(r3&&window.getResizeHandle){const hh=window.getResizeHandle(r3,e.offsetX,e.offsetY);if(hh)cur=hh.cursor;}
      if(cur==='crosshair'&&r3){const wo3=window.screenToWorld(e.offsetX,e.offsetY);if(wo3.x>r3.x&&wo3.x<r3.x+r3.w&&wo3.y>r3.y&&wo3.y<r3.y+r3.h)cur='grab';}
    }
    if(cur==='crosshair'){const wo3=window.screenToWorld(e.offsetX,e.offsetY);if(TK.rooms.some(r=>wo3.x>r.x&&wo3.x<r.x+r.w&&wo3.y>r.y&&wo3.y<r.y+r.h))cur='move';}
    if(cur==='crosshair'&&window._dimHitAreas){if(window._dimHitAreas.some(h=>Math.hypot(e.offsetX-h.hx,e.offsetY-h.hy)<h.r+8))cur='ns-resize';}
    cvEl.style.cursor=cur;}
  });

  cv.addEventListener('mouseup',e=>{
    if(TK._dimDrag){if(window.saveSnapshot)saveSnapshot();TK._dimDrag=null;return;}
  if(TK._moveEl){if(window.saveSnapshot)saveSnapshot();TK._moveEl=null;window.redraw();return;}
    if(TK._pan){TK._pan=null;return;}
    if(TK._resize){window.saveSnapshot();TK._resize=null;return;}
    if(TK._wallEnd){window.saveSnapshot();TK._wallEnd=null;return;}
    if(TK._draw?.active){
      TK._draw.active=false;window.activePreview=null;
      const s=snap(e.offsetX,e.offsetY,e.shiftKey);
      const w=Math.abs(s.x-TK._draw.start.x),h=Math.abs(s.y-TK._draw.start.y);
      if(w>50&&h>50){window.saveSnapshot();const tp=(window.TK_ROOM_TYPES||[])[7]||{color:'#aaa',id:'anna'};TK.rooms.push({id:TK.nextId++,name:'Rom '+TK.nextId,type:tp.id,x:Math.min(TK._draw.start.x,s.x),y:Math.min(TK._draw.start.y,s.y),w,h,color:tp.color,wallThickness:TK.wallThickness});if(window.updateSidebar)updateSidebar();}
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

  window.deleteSelected=()=>{if(!TK.selectedId)return;if(window.saveSnapshot)saveSnapshot();if(window.cascadeDelete)cascadeDelete(TK.selectedId,TK.selectedType||'room');};;
  window.copySelected=()=>{const r=TK.rooms.find(x=>x.id===TK.selectedId);if(r)TK.clipboard={...r};};
  window.pasteClipboard=()=>{if(!TK.clipboard)return;window.saveSnapshot();TK.rooms.push({...TK.clipboard,id:TK.nextId++,x:TK.clipboard.x+TK.scale*0.5,y:TK.clipboard.y+TK.scale*0.5});if(window.updateSidebar)updateSidebar();window.redraw();};
});
})();
