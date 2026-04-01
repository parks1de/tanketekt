/**
 * FIX-H: Toolbar layout, Vis dropdown, sidebar tabs, white canvas
 * Touches: index.html, src/styles.css, src/app.js
 */
import Anthropic from "@anthropic-ai/sdk";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
dotenv.config();

const DIR = process.env.PROJECT_DIR || "C:\\Users\\bness\\OneDrive\\02_PARKSIDE\\05_PROSJEKT\\TankeTekt";
const client = new Anthropic();
const read = f => { const p=path.join(DIR,f); return fs.existsSync(p)?fs.readFileSync(p,"utf8"):""; };
function write(text) {
  let c=text.trim().replace(/^```[a-z]*\n?/,"").replace(/\n?```$/,"").trim();
  if(!c.startsWith("{"))return console.log("  ⚠️  skipped");
  const files=JSON.parse(c);
  for(const [p,v] of Object.entries(files)){
    const f=path.join(DIR,p); fs.mkdirSync(path.dirname(f),{recursive:true}); fs.writeFileSync(f,v,"utf8");
    console.log(`  ✅ ${p} (${v.length}ch)`);
  }
}

async function run(){
  console.log("🔧 [FIX-H] GUI: toolbar + vis dropdown + sidebar tabs...\n");
  const [html,css,app]=[read("index.html"),read("src/styles.css"),read("src/app.js")];
  const res = await client.messages.create({ model:"claude-sonnet-4-6", max_tokens:8192,
    system:`Output ONLY raw JSON object. No markdown. Keys=filepaths, values=complete file contents.`,
    messages:[{role:"user",content:`Rewrite index.html, src/styles.css, src/app.js for TankeTekt v.demo-002. Return all 3.

INDEX.HTML TOOLBAR — exact left-to-right order:
1. select#wallThicknessSelect (leftmost, applies to both draw tools)
2. button#btnDraw SVG+label "Teikn rom"
3. button#btnWall SVG+label "Teikn vegg"
4. .toolbar-divider
5. button#btnDoor SVG+label "Dør"
6. button#btnWindow SVG+label "Vindauge"
7. .toolbar-divider
8. div.vis-dropdown-wrap: button#btnVis "Vis ▾" + div#visPanel.vis-panel (hidden by default) containing checkboxes:
   label>input#cbGrid type=checkbox checked "Rutenett"
   label>input#cbOuter type=checkbox checked "Ytre mål"
   label>input#cbInner type=checkbox "Indre mål"
   label>input#cbArea type=checkbox checked "Areal"
   label>input#cbLabels type=checkbox checked "Romnamn"
9. button#btnUndo SVG "Angre"
10. button#btnRedo SVG "Gjer om"
11. flex spacer (div style="flex:1")
12. button#btnNew SVG "Ny"
13. button#btnSave SVG "Lagre"
14. .toolbar-divider
15. button#btnPNG styled accent "PNG"
16. button#btnPDF styled accent "PDF"
17. input#fileInput type=file accept=.json style=display:none
18. button#btnZoomFit SVG "Tilpass"
19. button#btnHelp SVG "?"

SIDEBAR — tab system:
div#sidebar contains:
  div.tab-bar: button.tab.active data-tab=rooms "Rom", button.tab data-tab=walls "Veggar", button.tab data-tab=elements "Dører/Vindauge"
  div#tab-rooms.tab-pane.active: ul#room-list, div#tek17-warnings
  div#tab-walls.tab-pane: ul#wall-list
  div#tab-elements.tab-pane: ul#element-list

CANVAS: canvas#floorplan inside div#floorplan-wrap. NO width/height attrs. style="display:block;cursor:crosshair"
Script load order: jsPDF CDN → link styles.css → app.js → canvas.js → drawing.js → elements.js → export.js
Footer font-size:14px color:var(--text).

STYLES (src/styles.css) — keep all existing, ADD/FIX:
#floorplan-wrap { background:#ffffff; } 
canvas#floorplan { background:#ffffff; }
.vis-dropdown-wrap { position:relative; }
#visPanel { display:none; position:absolute; top:100%; left:0; background:var(--surface); border:1px solid var(--border); border-radius:6px; padding:10px 14px; z-index:100; min-width:160px; box-shadow:0 4px 12px rgba(0,0,0,0.4); margin-top:4px; }
#visPanel label { display:flex; align-items:center; gap:8px; padding:4px 0; font-size:12px; cursor:pointer; white-space:nowrap; }
#visPanel input[type=checkbox] { width:14px; height:14px; accent-color:var(--accent); }
#btnVis.active { background:var(--accent); }
.tab-bar { display:flex; border-bottom:1px solid var(--border); margin-bottom:8px; }
.tab { flex:1; background:none; border:none; border-bottom:2px solid transparent; color:var(--muted); padding:6px 4px; font-size:11px; cursor:pointer; }
.tab.active { color:var(--text); border-bottom-color:var(--hi); }
.tab-pane { display:none; }
.tab-pane.active { display:block; }

APP.JS — keep ALL existing code. ADD/FIX in DOMContentLoaded:
Vis dropdown: btnVis onclick toggles #visPanel display + btnVis.active class. Close on click outside (document click listener checks !visPanel.contains(e.target)&&!btnVis.contains(e.target)).
Each checkbox onchange: cbGrid→TK.showGrid=this.checked; cbOuter→TK.showOuterDims=this.checked; cbInner→TK.showInnerDims=this.checked; cbArea→TK.showAreaLabels=this.checked; cbLabels→TK.showRoomLabels=this.checked; redraw()
Tab switching: document.querySelectorAll('.tab').forEach(t=>t.onclick=()=>{ document.querySelectorAll('.tab,.tab-pane').forEach(x=>x.classList.remove('active')); t.classList.add('active'); document.getElementById('tab-'+t.dataset.tab).classList.add('active') })
updateSidebar() writes to #room-list AND #tek17-warnings (in tab-rooms). Add window.updateWallList() that writes to #wall-list: each li shows wall id, length in m, thickness in mm, delete button.
REMOVE: any reference to old #element-list being populated with walls (that goes to #wall-list now).
ADD to TK: showOuterDims:true, showInnerDims:false, showAreaLabels:true, showRoomLabels:true (if not already present).
wallThicknessSelect onchange: parse float → TK.wallThickness = parseFloat(val) IF val!=='custom'. Custom → prompt mm → /1000.

CURRENT index.html: ${html.slice(0,800)}
CURRENT styles.css: ${css.slice(0,600)}
CURRENT app.js: ${app.slice(0,1200)}

Return JSON: {"index.html":"...","src/styles.css":"...","src/app.js":"..."}`}]
  });
  write(res.content[0].text);
  console.log("\n✅ Fix-H done.");
}
run().catch(e=>{console.error("❌",e.message);process.exit(1);});
