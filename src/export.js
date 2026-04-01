
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
  var jsPDFCtor=(window.jspdf&&window.jspdf.jsPDF)||window.jsPDF;
  if(!jsPDFCtor){if(window.showToast)showToast('jsPDF ikkje tilgjengeleg','error');return;}
  var cv=document.getElementById('floorplan');
  var imgData=cv.toDataURL('image/jpeg',0.92);
  var cw=cv.width,ch=cv.height;
  var orient=cw>=ch?'landscape':'portrait';
  var pdf=new jsPDFCtor({orientation:orient,unit:'mm',format:'a3'});
  var pw=pdf.internal.pageSize.getWidth()-20;
  var ph=pdf.internal.pageSize.getHeight()-20;
  var ratio=Math.min(pw/cw,ph/ch);
  var iw=cw*ratio,ih=ch*ratio;
  var ox=(pw-iw)/2+10,oy=(ph-ih)/2+10;
  pdf.addImage(imgData,'JPEG',ox,oy,iw,ih);
  pdf.save('tanketekt.pdf');
  if(window.showToast)showToast('PDF lasta ned!','success');
};
