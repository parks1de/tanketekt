
window.cascadeDelete=(id,type)=>{
  if(type==='room'){
    TK.doors=TK.doors.filter(d=>d.roomId!==id);
    TK.windows=TK.windows.filter(w=>w.roomId!==id);
    TK.rooms=TK.rooms.filter(r=>r.id!==id);
  } else if(type==='wall'){
    TK.doors=TK.doors.filter(d=>d.wallId!==id);
    TK.windows=TK.windows.filter(w=>w.wallId!==id);
    TK.walls=TK.walls.filter(w=>w.id!==id);
  }
  if(TK.selectedId===id)TK.selectedId=null;
  if(window.updateSidebar)updateSidebar();
  if(window.updateWallList)updateWallList();
  if(window.updateElementList)updateElementList();
  if(window.redraw)redraw();
};
window.TK={ghostObject:null,rooms:[],walls:[],doors:[],windows:[],history:[],redoStack:[],scale:100,zoom:1.0,panX:0,panY:0,showGrid:true,showOuterDims:true,showInnerDims:false,showAreaLabels:true,showRoomLabels:true,selectedId:null,selectedType:null,selectedIds:[],currentTool:'draw',wallThickness:0.098,nextId:1,clipboard:null,snapToGrid:false,projectName:''}
window.TK_ROOM_TYPES=[{id:'stove',name:'Stove',color:'#4a7fa6',minArea:15},{id:'soverom',name:'Soverom',color:'#7d6a9e',minArea:7},{id:'kjokken',name:'Kjøken',color:'#c8874a',minArea:6},{id:'bad',name:'Bad/WC',color:'#4a9690',minArea:2.5},{id:'gang',name:'Gang/Entre',color:'#7e8e94',minArea:0},{id:'bod',name:'Bod',color:'#8a7060',minArea:0},{id:'kontor',name:'Kontor',color:'#5e9070',minArea:0},{id:'anna',name:'Anna',color:'#909090',minArea:0}]
window.px2m=(px)=>(px/TK.scale).toFixed(2)
window.roomArea=(r)=>(r.w*r.h/(TK.scale*TK.scale)).toFixed(2)
window.saveSnapshot=()=>{TK.history.push(JSON.stringify({rooms:TK.rooms,walls:TK.walls,doors:TK.doors,windows:TK.windows}));if(TK.history.length>50)TK.history.shift();TK.redoStack=[];autoSave()}
window.undo=()=>{if(!TK.history.length)return;TK.redoStack.push(JSON.stringify({rooms:TK.rooms,walls:TK.walls,doors:TK.doors,windows:TK.windows}));const s=JSON.parse(TK.history.pop());TK.rooms=s.rooms;TK.walls=s.walls;TK.doors=s.doors;TK.windows=s.windows;updateSidebar();updateWallList();if(window.updateElementList)updateElementList();if(window.redraw)redraw()}
window.redo=()=>{if(!TK.redoStack.length)return;TK.history.push(JSON.stringify({rooms:TK.rooms,walls:TK.walls,doors:TK.doors,windows:TK.windows}));const s=JSON.parse(TK.redoStack.pop());TK.rooms=s.rooms;TK.walls=s.walls;TK.doors=s.doors;TK.windows=s.windows;updateSidebar();updateWallList();if(window.updateElementList)updateElementList();if(window.redraw)redraw()}
window.setStatus=(msg)=>{const e=document.getElementById('statusMsg');if(e)e.textContent=msg}
window.setTool=(tool)=>{TK.currentTool=tool;['btnDraw','btnWall','btnDoor','btnWindow'].forEach(id=>{const b=document.getElementById(id);if(b)b.classList.remove('active')});const active={draw:'btnDraw',wall:'btnWall',door:'btnDoor',window:'btnWindow'}[tool];if(active){const b=document.getElementById(active);if(b)b.classList.add('active');}}
window.updateSidebar=()=>{
  const list=document.getElementById('room-list');if(!list)return;list.innerHTML='';
  TK.rooms.forEach(r=>{const type=TK_ROOM_TYPES.find(t=>t.id===r.type)||TK_ROOM_TYPES[7];const area=roomArea(r);const warn=type.minArea>0&&parseFloat(area)<type.minArea?' ⚠️':'';const li=document.createElement('li');li.className='room-item'+(TK.selectedId===r.id?' selected':'');li.style.borderLeftColor=type.color;li.innerHTML='<div class="rname">'+r.name+warn+'</div><div class="rinfo">'+px2m(r.w)+'m × '+px2m(r.h)+'m | '+area+' m²</div>';
    li.onclick=()=>{TK.selectedId=r.id;TK.selectedType='room';updateSidebar();if(window.redraw)redraw()};
    const delBtn=document.createElement('button');delBtn.textContent='×';delBtn.title='Slett rom';delBtn.style='float:right;padding:0 5px;background:#e94560;border:none;color:white;border-radius:3px;cursor:pointer;font-size:11px;margin-top:2px';
    delBtn.onclick=e=>{e.stopPropagation();if(window.saveSnapshot)saveSnapshot();TK.rooms=TK.rooms.filter(x=>x.id!==r.id);if(TK.selectedId===r.id)TK.selectedId=null;updateSidebar();if(window.redraw)redraw()};
    li.appendChild(delBtn);list.appendChild(li)});
  const wEl=document.getElementById('tek17-warnings');if(!wEl)return;wEl.innerHTML='';
  TK.rooms.forEach(r=>{const type=TK_ROOM_TYPES.find(t=>t.id===r.type)||TK_ROOM_TYPES[7];if(type.minArea>0&&parseFloat(roomArea(r))<type.minArea){const d=document.createElement('div');d.className='tek17-warn';d.textContent='⚠️ '+r.name+': '+roomArea(r)+'m² (min '+type.minArea+'m² TEK17)';wEl.appendChild(d)}})
}
window.updateWallList=()=>{
  const list=document.getElementById('wall-list');if(!list)return;list.innerHTML='';
  if(!TK.walls.length){const li=document.createElement('li');li.style='color:var(--muted);font-size:12px;padding:8px';li.textContent='Ingen veggar';list.appendChild(li);return}
  TK.walls.forEach(w=>{const len=Math.sqrt((w.x2-w.x1)**2+(w.y2-w.y1)**2)/TK.scale;const li=document.createElement('li');li.className='room-item'+(TK.selectedId===w.id?' selected':'');li.style.borderLeftColor='#666';li.innerHTML='<div class="rname">Vegg '+w.id+'</div><div class="rinfo">'+len.toFixed(2)+'m | '+(w.thickness*1000).toFixed(0)+'mm</div>';const btn=document.createElement('button');btn.textContent='×';btn.style='float:right;padding:0 5px;background:#e94560;border:none;color:white;border-radius:3px;cursor:pointer;font-size:11px';btn.onclick=e=>{e.stopPropagation();saveSnapshot();TK.walls=TK.walls.filter(x=>x.id!==w.id);updateWallList();if(window.redraw)redraw()};li.appendChild(btn);li.onclick=()=>{TK.selectedId=w.id;TK.selectedType='wall';updateWallList();if(window.redraw)redraw()};list.appendChild(li)})
}
window.autoSave=()=>{try{localStorage.setItem('tanketekt_autosave',JSON.stringify({rooms:TK.rooms,walls:TK.walls,doors:TK.doors,windows:TK.windows,scale:TK.scale,savedAt:Date.now()}))}catch(e){}}
window.loadFromLocalStorage=()=>{try{const d=localStorage.getItem('tanketekt_autosave');if(!d)return;const s=JSON.parse(d);const age=Math.round((Date.now()-s.savedAt)/60000);if(confirm('Gjenopprette sist lagra økt ('+age+' min sidan)?')){TK.rooms=s.rooms||[];TK.walls=s.walls||[];TK.doors=s.doors||[];TK.windows=s.windows||[];TK.scale=s.scale||100;updateSidebar();updateWallList();if(window.updateElementList)updateElementList();if(window.redraw)redraw();setStatus('Økt gjenoppretta!')}}catch(e){}}
window.redraw=()=>{}
window.deleteSelected=()=>{
  const ids=[...new Set([TK.selectedId,...(TK.selectedIds||[])].filter(Boolean))];
  if(!ids.length)return;saveSnapshot();
  ids.forEach(id=>{const type=TK.rooms.find(x=>x.id===id)?'room':TK.walls.find(x=>x.id===id)?'wall':(TK.selectedType||'room');cascadeDelete(id,type);});
  TK.selectedIds=[];
};
window.copySelected=()=>{const r=TK.rooms.find(x=>x.id===TK.selectedId);if(r){TK.clipboard=JSON.parse(JSON.stringify(r));setStatus('Kopiert!')}}
window.pasteClipboard=()=>{if(!TK.clipboard)return;saveSnapshot();const c={...TK.clipboard,id:TK.nextId++,x:TK.clipboard.x+TK.scale*0.5,y:TK.clipboard.y+TK.scale*0.5};TK.rooms.push(c);updateSidebar();if(window.redraw)redraw()}
window.placeDoor=()=>{}
window.placeWindow=()=>{}
window.exportPNG=()=>{}
window.exportPDF=()=>{}
window.saveProject=()=>{}
window.loadProject=()=>{}
window.updateElementList=()=>{}
window.zoomToFit=()=>{}

window.promptRoomDims=()=>{
  const types=(window.TK_ROOM_TYPES||[]);
  const opts=types.map(t=>'<option value="'+t.id+'">'+t.name+'</option>').join('');
  const ov=document.createElement('div');ov.className='modal-overlay';
  ov.innerHTML='<div class="modal"><h2>Nytt rom med mål</h2><label>Lengd (m)</label><input id="_rl" type="number" value="4.0" step="0.05" min="0.5"><label>Breidd (m)</label><input id="_rb" type="number" value="3.0" step="0.05" min="0.5"><label>Type</label><select id="_rtp">'+opts+'</select><div class="modal-btns"><button id="_rpc">Avbryt</button><button id="_rpp" style="background:var(--accent);border-color:var(--accent)">Plasser</button></div></div>';
  document.body.appendChild(ov);
  document.getElementById('_rpc').onclick=()=>ov.remove();
  document.getElementById('_rpp').onclick=()=>{
    const l=parseFloat(document.getElementById('_rl').value)||4;
    const b2=parseFloat(document.getElementById('_rb').value)||3;
    const tid=document.getElementById('_rtp').value;
    const tp=types.find(t=>t.id===tid)||types[7];
    const cv2=document.getElementById('floorplan');
    const wo2=window.screenToWorld?window.screenToWorld(cv2.width/2,cv2.height/2):{x:l*TK.scale/2,y:b2*TK.scale/2};
    if(window.saveSnapshot)saveSnapshot();
    const rid=TK.nextId++;
    TK.rooms.push({id:rid,name:tp.name+' '+rid,type:tid,x:wo2.x-l*TK.scale/2,y:wo2.y-b2*TK.scale/2,w:l*TK.scale,h:b2*TK.scale,color:tp.color,wallThickness:TK.wallThickness});
    TK.selectedId=rid;TK.selectedType='room';
    ov.remove();if(window.updateSidebar)updateSidebar();if(window.redraw)redraw();
    if(window.setStatus)setStatus('Rom plassert — dra for å flytte');
  };
};
window.setVisibility=function(key,val){if(key==='grid')TK.showGrid=val;else if(key==='outer')TK.showOuterDims=val;else if(key==='inner')TK.showInnerDims=val;else if(key==='area')TK.showAreaLabels=val;else if(key==='labels')TK.showRoomLabels=val;else if(key==='snap')TK.snapToGrid=val;if(window.redraw)redraw();};
window.setWallThickness=function(val){TK.wallThickness=val/1000;};
window.newProject=function(){if(confirm('Nytt prosjekt? Ulagra endringar går tapt.')){TK.rooms=[];TK.walls=[];TK.doors=[];TK.windows=[];TK.selectedId=null;TK.history=[];TK.redoStack=[];localStorage.removeItem('tanketekt_autosave');updateSidebar();updateWallList();if(window.updateElementList)updateElementList();if(window.redraw)redraw();setStatus('Nytt prosjekt klart');}};
window.showHelpModal=function(){
  var ov=document.createElement('div');ov.className='modal-overlay';
  ov.innerHTML='<div class="modal" style="max-width:480px;width:95%"><h2>Hjelp — TankeTekt</h2>'+
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px 20px;font-size:12px;line-height:1.8;margin-top:8px">'+
    '<div><div style="font-size:10px;text-transform:uppercase;letter-spacing:.07em;color:var(--muted);margin-bottom:4px">Teikne</div>'+
    '<div>&#9633; Dra — teikn rom</div>'+
    '<div>| Dra — teikn vegg</div>'+
    '<div>&#8853; — nytt rom med mål</div>'+
    '<div>D&#248;r/Vindauge — klikk p&#229; vegg</div>'+
    '</div>'+
    '<div><div style="font-size:10px;text-transform:uppercase;letter-spacing:.07em;color:var(--muted);margin-bottom:4px">Redigere</div>'+
    '<div>Klikk — vel element</div>'+
    '<div>Shift+klikk — fleirval</div>'+
    '<div>Dra — flytt element</div>'+
    '<div>Hjørnepunkt — endre storleik</div>'+
    '<div>Dobbelklikk rom — endre detaljar</div>'+
    '</div>'+
    '<div><div style="font-size:10px;text-transform:uppercase;letter-spacing:.07em;color:var(--muted);margin-bottom:4px">Snarvegtastar</div>'+
    '<div><b>Ctrl+Z</b> — angre</div>'+
    '<div><b>Ctrl+Y</b> — gjer om</div>'+
    '<div><b>Ctrl+C / Ctrl+V</b> — kopier/lim</div>'+
    '<div><b>Delete</b> — slett valt</div>'+
    '<div><b>D</b> — nytt rom med mål</div>'+
    '<div><b>Esc</b> — avbryt handling</div>'+
    '</div>'+
    '<div><div style="font-size:10px;text-transform:uppercase;letter-spacing:.07em;color:var(--muted);margin-bottom:4px">Navigasjon</div>'+
    '<div>Scroll — zoom inn/ut</div>'+
    '<div>Alt+dra — panorere</div>'+
    '<div>&#8694; — tilpass til innhald</div>'+
    '<div>Prosjektnamn-felt — namngjev teikning for eksport</div>'+
    '</div>'+
    '</div>'+
    '<div class="modal-btns"><button onclick="this.closest(\'.modal-overlay\').remove()">Lukk</button></div></div>';
  document.body.appendChild(ov);
};
window.promptWallDims=()=>{
  const ov=document.createElement('div');ov.className='modal-overlay';
  ov.innerHTML='<div class="modal"><h2>Ny vegg med mål</h2><label>Lengd (m)</label><input id="_wl2" type="number" value="3.0" step="0.05" min="0.1"><label>Tykkleik</label><select id="_wth2"><option value="0.098">Innv. 98mm</option><option value="0.148">Innv. 148mm</option><option value="0.198" selected>Utv. 198mm</option><option value="0.248">Utv. 248mm</option></select><div class="modal-btns"><button id="_wpc2">Avbryt</button><button id="_wpp2" style="background:var(--accent);border-color:var(--accent)">Plasser</button></div></div>';
  document.body.appendChild(ov);
  document.getElementById('_wpc2').onclick=()=>ov.remove();
  document.getElementById('_wpp2').onclick=()=>{
    const l=parseFloat(document.getElementById('_wl2').value)||3;
    const th=parseFloat(document.getElementById('_wth2').value)||0.198;
    const cv3=document.getElementById('floorplan');
    const wo3=window.screenToWorld?window.screenToWorld(cv3.width/2,cv3.height/2):{x:200,y:200};
    if(window.saveSnapshot)saveSnapshot();
    const wid=TK.nextId++;
    TK.walls.push({id:wid,x1:wo3.x-l*TK.scale/2,y1:wo3.y,x2:wo3.x+l*TK.scale/2,y2:wo3.y,thickness:th});
    TK.selectedId=wid;TK.selectedType='wall';
    ov.remove();if(window.updateWallList)updateWallList();if(window.redraw)redraw();
    if(window.setStatus)setStatus('Vegg plassert — dra for å flytte');
  };
};
document.addEventListener('DOMContentLoaded',function(){
  var ws=document.getElementById('wallThicknessSelect');
  if(ws){ws.onchange=function(){TK.wallThickness=parseFloat(this.value)/1000;};TK.wallThickness=parseFloat(ws.value)/1000;}
  document.addEventListener('keydown',function(e){
    if(e.target.tagName==='INPUT'||e.target.tagName==='SELECT'||e.target.tagName==='TEXTAREA')return;
    if(e.ctrlKey&&e.key==='z'){e.preventDefault();undo();}
    else if(e.ctrlKey&&e.key==='y'){e.preventDefault();redo();}
    else if(e.ctrlKey&&e.key==='c')copySelected();
    else if(e.ctrlKey&&e.key==='v')pasteClipboard();
    else if(e.key==='Delete')deleteSelected();
    else if(e.key==='d'||e.key==='D'){if(window.promptRoomDims)promptRoomDims();}
    else if(e.key==='Escape'){TK.currentTool='draw';TK.pendingElement=null;setTool('draw');window.activePreview=null;window.snapIndicator=null;if(window.setStatus)setStatus('Klar');if(window.redraw)redraw();}
  });
  setTool('draw');setStatus('Teikn rom: klikk og dra');
  setTimeout(loadFromLocalStorage,500);
});