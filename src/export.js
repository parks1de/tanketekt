
window.showToast=function(msg,type){
  var d=document.createElement('div');
  d.style='position:fixed;bottom:20px;right:20px;padding:10px 18px;border-radius:6px;font-weight:bold;font-size:13px;color:#fff;z-index:9999;background:'+(type==='error'?'#e94560':'#238636');
  d.textContent=msg;document.body.appendChild(d);
  setTimeout(function(){d.style.cssText+=';transition:opacity 0.4s;opacity:0';setTimeout(function(){d.remove();},400);},2500);
};

window.autoSave=function(){try{localStorage.setItem('tanketekt_autosave',JSON.stringify({rooms:TK.rooms,walls:TK.walls,doors:TK.doors,windows:TK.windows,scale:TK.scale,savedAt:Date.now()}));}catch(e){}};
setInterval(window.autoSave,30000);

window.loadFromLocalStorage=function(){
  try{
    var d=localStorage.getItem('tanketekt_autosave');if(!d)return;
    var s=JSON.parse(d);
    var age=Math.round((Date.now()-s.savedAt)/60000);
    if(confirm('Gjenopprette sist lagra økt ('+age+' min sidan)?')){
      TK.rooms=s.rooms||[];TK.walls=s.walls||[];TK.doors=s.doors||[];TK.windows=s.windows||[];TK.scale=s.scale||100;
      if(window.updateSidebar)updateSidebar();if(window.updateWallList)updateWallList();if(window.updateElementList)updateElementList();if(window.redraw)redraw();
      if(window.setStatus)setStatus('Økt gjenoppretta!');
    }
  }catch(e){}
};

window.saveProject=function(){
  var data=JSON.stringify({version:2,rooms:TK.rooms,walls:TK.walls,doors:TK.doors,windows:TK.windows,scale:TK.scale},null,2);
  var blob=new Blob([data],{type:'application/json'});
  var url=URL.createObjectURL(blob);
  var a=document.createElement('a');a.download='tanketekt.json';a.href=url;a.click();
  setTimeout(function(){URL.revokeObjectURL(url);},1000);
  if(window.showToast)showToast('Prosjekt lagra!','success');
};

window.loadProject=function(file){
  if(!file)return;
  var reader=new FileReader();
  reader.onload=function(e){
    try{
      var s=JSON.parse(e.target.result);
      if(window.saveSnapshot)saveSnapshot();
      TK.rooms=s.rooms||[];TK.walls=s.walls||[];TK.doors=s.doors||[];TK.windows=s.windows||[];
      if(s.scale)TK.scale=s.scale;
      if(window.updateSidebar)updateSidebar();if(window.updateWallList)updateWallList();if(window.updateElementList)updateElementList();
      if(window.zoomToFit)zoomToFit();else if(window.redraw)redraw();
      if(window.showToast)showToast('Prosjekt opna!','success');
    }catch(err){if(window.showToast)showToast('Ugyldig fil','error');}
  };
  reader.readAsText(file);
};

window.exportPNG=function(){
  var cv=document.getElementById('floorplan');
  var a=document.createElement('a');a.download='tanketekt.png';a.href=cv.toDataURL('image/png');a.click();
  if(window.showToast)showToast('PNG lasta ned!','success');
};

window.exportPDF=function(){
  var ov=document.createElement('div');ov.className='modal-overlay';
  ov.innerHTML='<div class="modal"><h2>Eksporter PDF</h2>'+
    '<label><input type="checkbox" id="_pdfGrid" '+(TK.showGrid?'checked':'')+'>Vis rutenett</label>'+
    '<label><input type="checkbox" id="_pdfOuter" '+(TK.showOuterDims?'checked':'')+'>Ytre mål</label>'+
    '<label><input type="checkbox" id="_pdfInner" '+(TK.showInnerDims?'checked':'')+'>Indre mål</label>'+
    '<label><input type="checkbox" id="_pdfLabels" '+(TK.showRoomLabels?'checked':'')+'>Romnamn</label>'+
    '<label><input type="checkbox" id="_pdfArea" '+(TK.showAreaLabels?'checked':'')+'>Areal</label>'+
    '<label><input type="checkbox" id="_pdfTable" checked>Romtabell</label>'+
    '<label>Teikna av</label><input id="_pdfDrawer" type="text" placeholder="Namn...">'+
    '<div class="modal-btns">'+
    '<button id="_pdfCancel">Avbryt</button>'+
    '<button id="_pdfOk" style="background:var(--accent);border-color:var(--accent);color:#fff">Eksporter PDF</button>'+
    '</div></div>';
  document.body.appendChild(ov);
  document.getElementById('_pdfCancel').onclick=function(){ov.remove();};
  document.getElementById('_pdfOk').onclick=function(){
    var opts={
      grid:document.getElementById('_pdfGrid').checked,
      outer:document.getElementById('_pdfOuter').checked,
      inner:document.getElementById('_pdfInner').checked,
      labels:document.getElementById('_pdfLabels').checked,
      area:document.getElementById('_pdfArea').checked,
      table:document.getElementById('_pdfTable').checked,
      drawer:document.getElementById('_pdfDrawer').value.trim()
    };
    ov.remove();
    _doExportPDF(opts);
  };
};

function _doExportPDF(opts){
  var jsPDFCtor=(window.jspdf&&window.jspdf.jsPDF)||window.jsPDF;
  if(!jsPDFCtor){if(window.showToast)showToast('jsPDF ikkje tilgjengeleg','error');return;}
  // Temporarily apply PDF display settings
  var saved={grid:TK.showGrid,outer:TK.showOuterDims,inner:TK.showInnerDims,labels:TK.showRoomLabels,area:TK.showAreaLabels};
  TK.showGrid=opts.grid;TK.showOuterDims=opts.outer;TK.showInnerDims=opts.inner;TK.showRoomLabels=opts.labels;TK.showAreaLabels=opts.area;
  if(window.redraw)redraw();
  var cv=document.getElementById('floorplan');
  var imgData=cv.toDataURL('image/jpeg',0.95);
  var cw=cv.width,ch=cv.height;
  // Restore settings
  TK.showGrid=saved.grid;TK.showOuterDims=saved.outer;TK.showInnerDims=saved.inner;TK.showRoomLabels=saved.labels;TK.showAreaLabels=saved.area;
  if(window.redraw)redraw();

  var orient=cw>=ch?'landscape':'portrait';
  var pdf=new jsPDFCtor({orientation:orient,unit:'mm',format:'a3'});
  var pw=pdf.internal.pageSize.getWidth();
  var ph=pdf.internal.pageSize.getHeight();
  var M=12; // margin

  // Header
  pdf.setFontSize(13);pdf.setFont(undefined,'bold');
  pdf.text('TankeTekt — Planteikning',M,M+6);
  pdf.setFontSize(8);pdf.setFont(undefined,'normal');
  pdf.setTextColor(100);
  var dateStr=new Date().toLocaleDateString('no-NO');
  var meta='Dato: '+dateStr;
  if(opts.drawer)meta+='   |   Teikna av: '+opts.drawer;
  pdf.text(meta,M,M+12);
  pdf.setTextColor(0);
  var headerH=M+16;

  // Room table at bottom
  var tableH=0;
  if(opts.table&&TK.rooms.length){
    var rows=TK.rooms.map(function(r){
      var type=(window.TK_ROOM_TYPES||[]).find(function(t){return t.id===r.type;})||{name:'Anna'};
      var area=(r.w*r.h/TK.scale/TK.scale).toFixed(2);
      return [r.name,type.name,area+' m²'];
    });
    var rowH=6,colW=[60,40,28];
    tableH=(rows.length+1)*rowH+6;
    var ty=ph-M-tableH;
    pdf.setFontSize(8);pdf.setFont(undefined,'bold');
    pdf.text('Romtabell',M,ty);
    ty+=5;
    var hdrs=['Namn','Type','Areal'];
    var cx=M;
    hdrs.forEach(function(h,i){pdf.text(h,cx,ty);cx+=colW[i];});
    pdf.setLineWidth(0.3);pdf.line(M,ty+1,M+colW[0]+colW[1]+colW[2],ty+1);
    pdf.setFont(undefined,'normal');
    rows.forEach(function(row){
      ty+=rowH;cx=M;
      row.forEach(function(cell,i){pdf.text(cell,cx,ty);cx+=colW[i];});
    });
  }

  // Floor plan image
  var imgY=headerH;
  var imgMaxH=ph-headerH-M-tableH-(tableH>0?4:0);
  var ratio=Math.min((pw-M*2)/cw,imgMaxH/ch);
  var iw=cw*ratio,ih=ch*ratio;
  var ox=(pw-iw)/2;
  pdf.addImage(imgData,'JPEG',ox,imgY,iw,ih);

  pdf.save('tanketekt.pdf');
  if(window.showToast)showToast('PDF lasta ned!','success');
}
