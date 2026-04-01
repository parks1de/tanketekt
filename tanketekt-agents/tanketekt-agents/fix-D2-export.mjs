/**
 * TANKETEKT — Fix D2: export.js
 * Fixes: PNG/PDF working, layout matches professional example, optional table toggle
 */
import Anthropic from "@anthropic-ai/sdk";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
dotenv.config();

const PROJECT_DIR = process.env.PROJECT_DIR ||
  "C:\\Users\\bness\\OneDrive\\02_PARKSIDE\\05_PROSJEKT\\TankeTekt";
const client = new Anthropic();

function readFile(rel) {
  const p = path.join(PROJECT_DIR, rel);
  return fs.existsSync(p) ? fs.readFileSync(p, "utf8") : "";
}
function writeFiles(text, dir) {
  let clean = text.trim().replace(/^```[a-z]*\n?/,"").replace(/\n?```$/,"").trim();
  if (!clean.startsWith('{')) { console.log("  ⚠️  Non-JSON skipped"); return 0; }
  const files = JSON.parse(clean);
  let count = 0;
  for (const [p, content] of Object.entries(files)) {
    const full = path.join(dir, p);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, content, "utf8");
    console.log(`  ✅ ${p} (${content.length} chars)`);
    count++;
  }
  return count;
}

async function run() {
  console.log("📤  [FIX-D2] Fixing export.js...\n");
  const current = readFile("src/export.js");
  const appJs = readFile("src/app.js").slice(0, 600);

  const res = await client.messages.create({
    model: "claude-sonnet-4-6", max_tokens: 8192,
    system: `Output ONLY a raw JSON object. No markdown. No prose. Keys=filepaths, values=complete file contents.`,
    messages:[{ role:"user", content:`Write complete src/export.js for TankeTekt v.demo-002. No comments, no blank lines.

EXPORT PNG (window.exportPNG):
const prev=TK.selectedId; TK.selectedId=null; if(window.redraw)redraw()
setTimeout(()=>{
  const c=document.getElementById('floorplan')
  const url=c.toDataURL('image/png')
  const a=document.createElement('a'); a.href=url; a.download='tanketekt.png'
  document.body.appendChild(a); a.click(); document.body.removeChild(a)
  TK.selectedId=prev; if(window.redraw)redraw()
  showToast('PNG eksportert! 🖼️')
},80)

EXPORT PDF DIALOG (window.exportPDF):
First show a small modal "PDF-eksport" with:
  Checkbox id=cbIncludeTable checked=true label="Inkluder arealtabell"
  Checkbox id=cbShowScale checked=true label="Vis målestokk"
  Button "Eksporter PDF" → calls doExportPDF(includeTable, showScale)
  Button "Avbryt"

PDF GENERATION (doExportPDF(includeTable, showScale)):
if(!window.jspdf){showToast('jsPDF manglar','error');return}
if(!TK.rooms.length&&!TK.walls.length){showToast('Ingen element','error');return}
const {jsPDF}=window.jspdf
const doc=new jsPDF({orientation:'landscape',unit:'mm',format:'a4'})

PAGE = 297x210mm white background.

COMPUTE BOUNDING BOX of all rooms (x,y,w,h) and walls:
  let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity
  TK.rooms.forEach(r=>{minX=Math.min(minX,r.x);minY=Math.min(minY,r.y);maxX=Math.max(maxX,r.x+r.w);maxY=Math.max(maxY,r.y+r.h)})
  TK.walls.forEach(w=>{minX=Math.min(minX,w.x1,w.x2);minY=Math.min(minY,w.y1,w.y2);maxX=Math.max(maxX,w.x1,w.x2);maxY=Math.max(maxY,w.y1,w.y2)})
  const bboxW=maxX-minX; const bboxH=maxY-minY

LAYOUT (like professional floor plan):
  Left side: floor plan drawing. Right side: area table (if included).
  drawAreaW = includeTable ? 200 : 267
  drawAreaH = 165
  drawOffX = 15; drawOffY = 20

  sf = Math.min(drawAreaW/(bboxW/TK.scale*1000), drawAreaH/(bboxH/TK.scale*1000)) * 0.85
  toMM = (px) => px/TK.scale*1000*sf
  ox = drawOffX + (drawAreaW - bboxW/TK.scale*1000*sf)/2 - toMM(minX)
  oy = drawOffY + (drawAreaH - bboxH/TK.scale*1000*sf)/2 - toMM(minY)

DRAW ROOMS (professional style — white fill, black border):
For each room:
  xp=ox+toMM(room.x); yp=oy+toMM(room.y); wp=toMM(room.w); hp=toMM(room.h)
  White fill: doc.setFillColor(255,255,255); doc.rect(xp,yp,wp,hp,'F')
  Black border 0.5pt: doc.setDrawColor(0); doc.setLineWidth(0.5); doc.rect(xp,yp,wp,hp,'S')
  Room name centered: doc.setFontSize(7); doc.setTextColor(0); doc.text(room.name, xp+wp/2, yp+hp/2-2, {align:'center'})
  Dimensions inside room (Lengd x Breidd): doc.setFontSize(5.5); doc.setTextColor(80);
    const ldim=(room.w/TK.scale).toFixed(2)+'x'+(room.h/TK.scale).toFixed(2)
    doc.text(ldim, xp+wp/2, yp+hp/2+3, {align:'center'})
  Area m²: doc.setFontSize(5); doc.setTextColor(100);
    doc.text((room.w*room.h/TK.scale/TK.scale).toFixed(2)+' m²', xp+wp/2, yp+hp/2+7, {align:'center'})

DRAW WALLS (variable thickness — exterior heavier):
For each wall:
  isMM = wall.thickness >= 0.15
  lw = toMM(wall.thickness * TK.scale) * 0.4
  doc.setLineWidth(Math.max(0.3, lw))
  doc.setDrawColor(isMM ? 0 : 60)
  doc.line(ox+toMM(wall.x1), oy+toMM(wall.y1), ox+toMM(wall.x2), oy+toMM(wall.y2))

OUTER DIMENSIONS (below and right of full bbox, if TK.showOuterDims):
  Horizontal: line below bbox + 8mm. Arrowheads. Label total width.
  Vertical: line right of bbox + 8mm. Label total height.
  doc.setFontSize(6); doc.setTextColor(0); doc.setLineWidth(0.2); doc.setDrawColor(100)

SCALE INDICATOR (bottom-left of drawing, if showScale):
  doc.setFontSize(6); doc.setTextColor(80)
  const scaleVal = Math.round(1000/sf)
  doc.text('PLANTEIKNING', drawOffX, drawOffY+drawAreaH+8)
  doc.text('MÅLESTOKK 1:'+scaleVal+' @ A4', drawOffX, drawOffY+drawAreaH+12)

TITLE BLOCK (bottom of page):
  doc.setFontSize(10); doc.setFont('helvetica','bold'); doc.setTextColor(0)
  doc.text('TankeTekt', 15, 200)
  doc.setFontSize(7); doc.setFont('helvetica','normal'); doc.setTextColor(80)
  doc.text('v.demo-002 • tanketekt.no', 15, 205)
  doc.setFontSize(7); doc.text(new Date().toLocaleDateString('no'), 282, 205, {align:'right'})

AREA TABLE (right side, if includeTable):
  tableX=220; tableY=drawOffY
  doc.setFillColor(240,240,240); doc.rect(tableX,tableY,72,8,'F')
  doc.setFont('helvetica','bold'); doc.setFontSize(8); doc.setTextColor(0)
  doc.text('AREAL', tableX+2, tableY+5.5)
  doc.text('m²', tableX+65, tableY+5.5, {align:'right'})
  let ty=tableY+8; let totalArea=0
  TK.rooms.forEach((r,i)=>{
    const area=parseFloat((r.w*r.h/TK.scale/TK.scale).toFixed(2))
    totalArea+=area
    if(i%2===0){doc.setFillColor(250,250,250);doc.rect(tableX,ty,72,6,'F')}
    doc.setFont('helvetica','normal'); doc.setFontSize(7); doc.setTextColor(0)
    doc.text(r.name, tableX+2, ty+4.2)
    doc.text(area.toFixed(2), tableX+65, ty+4.2, {align:'right'})
    ty+=6
  })
  doc.setFillColor(220,220,220); doc.rect(tableX,ty,72,7,'F')
  doc.setFont('helvetica','bold'); doc.setFontSize(7.5)
  doc.text('TOTAL', tableX+2, ty+5)
  doc.text(totalArea.toFixed(2), tableX+65, ty+5, {align:'right'})
  doc.setDrawColor(0); doc.setLineWidth(0.3)
  doc.rect(tableX,tableY,72,ty+7-tableY,'S')

doc.save('tanketekt.pdf')
showToast('PDF eksportert! 📄')

SAVE PROJECT (window.saveProject):
const d=JSON.stringify({version:'v.demo-002',rooms:TK.rooms,walls:TK.walls,doors:TK.doors,windows:TK.windows,scale:TK.scale},null,2)
const b=new Blob([d],{type:'application/json'})
const a=document.createElement('a'); a.href=URL.createObjectURL(b); a.download='tanketekt-prosjekt.json'
document.body.appendChild(a); a.click(); document.body.removeChild(a)
showToast('Prosjekt lagra! 💾')

LOAD PROJECT (window.loadProject(file)):
const reader=new FileReader()
reader.onload=(e)=>{try{const d=JSON.parse(e.target.result);if(!d.rooms)throw new Error('Ugyldig fil');saveSnapshot();TK.rooms=d.rooms||[];TK.walls=d.walls||[];TK.doors=d.doors||[];TK.windows=d.windows||[];TK.scale=d.scale||100;if(window.updateSidebar)updateSidebar();if(window.updateElementList)updateElementList();if(window.redraw)redraw();showToast('Prosjekt lasta inn!')}catch(err){showToast('Feil: '+err.message,'error')}}
reader.readAsText(file)

AUTO-SAVE (window.autoSave):
window.autoSave=()=>{try{localStorage.setItem('tanketekt_autosave',JSON.stringify({rooms:TK.rooms,walls:TK.walls,doors:TK.doors,windows:TK.windows,scale:TK.scale,savedAt:Date.now()}))}catch(e){}}
setInterval(autoSave, 30000)

LOAD FROM LOCALSTORAGE (window.loadFromLocalStorage):
window.loadFromLocalStorage=()=>{try{const d=localStorage.getItem('tanketekt_autosave');if(!d)return;const s=JSON.parse(d);const age=Math.round((Date.now()-s.savedAt)/60000);if(confirm('Gjenopprette sist lagra økt ('+age+' min sidan)?')){TK.rooms=s.rooms||[];TK.walls=s.walls||[];TK.doors=s.doors||[];TK.windows=s.windows||[];TK.scale=s.scale||100;if(window.updateSidebar)updateSidebar();if(window.updateElementList)updateElementList();if(window.redraw)redraw();setStatus('Økt gjenoppretta!')}}catch(e){}}

SHOW TOAST (window.showToast):
window.showToast=(msg,type='success')=>{const d=document.createElement('div');d.style='position:fixed;bottom:24px;right:24px;padding:10px 20px;border-radius:6px;font-weight:bold;font-size:13px;color:white;z-index:9999;transition:opacity 0.4s;background:'+(type==='error'?'#e94560':'#238636');d.textContent=msg;document.body.appendChild(d);setTimeout(()=>{d.style.opacity='0';setTimeout(()=>d.remove(),400)},2500)}

CURRENT (reference only):
${current.slice(0,400)}

Return JSON: {"src/export.js":"..."}`}]
  });
  writeFiles(res.content[0].text, PROJECT_DIR);
  console.log("\n✅ Fix-D2 done. Run fix-E-walls-resize.mjs next.");
}
run().catch(e => { console.error("❌", e.message); process.exit(1); });
