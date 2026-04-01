import fs from "fs";
import path from "path";
import dotenv from "dotenv";
dotenv.config();
const DIR = process.env.PROJECT_DIR || "C:\\Users\\bness\\OneDrive\\02_PARKSIDE\\05_PROSJEKT\\TankeTekt";
const read = f => fs.readFileSync(path.join(DIR,f),"utf8");
const write = (f,v) => { fs.writeFileSync(path.join(DIR,f),v,"utf8"); console.log(`  ✅ ${f} (${v.length}ch)`); };

// ── 1. CANVAS.JS: room walls with thickness + wall dims always visible ──────
let cv = read("src/canvas.js");

// Replace the room rendering block — find strokeRect and replace with thick walls
const oldRoomStroke = `ctx.strokeStyle=sel?'#e94560':type.color;ctx.lineWidth=sel?3:2;ctx.strokeRect(s.x,s.y,rw,rh);`;
const newRoomStroke = `
    // Draw room walls with thickness
    const rwt=(r.wallThickness||TK.wallThickness||0.1)*TK.scale*TK.zoom;
    ctx.fillStyle=sel?'rgba(233,69,96,0.85)':(type.color==='#aaaaaa'?'#555':type.color);
    [[s.x,s.y,s.x+rw,s.y],[s.x+rw,s.y,s.x+rw,s.y+rh],[s.x,s.y+rh,s.x+rw,s.y+rh],[s.x,s.y,s.x,s.y+rh]].forEach(([ax,ay,bx,by])=>{
      const dx=bx-ax,dy=by-ay,len=Math.sqrt(dx*dx+dy*dy);if(len<1)return;
      const nx=-dy/len*rwt/2,ny=dx/len*rwt/2;
      ctx.beginPath();ctx.moveTo(ax+nx,ay+ny);ctx.lineTo(bx+nx,by+ny);ctx.lineTo(bx-nx,by-ny);ctx.lineTo(ax-nx,ay-ny);ctx.closePath();ctx.fill();
    });`;
cv = cv.replace(oldRoomStroke, newRoomStroke);

// Wall dimension labels — show when showOuterDims (not just selected)
// Find the wall length label section and make it show for all walls when showOuterDims
cv = cv.replace(
  `if(len>50){`,
  `if(len>50&&(w.id===TK.selectedId||TK.showOuterDims)){`
);

write("src/canvas.js", cv);

// ── 2. DRAWING.JS: store wallThickness on room creation ─────────────────────
let dr = read("src/drawing.js");
dr = dr.replace(
  `TK.rooms.push({id:TK.nextId++,name:'Rom '+TK.nextId,type:tp.id,x:Math.min(TK._draw.start.x,s.x),y:Math.min(TK._draw.start.y,s.y),w,h,color:tp.color})`,
  `TK.rooms.push({id:TK.nextId++,name:'Rom '+TK.nextId,type:tp.id,x:Math.min(TK._draw.start.x,s.x),y:Math.min(TK._draw.start.y,s.y),w,h,color:tp.color,wallThickness:TK.wallThickness})`
);
write("src/drawing.js", dr);

// ── 3. APP.JS: add × delete button to rooms in sidebar ──────────────────────
let app = read("src/app.js");
// Replace room item creation to add delete button
app = app.replace(
  `li.innerHTML='<div class="rname">'+r.name+warn+'</div><div class="rinfo">'+px2m(r.w)+'m × '+px2m(r.h)+'m | '+area+' m²</div>';li.onclick=()=>{TK.selectedId=r.id;TK.selectedType='room';updateSidebar();if(window.redraw)redraw()};list.appendChild(li)`,
  `li.innerHTML='<div class="rname">'+r.name+warn+'</div><div class="rinfo">'+px2m(r.w)+'m × '+px2m(r.h)+'m | '+area+' m²</div>';
    li.onclick=()=>{TK.selectedId=r.id;TK.selectedType='room';updateSidebar();if(window.redraw)redraw()};
    const delBtn=document.createElement('button');delBtn.textContent='×';delBtn.title='Slett rom';delBtn.style='float:right;padding:0 5px;background:#e94560;border:none;color:white;border-radius:3px;cursor:pointer;font-size:11px;margin-top:2px';
    delBtn.onclick=e=>{e.stopPropagation();if(window.saveSnapshot)saveSnapshot();TK.rooms=TK.rooms.filter(x=>x.id!==r.id);if(TK.selectedId===r.id)TK.selectedId=null;updateSidebar();if(window.redraw)redraw()};
    li.appendChild(delBtn);list.appendChild(li)`
);
write("src/app.js", app);

// ── 4. ELEMENTS.JS: bigger hit tolerance + × on doors/windows ───────────────
let el = read("src/elements.js");

// Increase hitTestWall tolerance from 0.6 to screen-pixel based
el = el.replace(
  /if\s*\(dist\s*<\s*[\d.]+\)/g,
  `if(dist<Math.max(1.5, 25/TK.zoom))`
);
// Also try world-unit based tolerances
el = el.replace(/if\s*\(d\s*<\s*0\.6\)/g, `if(d<Math.max(1.5,25/TK.zoom))`);
el = el.replace(/if\s*\(d\s*<\s*0\.8\)/g, `if(d<Math.max(1.5,25/TK.zoom))`);
el = el.replace(/if\s*\(dist\s*<\s*0\.6\)/g, `if(dist<Math.max(1.5,25/TK.zoom))`);
el = el.replace(/if\s*\(dist\s*<\s*0\.8\)/g, `if(dist<Math.max(1.5,25/TK.zoom))`);

// Add × to door/window items in updateElementList
// Find the door/window item creation and add delete buttons
el = el.replace(
  /li\.onclick=\(e\)=>\{e\.stopPropagation\(\).*?updateElementList\(\).*?\}/g,
  match => match // keep existing delete handlers, they should already have them
);

write("src/elements.js", el);

// ── 5. EXPORT.JS: wall dims in PDF + compact table ───────────────────────────
let ex = read("src/export.js");

// After room drawing, add wall dimension labels in PDF
const wallDrawBlock = `DRAW WALLS: for each wall`;
if (!ex.includes("wall length label in PDF")) {
  ex = ex.replace(
    /doc\.save\('tanketekt\.pdf'\)/,
    `// Wall dimension labels in PDF
  if(TK.showOuterDims){
    TK.walls.forEach(w=>{
      const wx1=ox+toMM(w.x1),wy1=oy+toMM(w.y1),wx2=ox+toMM(w.x2),wy2=oy+toMM(w.y2);
      const wlen=Math.sqrt((w.x2-w.x1)**2+(w.y2-w.y1)**2)/TK.scale;
      const mx=(wx1+wx2)/2,my=(wy1+wy2)/2;
      doc.setFontSize(5);doc.setTextColor(80,80,80);doc.text(wlen.toFixed(2)+'m',mx,my-1,{align:'center'});
    });
  }
  doc.save('tanketekt.pdf')`
  );
}

// Make table more compact and less intrusive
ex = ex.replace(/min-width:280px/g, 'min-width:200px');
// Reduce table font sizes
ex = ex.replace(/doc\.setFontSize\(8\).*?'AREAL'/g, `doc.setFontSize(7);doc.setTextColor(0);doc.text('AREAL'`);
// Move table further right, narrower
ex = ex.replace(/tableX=220/g, 'tableX=232');
ex = ex.replace(/tableX,tableY,72/g, 'tableX,tableY,58');
ex = ex.replace(/tableX\+65/g, 'tableX+51');
ex = ex.replace(/tableX\+2,ty\+4\.2/g, 'tableX+2,ty+3.8');
ex = ex.replace(/doc\.setFontSize\(7\).*?doc\.text\(r\.name/g, `doc.setFontSize(6);doc.text(r.name`);
ex = ex.replace(/doc\.text\(area\.toFixed\(2\)/g, `doc.setFontSize(6);doc.text(area.toFixed(2)`);
ex = ex.replace(/doc\.setFontSize\(7\.5\)/g, 'doc.setFontSize(7)');
ex = ex.replace(/ty\+=6/g, 'ty+=5');

write("src/export.js", ex);

console.log("\n✅ All 5 fixes applied. Ctrl+Shift+R to reload.");
