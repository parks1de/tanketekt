import fs from "fs";
import path from "path";
import dotenv from "dotenv";
dotenv.config();
const DIR = process.env.PROJECT_DIR || "C:\\Users\\bness\\OneDrive\\02_PARKSIDE\\05_PROSJEKT\\TankeTekt";

// Read and show all button IDs in current HTML
let html = fs.readFileSync(path.join(DIR,"index.html"),"utf8");

// Show what buttons exist
const btnMatches = [...html.matchAll(/id="(btn[^"]+)"/g)];
console.log("Found button IDs:", btnMatches.map(m=>m[1]).join(', '));

// Remove ALL previous override scripts
html = html.replace(/<!-- TANKETEKT OVERRIDE[\s\S]*?<\/script>\s*/g,'');

// Strip onclick from existing buttons to avoid doubles
html = html.replace(/ onclick="[^"]*"/g,'');

// Add onclick directly to each button by ID
const onclicks = {
  btnPNG: 'exportPNG()',
  btnPDF: 'exportPDF()',
  btnSave: 'saveProject()',
  btnLoad: "document.getElementById('fileInput').click()",
  btnDoor: 'placeDoor()',
  btnWindow: 'placeWindow()',
  btnHelp: 'showHelpModal()',
  btnNew: "if(confirm('Nytt prosjekt?')){TK.rooms=[];TK.walls=[];TK.doors=[];TK.windows=[];TK.selectedId=null;localStorage.removeItem('tanketekt_autosave');updateSidebar();updateWallList&&updateWallList();updateElementList&&updateElementList();redraw();setStatus('Nytt prosjekt')}",
  btnUndo: 'undo()',
  btnRedo: 'redo()',
  btnZoomFit: 'zoomToFit&&zoomToFit()',
  btnDraw: "setTool('draw');setStatus('Teikn rom: klikk og dra')",
  btnWall: "setTool('wall');setStatus('Teikn vegg: klikk og dra')",
  btnGrid: 'TK.showGrid=!TK.showGrid;this.classList.toggle("active");redraw()',
  btnShowOuter: 'TK.showOuterDims=!TK.showOuterDims;this.classList.toggle("active");redraw()',
  btnShowInner: 'TK.showInnerDims=!TK.showInnerDims;this.classList.toggle("active");redraw()',
  btnShowArea: 'TK.showAreaLabels=!TK.showAreaLabels;this.classList.toggle("active");redraw()',
  btnShowLabels: 'TK.showRoomLabels=!TK.showRoomLabels;this.classList.toggle("active");redraw()',
  btnRoomDims: 'promptRoomDims()',
  btnWallDims: 'promptWallDims()',
};

for(const [id,handler] of Object.entries(onclicks)){
  html = html.replace(
    new RegExp(`id="${id}"`, 'g'),
    `id="${id}" onclick="${handler}"`
  );
}

// Now inject the functions as a plain <script> (no listener needed - just definitions)
const fnScript = `<script>
function exportPNG(){
  if(!TK.rooms.length&&!TK.walls.length){alert('Ingen element!');return;}
  var prev=TK.selectedId;TK.selectedId=null;redraw();
  setTimeout(function(){
    var c=document.getElementById('floorplan');
    var a=document.createElement('a');a.href=c.toDataURL('image/png');a.download='tanketekt.png';
    document.body.appendChild(a);a.click();document.body.removeChild(a);
    TK.selectedId=prev;redraw();showToast('PNG eksportert!');
  },120);
}
function exportPDF(){
  if(!TK.rooms.length&&!TK.walls.length){alert('Ingen element!');return;}
  if(!window.jspdf){alert('jsPDF manglar - last sida på nytt');return;}
  var ov=document.createElement('div');ov.className='modal-overlay';
  ov.innerHTML='<div class="modal"><h2>PDF-eksport</h2>'
    +'<label style="display:flex;align-items:center;gap:8px;margin:8px 0"><input type="checkbox" id="_pct2" checked> Inkluder arealtabell</label>'
    +'<label style="display:flex;align-items:center;gap:8px;margin:8px 0"><input type="checkbox" id="_pcn2" checked> Vis "teikna av"</label>'
    +'<input id="_pca2" placeholder="Teikna av (valg.)..." style="width:100%;background:var(--bg);color:var(--text);border:1px solid var(--border);border-radius:4px;padding:7px;margin-bottom:12px">'
    +'<div class="modal-btns"><button onclick="this.closest(\'.modal-overlay\').remove()">Avbryt</button>'
    +'<button onclick="_doPDF2(this)" style="background:var(--accent);border-color:var(--accent)">Eksporter PDF</button></div></div>';
  document.body.appendChild(ov);
}
function _doPDF2(btn){
  var inclTable=document.getElementById('_pct2').checked;
  var drawnBy=document.getElementById('_pcn2').checked?document.getElementById('_pca2').value.trim():'';
  btn.closest('.modal-overlay').remove();
  var doc=new window.jspdf.jsPDF({orientation:'landscape',unit:'mm',format:'a4'});
  var W=297,H=210,M=15;
  var minX=1e9,minY=1e9,maxX=-1e9,maxY=-1e9;
  TK.rooms.forEach(function(r){minX=Math.min(minX,r.x);minY=Math.min(minY,r.y);maxX=Math.max(maxX,r.x+r.w);maxY=Math.max(maxY,r.y+r.h);});
  TK.walls.forEach(function(w){minX=Math.min(minX,w.x1,w.x2);minY=Math.min(minY,w.y1,w.y2);maxX=Math.max(maxX,w.x1,w.x2);maxY=Math.max(maxY,w.y1,w.y2);});
  if(minX===1e9){alert('Ingen element');return;}
  var bw=maxX-minX,bh=maxY-minY;
  var dW=inclTable?192:262,dH=168;
  var sf=Math.min(dW/(bw/TK.scale*1000),dH/(bh/TK.scale*1000))*0.88;
  function mm(px){return px/TK.scale*1000*sf;}
  var ox=M+(dW-bw/TK.scale*1000*sf)/2-mm(minX);
  var oy=22+(dH-bh/TK.scale*1000*sf)/2-mm(minY);
  doc.setFont('helvetica','bold');doc.setFontSize(12);doc.setTextColor(0);doc.text('TankeTekt',M,11);
  doc.setFont('helvetica','normal');doc.setFontSize(8);doc.setTextColor(100);
  doc.text(new Date().toLocaleDateString('no'),W-M,11,{align:'right'});
  if(drawnBy)doc.text('Teikna av: '+drawnBy,W-M,16,{align:'right'});
  doc.setDrawColor(200);doc.setLineWidth(0.3);doc.line(M,19,W-M,19);
  TK.rooms.forEach(function(r){
    var xp=ox+mm(r.x),yp=oy+mm(r.y),wp=mm(r.w),hp=mm(r.h);
    var wl=Math.max(0.4,mm((r.wallThickness||TK.wallThickness||0.1)*TK.scale)*0.6);
    doc.setFillColor(245,245,245);doc.rect(xp,yp,wp,hp,'F');
    doc.setDrawColor(45,45,45);doc.setLineWidth(wl);doc.rect(xp,yp,wp,hp,'S');
    doc.setFont('helvetica','bold');doc.setFontSize(Math.max(5,Math.min(8,wp*0.4)));doc.setTextColor(30);
    doc.text(r.name,xp+wp/2,yp+hp/2-1,{align:'center'});
    doc.setFont('helvetica','normal');doc.setFontSize(Math.max(4,Math.min(6,wp*0.3)));doc.setTextColor(100);
    doc.text((r.w*r.h/TK.scale/TK.scale).toFixed(2)+' m²',xp+wp/2,yp+hp/2+3,{align:'center'});
  });
  TK.walls.forEach(function(w){
    doc.setDrawColor(45,45,45);doc.setLineWidth(Math.max(0.4,mm(w.thickness*TK.scale)*0.5));
    doc.line(ox+mm(w.x1),oy+mm(w.y1),ox+mm(w.x2),oy+mm(w.y2));
  });
  doc.setFontSize(6);doc.setTextColor(150);doc.text('TankeTekt',W/2,H-3,{align:'center'});
  if(inclTable){
    var tx=M+dW+3,ty=22,trh=5;
    doc.setFillColor(40,40,40);doc.rect(tx,ty,55,6.5,'F');
    doc.setFont('helvetica','bold');doc.setFontSize(7);doc.setTextColor(255);
    doc.text('ROM',tx+2,ty+4.5);doc.text('m²',tx+48,ty+4.5,{align:'right'});
    ty+=6.5;var tot=0;
    TK.rooms.forEach(function(r,i){
      var a=parseFloat((r.w*r.h/TK.scale/TK.scale).toFixed(2));tot+=a;
      if(i%2===0){doc.setFillColor(248,248,248);doc.rect(tx,ty,55,trh,'F');}
      doc.setFont('helvetica','normal');doc.setFontSize(6);doc.setTextColor(0);
      var nm=r.name.length>14?r.name.slice(0,13)+'…':r.name;
      doc.text(nm,tx+2,ty+3.5);doc.text(a.toFixed(2),tx+48,ty+3.5,{align:'right'});
      ty+=trh;
    });
    doc.setFillColor(200,200,200);doc.rect(tx,ty,55,6,'F');
    doc.setFont('helvetica','bold');doc.setFontSize(7);doc.setTextColor(0);
    doc.text('TOTAL',tx+2,ty+4.3);doc.text(tot.toFixed(2),tx+48,ty+4.3,{align:'right'});
    doc.setDrawColor(160);doc.setLineWidth(0.3);doc.rect(tx,22,55,ty+6-22,'S');
  }
  doc.save('tanketekt.pdf');showToast('PDF eksportert! 📄');
}
function saveProject(){
  var d=JSON.stringify({version:'v.demo-002',rooms:TK.rooms,walls:TK.walls,doors:TK.doors,windows:TK.windows,scale:TK.scale},null,2);
  var a=document.createElement('a');a.href='data:application/json,'+encodeURIComponent(d);a.download='tanketekt-prosjekt.json';
  document.body.appendChild(a);a.click();document.body.removeChild(a);showToast('Lagra! 💾');
}
function showToast(msg,type){
  var d=document.createElement('div');
  d.style='position:fixed;bottom:20px;right:20px;padding:10px 18px;border-radius:6px;font-weight:bold;font-size:13px;color:#fff;z-index:9999;background:'+(type==='error'?'#e94560':'#238636');
  d.textContent=msg;document.body.appendChild(d);
  setTimeout(function(){d.style.cssText+=';transition:opacity 0.4s;opacity:0';setTimeout(function(){d.remove();},400);},2500);
}
function placeDoor(){
  var P=[{id:'d70',name:'Dør 70cm',width:0.7},{id:'d80',name:'Dør 80cm',width:0.8},{id:'d90',name:'Dør 90cm',width:0.9},{id:'d120',name:'Dør 120cm',width:1.2}];
  var ov=document.createElement('div');ov.className='modal-overlay';
  ov.innerHTML='<div class="modal"><h2>Legg til dør</h2><select id="_ds3">'+P.map(function(p){return'<option value="'+p.id+'">'+p.name+'</option>';}).join('')+'</select><div class="modal-btns"><button onclick="this.closest(\'.modal-overlay\').remove()">Avbryt</button><button onclick="window._PD='+JSON.stringify(P).replace(/"/g,"'")+';var s=document.getElementById(\'_ds3\').value;TK.pendingElement={type:\'door\',preset:window._PD.find(function(p){return p.id===s;})||window._PD[1]};TK.currentTool=\'door\';this.closest(\'.modal-overlay\').remove();setStatus(\'Klikk på vegg\')" style="background:var(--accent);border-color:var(--accent)">Vel plassering</button></div></div>';
  document.body.appendChild(ov);
}
function placeWindow(){
  var P=[{id:'v60',name:'Vindauge 60cm',width:0.6},{id:'v90',name:'Vindauge 90cm',width:0.9},{id:'v120',name:'Vindauge 120cm',width:1.2},{id:'v150',name:'Vindauge 150cm',width:1.5}];
  var ov=document.createElement('div');ov.className='modal-overlay';
  ov.innerHTML='<div class="modal"><h2>Legg til vindauge</h2><select id="_ws3">'+P.map(function(p){return'<option value="'+p.id+'">'+p.name+'</option>';}).join('')+'</select><div class="modal-btns"><button onclick="this.closest(\'.modal-overlay\').remove()">Avbryt</button><button onclick="window._PW='+JSON.stringify(P).replace(/"/g,"'")+';var s=document.getElementById(\'_ws3\').value;TK.pendingElement={type:\'window\',preset:window._PW.find(function(p){return p.id===s;})||window._PW[1]};TK.currentTool=\'window\';this.closest(\'.modal-overlay\').remove();setStatus(\'Klikk på vegg\')" style="background:var(--accent);border-color:var(--accent)">Vel plassering</button></div></div>';
  document.body.appendChild(ov);
}
function showHelpModal(){
  var ov=document.createElement('div');ov.className='modal-overlay';
  ov.innerHTML='<div class="modal" style="max-width:480px;max-height:80vh;overflow-y:auto"><h2 style="margin-bottom:12px">Hjelp & Hurtigtastar</h2><table style="width:100%;font-size:12px;border-collapse:collapse"><tr><th colspan="2" style="text-align:left;color:var(--muted);padding:8px 0 4px;font-size:10px;text-transform:uppercase;font-weight:normal">Teikneverkty</th></tr><tr><td style="padding:3px 10px 3px 0;color:var(--muted)">Teikn rom</td><td>Klikk + dra på canvas</td></tr><tr><td style="padding:3px 10px 3px 0;color:var(--muted)">✛ Rom med mål</td><td>Mål-dialog → plassert senter → dra</td></tr><tr><td style="padding:3px 10px 3px 0;color:var(--muted)">Teikn vegg</td><td>Klikk start, dra til slutt</td></tr><tr><td style="padding:3px 10px 3px 0;color:var(--muted)">Dør / Vindauge</td><td>Klikk på kva som helst vegg</td></tr><tr><td style="padding:3px 10px 3px 0;color:var(--muted)">Snapping</td><td>Auto · Shift = fri</td></tr><tr><th colspan="2" style="text-align:left;color:var(--muted);padding:8px 0 4px;font-size:10px;text-transform:uppercase;font-weight:normal">Redigering</th></tr><tr><td style="padding:3px 10px 3px 0;color:var(--muted)">Flytt</td><td>Vel element → klikk+dra innside</td></tr><tr><td style="padding:3px 10px 3px 0;color:var(--muted)">Endre storleik rom</td><td>Vel → dra handtak</td></tr><tr><td style="padding:3px 10px 3px 0;color:var(--muted)">Snu dør</td><td>Vel dør → ↖↗↙↘ i høgre panel</td></tr><tr><td style="padding:3px 10px 3px 0;color:var(--muted)">Rename rom</td><td>Dobbelklikk</td></tr><tr><th colspan="2" style="text-align:left;color:var(--muted);padding:8px 0 4px;font-size:10px;text-transform:uppercase;font-weight:normal">Hurtigtastar</th></tr><tr><td style="padding:3px 10px 3px 0;color:var(--muted);font-family:monospace">Ctrl+Z / Y</td><td>Angre / Gjer om</td></tr><tr><td style="padding:3px 10px 3px 0;color:var(--muted);font-family:monospace">Delete</td><td>Slett valt</td></tr><tr><td style="padding:3px 10px 3px 0;color:var(--muted);font-family:monospace">D</td><td>Nytt rom med mål</td></tr><tr><td style="padding:3px 10px 3px 0;color:var(--muted);font-family:monospace">Escape</td><td>Avbryt / fjern val</td></tr><tr><td style="padding:3px 10px 3px 0;color:var(--muted);font-family:monospace">Scroll</td><td>Zoom inn/ut</td></tr><tr><td style="padding:3px 10px 3px 0;color:var(--muted);font-family:monospace">Alt+drag</td><td>Panorér</td></tr></table><div class="modal-btns" style="margin-top:14px"><button onclick="this.closest(\'.modal-overlay\').remove()" style="background:var(--accent);border-color:var(--accent)">Lukk</button></div></div>';
  document.body.appendChild(ov);ov.onclick=function(e){if(e.target===ov)ov.remove();};
}
function promptRoomDims(){
  var types=window.TK_ROOM_TYPES||[];
  var opts=types.map(function(t){return'<option value="'+t.id+'">'+t.name+'</option>';}).join('');
  var ov=document.createElement('div');ov.className='modal-overlay';
  ov.innerHTML='<div class="modal"><h2>Nytt rom med mål</h2><label>Lengd (m)</label><input id="_rl3" type="number" value="4.0" step="0.05" min="0.5"><label>Breidd (m)</label><input id="_rb3" type="number" value="3.0" step="0.05" min="0.5"><label>Type</label><select id="_rt3">'+opts+'</select><div class="modal-btns"><button onclick="this.closest(\'.modal-overlay\').remove()">Avbryt</button><button onclick="_placeRoomFromDims(this)" style="background:var(--accent);border-color:var(--accent)">Plasser</button></div></div>';
  document.body.appendChild(ov);
}
function _placeRoomFromDims(btn){
  var l=parseFloat(document.getElementById('_rl3').value)||4;
  var b=parseFloat(document.getElementById('_rb3').value)||3;
  var tid=document.getElementById('_rt3').value;
  var tp=(window.TK_ROOM_TYPES||[]).find(function(t){return t.id===tid;})||{id:'anna',color:'#aaa',name:'Rom'};
  var cv=document.getElementById('floorplan');
  var wo=window.screenToWorld?window.screenToWorld(cv.width/2,cv.height/2):{x:200,y:200};
  saveSnapshot();
  var rid=TK.nextId++;
  TK.rooms.push({id:rid,name:tp.name+' '+rid,type:tid,x:wo.x-l*TK.scale/2,y:wo.y-b*TK.scale/2,w:l*TK.scale,h:b*TK.scale,color:tp.color,wallThickness:TK.wallThickness});
  TK.selectedId=rid;TK.selectedType='room';
  btn.closest('.modal-overlay').remove();
  updateSidebar();redraw();setStatus('Rom plassert — dra for å flytte');
}
</script>`;

html = html.replace('</body>', fnScript+'\n</body>');
fs.writeFileSync(path.join(DIR,"index.html"), html, "utf8");
console.log("✅ index.html hardwired — all functions inline, onclick attributes set directly");
console.log("Found and wired: "+btnMatches.map(m=>m[1]).join(', '));
