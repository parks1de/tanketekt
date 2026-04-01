import fs from "fs";
import path from "path";
import dotenv from "dotenv";
dotenv.config();
const DIR = process.env.PROJECT_DIR || "C:\\Users\\bness\\OneDrive\\02_PARKSIDE\\05_PROSJEKT\\TankeTekt";
const write = (f,v) => { fs.writeFileSync(path.join(DIR,f),v,"utf8"); console.log(`  ✅ ${f} (${v.length}ch)`); };

// ── CANVAS.JS: add dimension line system ─────────────────────────────────────
let cv = fs.readFileSync(path.join(DIR,"src/canvas.js"),"utf8");

const dimCode = `
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
  // Room walls
  TK.rooms.forEach(r=>{
    if(!r.dimOffsets) r.dimOffsets={top:40,right:40,bottom:40,left:40};
    const s=worldToScreen(r.x,r.y); const rw=r.w*TK.zoom,rh=r.h*TK.zoom;
    const lm=(r.w/TK.scale).toFixed(2)+'m', hm=(r.h/TK.scale).toFixed(2)+'m';
    drawDimLine(ctx, s.x,s.y, s.x+rw,s.y, lm, -r.dimOffsets.top, 0,-1, r.id,'room-top');
    drawDimLine(ctx, s.x+rw,s.y, s.x+rw,s.y+rh, hm, r.dimOffsets.right, 1,0, r.id,'room-right');
    drawDimLine(ctx, s.x,s.y+rh, s.x+rw,s.y+rh, lm, r.dimOffsets.bottom, 0,1, r.id,'room-bottom');
    drawDimLine(ctx, s.x,s.y, s.x,s.y+rh, hm, -r.dimOffsets.left, -1,0, r.id,'room-left');
  });
  // Standalone walls
  TK.walls.forEach(w=>{
    if(w.dimOffset===undefined) w.dimOffset=40;
    const s1=worldToScreen(w.x1,w.y1), s2=worldToScreen(w.x2,w.y2);
    const len=Math.hypot(s2.x-s1.x,s2.y-s1.y); if(len<10)return;
    const ux2=(s2.x-s1.x)/len, uy2=(s2.y-s1.y)/len;
    const onx2=-uy2, ony2=ux2; // left perpendicular
    const lbl=(Math.hypot(w.x2-w.x1,w.y2-w.y1)/TK.scale).toFixed(2)+'m';
    drawDimLine(ctx, s1.x,s1.y, s2.x,s2.y, lbl, w.dimOffset, onx2,ony2, w.id,'wall');
  });
}
// ── END DIMENSION LINE SYSTEM ────────────────────────────────────────────────
`;

// Insert dim system before the closing IIFE or before zoomToFit
if(!cv.includes('_dimHitAreas')){
  cv = cv.replace('window.zoomToFit=', dimCode + '\nwindow.zoomToFit=');
  // Call drawAllDims at end of redraw, before snap indicator
  cv = cv.replace(
    '// Doors & Windows',
    '// Dimension lines (all walls)\n  if(TK.showOuterDims) drawAllDims(ctx);\n  // Doors & Windows'
  );
  // Remove old wall length labels on wall (they're now dim lines)
  cv = cv.replace(
    /if\(len>50&&\(w\.id===TK\.selectedId\|\|TK\.showOuterDims\)\)\{[\s\S]*?ctx\.restore\(\);\s*\}/,
    '// Length label moved to dimension lines'
  );
}
write("src/canvas.js", cv);

// ── DRAWING.JS: drag dimension lines ─────────────────────────────────────────
let dr = fs.readFileSync(path.join(DIR,"src/drawing.js"),"utf8");

const dimDragCode = `
  // Check dim line drag start
  if(TK.showOuterDims&&window._dimHitAreas){
    for(const h of window._dimHitAreas){
      if(Math.hypot(e.offsetX-h.hx,e.offsetY-h.hy)<h.r+8){
        TK._dimDrag={...h,startX:e.offsetX,startY:e.offsetY};
        return;
      }
    }
  }`;

// Insert dim drag check before the pan check in mousedown
dr = dr.replace(
  `if(e.altKey||e.button===1){`,
  dimDragCode + `\n    if(e.altKey||e.button===1){`
);

// Handle dim drag in mousemove
const dimDragMove = `
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
    }`;

dr = dr.replace(
  `const wo=window.screenToWorld(e.offsetX,e.offsetY);`,
  dimDragMove + `\n    const wo=window.screenToWorld(e.offsetX,e.offsetY);`
);

// Release dim drag on mouseup
dr = dr.replace(
  `if(TK._pan){TK._pan=null;return;}`,
  `if(TK._dimDrag){if(window.saveSnapshot)saveSnapshot();TK._dimDrag=null;return;}\n    if(TK._pan){TK._pan=null;return;}`
);

// Cursor feedback on mousemove for dim lines
dr = dr.replace(
  `window.snapIndicator=null;`,
  `window.snapIndicator=null;
    if(TK.showOuterDims&&window._dimHitAreas){
      const onDim=window._dimHitAreas.some(h=>Math.hypot(e.offsetX-h.hx,e.offsetY-h.hy)<h.r+8);
      document.getElementById('floorplan').style.cursor=onDim?'ns-resize':'crosshair';
    }`
);

write("src/drawing.js", dr);
console.log("\n✅ Dimension lines added. Ctrl+Shift+R to reload.");
