import fs from "fs";
import path from "path";
import dotenv from "dotenv";
dotenv.config();
const DIR = process.env.PROJECT_DIR || "C:\\Users\\bness\\OneDrive\\02_PARKSIDE\\05_PROSJEKT\\TankeTekt";
const read = f => fs.readFileSync(path.join(DIR,f),"utf8");
const write = (f,v) => { fs.writeFileSync(path.join(DIR,f),v,"utf8"); console.log(`  ✅ ${f} (${v.length}ch)`); };

// ── 1. FIX CANVAS.JS: replace drawAllDims by brute-force section replace ─────
let cv = read("src/canvas.js");
const dimFnStart = cv.indexOf('function drawAllDims(ctx){');
const dimFnEnd = cv.indexOf('\n}', dimFnStart) + 2; // find closing brace
// Find proper end (next blank line or next function)
let searchFrom = dimFnStart + 20;
let braceDepth = 0;
let dimEnd2 = -1;
for(let i = dimFnStart; i < cv.length; i++){
  if(cv[i]==='{') braceDepth++;
  if(cv[i]==='}') { braceDepth--; if(braceDepth===0){dimEnd2=i+1;break;} }
}
if(dimFnStart > -1 && dimEnd2 > -1){
  const newDim = `function drawAllDims(ctx){
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
      dimLine(s.x-hwt,s.y-hwt,s.x+rw+hwt,s.y-hwt,((r.w/TK.scale)+wt).toFixed(2)+'m',-r.dimOffsets.top,0,-1,r.id,'room-top');
      dimLine(s.x+rw+hwt,s.y-hwt,s.x+rw+hwt,s.y+rh+hwt,((r.h/TK.scale)+wt).toFixed(2)+'m',r.dimOffsets.right,1,0,r.id,'room-right');
      dimLine(s.x-hwt,s.y+rh+hwt,s.x+rw+hwt,s.y+rh+hwt,((r.w/TK.scale)+wt).toFixed(2)+'m',r.dimOffsets.bottom,0,1,r.id,'room-bottom');
      dimLine(s.x-hwt,s.y-hwt,s.x-hwt,s.y+rh+hwt,((r.h/TK.scale)+wt).toFixed(2)+'m',-r.dimOffsets.left,-1,0,r.id,'room-left');
    }
    if(TK.showInnerDims){
      const iw=rw-wt*TK.scale*TK.zoom,ih=rh-wt*TK.scale*TK.zoom;
      if(iw>15&&ih>15){
        const ix=s.x+hwt,iy=s.y+hwt;
        const lmI=(iw/TK.zoom/TK.scale).toFixed(2)+'m',hmI=(ih/TK.zoom/TK.scale).toFixed(2)+'m';
        dimLine(ix,iy,ix+iw,iy,lmI,-18,0,-1,r.id,'room-in-top');
        dimLine(ix+iw,iy,ix+iw,iy+ih,hmI,18,1,0,r.id,'room-in-right');
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
}`;
  cv = cv.slice(0, dimFnStart) + newDim + cv.slice(dimEnd2);
  console.log("  ✔ drawAllDims replaced (chars: "+dimFnStart+"–"+dimEnd2+")");
} else { console.log("  ⚠ drawAllDims not found, will add via override script"); }
write("src/canvas.js", cv);

// ── 2. ADD OVERRIDE SCRIPT TO index.html ─────────────────────────────────────
let html = read("index.html");
// Remove previous override if exists
html = html.replace(/<!-- TANKETEKT OVERRIDE[\s\S]*?<\/script>/,'');

const overrideScript = `
<!-- TANKETEKT OVERRIDE -->
<script>
window.addEventListener('load',function(){

// ── EXPORT PNG ──
window.exportPNG=function(){
  if(!TK.rooms.length&&!TK.walls.length){showToast('Ingen element!','error');return;}
  var prev=TK.selectedId;TK.selectedId=null;redraw();
  setTimeout(function(){
    var c=document.getElementById('floorplan');
    var a=document.createElement('a');a.href=c.toDataURL('image/png');a.download='tanketekt.png';
    document.body.appendChild(a);a.click();document.body.removeChild(a);
    TK.selectedId=prev;redraw();showToast('PNG eksportert! 🖼️');
  },120);
};

// ── EXPORT PDF ──
window.exportPDF=function(){
  if(!TK.rooms.length&&!TK.walls.length){showToast('Ingen element!','error');return;}
  if(!window.jspdf){showToast('jsPDF manglar','error');return;}
  var ov=document.createElement('div');ov.className='modal-overlay';
  ov.innerHTML='<div class="modal"><h2>PDF-eksport</h2><label style="display:flex;align-items:center;gap:8px;margin-bottom:10px"><input type="checkbox" id="_pct" checked> Inkluder arealtabell</label><label style="display:flex;align-items:center;gap:8px;margin-bottom:16px"><input type="checkbox" id="_pcb" checked> Vis "teikna av"</label><div id="_pcn" style="margin-bottom:12px"><label>Teikna av (valg.)</label><input id="_pca" placeholder="Namn..." style="width:100%;background:var(--bg);color:var(--text);border:1px solid var(--border);border-radius:4px;padding:6px;margin-top:4px"></div><div class="modal-btns"><button onclick="this.closest(\'.modal-overlay\').remove()">Avbryt</button><button onclick="window._doPDF(this)" style="background:var(--accent);border-color:var(--accent)">Eksporter</button></div></div>';
  document.body.appendChild(ov);
  document.getElementById('_pcb').onchange=function(){document.getElementById('_pcn').style.display=this.checked?'block':'none';};
};

window._doPDF=function(btn){
  var ov=btn.closest('.modal-overlay');
  var inclTable=document.getElementById('_pct').checked;
  var drawnBy=document.getElementById('_pcb').checked?document.getElementById('_pca').value.trim():'';
  ov.remove();
  var jsPDF=window.jspdf.jsPDF;
  var doc=new jsPDF({orientation:'landscape',unit:'mm',format:'a4'});
  var W=297,H=210,M=15;
  // Compute bbox
  var minX=1e9,minY=1e9,maxX=-1e9,maxY=-1e9;
  TK.rooms.forEach(function(r){minX=Math.min(minX,r.x);minY=Math.min(minY,r.y);maxX=Math.max(maxX,r.x+r.w);maxY=Math.max(maxY,r.y+r.h);});
  TK.walls.forEach(function(w){minX=Math.min(minX,w.x1,w.x2);minY=Math.min(minY,w.y1,w.y2);maxX=Math.max(maxX,w.x1,w.x2);maxY=Math.max(maxY,w.y1,w.y2);});
  var bw=maxX-minX,bh=maxY-minY;
  var drawW=inclTable?195:262,drawH=165,ox2=M,oy2=22;
  var sf=Math.min(drawW/(bw/TK.scale*1000),drawH/(bh/TK.scale*1000))*0.88;
  var toMM=function(px){return px/TK.scale*1000*sf;};
  var ox=ox2+(drawW-bw/TK.scale*1000*sf)/2-toMM(minX);
  var oy=oy2+(drawH-bh/TK.scale*1000*sf)/2-toMM(minY);
  // Header
  doc.setFont('helvetica','bold');doc.setFontSize(13);doc.setTextColor(0);doc.text('TankeTekt',M,11);
  doc.setFont('helvetica','normal');doc.setFontSize(8);doc.setTextColor(100);doc.text('v.demo-002',M,16);
  doc.setFontSize(8);doc.text(new Date().toLocaleDateString('no'),W-M,11,{align:'right'});
  if(drawnBy)doc.text('Teikna av: '+drawnBy,W-M,16,{align:'right'});
  doc.setDrawColor(200);doc.setLineWidth(0.3);doc.line(M,19,W-M,19);
  // Rooms
  TK.rooms.forEach(function(r){
    var xp=ox+toMM(r.x),yp=oy+toMM(r.y),wp=toMM(r.w),hp=toMM(r.h);
    doc.setFillColor(245,245,245);doc.rect(xp,yp,wp,hp,'F');
    doc.setDrawColor(45,45,45);doc.setLineWidth(toMM(r.wallThickness||TK.wallThickness||0.1)*0.5+0.3);doc.rect(xp,yp,wp,hp,'S');
    doc.setFontSize(6);doc.setTextColor(30);doc.setFont('helvetica','bold');doc.text(r.name,xp+wp/2,yp+hp/2-1.5,{align:'center'});
    doc.setFont('helvetica','normal');doc.setFontSize(5);doc.setTextColor(100);doc.text((r.w*r.h/TK.scale/TK.scale).toFixed(2)+' m²',xp+wp/2,yp+hp/2+2.5,{align:'center'});
  });
  // Walls
  TK.walls.forEach(function(w){
    var lw=Math.max(0.3,toMM(w.thickness*TK.scale)*0.5);
    doc.setDrawColor(45,45,45);doc.setLineWidth(lw);
    doc.line(ox+toMM(w.x1),oy+toMM(w.y1),ox+toMM(w.x2),oy+toMM(w.y2));
  });
  // Scale indicator
  doc.setFontSize(6);doc.setTextColor(80);doc.setFont('helvetica','normal');
  var scV=Math.round(1000/sf);
  doc.text('PLANTEIKNING  1:'+scV+' @ A4',M,H-6);
  // Footer
  doc.setFontSize(6);doc.setTextColor(160);doc.text('TankeTekt',W/2,H-3,{align:'center'});
  // Table
  if(inclTable){
    var tx=213,ty=oy2,trh=5.5;
    doc.setFillColor(45,45,45);doc.rect(tx,ty,75,7,'F');
    doc.setFont('helvetica','bold');doc.setFontSize(7);doc.setTextColor(255);doc.text('ROMPLAN',tx+2,ty+5);
    doc.text('m²',tx+68,ty+5,{align:'right'});
    ty+=7;var total=0;
    TK.rooms.forEach(function(r,i){
      var area=parseFloat((r.w*r.h/TK.scale/TK.scale).toFixed(2));total+=area;
      if(i%2===0){doc.setFillColor(248,248,248);doc.rect(tx,ty,75,trh,'F');}
      doc.setFont('helvetica','normal');doc.setFontSize(6);doc.setTextColor(0);
      doc.text(r.name,tx+2,ty+3.8);doc.text(area.toFixed(2),tx+68,ty+3.8,{align:'right'});
      ty+=trh;
    });
    doc.setFillColor(220,220,220);doc.rect(tx,ty,75,6,'F');
    doc.setFont('helvetica','bold');doc.setFontSize(6.5);doc.setTextColor(0);
    doc.text('TOTAL',tx+2,ty+4.3);doc.text(total.toFixed(2),tx+68,ty+4.3,{align:'right'});
    doc.setDrawColor(180);doc.setLineWidth(0.3);doc.rect(tx,oy2,75,ty+6-oy2,'S');
  }
  doc.save('tanketekt.pdf');
  showToast('PDF eksportert! 📄');
};

// ── SAVE PROJECT ──
window.saveProject=function(){
  var d=JSON.stringify({version:'v.demo-002',rooms:TK.rooms,walls:TK.walls,doors:TK.doors,windows:TK.windows,scale:TK.scale},null,2);
  var a=document.createElement('a');a.href='data:application/json,'+encodeURIComponent(d);a.download='tanketekt-prosjekt.json';
  document.body.appendChild(a);a.click();document.body.removeChild(a);
  showToast('Prosjekt lagra! 💾');
};

// ── LOAD PROJECT ──
window.loadProject=function(file){
  var reader=new FileReader();
  reader.onload=function(e){
    try{
      var d=JSON.parse(e.target.result);
      if(!Array.isArray(d.rooms))throw new Error('Ugyldig fil');
      saveSnapshot();TK.rooms=d.rooms||[];TK.walls=d.walls||[];TK.doors=d.doors||[];TK.windows=d.windows||[];TK.scale=d.scale||100;
      updateSidebar();if(window.updateWallList)updateWallList();if(window.updateElementList)updateElementList();redraw();
      showToast('Prosjekt lasta inn!');
    }catch(err){showToast('Feil: '+err.message,'error');}
  };
  reader.readAsText(file);
};

// ── SHOW TOAST ──
window.showToast=function(msg,type){
  var d=document.createElement('div');
  d.style='position:fixed;bottom:24px;right:24px;padding:10px 20px;border-radius:6px;font-weight:bold;font-size:13px;color:white;z-index:9999;background:'+(type==='error'?'#e94560':'#238636');
  d.textContent=msg;document.body.appendChild(d);
  setTimeout(function(){d.style.transition='opacity 0.4s';d.style.opacity='0';setTimeout(function(){d.remove();},400);},2500);
};

// ── PLACE DOOR ──
window.placeDoor=function(){
  var presets=[{id:'d70',name:'Dør 70cm',width:0.7},{id:'d80',name:'Dør 80cm',width:0.8},{id:'d90',name:'Dør 90cm',width:0.9},{id:'d120',name:'Dør 120cm',width:1.2}];
  var opts=presets.map(function(p){return '<option value="'+p.id+'">'+p.name+'</option>';}).join('');
  var ov=document.createElement('div');ov.className='modal-overlay';
  ov.innerHTML='<div class="modal"><h2>Legg til dør</h2><select id="_dp2">'+opts+'</select><div class="modal-btns"><button onclick="this.closest(\'.modal-overlay\').remove()">Avbryt</button><button onclick="window._setDoorTool(this)" style="background:var(--accent);border-color:var(--accent)">Vel plassering</button></div></div>';
  document.body.appendChild(ov);
  window._doorPresets=presets;
};
window._setDoorTool=function(btn){
  var sel=document.getElementById('_dp2').value;
  var preset=window._doorPresets.find(function(p){return p.id===sel;})||window._doorPresets[1];
  TK.pendingElement={type:'door',preset:preset};TK.currentTool='door';
  btn.closest('.modal-overlay').remove();
  setStatus('Klikk på vegg for å plassere dør');
};

// ── PLACE WINDOW ──
window.placeWindow=function(){
  var presets=[{id:'v60',name:'Vindauge 60cm',width:0.6},{id:'v90',name:'Vindauge 90cm',width:0.9},{id:'v120',name:'Vindauge 120cm',width:1.2},{id:'v150',name:'Vindauge 150cm',width:1.5}];
  var opts=presets.map(function(p){return '<option value="'+p.id+'">'+p.name+'</option>';}).join('');
  var ov=document.createElement('div');ov.className='modal-overlay';
  ov.innerHTML='<div class="modal"><h2>Legg til vindauge</h2><select id="_wp2">'+opts+'</select><div class="modal-btns"><button onclick="this.closest(\'.modal-overlay\').remove()">Avbryt</button><button onclick="window._setWinTool(this)" style="background:var(--accent);border-color:var(--accent)">Vel plassering</button></div></div>';
  document.body.appendChild(ov);
  window._winPresets=presets;
};
window._setWinTool=function(btn){
  var sel=document.getElementById('_wp2').value;
  var preset=window._winPresets.find(function(p){return p.id===sel;})||window._winPresets[1];
  TK.pendingElement={type:'window',preset:preset};TK.currentTool='window';
  btn.closest('.modal-overlay').remove();
  setStatus('Klikk på vegg for å plassere vindauge');
};

// ── HELP MODAL ──
window.showHelpModal=function(){
  var ov=document.createElement('div');ov.className='modal-overlay';
  ov.innerHTML='<div class="modal" style="max-width:500px;max-height:82vh;overflow-y:auto"><h2 style="margin-bottom:14px">Hjelp & Hurtigtastar</h2>'
  +'<h3 style="color:var(--muted);font-size:10px;text-transform:uppercase;margin:10px 0 5px">Teikneverkty</h3>'
  +'<table style="width:100%;font-size:12px;border-collapse:collapse">'
  +'<tr><td style="padding:3px 10px 3px 0;color:var(--muted)">Teikn rom</td><td>Klikk + dra på canvas</td></tr>'
  +'<tr><td style="padding:3px 10px 3px 0;color:var(--muted)">✛ Rom med mål</td><td>Skriv inn mål → plassert i midten → dra</td></tr>'
  +'<tr><td style="padding:3px 10px 3px 0;color:var(--muted)">Teikn vegg</td><td>Klikk startpunkt, dra til endepunkt</td></tr>'
  +'<tr><td style="padding:3px 10px 3px 0;color:var(--muted)">Dør / Vindauge</td><td>Klikk på vegg eller romvegg</td></tr>'
  +'<tr><td style="padding:3px 10px 3px 0;color:var(--muted)">Snapping</td><td>Auto — hald Shift for fri plassering</td></tr>'
  +'</table>'
  +'<h3 style="color:var(--muted);font-size:10px;text-transform:uppercase;margin:10px 0 5px">Redigering</h3>'
  +'<table style="width:100%;font-size:12px;border-collapse:collapse">'
  +'<tr><td style="padding:3px 10px 3px 0;color:var(--muted)">Flytt element</td><td>Vel → klikk+dra innside</td></tr>'
  +'<tr><td style="padding:3px 10px 3px 0;color:var(--muted)">Endre storleik rom</td><td>Vel → dra kvitt handtak i hjørne/kant</td></tr>'
  +'<tr><td style="padding:3px 10px 3px 0;color:var(--muted)">Endre veggendepunkt</td><td>Vel vegg → dra rundt endepunkt</td></tr>'
  +'<tr><td style="padding:3px 10px 3px 0;color:var(--muted)">Snu dør</td><td>Vel dør → ↖↗↙↘ i høgre panel</td></tr>'
  +'<tr><td style="padding:3px 10px 3px 0;color:var(--muted)">Endre romtype</td><td>Dobbelklikk på rom</td></tr>'
  +'</table>'
  +'<h3 style="color:var(--muted);font-size:10px;text-transform:uppercase;margin:10px 0 5px">Hurtigtastar</h3>'
  +'<table style="width:100%;font-size:12px;border-collapse:collapse">'
  +'<tr><td style="padding:3px 10px 3px 0;color:var(--muted);font-family:monospace">Ctrl+Z / Y</td><td>Angre / Gjer om</td></tr>'
  +'<tr><td style="padding:3px 10px 3px 0;color:var(--muted);font-family:monospace">Ctrl+C / V</td><td>Kopier / Lim inn rom</td></tr>'
  +'<tr><td style="padding:3px 10px 3px 0;color:var(--muted);font-family:monospace">Delete</td><td>Slett valt element</td></tr>'
  +'<tr><td style="padding:3px 10px 3px 0;color:var(--muted);font-family:monospace">D</td><td>Nytt rom med mål</td></tr>'
  +'<tr><td style="padding:3px 10px 3px 0;color:var(--muted);font-family:monospace">Escape</td><td>Avbryt / fjern val</td></tr>'
  +'<tr><td style="padding:3px 10px 3px 0;color:var(--muted);font-family:monospace">Scroll</td><td>Zoom inn/ut</td></tr>'
  +'<tr><td style="padding:3px 10px 3px 0;color:var(--muted);font-family:monospace">Alt+drag</td><td>Panorér canvas</td></tr>'
  +'</table>'
  +'<div class="modal-btns" style="margin-top:16px"><button onclick="this.closest(\'.modal-overlay\').remove()" style="background:var(--accent);border-color:var(--accent)">Lukk</button></div>'
  +'</div>';
  document.body.appendChild(ov);
  ov.addEventListener('click',function(e){if(e.target===ov)ov.remove();});
};
document.getElementById('btnHelp')&&(document.getElementById('btnHelp').onclick=function(){showHelpModal();});
document.getElementById('btnPNG')&&(document.getElementById('btnPNG').onclick=function(){exportPNG();});
document.getElementById('btnPDF')&&(document.getElementById('btnPDF').onclick=function(){exportPDF();});
document.getElementById('btnSave')&&(document.getElementById('btnSave').onclick=function(){saveProject();});
document.getElementById('btnDoor')&&(document.getElementById('btnDoor').onclick=function(){placeDoor();});
document.getElementById('btnWindow')&&(document.getElementById('btnWindow').onclick=function(){placeWindow();});

});
</script>`;

html = html.replace('</body>', overrideScript+'\n</body>');
write("index.html", html);
console.log("\n✅ Done. Ctrl+Shift+R to reload.");
