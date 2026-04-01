/**
 * TANKETEKT — Fix Agent A: index.html + app.js
 * Fixes: toolbar layout, display toggles, new project, zoom-to-fit, help, footer
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
  if (!clean.startsWith('{')) { console.log("  ⚠️  Skipped (non-JSON)"); return 0; }
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
  console.log("🔧  [FIX-A] Fixing toolbar + app state...\n");
  const indexHtml = readFile("index.html");
  const appJs = readFile("src/app.js");

  const res = await client.messages.create({
    model: "claude-sonnet-4-6", max_tokens: 8192,
    system: `Output ONLY raw JSON object. No markdown. No explanation. Keys=filepaths, values=complete file contents.`,
    messages:[{ role:"user", content:`Rewrite these 2 TankeTekt v.demo-002 files with all fixes applied. Return both files always.

=== FIXES FOR index.html ===
Toolbar must be logically grouped LEFT to RIGHT:
  GROUP 1 "Teikn": [Teikn rom ✏️ #btnDraw] [Teikn vegg 📐 #btnWall] [select#wallThicknessSelect]
  DIVIDER
  GROUP 2 "Vis": [Rutenett #btnGrid active-by-default] [Ytre mål #btnShowOuter active-by-default] [Indre mål #btnShowInner] [Areal #btnShowArea active-by-default] [Romnamn #btnShowLabels active-by-default]
  DIVIDER
  GROUP 3 "Redigér": [Angre ↩ #btnUndo] [Gjer om ↪ #btnRedo] [Dør 🚪 #btnDoor] [Vindauge 🪟 #btnWindow]
  DIVIDER
  GROUP 4 "Prosjekt": [Ny ✨ #btnNew] [Lagre 💾 #btnSave] [Last inn 📂 #btnLoad] [Tilpass 🎯 #btnZoomFit] [Hjelp ? #btnHelp]
  input#fileInput type=file accept=.json style=display:none
  RIGHT-ALIGNED (margin-left:auto): [PNG #btnPNG] [PDF #btnPDF]
Keep exact same layout structure otherwise (canvas, sidebar, statusbar).
Footer: increase font-size to 13px, color var(--text) not muted.
Load order: jsPDF CDN → link rel=stylesheet src/styles.css → then scripts: src/app.js src/canvas.js src/drawing.js src/elements.js src/export.js

=== FIXES FOR src/app.js ===
Add to window.TK: showOuterDims:true, showInnerDims:false, showAreaLabels:true, showRoomLabels:true
Keep ALL existing TK properties and all existing code.
Add these new button wirings in DOMContentLoaded (keep all existing wirings):
  btnShowOuter: toggle TK.showOuterDims, toggle .active, redraw()
  btnShowInner: toggle TK.showInnerDims, toggle .active, redraw()
  btnShowArea: toggle TK.showAreaLabels, toggle .active, redraw()
  btnShowLabels: toggle TK.showRoomLabels, toggle .active, redraw()
  btnNew: if(confirm('Nytt prosjekt? Ulagra endringar går tapt.'))){ TK.rooms=[];TK.walls=[];TK.doors=[];TK.windows=[];TK.selectedId=null;TK.history=[];TK.redoStack=[];localStorage.removeItem('tanketekt_autosave');updateSidebar();if(window.updateElementList)updateElementList();redraw();setStatus('Nytt prosjekt klart') }
  btnZoomFit: if(window.zoomToFit)zoomToFit()
  btnHelp: show help modal with keyboard shortcuts
  btnGrid already wired — keep it, just add active class on load since showGrid defaults true
Add window.showToast if not present: fixed div bottom-right, bg #238636, white text, fades after 2.5s
Add help modal function: showHelpModal() creates overlay div with shortcuts list:
  Scroll = zoom inn/ut
  Alt+drag = panorér
  Ctrl+Z/Y = angre/gjer om
  Ctrl+C/V = kopier/lim inn
  Delete = slett valt
  Escape = avbryt
  Dobbelklikk rom = endre namn/type
  "Lagre" = lagrar til fil | "Last inn" = lastar prosjekt frå fil
  Close button to dismiss.
Set active class on btnGrid, btnShowOuter, btnShowArea, btnShowLabels on DOMContentLoaded.

=== CURRENT index.html ===
${indexHtml}

=== CURRENT src/app.js ===
${appJs}

Return JSON: {"index.html":"...","src/app.js":"..."}`}]
  });
  writeFiles(res.content[0].text, PROJECT_DIR);
  console.log("\n✅ Fix-A done.");
}
run().catch(e => { console.error("❌", e.message); process.exit(1); });
