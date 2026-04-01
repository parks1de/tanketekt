
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

  // ── 1. Bounding box in world coords ─────────────────────────────────────
  var minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
  TK.rooms.forEach(function(r){
    var wh=(r.wallThickness||TK.wallThickness||0.1)*TK.scale/2;
    minX=Math.min(minX,r.x-wh);minY=Math.min(minY,r.y-wh);
    maxX=Math.max(maxX,r.x+r.w+wh);maxY=Math.max(maxY,r.y+r.h+wh);
  });
  TK.walls.forEach(function(w){
    var hw=w.thickness*TK.scale/2;
    minX=Math.min(minX,Math.min(w.x1,w.x2)-hw);minY=Math.min(minY,Math.min(w.y1,w.y2)-hw);
    maxX=Math.max(maxX,Math.max(w.x1,w.x2)+hw);maxY=Math.max(maxY,Math.max(w.y1,w.y2)+hw);
  });
  if(!isFinite(minX)){if(window.showToast)showToast('Ingen innhald å eksportere','error');return;}
  var pad=(opts.outer||opts.inner)?55:8;
  minX-=pad;minY-=pad;maxX+=pad;maxY+=pad;
  var bw=maxX-minX,bh=maxY-minY;

  // ── 2. Create PDF ────────────────────────────────────────────────────────
  var orient=bw>=bh?'landscape':'portrait';
  var pdf=new jsPDFCtor({orientation:orient,unit:'mm',format:'a3'});
  var pw=pdf.internal.pageSize.getWidth(),ph=pdf.internal.pageSize.getHeight();
  var M=12;

  // Header
  pdf.setFontSize(12);pdf.setFont(undefined,'bold');
  pdf.text(TK.projectName||'Planteikning',M,M+6);
  pdf.setFontSize(8);pdf.setFont(undefined,'normal');pdf.setTextColor(100);
  pdf.text('Dato: '+new Date().toLocaleDateString('no-NO'),M,M+12);
  pdf.setTextColor(0);pdf.setLineWidth(0.3);pdf.line(M,M+15,pw-M,M+15);
  var headerH=M+19;

  // ── 3. Layout: scale factor fills available area ─────────────────────────
  var tableRows=[];
  if(opts.table&&TK.rooms.length){
    tableRows=TK.rooms.map(function(r){
      var type=(window.TK_ROOM_TYPES||[]).find(function(t){return t.id===r.type;})||{name:'Anna'};
      return[r.name,type.name,(r.w*r.h/TK.scale/TK.scale).toFixed(2)+' m²'];
    });
  }
  var tableH=tableRows.length?(tableRows.length*6.5+8+6.5+10):0;
  var sbH=10;
  var imgAreaW=pw-M*2;
  var imgAreaH=ph-headerH-M-tableH-(tableH?4:0)-sbH;
  var sf=Math.min(imgAreaW/bw,imgAreaH/bh); // mm per world pixel
  var drawW=bw*sf,drawH=bh*sf;
  var ox=M+(imgAreaW-drawW)/2;
  var oy=headerH+(imgAreaH-drawH)/2;
  var actualN=Math.max(1,Math.round(1000/(TK.scale*sf)));

  // ── 4. Helpers ───────────────────────────────────────────────────────────
  function px(wx){return ox+(wx-minX)*sf;}
  function py(wy){return oy+(wy-minY)*sf;}
  function ps(v){return v*sf;}
  function hexRgb(h){var r=parseInt(h.slice(1,3),16),g=parseInt(h.slice(3,5),16),b=parseInt(h.slice(5,7),16);return{r:isNaN(r)?170:r,g:isNaN(g)?170:g,b:isNaN(b)?170:b};}
  function blendW(h,a){var c=hexRgb(h);return{r:Math.round(c.r*a+255*(1-a)),g:Math.round(c.g*a+255*(1-a)),b:Math.round(c.b*a+255*(1-a))};}
  function polyFill(pts,fr,fg,fb){
    var rel=pts.slice(1).map(function(p,i){return[ps(p[0]-pts[i][0]),ps(p[1]-pts[i][1])];});
    pdf.setFillColor(fr,fg,fb);pdf.setLineWidth(0);
    pdf.lines(rel,px(pts[0][0]),py(pts[0][1]),[1,1],'F',true);
  }

  // ── 5. Grid ──────────────────────────────────────────────────────────────
  if(opts.grid){
    pdf.setDrawColor(220);pdf.setLineWidth(0.15);
    var gs=TK.scale,gx0=Math.ceil(minX/gs)*gs;
    for(var gx=gx0;gx<=maxX;gx+=gs)pdf.line(px(gx),oy,px(gx),oy+drawH);
    var gy0=Math.ceil(minY/gs)*gs;
    for(var gy=gy0;gy<=maxY;gy+=gs)pdf.line(ox,py(gy),ox+drawW,py(gy));
    pdf.setDrawColor(0);
  }

  // ── 6. Rooms ─────────────────────────────────────────────────────────────
  TK.rooms.forEach(function(r){
    var wt=(r.wallThickness||TK.wallThickness||0.1)*TK.scale,hwt=wt/2;
    var type=(window.TK_ROOM_TYPES||[]).find(function(t){return t.id===r.type;})||{color:'#aaaaaa'};
    // Wall (outer rect)
    pdf.setFillColor(45,45,45);pdf.setLineWidth(0);
    pdf.rect(px(r.x-hwt),py(r.y-hwt),ps(r.w+wt),ps(r.h+wt),'F');
    // Inner white
    if(r.w>wt&&r.h>wt){
      pdf.setFillColor(255,255,255);
      pdf.rect(px(r.x+hwt),py(r.y+hwt),ps(r.w-wt),ps(r.h-wt),'F');
      // Color tint
      var tint=blendW(type.color,0.22);
      pdf.setFillColor(tint.r,tint.g,tint.b);
      pdf.rect(px(r.x+hwt),py(r.y+hwt),ps(r.w-wt),ps(r.h-wt),'F');
    }
  });

  // ── 7. Freehand walls ────────────────────────────────────────────────────
  TK.walls.forEach(function(w){
    var dx=w.x2-w.x1,dy=w.y2-w.y1,len=Math.sqrt(dx*dx+dy*dy);if(len<0.1)return;
    var nx=-dy/len,ny=dx/len,hw=w.thickness*TK.scale/2;
    var pts=[[w.x1+nx*hw,w.y1+ny*hw],[w.x2+nx*hw,w.y2+ny*hw],[w.x2-nx*hw,w.y2-ny*hw],[w.x1-nx*hw,w.y1-ny*hw]];
    polyFill(pts,26,26,26);
  });

  // ── 8. Doors ─────────────────────────────────────────────────────────────
  TK.doors.forEach(function(door){
    var pos=window.getElPos?window.getElPos(door):null;if(!pos)return;
    var dlen=Math.hypot(pos.x2-pos.x1,pos.y2-pos.y1);if(dlen<0.1)return;
    var ux=(pos.x2-pos.x1)/dlen,uy=(pos.y2-pos.y1)/dlen;
    var dw=door.width*TK.scale;
    var thick=(pos.thickness||TK.wallThickness||0.1)*TK.scale,hw=thick/2;
    var hx=pos.x1+(pos.x2-pos.x1)*door.t,hy=pos.y1+(pos.y2-pos.y1)*door.t;
    var sd=door.swingDir||0,fa=sd&1,fs=(sd>>1)&1;
    var dx2=fa?-ux:ux,dy2=fa?-uy:uy;
    var nx=fs?uy:-uy,ny=fs?-ux:ux;
    var tx=hx+dx2*dw,ty_=hy+dy2*dw;
    var gap=hw+3/sf;
    polyFill([[hx+uy*gap,hy-ux*gap],[tx+uy*gap,ty_-ux*gap],[tx-uy*gap,ty_+ux*gap],[hx-uy*gap,hy+ux*gap]],255,255,255);
    pdf.setDrawColor(26,26,26);pdf.setLineWidth(0.5);
    pdf.line(px(hx),py(hy),px(tx),py(ty_));
    pdf.setFillColor(26,26,26);pdf.circle(px(hx),py(hy),0.6,'F');
    // Swing arc (polyline approximation)
    var sa=Math.atan2(dy2,dx2),ea=Math.atan2(ny,nx);
    var ACW=!!(fs^fa);
    var da=ACW?-((sa-ea+2*Math.PI)%(2*Math.PI)):(ea-sa+2*Math.PI)%(2*Math.PI);
    pdf.setDrawColor(100);pdf.setLineWidth(0.25);pdf.setLineDashPattern([0.8,0.6],0);
    var prev2=null;
    for(var ai=0;ai<=16;ai++){
      var ang2=sa+da*(ai/16);
      var apt=[hx+Math.cos(ang2)*dw,hy+Math.sin(ang2)*dw];
      if(prev2)pdf.line(px(prev2[0]),py(prev2[1]),px(apt[0]),py(apt[1]));
      prev2=apt;
    }
    pdf.setLineDashPattern([],0);
  });

  // ── 9. Windows ───────────────────────────────────────────────────────────
  TK.windows.forEach(function(win){
    var pos=window.getElPos?window.getElPos(win):null;if(!pos)return;
    var wlen=Math.hypot(pos.x2-pos.x1,pos.y2-pos.y1);if(wlen<0.1)return;
    var ux=(pos.x2-pos.x1)/wlen,uy=(pos.y2-pos.y1)/wlen;
    var ww=win.width*TK.scale;
    var thick=(pos.thickness||TK.wallThickness||0.1)*TK.scale,hw=thick/2;
    var cx=pos.x1+(pos.x2-pos.x1)*win.t,cy=pos.y1+(pos.y2-pos.y1)*win.t;
    var wx1=cx-ux*ww/2,wy1=cy-uy*ww/2,wx2=cx+ux*ww/2,wy2=cy+uy*ww/2;
    var gap=hw+2/sf;
    polyFill([[wx1+uy*gap,wy1-ux*gap],[wx2+uy*gap,wy2-ux*gap],[wx2-uy*gap,wy2+ux*gap],[wx1-uy*gap,wy1+ux*gap]],255,255,255);
    var o=Math.max(2/sf,hw*0.4);
    pdf.setDrawColor(26,26,26);pdf.setLineWidth(0.4);
    pdf.line(px(wx1+uy*o),py(wy1-ux*o),px(wx2+uy*o),py(wy2-ux*o));
    pdf.line(px(wx1-uy*o),py(wy1+ux*o),px(wx2-uy*o),py(wy2+ux*o));
    pdf.setLineWidth(0.6);
    pdf.line(px(wx1+uy*hw),py(wy1-ux*hw),px(wx1-uy*hw),py(wy1+ux*hw));
    pdf.line(px(wx2+uy*hw),py(wy2-ux*hw),px(wx2-uy*hw),py(wy2+ux*hw));
  });

  // ── 10. Labels ───────────────────────────────────────────────────────────
  if(opts.labels||opts.area){
    TK.rooms.forEach(function(r){
      var wt=(r.wallThickness||TK.wallThickness||0.1)*TK.scale;
      var iw=ps(r.w-wt),ih=ps(r.h-wt);if(iw<6||ih<4)return;
      var cx2=px(r.x+r.w/2),cy2=py(r.y+r.h/2);
      var both=opts.labels&&opts.area;
      if(opts.labels){
        pdf.setFontSize(Math.min(9,Math.max(5,iw/r.name.length*2.2)));
        pdf.setFont(undefined,'bold');pdf.setTextColor(30);
        pdf.text(r.name,cx2,cy2-(both?1.5:0),{align:'center',baseline:'middle'});
      }
      if(opts.area){
        var aStr=(r.w*r.h/TK.scale/TK.scale).toFixed(2)+' m²';
        pdf.setFontSize(Math.min(7,Math.max(5,iw/aStr.length*2)));
        pdf.setFont(undefined,'normal');pdf.setTextColor(80);
        pdf.text(aStr,cx2,cy2+(both?1.5:0),{align:'center',baseline:'middle'});
      }
    });
    pdf.setTextColor(0);
  }

  // ── 11. Dimension lines ──────────────────────────────────────────────────
  if(opts.outer||opts.inner){
    var DOFF=10/sf,IOFF=8/sf; // offsets in world px (= 10mm / 8mm in PDF)
    function pdfDim(x1,y1,x2,y2,lbl,offPx,nx2,ny2){
      var dl=Math.hypot(x2-x1,y2-y1);if(dl<0.5)return;
      var ux2=(x2-x1)/dl,uy2=(y2-y1)/dl;
      var d1x=x1+nx2*offPx,d1y=y1+ny2*offPx,d2x=x2+nx2*offPx,d2y=y2+ny2*offPx;
      pdf.setDrawColor(80);pdf.setLineWidth(0.15);
      pdf.line(px(x1+nx2*(2/sf)),py(y1+ny2*(2/sf)),px(d1x+nx2*(2/sf)),py(d1y+ny2*(2/sf)));
      pdf.line(px(x2+nx2*(2/sf)),py(y2+ny2*(2/sf)),px(d2x+nx2*(2/sf)),py(d2y+ny2*(2/sf)));
      pdf.setLineWidth(0.3);pdf.line(px(d1x),py(d1y),px(d2x),py(d2y));
      var A=3/sf,tc=1.5/sf;
      pdf.line(px(d1x),py(d1y),px(d1x+ux2*A-uy2*tc),py(d1y+uy2*A+ux2*tc));
      pdf.line(px(d1x),py(d1y),px(d1x+ux2*A+uy2*tc),py(d1y+uy2*A-ux2*tc));
      pdf.line(px(d2x),py(d2y),px(d2x-ux2*A-uy2*tc),py(d2y-uy2*A+ux2*tc));
      pdf.line(px(d2x),py(d2y),px(d2x-ux2*A+uy2*tc),py(d2y-uy2*A-ux2*tc));
      var mx=px((d1x+d2x)/2),my=py((d1y+d2y)/2);
      var ang=Math.atan2(uy2,ux2)*180/Math.PI;if(ang>90||ang<-90)ang+=180;
      pdf.setFontSize(6.5);pdf.setFont(undefined,'bold');pdf.setTextColor(60);
      pdf.text(lbl,mx,my,{align:'center',baseline:'middle',angle:ang});
      pdf.setTextColor(0);
    }
    TK.rooms.forEach(function(r){
      var wt=(r.wallThickness||TK.wallThickness||0.1)*TK.scale,hwt=wt/2;
      if(opts.outer){
        pdfDim(r.x-hwt,r.y-hwt,r.x+r.w+hwt,r.y-hwt,((r.w/TK.scale)+(wt/TK.scale)).toFixed(2)+'m',DOFF,0,-1);
        pdfDim(r.x+r.w+hwt,r.y-hwt,r.x+r.w+hwt,r.y+r.h+hwt,((r.h/TK.scale)+(wt/TK.scale)).toFixed(2)+'m',DOFF,1,0);
        pdfDim(r.x-hwt,r.y+r.h+hwt,r.x+r.w+hwt,r.y+r.h+hwt,((r.w/TK.scale)+(wt/TK.scale)).toFixed(2)+'m',DOFF,0,1);
        pdfDim(r.x-hwt,r.y-hwt,r.x-hwt,r.y+r.h+hwt,((r.h/TK.scale)+(wt/TK.scale)).toFixed(2)+'m',DOFF,-1,0);
      }
      if(opts.inner){
        var iw2=r.w-wt,ih2=r.h-wt;
        if(iw2>2&&ih2>2){
          pdfDim(r.x+hwt,r.y+hwt,r.x+r.w-hwt,r.y+hwt,(iw2/TK.scale).toFixed(2)+'m',IOFF,0,1);
          pdfDim(r.x+hwt,r.y+hwt,r.x+hwt,r.y+r.h-hwt,(ih2/TK.scale).toFixed(2)+'m',IOFF,1,0);
        }
      }
    });
    if(opts.outer) TK.walls.forEach(function(w){
      var wl=Math.hypot(w.x2-w.x1,w.y2-w.y1);if(wl<0.5)return;
      var ux2=(w.x2-w.x1)/wl,uy2=(w.y2-w.y1)/wl;
      pdfDim(w.x1,w.y1,w.x2,w.y2,(wl/TK.scale).toFixed(2)+'m',DOFF,-uy2,ux2);
    });
  }

  // ── 12. Border ───────────────────────────────────────────────────────────
  pdf.setLineWidth(0.2);pdf.setDrawColor(180);
  pdf.rect(ox,oy,drawW,drawH);pdf.setDrawColor(0);

  // ── 13. Scale bar ─────────────────────────────────────────────────────────
  var sbY=oy+drawH+5;
  var sbNice=[0.1,0.25,0.5,1,2,5,10,20,50,100];
  var sbTgtM=20*actualN/1000;
  var sbRealM=sbNice.reduce(function(p,c){return Math.abs(c-sbTgtM)<Math.abs(p-sbTgtM)?c:p;});
  var sbW=sbRealM*TK.scale*sf;if(sbW>60)sbW=60;
  pdf.setLineWidth(0.5);pdf.setDrawColor(0);
  pdf.line(ox,sbY,ox+sbW,sbY);
  pdf.line(ox,sbY-1.5,ox,sbY+1.5);pdf.line(ox+sbW,sbY-1.5,ox+sbW,sbY+1.5);
  pdf.setFontSize(7);pdf.setFont(undefined,'normal');
  var sbLabel=sbRealM>=1?sbRealM.toFixed(0)+'m':(sbRealM*100).toFixed(0)+'cm';
  pdf.text(sbLabel,ox+sbW/2,sbY+4,{align:'center'});
  pdf.setFontSize(8);pdf.text('1 : '+actualN,ox+sbW+6,sbY+1);

  // ── 14. Room table ────────────────────────────────────────────────────────
  if(tableRows.length){
    var colW=[65,45,28];var totalTableW=colW[0]+colW[1]+colW[2];
    var rowH=6.5,hdrH=8;
    var ty=ph-M-(tableRows.length*rowH+hdrH+rowH+4);
    pdf.setFontSize(8);pdf.setFont(undefined,'bold');pdf.setTextColor(80);
    pdf.text('ROMTABELL',M,ty);ty+=3;pdf.setTextColor(0);
    pdf.setFillColor(40,40,40);pdf.rect(M,ty,totalTableW,hdrH,'F');
    var hdrs=['Romnamn','Type','Areal'];var tcx=M;
    pdf.setFontSize(8);pdf.setFont(undefined,'bold');pdf.setTextColor(255);
    hdrs.forEach(function(h,i){pdf.text(h,tcx+2,ty+5.5);tcx+=colW[i];});
    pdf.setTextColor(0);pdf.setDrawColor(40,40,40);pdf.setLineWidth(0.3);pdf.rect(M,ty,totalTableW,hdrH);
    ty+=hdrH;
    pdf.setFont(undefined,'normal');pdf.setFontSize(7.5);
    tableRows.forEach(function(row,ri){
      pdf.setFillColor(ri%2===0?247:255,ri%2===0?247:255,ri%2===0?247:255);
      pdf.rect(M,ty,totalTableW,rowH,'F');
      tcx=M;row.forEach(function(cell,i){
        if(i===2)pdf.text(cell,tcx+colW[i]-2,ty+4.5,{align:'right'});
        else pdf.text(cell,tcx+2,ty+4.5);
        tcx+=colW[i];
      });
      pdf.setDrawColor(210);pdf.setLineWidth(0.2);pdf.rect(M,ty,totalTableW,rowH);
      tcx=M;colW.slice(0,-1).forEach(function(cw2){tcx+=cw2;pdf.line(tcx,ty,tcx,ty+rowH);});
      ty+=rowH;
    });
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
