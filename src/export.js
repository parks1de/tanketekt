
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
  var fname=(TK.projectName?TK.projectName.replace(/[^a-zA-Z0-9æøåÆØÅ_-]/g,'_'):'tanketekt')+'.json';
  var data=JSON.stringify({version:2,projectName:TK.projectName||'',rooms:TK.rooms,walls:TK.walls,doors:TK.doors,windows:TK.windows,scale:TK.scale},null,2);
  var blob=new Blob([data],{type:'application/json'});
  var url=URL.createObjectURL(blob);
  var a=document.createElement('a');a.download=fname;a.href=url;a.click();
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
      if(s.projectName!==undefined){TK.projectName=s.projectName;var _pn=document.getElementById('_projectName');if(_pn)_pn.value=TK.projectName;}
      if(window.updateSidebar)updateSidebar();if(window.updateWallList)updateWallList();if(window.updateElementList)updateElementList();
      if(window.zoomToFit)zoomToFit();else if(window.redraw)redraw();
      if(window.showToast)showToast('Prosjekt opna!','success');
    }catch(err){if(window.showToast)showToast('Ugyldig fil','error');}
  };
  reader.readAsText(file);
};

window.exportPNG=function(){
  var cv=document.getElementById('floorplan');
  var fname=(TK.projectName?TK.projectName.replace(/[^a-zA-Z0-9æøåÆØÅ_-]/g,'_'):'tanketekt')+'.png';
  var a=document.createElement('a');a.download=fname;a.href=cv.toDataURL('image/png');a.click();
  if(window.showToast)showToast('PNG lasta ned!','success');
};

window.exportPDF=function(){
  var ov=document.createElement('div');ov.className='modal-overlay';
  var chk='style="accent-color:var(--accent)"';
  var lS='style="display:flex;align-items:center;gap:7px;font-size:12px;padding:3px 0;cursor:pointer"';
  ov.innerHTML='<div class="modal" style="min-width:320px"><h2>Eksporter PDF</h2>'+
    '<div style="font-size:10px;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);margin:10px 0 6px">Innstillingar</div>'+
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:0 16px">'+
    '<label '+lS+'><input type="checkbox" id="_pdfGrid" '+(TK.showGrid?'checked':'')+' '+chk+'> Rutenett</label>'+
    '<label '+lS+'><input type="checkbox" id="_pdfOuter" '+(TK.showOuterDims?'checked':'')+' '+chk+'> Ytre mål</label>'+
    '<label '+lS+'><input type="checkbox" id="_pdfInner" '+(TK.showInnerDims?'checked':'')+' '+chk+'> Indre mål</label>'+
    '<label '+lS+'><input type="checkbox" id="_pdfLabels" '+(TK.showRoomLabels?'checked':'')+' '+chk+'> Romnamn</label>'+
    '<label '+lS+'><input type="checkbox" id="_pdfArea" '+(TK.showAreaLabels?'checked':'')+' '+chk+'> Areal</label>'+
    '<label '+lS+'><input type="checkbox" id="_pdfTable" checked '+chk+'> Romtabell</label>'+
    '</div>'+
    '<div style="font-size:11px;color:var(--muted);margin-top:8px">Prosjektnamn: <b style="color:var(--text)">'+(TK.projectName||'(ikkje sett)')+' </b></div>'+
    '<div class="modal-btns">'+
    '<button id="_pdfCancel">Avbryt</button>'+
    '<button id="_pdfTableOnly" style="background:var(--bg)">Berre tabell</button>'+
    '<button id="_pdfOk" style="background:var(--accent);border-color:var(--accent);color:#fff">Eksporter PDF</button>'+
    '</div></div>';
  document.body.appendChild(ov);
  document.getElementById('_pdfCancel').onclick=function(){ov.remove();};
  document.getElementById('_pdfTableOnly').onclick=function(){ov.remove();_doExportTableOnly();};
  document.getElementById('_pdfOk').onclick=function(){
    var opts={
      grid:document.getElementById('_pdfGrid').checked,
      outer:document.getElementById('_pdfOuter').checked,
      inner:document.getElementById('_pdfInner').checked,
      labels:document.getElementById('_pdfLabels').checked,
      area:document.getElementById('_pdfArea').checked,
      table:document.getElementById('_pdfTable').checked
    };
    ov.remove();
    _doExportPDF(opts);
  };
};

function _doExportPDF(opts){
  var jsPDFCtor=(window.jspdf&&window.jspdf.jsPDF)||window.jsPDF;
  if(!jsPDFCtor){if(window.showToast)showToast('jsPDF ikkje tilgjengeleg','error');return;}

  // ── 1. Compute tight content bounding box in world coords ────────────────
  var minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
  TK.rooms.forEach(function(r){
    var wt=(r.wallThickness||TK.wallThickness||0.1)*TK.scale;
    minX=Math.min(minX,r.x-wt/2);minY=Math.min(minY,r.y-wt/2);
    maxX=Math.max(maxX,r.x+r.w+wt/2);maxY=Math.max(maxY,r.y+r.h+wt/2);
  });
  TK.walls.forEach(function(w){
    var hw=w.thickness*TK.scale/2;
    minX=Math.min(minX,Math.min(w.x1,w.x2)-hw);minY=Math.min(minY,Math.min(w.y1,w.y2)-hw);
    maxX=Math.max(maxX,Math.max(w.x1,w.x2)+hw);maxY=Math.max(maxY,Math.max(w.y1,w.y2)+hw);
  });
  if(!isFinite(minX)){if(window.showToast)showToast('Ingen innhald å eksportere','error');return;}
  var dimPad=(opts.outer||opts.inner)?70:15;
  minX-=dimPad;minY-=dimPad;maxX+=dimPad;maxY+=dimPad;
  var bw=maxX-minX,bh=maxY-minY;

  // ── 2. Render canvas cropped to content ─────────────────────────────────
  var cv=document.getElementById('floorplan');
  var savedZoom=TK.zoom,savedPanX=TK.panX,savedPanY=TK.panY,savedSel=TK.selectedId,savedSelIds=TK.selectedIds.slice();
  TK.selectedId=null;TK.selectedIds=[];
  var fitZoom=Math.min(cv.width/bw,cv.height/bh)*0.98;
  TK.zoom=fitZoom;
  TK.panX=(cv.width-bw*fitZoom)/2-minX*fitZoom;
  TK.panY=(cv.height-bh*fitZoom)/2-minY*fitZoom;
  var savedDisp={grid:TK.showGrid,outer:TK.showOuterDims,inner:TK.showInnerDims,labels:TK.showRoomLabels,area:TK.showAreaLabels};
  TK.showGrid=opts.grid;TK.showOuterDims=opts.outer;TK.showInnerDims=opts.inner;TK.showRoomLabels=opts.labels;TK.showAreaLabels=opts.area;
  if(window.redraw)redraw();
  var imgData=cv.toDataURL('image/jpeg',0.97);
  var cw=cv.width,ch=cv.height;
  TK.zoom=savedZoom;TK.panX=savedPanX;TK.panY=savedPanY;TK.selectedId=savedSel;TK.selectedIds=savedSelIds;
  TK.showGrid=savedDisp.grid;TK.showOuterDims=savedDisp.outer;TK.showInnerDims=savedDisp.inner;TK.showRoomLabels=savedDisp.labels;TK.showAreaLabels=savedDisp.area;
  if(window.redraw)redraw();

  // ── 3. Build PDF ─────────────────────────────────────────────────────────
  var orient=cw>=ch?'landscape':'portrait';
  var pdf=new jsPDFCtor({orientation:orient,unit:'mm',format:'a3'});
  var pw=pdf.internal.pageSize.getWidth(),ph=pdf.internal.pageSize.getHeight();
  var M=12;

  // Header
  pdf.setFontSize(12);pdf.setFont(undefined,'bold');
  pdf.text(TK.projectName||'Planteikning',M,M+6);
  pdf.setFontSize(8);pdf.setFont(undefined,'normal');pdf.setTextColor(100);
  var meta='Dato: '+new Date().toLocaleDateString('no-NO');
  pdf.text(meta,M,M+12);pdf.setTextColor(0);
  pdf.setLineWidth(0.3);pdf.line(M,M+15,pw-M,M+15);
  var headerH=M+19;

  // ── 4. Choose clean scale ratio ──────────────────────────────────────────
  var stdScales=[5,10,20,25,50,75,100,125,150,200,250,500,1000];
  var tableRows=[];
  if(opts.table&&TK.rooms.length){
    tableRows=TK.rooms.map(function(r){
      var type=(window.TK_ROOM_TYPES||[]).find(function(t){return t.id===r.type;})||{name:'Anna'};
      return [r.name,type.name,(r.w*r.h/TK.scale/TK.scale).toFixed(2)+' m²'];
    });
  }
  var tableH=tableRows.length?(tableRows.length*6.5+8+6.5+8):0;
  var scaleBarH=8;
  var imgAreaW=pw-M*2;
  var imgAreaH=ph-headerH-M-tableH-(tableH?6:0)-scaleBarH-4;
  // Content size in meters
  var contentW_m=bw/TK.scale,contentH_m=bh/TK.scale;
  // Find smallest N where content fits: contentW_m*1000/N <= imgAreaW
  var N=stdScales.find(function(n){return contentW_m*1000/n<=imgAreaW&&contentH_m*1000/n<=imgAreaH;});
  if(!N)N=stdScales[stdScales.length-1];
  // Image size at scale 1:N (content portion), then full image slightly larger due to fitZoom margin
  var contentPDFW=contentW_m*1000/N;
  var contentPDFH=contentH_m*1000/N;
  var imgPDFW=contentPDFW*(cw/(bw*fitZoom));
  var imgPDFH=contentPDFH*(ch/(bh*fitZoom));
  var ox=(pw-imgPDFW)/2;
  var oy=headerH;
  pdf.addImage(imgData,'JPEG',ox,oy,imgPDFW,imgPDFH);
  // Thin border around drawing
  pdf.setLineWidth(0.2);pdf.setDrawColor(180);
  pdf.rect(ox,oy,imgPDFW,imgPDFH);pdf.setDrawColor(0);

  // ── 5. Scale bar ─────────────────────────────────────────────────────────
  var sbY=oy+imgPDFH+4;
  // Choose scale bar real length (target ~20mm on drawing)
  var sbNice=[0.1,0.25,0.5,1,2,5,10,20,50,100];
  var sbTarget=20*N/1000;
  var sbRealM=sbNice.reduce(function(p,c){return Math.abs(c-sbTarget)<Math.abs(p-sbTarget)?c:p;});
  var sbW=sbRealM*1000/N;
  var sbX=ox;
  pdf.setLineWidth(0.5);pdf.setDrawColor(0);
  pdf.line(sbX,sbY,sbX+sbW,sbY);
  pdf.line(sbX,sbY-1.5,sbX,sbY+1.5);pdf.line(sbX+sbW,sbY-1.5,sbX+sbW,sbY+1.5);
  pdf.setFontSize(7);pdf.setFont(undefined,'normal');
  var sbLabel=sbRealM>=1?sbRealM+'m':(sbRealM*100).toFixed(0)+'cm';
  pdf.text(sbLabel,sbX+sbW/2,sbY+4,{align:'center'});
  pdf.setFontSize(8);pdf.text('1 : '+N,sbX+sbW+6,sbY+1);

  // ── 6. Room table ─────────────────────────────────────────────────────────
  if(tableRows.length){
    var colW=[65,45,28];var totalTableW=colW[0]+colW[1]+colW[2];
    var rowH=6.5;var hdrH=8;
    var ty=ph-M-(tableRows.length*rowH+hdrH+rowH+4);
    // Section title
    pdf.setFontSize(8);pdf.setFont(undefined,'bold');pdf.setTextColor(80);
    pdf.text('ROMTABELL',M,ty);ty+=3;pdf.setTextColor(0);
    // Header row fill
    pdf.setFillColor(40,40,40);pdf.rect(M,ty,totalTableW,hdrH,'F');
    // Header text
    var hdrs=['Romnamn','Type','Areal'];var cx=M;
    pdf.setFontSize(8);pdf.setFont(undefined,'bold');pdf.setTextColor(255);
    hdrs.forEach(function(h,i){pdf.text(h,cx+2,ty+5.5);cx+=colW[i];});
    pdf.setTextColor(0);
    // Header border
    pdf.setDrawColor(40,40,40);pdf.setLineWidth(0.3);pdf.rect(M,ty,totalTableW,hdrH);
    ty+=hdrH;
    // Data rows
    pdf.setFont(undefined,'normal');pdf.setFontSize(7.5);
    tableRows.forEach(function(row,ri){
      if(ri%2===0){pdf.setFillColor(247,247,247);pdf.rect(M,ty,totalTableW,rowH,'F');}
      else{pdf.setFillColor(255,255,255);pdf.rect(M,ty,totalTableW,rowH,'F');}
      cx=M;row.forEach(function(cell,i){
        if(i===2){pdf.text(cell,cx+colW[i]-2,ty+4.5,{align:'right'});}
        else{pdf.text(cell,cx+2,ty+4.5);}
        cx+=colW[i];
      });
      // Row border
      pdf.setDrawColor(210);pdf.setLineWidth(0.2);pdf.rect(M,ty,totalTableW,rowH);
      // Column dividers
      cx=M;colW.slice(0,-1).forEach(function(w){cx+=w;pdf.line(cx,ty,cx,ty+rowH);});
      ty+=rowH;
    });
    // Total row
    var totalArea=TK.rooms.reduce(function(s,r){return s+r.w*r.h/TK.scale/TK.scale;},0);
    pdf.setFillColor(230,230,230);pdf.rect(M,ty,totalTableW,rowH,'F');
    pdf.setFont(undefined,'bold');pdf.setFontSize(7.5);pdf.setDrawColor(100);pdf.setLineWidth(0.3);pdf.rect(M,ty,totalTableW,rowH);
    pdf.text('BRA totalt',M+2,ty+4.5);
    pdf.text(totalArea.toFixed(2)+' m²',M+totalTableW-2,ty+4.5,{align:'right'});
    pdf.setFont(undefined,'normal');pdf.setDrawColor(0);
  }

  var pdfName=(TK.projectName?TK.projectName.replace(/[^a-zA-Z0-9æøåÆØÅ_-]/g,'_'):'tanketekt')+'.pdf';
  pdf.save(pdfName);
  if(window.showToast)showToast('PDF lasta ned!','success');
}

function _doExportTableOnly(){
  var jsPDFCtor=(window.jspdf&&window.jspdf.jsPDF)||window.jsPDF;
  if(!jsPDFCtor){if(window.showToast)showToast('jsPDF ikkje tilgjengeleg','error');return;}
  if(!TK.rooms.length){if(window.showToast)showToast('Ingen rom å eksportere','error');return;}
  var pdf=new jsPDFCtor({orientation:'portrait',unit:'mm',format:'a4'});
  var pw=pdf.internal.pageSize.getWidth(),M=15;
  pdf.setFontSize(13);pdf.setFont(undefined,'bold');
  pdf.text(TK.projectName||'Romtabell',M,M+6);
  pdf.setFontSize(8);pdf.setFont(undefined,'normal');pdf.setTextColor(100);
  pdf.text('Dato: '+new Date().toLocaleDateString('no-NO'),M,M+12);
  pdf.setTextColor(0);pdf.setLineWidth(0.3);pdf.line(M,M+15,pw-M,M+15);
  var ty=M+22;
  var tableRows=TK.rooms.map(function(r){
    var type=(window.TK_ROOM_TYPES||[]).find(function(t){return t.id===r.type;})||{name:'Anna'};
    return [r.name,type.name,(r.w*r.h/TK.scale/TK.scale).toFixed(2)+' m²'];
  });
  var colW=[80,55,30];var totalTableW=colW[0]+colW[1]+colW[2];
  var rowH=6.5,hdrH=8;
  pdf.setFillColor(40,40,40);pdf.rect(M,ty,totalTableW,hdrH,'F');
  var hdrs=['Romnamn','Type','Areal'];var cx=M;
  pdf.setFontSize(8);pdf.setFont(undefined,'bold');pdf.setTextColor(255);
  hdrs.forEach(function(h,i){pdf.text(h,cx+2,ty+5.5);cx+=colW[i];});
  pdf.setTextColor(0);pdf.setDrawColor(40,40,40);pdf.setLineWidth(0.3);pdf.rect(M,ty,totalTableW,hdrH);
  ty+=hdrH;
  pdf.setFont(undefined,'normal');pdf.setFontSize(7.5);
  tableRows.forEach(function(row,ri){
    pdf.setFillColor(ri%2===0?247:255,ri%2===0?247:255,ri%2===0?247:255);
    pdf.rect(M,ty,totalTableW,rowH,'F');
    cx=M;row.forEach(function(cell,i){
      if(i===2)pdf.text(cell,cx+colW[i]-2,ty+4.5,{align:'right'});
      else pdf.text(cell,cx+2,ty+4.5);
      cx+=colW[i];
    });
    pdf.setDrawColor(210);pdf.setLineWidth(0.2);pdf.rect(M,ty,totalTableW,rowH);
    cx=M;colW.slice(0,-1).forEach(function(w){cx+=w;pdf.line(cx,ty,cx,ty+rowH);});
    ty+=rowH;
  });
  var totalArea=TK.rooms.reduce(function(s,r){return s+r.w*r.h/TK.scale/TK.scale;},0);
  pdf.setFillColor(220,220,220);pdf.rect(M,ty,totalTableW,rowH,'F');
  pdf.setFont(undefined,'bold');pdf.setDrawColor(100);pdf.setLineWidth(0.3);pdf.rect(M,ty,totalTableW,rowH);
  pdf.text('BRA totalt',M+2,ty+4.5);
  pdf.text(totalArea.toFixed(2)+' m²',M+totalTableW-2,ty+4.5,{align:'right'});
  pdf.setFont(undefined,'normal');pdf.setDrawColor(0);
  var fname=(TK.projectName?TK.projectName.replace(/[^a-zA-Z0-9æøåÆØÅ_-]/g,'_'):'romtabell')+'-tabell.pdf';
  pdf.save(fname);
  if(window.showToast)showToast('Tabell eksportert!','success');
}
