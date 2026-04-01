import fs from "fs";
import path from "path";
import dotenv from "dotenv";
dotenv.config();
const DIR = process.env.PROJECT_DIR || "C:\\Users\\bness\\OneDrive\\02_PARKSIDE\\05_PROSJEKT\\TankeTekt";
const write = (f,v) => { fs.writeFileSync(path.join(DIR,f),v,"utf8"); console.log(`  ✅ ${f} (${v.length}ch)`); };

let cv = fs.readFileSync(path.join(DIR,"src/canvas.js"),"utf8");

// ── 1. FIX ROOM RENDERING: fill-outer/cut-inner for merged corners ───────────
const oldRoomRender = `const rwt=(r.wallThickness||TK.wallThickness||0.1)*TK.scale*TK.zoom;
    ctx.fillStyle=sel?'rgba(233,69,96,0.85)':(type.color==='#aaaaaa'?'#555':type.color);
    [[s.x,s.y,s.x+rw,s.y],[s.x+rw,s.y,s.x+rw,s.y+rh],[s.x,s.y+rh,s.x+rw,s.y+rh],[s.x,s.y,s.x,s.y+rh]].forEach(([ax,ay,bx,by])=>{
      const dx=bx-ax,dy=by-ay,len=Math.sqrt(dx*dx+dy*dy);if(len<1)return;
      const nx=-dy/len*rwt/2,ny=dx/len*rwt/2;
      ctx.beginPath();ctx.moveTo(ax+nx,ay+ny);ctx.lineTo(bx+nx,by+ny);ctx.lineTo(bx-nx,by-ny);ctx.lineTo(ax-nx,ay-ny);ctx.closePath();ctx.fill();
    });`;

const newRoomRender = `const rwt=(r.wallThickness||TK.wallThickness||0.1)*TK.scale*TK.zoom;
    const hwt=rwt/2; // half wall thickness in screen px
    const wallCol=sel?'rgba(233,69,96,0.85)':(type.color==='#aaaaaa'?'#555':type.color);
    // Fill outer bounding box (merges all 4 corners perfectly)
    ctx.fillStyle=wallCol;
    ctx.fillRect(s.x-hwt,s.y-hwt,rw+rwt,rh+rwt);
    // Cut inner area with room fill
    const innerW=rw-rwt, innerH=rh-rwt;
    if(innerW>0&&innerH>0){
      ctx.fillStyle=type.color+'22';
      ctx.fillRect(s.x+hwt,s.y+hwt,innerW,innerH);
    }
    // Selection outline
    if(sel){ctx.strokeStyle='#e94560';ctx.lineWidth=2;ctx.strokeRect(s.x-hwt,s.y-hwt,rw+rwt,rh+rwt);}`;

if(cv.includes('rwt/2,ny=dx/len*rwt/2')){
  cv = cv.replace(oldRoomRender, newRoomRender);
  console.log("  ✔ Room corner rendering fixed");
} else {
  // Try simpler replacement
  cv = cv.replace(
    /const rwt=\(r\.wallThickness.*?ctx\.fill\(\);\s*\}\);/s,
    newRoomRender
  );
  console.log("  ✔ Room rendering patched (fallback)");
}

// ── 2. FIX drawAllDims: separate outer/inner using wall thickness ─────────────
const oldDimFn = /function drawAllDims\(ctx\)\{[\s\S]*?\}\s*\/\/ ── END DIMENSION LINE SYSTEM/;

const newDimFn = `function drawAllDims(ctx){
  window._dimHitAreas=[];
  TK.rooms.forEach(r=>{
    if(!r.dimOffsets)r.dimOffsets={top:40,right:40,bottom:40,left:40};
    const s=worldToScreen(r.x,r.y);const rw=r.w*TK.zoom,rh=r.h*TK.zoom;
    const rwt=(r.wallThickness||TK.wallThickness||0.1)*TK.scale*TK.zoom;
    const hwt=rwt/2;
    // Outer dimensions (outside of outer wall face)
    if(TK.showOuterDims){
      const lmO=((r.w+r.wallThickness||TK.wallThickness)/TK.scale).toFixed(2)+'m';
      const hmO=((r.h+r.wallThickness||TK.wallThickness)/TK.scale).toFixed(2)+'m';
      // Top outer edge = s.y - hwt
      drawDimLine(ctx,s.x-hwt,s.y-hwt,s.x+rw+hwt,s.y-hwt,lmO,-r.dimOffsets.top,0,-1,r.id,'room-top');
      // Right outer edge = s.x+rw+hwt
      drawDimLine(ctx,s.x+rw+hwt,s.y-hwt,s.x+rw+hwt,s.y+rh+hwt,hmO,r.dimOffsets.right,1,0,r.id,'room-right');
      // Bottom outer edge
      drawDimLine(ctx,s.x-hwt,s.y+rh+hwt,s.x+rw+hwt,s.y+rh+hwt,lmO,r.dimOffsets.bottom,0,1,r.id,'room-bottom');
      // Left outer edge
      drawDimLine(ctx,s.x-hwt,s.y-hwt,s.x-hwt,s.y+rh+hwt,hmO,-r.dimOffsets.left,-1,0,r.id,'room-left');
    }
    // Inner dimensions (inside of inner wall face)
    if(TK.showInnerDims){
      const innerW=rw-rwt, innerH=rh-rwt;
      if(innerW>10&&innerH>10){
        const lmI=(innerW/TK.zoom/TK.scale).toFixed(2)+'m';
        const hmI=(innerH/TK.zoom/TK.scale).toFixed(2)+'m';
        const ix=s.x+hwt, iy=s.y+hwt;
        // Draw inner dims inside the room, offset inward
        const inOff=18;
        drawDimLine(ctx,ix,iy,ix+innerW,iy,lmI,inOff,0,1,r.id,'room-inner-top');
        drawDimLine(ctx,ix,iy,ix,iy+innerH,hmI,inOff,1,0,r.id,'room-inner-left');
      }
    }
  });
  // Standalone walls
  TK.walls.forEach(w=>{
    if(w.dimOffset===undefined)w.dimOffset=40;
    const s1=worldToScreen(w.x1,w.y1),s2=worldToScreen(w.x2,w.y2);
    const len=Math.hypot(s2.x-s1.x,s2.y-s1.y);if(len<10)return;
    const ux2=(s2.x-s1.x)/len,uy2=(s2.y-s1.y)/len;
    const lbl=(Math.hypot(w.x2-w.x1,w.y2-w.y1)/TK.scale).toFixed(2)+'m';
    if(TK.showOuterDims){
      drawDimLine(ctx,s1.x,s1.y,s2.x,s2.y,lbl,w.dimOffset,-uy2,ux2,w.id,'wall');
    }
  });
}
// ── END DIMENSION LINE SYSTEM`;

if(cv.match(oldDimFn)){
  cv = cv.replace(oldDimFn, newDimFn);
  console.log("  ✔ drawAllDims rewritten with outer/inner split");
} else {
  // Fallback: find and replace just the function body
  const start = cv.indexOf('function drawAllDims(ctx){');
  const end = cv.indexOf('// ── END DIMENSION LINE SYSTEM');
  if(start>-1&&end>-1){
    cv = cv.slice(0,start)+newDimFn+'\n'+cv.slice(end+'// ── END DIMENSION LINE SYSTEM'.length);
    console.log("  ✔ drawAllDims replaced (fallback)");
  } else {
    console.log("  ⚠ Could not find drawAllDims — adding fresh");
    cv = cv.replace('window.zoomToFit=', newDimFn+'\nwindow.zoomToFit=');
  }
}

// ── 3. FIX: outer dims label should use actual outer measurement ─────────────
// The outer width = r.w + wallThickness (wall centered on edge, so +full thickness)
// Fix the label calculation properly
cv = cv.replace(
  /const lmO=\(\(r\.w\+r\.wallThickness\|\|TK\.wallThickness\)\/TK\.scale\)\.toFixed\(2\)\+'m'/,
  `const wt=(r.wallThickness||TK.wallThickness||0.1);const lmO=((r.w/TK.scale)+wt).toFixed(2)+'m'`
);
cv = cv.replace(
  /const hmO=\(\(r\.h\+r\.wallThickness\|\|TK\.wallThickness\)\/TK\.scale\)\.toFixed\(2\)\+'m'/,
  `const hmO=((r.h/TK.scale)+wt).toFixed(2)+'m'`
);

write("src/canvas.js", cv);
console.log("\n✅ Done. Ctrl+Shift+R to reload.");
console.log("   Outer dims = outside wall face to outside wall face");
console.log("   Inner dims = inside wall face to inside wall face");
