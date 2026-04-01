import fs from "fs";
import path from "path";
import dotenv from "dotenv";
dotenv.config();
const DIR = process.env.PROJECT_DIR || "C:\\Users\\bness\\OneDrive\\02_PARKSIDE\\05_PROSJEKT\\TankeTekt";
const write = (f,v) => { fs.writeFileSync(path.join(DIR,f),v,"utf8"); console.log(`  ✅ ${f} (${v.length}ch)`); };

// ── APP.JS: fix ghost init — set _cx/_cy to canvas center immediately ─────────
let app = fs.readFileSync(path.join(DIR,"src/app.js"),"utf8");

// When setting ghostObject, immediately place it at canvas center
app = app.replace(
  `TK.ghostObject={type:'room',w:l*TK.scale,h:b*TK.scale,roomType:tid,color:tp.color,name:'Rom '+TK.nextId};
    TK.currentTool='ghost';`,
  `const cv2=document.getElementById('floorplan');
    const cx2=cv2?cv2.width/2:400, cy2=cv2?cv2.height/2:300;
    const wo2=window.screenToWorld?window.screenToWorld(cx2,cy2):{x:cx2,y:cy2};
    TK.ghostObject={type:'room',w:l*TK.scale,h:b*TK.scale,roomType:tid,color:tp.color,name:'Rom '+TK.nextId,_cx:wo2.x,_cy:wo2.y};
    TK.currentTool='ghost';`
);
app = app.replace(
  `TK.ghostObject={type:'wall',length:l*TK.scale,thickness:th};
    TK.currentTool='ghost';`,
  `const cv3=document.getElementById('floorplan');
    const cx3=cv3?cv3.width/2:400, cy3=cv3?cv3.height/2:300;
    const wo3=window.screenToWorld?window.screenToWorld(cx3,cy3):{x:cx3,y:cy3};
    TK.ghostObject={type:'wall',length:l*TK.scale,thickness:th,_cx:wo3.x,_cy:wo3.y};
    TK.currentTool='ghost';`
);
// Redraw after setting ghost so it appears immediately
app = app.replace(
  `if(window.setStatus)setStatus('Klikk for å plassere rom`,
  `if(window.redraw)setTimeout(redraw,50);if(window.setStatus)setStatus('Klikk for å plassere rom`
);
app = app.replace(
  `if(window.setStatus)setStatus('Klikk for å plassere vegg`,
  `if(window.redraw)setTimeout(redraw,50);if(window.setStatus)setStatus('Klikk for å plassere vegg`
);
write("src/app.js", app);

// ── DRAWING.JS: full rewrite of interaction logic ─────────────────────────────
let dr = fs.readFileSync(path.join(DIR,"src/drawing.js"),"utf8");

// Fix 1: ghost placement should fire on mousedown not mouseup (prevents modal bleed-through)
// Add a flag: ghost can only place if mouse has moved since tool was set
// Also: use window.snapPoint explicitly throughout

// Fix 2: add drag-move for rooms, walls, doors, windows
// Drag = click body (not handle) of selected element and move

// Find the ghost place code in mouseup and add a "hasMoved" guard
dr = dr.replace(
  `if(TK.currentTool==='ghost'&&TK.ghostObject){`,
  `if(TK.currentTool==='ghost'&&TK.ghostObject&&TK._ghostMoved){TK._ghostMoved=false;`
);
// Set ghostMoved=true in mousemove
dr = dr.replace(
  `if(TK.currentTool==='ghost'&&TK.ghostObject){
      const wo=window.screenToWorld(e.offsetX,e.offsetY);
      const snapped=e.shiftKey?wo:snapPoint(e.offsetX,e.offsetY,false);`,
  `if(TK.currentTool==='ghost'&&TK.ghostObject){
      TK._ghostMoved=true;
      const wo=window.screenToWorld(e.offsetX,e.offsetY);
      const snapped=e.shiftKey?wo:(window.snapPoint?window.snapPoint(e.offsetX,e.offsetY,false):wo);`
);

// Fix 3: add drag-move in mousedown (click body of selected element = start move)
const dragMoveStart = `
  // Drag-move: click body of selected element to move it
  if(TK.selectedId&&!TK._resize&&!TK._wallEnd){
    const wo2=window.screenToWorld(e.offsetX,e.offsetY);
    if(TK.selectedType==='room'){
      const r=TK.rooms.find(x=>x.id===TK.selectedId);
      if(r&&wo2.x>r.x&&wo2.x<r.x+r.w&&wo2.y>r.y&&wo2.y<r.y+r.h){
        TK._moveEl={type:'room',id:r.id,startSX:e.offsetX,startSY:e.offsetY,origX:r.x,origY:r.y};return;
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
  }`;

dr = dr.replace(
  `// Check dim line drag start`,
  dragMoveStart+`\n  // Check dim line drag start`
);

// Handle drag-move in mousemove
const dragMoveMove = `
    if(TK._moveEl){
      const dx=(e.offsetX-TK._moveEl.startSX)/TK.zoom;
      const dy=(e.offsetY-TK._moveEl.startSY)/TK.zoom;
      if(TK._moveEl.type==='room'){
        const r=TK.rooms.find(x=>x.id===TK._moveEl.id);
        if(r){
          const snapped=e.shiftKey?{x:TK._moveEl.origX+dx,y:TK._moveEl.origY+dy}:window.snapPoint?window.snapPoint(e.offsetX-(TK._moveEl.origX+r.w/2-TK.panX)*TK.zoom/TK.zoom,e.offsetY-(TK._moveEl.origY+r.h/2-TK.panY)*TK.zoom/TK.zoom,false):{x:TK._moveEl.origX+dx,y:TK._moveEl.origY+dy};
          r.x=TK._moveEl.origX+dx; r.y=TK._moveEl.origY+dy;
        }
      } else if(TK._moveEl.type==='wall'){
        const w=TK.walls.find(x=>x.id===TK._moveEl.id);
        if(w){w.x1=TK._moveEl.ox1+dx;w.y1=TK._moveEl.oy1+dy;w.x2=TK._moveEl.ox2+dx;w.y2=TK._moveEl.oy2+dy;}
      } else if(TK._moveEl.type==='door'||TK._moveEl.type==='window'){
        const arr=TK._moveEl.type==='door'?TK.doors:TK.windows;
        const el=arr.find(x=>x.id===TK._moveEl.id);
        if(el&&window.hitTestAll){const hit=window.hitTestAll(e.offsetX,e.offsetY);if(hit){if(hit.type==='wall'){el.wallId=hit.wallId;delete el.roomId;delete el.edge;}else{el.roomId=hit.roomId;el.edge=hit.edge;delete el.wallId;}el.t=hit.t;}}
      }
      window.redraw(); return;
    }`;

dr = dr.replace(
  `if(TK._pan){TK.panX=TK._pan.px+(e.offsetX-TK._pan.sx);TK.panY=TK._pan.py+(e.offsetY-TK._pan.sy);window.redraw();return;}`,
  `if(TK._pan){TK.panX=TK._pan.px+(e.offsetX-TK._pan.sx);TK.panY=TK._pan.py+(e.offsetY-TK._pan.sy);window.redraw();return;}`+dragMoveMove
);

// Handle drag-move release in mouseup
const dragMoveUp = `
  if(TK._moveEl){if(window.saveSnapshot)saveSnapshot();TK._moveEl=null;window.redraw();return;}`;
dr = dr.replace(
  `if(TK._dimDrag){if(window.saveSnapshot)saveSnapshot();TK._dimDrag=null;return;}`,
  `if(TK._dimDrag){if(window.saveSnapshot)saveSnapshot();TK._dimDrag=null;return;}`+dragMoveUp
);

// Fix cursor for move state
dr = dr.replace(
  `document.getElementById('floorplan').style.cursor=onDim?'ns-resize':'crosshair';`,
  `const cvEl=document.getElementById('floorplan');
      if(TK._moveEl) cvEl.style.cursor='grabbing';
      else if(TK.selectedId){
        const wo3=window.screenToWorld(e.offsetX,e.offsetY);
        const r3=TK.rooms.find(x=>x.id===TK.selectedId&&TK.selectedType==='room');
        const inBody=r3&&wo3.x>r3.x&&wo3.x<r3.x+r3.w&&wo3.y>r3.y&&wo3.y<r3.y+r3.h;
        cvEl.style.cursor=onDim?'ns-resize':inBody?'grab':'crosshair';
      } else cvEl.style.cursor=onDim?'ns-resize':'crosshair';`
);

write("src/drawing.js", dr);
console.log("\n✅ Done. Ctrl+Shift+R to reload.");
console.log("   Ghost: appears immediately at canvas center, follows cursor");
console.log("   Move: click+drag body of any selected element to reposition");
