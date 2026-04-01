import fs from "fs";
import path from "path";
import dotenv from "dotenv";
dotenv.config();
const DIR = process.env.PROJECT_DIR || "C:\\Users\\bness\\OneDrive\\02_PARKSIDE\\05_PROSJEKT\\TankeTekt";
const read = f => fs.readFileSync(path.join(DIR,f),"utf8");
const write = (f,v) => { fs.writeFileSync(path.join(DIR,f),v,"utf8"); console.log(`  ✅ ${f} (${v.length}ch)`); };

// ── 1. FIX DIMENSIONS in canvas.js ───────────────────────────────────────────
let cv = read("src/canvas.js");

// Completely replace drawAllDims with clean correct version
const dimStart = cv.indexOf('function drawAllDims(ctx){');
const dimEnd = cv.indexOf('// ── END DIMENSION LINE SYSTEM');
if(dimStart > -1 && dimEnd > -1) {
  const newDimFn = `function drawAllDims(ctx){
  window._dimHitAreas=[];
  TK.rooms.forEach(r=>{
    if(!r.dimOffsets)r.dimOffsets={top:40,right:40,bottom:40,left:40};
    const s=worldToScreen(r.x,r.y);
    const rw=r.w*TK.zoom, rh=r.h*TK.zoom;
    const wt=(r.wallThickness||TK.wallThickness||0.1);
    const hwt=wt*TK.scale*TK.zoom/2; // half wall thickness in screen px
    // Outer dimensions — from outer wall face to outer wall face
    if(TK.showOuterDims){
      const lmO=((r.w/TK.scale)+wt).toFixed(2)+'m';
      const hmO=((r.h/TK.scale)+wt).toFixed(2)+'m';
      drawDimLine(ctx, s.x-hwt, s.y-hwt, s.x+rw+hwt, s.y-hwt, lmO, -r.dimOffsets.top,    0,-1, r.id,'room-top');
      drawDimLine(ctx, s.x+rw+hwt, s.y-hwt, s.x+rw+hwt, s.y+rh+hwt, hmO, r.dimOffsets.right, 1, 0, r.id,'room-right');
      drawDimLine(ctx, s.x-hwt, s.y+rh+hwt, s.x+rw+hwt, s.y+rh+hwt, lmO, r.dimOffsets.bottom, 0, 1, r.id,'room-bottom');
      drawDimLine(ctx, s.x-hwt, s.y-hwt, s.x-hwt, s.y+rh+hwt, hmO, -r.dimOffsets.left, -1, 0, r.id,'room-left');
    }
    // Inner dimensions — from inner wall face to inner wall face (only if showInnerDims AND not already showing outer)
    if(TK.showInnerDims && !TK.showOuterDims){
      const innerW=rw-wt*TK.scale*TK.zoom;
      const innerH=rh-wt*TK.scale*TK.zoom;
      if(innerW>20&&innerH>20){
        const lmI=(innerW/TK.zoom/TK.scale).toFixed(2)+'m';
        const hmI=(innerH/TK.zoom/TK.scale).toFixed(2)+'m';
        const ix=s.x+hwt, iy=s.y+hwt;
        drawDimLine(ctx, ix, iy, ix+innerW, iy, lmI, -20, 0,-1, r.id,'room-inner-top');
        drawDimLine(ctx, ix, iy, ix, iy+innerH, hmI, -20,-1, 0, r.id,'room-inner-left');
      }
    }
    // Both: show outer outside + inner inside
    if(TK.showInnerDims && TK.showOuterDims){
      const innerW=rw-wt*TK.scale*TK.zoom;
      const innerH=rh-wt*TK.scale*TK.zoom;
      if(innerW>20&&innerH>20){
        const lmI=(innerW/TK.zoom/TK.scale).toFixed(2)+'m';
        const hmI=(innerH/TK.zoom/TK.scale).toFixed(2)+'m';
        const ix=s.x+hwt, iy=s.y+hwt;
        drawDimLine(ctx, ix, iy+innerH, ix+innerW, iy+innerH, lmI, 20, 0, 1, r.id,'room-inner-bot');
        drawDimLine(ctx, ix+innerW, iy, ix+innerW, iy+innerH, hmI, 20, 1, 0, r.id,'room-inner-right');
      }
    }
  });
  // Standalone walls
  if(TK.showOuterDims){
    TK.walls.forEach(w=>{
      if(w.dimOffset===undefined)w.dimOffset=40;
      const s1=worldToScreen(w.x1,w.y1),s2=worldToScreen(w.x2,w.y2);
      const len=Math.hypot(s2.x-s1.x,s2.y-s1.y);if(len<10)return;
      const ux2=(s2.x-s1.x)/len,uy2=(s2.y-s1.y)/len;
      const lbl=(Math.hypot(w.x2-w.x1,w.y2-w.y1)/TK.scale).toFixed(2)+'m';
      drawDimLine(ctx,s1.x,s1.y,s2.x,s2.y,lbl,w.dimOffset,-uy2,ux2,w.id,'wall');
    });
  }
}`;
  cv = cv.slice(0, dimStart) + newDimFn + '\n' + cv.slice(dimEnd);
  console.log("  ✔ drawAllDims rewritten");
}
write("src/canvas.js", cv);

// ── 2. FIX DRAWING.JS: resize priority + better snap ─────────────────────────
let dr = read("src/drawing.js");

// Fix resize priority: check handles BEFORE drag-move
// The drag-move check is currently after dim drag. Move resize check to BEFORE drag-move.
const resizeCheck = `
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
  }`;

// Insert resize check at very start of mousedown (after ghost/dim/pan checks)
// Find the existing drag-move start and insert BEFORE it
dr = dr.replace(
  `// Drag-move: click body of selected element to move it`,
  resizeCheck + `\n  // Drag-move: click body of selected element to move it`
);

// Also remove the old resize check that was in the hit-test section (to avoid duplicate)
dr = dr.replace(
  /if\(TK\.selectedType==='room'&&TK\.selectedId\)\{\s*const r=TK\.rooms\.find.*?getResizeHandle.*?return;\}\}\}\s*if\(TK\.selectedType==='wall'&&TK\.selectedId\)\{.*?getWallHandle.*?return;\}\}\}/s,
  `// resize handled above`
);

// Fix snap to show larger radius for wall drawing corners
dr = dr.replace(
  'const SNAP=15/TK.zoom;',
  'const SNAP=20/TK.zoom;'
);

write("src/drawing.js", dr);

// ── 3. FIX EXPORT.JS ─────────────────────────────────────────────────────────
let ex = read("src/export.js");

// Fix exportPNG - ensure it works reliably
const newExportPNG = `window.exportPNG=()=>{
  if(!TK.rooms.length&&!TK.walls.length){if(window.showToast)showToast('Ingen element å eksportere!','error');return;}
  const prev=TK.selectedId; TK.selectedId=null;
  if(window.redraw)redraw();
  setTimeout(()=>{
    try{
      const canvas=document.getElementById('floorplan');
      const url=canvas.toDataURL('image/png');
      const a=document.createElement('a');a.href=url;a.download='tanketekt.png';
      document.body.appendChild(a);a.click();document.body.removeChild(a);
      TK.selectedId=prev;if(window.redraw)redraw();
      if(window.showToast)showToast('PNG eksportert! 🖼️');
    }catch(e){if(window.showToast)showToast('Feil: '+e.message,'error');}
  },100);
};`;

// Replace the existing exportPNG
ex = ex.replace(/window\.exportPNG=\(\)=>\{[\s\S]*?\};(\s*window\.exportPDF)/, newExportPNG+'$1');

// Fix showToast — make sure it's defined early
if(!ex.startsWith('window.showToast')){
  ex = `window.showToast=(msg,type='success')=>{const d=document.createElement('div');d.style='position:fixed;bottom:24px;right:24px;padding:10px 20px;border-radius:6px;font-weight:bold;font-size:13px;color:white;z-index:9999;background:'+(type==='error'?'#e94560':'#238636');d.textContent=msg;document.body.appendChild(d);setTimeout(()=>{d.style.opacity='0';d.style.transition='opacity 0.4s';setTimeout(()=>d.remove(),400)},2500)};\n`+ex;
}

write("src/export.js", ex);
console.log("\n✅ All fixes applied. Ctrl+Shift+R to reload.");
