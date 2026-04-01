/**
 * TANKETEKT — Fix F: SVG Icons throughout UI
 * Replaces all emoji and text icons with clean inline SVG icons
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

// SVG icon definitions - clean 16x16 minimal SVGs
const ICONS = {
  draw: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M11 2l3 3-8 8H3v-3L11 2z"/></svg>`,
  wall: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><rect x="2" y="5" width="12" height="3" rx="0.5" stroke="currentColor" fill="none"/><rect x="2" y="8" width="12" height="3" rx="0.5" stroke="currentColor" fill="none"/></svg>`,
  grid: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6 2v12M10 2v12M2 6h12M2 10h12"/></svg>`,
  outerDim: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><rect x="4" y="4" width="8" height="8"/><path d="M1 4v8M1 4l1.5 1.5M1 12l1.5-1.5M4 1h8M4 1l1.5 1.5M12 1l-1.5 1.5"/></svg>`,
  innerDim: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><rect x="2" y="2" width="12" height="12"/><path d="M5 8h6M5 8l1.5-1.5M11 8l-1.5-1.5M8 5v6M8 5l1.5 1.5M8 11l-1.5-1.5"/></svg>`,
  area: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><rect x="2" y="2" width="12" height="12" rx="1"/><path d="M5 10l2-4 2 4M5.5 9h3"/></svg>`,
  label: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><rect x="1" y="4" width="14" height="8" rx="1.5"/><path d="M4 8h8M4 11h5"/></svg>`,
  undo: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7V3L1 5"/><path d="M3 7c0-3 8-5 10 1s-2 7-6 7"/></svg>`,
  redo: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M13 7V3l2 2"/><path d="M13 7c0-3-8-5-10 1s2 7 6 7"/></svg>`,
  door: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><rect x="3" y="2" width="7" height="12" rx="0.5"/><path d="M10 2a6 6 0 0 1 0 6"/><circle cx="9.5" cy="8" r="0.8" fill="currentColor"/></svg>`,
  window: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><rect x="2" y="4" width="12" height="8" rx="0.5"/><path d="M8 4v8M2 8h12"/></svg>`,
  newProject: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M9 2H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V6L9 2z"/><path d="M9 2v4h4M8 9v4M6 11h4"/></svg>`,
  save: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M13 13H3a1 1 0 0 1-1-1V4l3-3h7a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1z"/><path d="M5 1v4h6V1M5 13v-4h6v4"/></svg>`,
  load: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M14 9v4a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1h4l2 2h1"/><path d="M11 6l2 2-2 2M13 8H8"/></svg>`,
  zoomFit: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M2 6V2h4M2 10v4h4M14 6V2h-4M14 10v4h-4"/><rect x="5" y="5" width="6" height="6" rx="0.5"/></svg>`,
  help: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="8" cy="8" r="6"/><path d="M6 6a2 2 0 1 1 2 2v1.5"/><circle cx="8" cy="12" r="0.5" fill="currentColor"/></svg>`,
  png: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><rect x="2" y="2" width="12" height="12" rx="1"/><circle cx="5.5" cy="5.5" r="1"/><path d="M14 10l-4-4-3 3-2-2-3 3"/></svg>`,
  pdf: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M9 2H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V6L9 2z"/><path d="M9 2v4h4"/><path d="M5 9h1.5a1 1 0 0 1 0 2H5v2M9 9v4M9 9h1.5a1 1 0 0 1 .5 1.8"/><path d="M12 13a2 2 0 0 0 0-4h-1v4h1z"/></svg>`,
};

async function run() {
  console.log("🎨  [FIX-F] Replacing icons with SVGs...\n");
  const indexHtml = readFile("index.html");
  const stylesCSS = readFile("src/styles.css");

  const res = await client.messages.create({
    model: "claude-sonnet-4-6", max_tokens: 8192,
    system: `Output ONLY a raw JSON object. No markdown. No prose. Keys=filepaths, values=complete file contents.`,
    messages:[{ role:"user", content:`Rewrite index.html and src/styles.css for TankeTekt. Replace ALL emoji icons with inline SVG icons. Return both files.

SVG ICONS to use (paste these exactly as innerHTML of each button, alongside the label text):
draw:       ${ICONS.draw}
wall:       ${ICONS.wall}
grid:       ${ICONS.grid}
outerDim:   ${ICONS.outerDim}
innerDim:   ${ICONS.innerDim}
area:       ${ICONS.area}
label:      ${ICONS.label}
undo:       ${ICONS.undo}
redo:       ${ICONS.redo}
door:       ${ICONS.door}
window:     ${ICONS.window}
newProject: ${ICONS.newProject}
save:       ${ICONS.save}
load:       ${ICONS.load}
zoomFit:    ${ICONS.zoomFit}
help:       ${ICONS.help}
png:        ${ICONS.png}
pdf:        ${ICONS.pdf}

BUTTON FORMAT — each button contains SVG + short label text:
<button id="btnDraw" title="Teikn rom (R)">${ICONS.draw} <span>Teikn rom</span></button>
<button id="btnWall" title="Teikn vegg (V)">${ICONS.wall} <span>Vegg</span></button>
<button id="btnGrid" title="Rutenett (G)">${ICONS.grid} <span>Rutenett</span></button>
<button id="btnShowOuter" title="Ytre mål">${ICONS.outerDim} <span>Ytre mål</span></button>
<button id="btnShowInner" title="Indre mål">${ICONS.innerDim} <span>Indre mål</span></button>
<button id="btnShowArea" title="Areal">${ICONS.area} <span>Areal</span></button>
<button id="btnShowLabels" title="Romnamn">${ICONS.label} <span>Romnamn</span></button>
<button id="btnUndo" title="Angre (Ctrl+Z)">${ICONS.undo} <span>Angre</span></button>
<button id="btnRedo" title="Gjer om (Ctrl+Y)">${ICONS.redo} <span>Gjer om</span></button>
<button id="btnDoor" title="Legg til dør">${ICONS.door} <span>Dør</span></button>
<button id="btnWindow" title="Legg til vindauge">${ICONS.window} <span>Vindauge</span></button>
<button id="btnNew" title="Nytt prosjekt">${ICONS.newProject} <span>Ny</span></button>
<button id="btnSave" title="Lagre prosjekt (Ctrl+S)">${ICONS.save} <span>Lagre</span></button>
<button id="btnLoad" title="Last inn prosjekt">${ICONS.load} <span>Last inn</span></button>
<button id="btnZoomFit" title="Tilpass til skjerm (F)">${ICONS.zoomFit} <span>Tilpass</span></button>
<button id="btnHelp" title="Hjelp (?)">${ICONS.help} <span>Hjelp</span></button>
Export group (right-aligned, margin-left:auto):
<button id="btnPNG" title="Eksporter PNG">${ICONS.png} <span>PNG</span></button>
<button id="btnPDF" title="Eksporter PDF">${ICONS.pdf} <span>PDF</span></button>

TOOLBAR GROUPING (keep from Fix-A):
Group 1 (Teikn): btnDraw, btnWall, wallThicknessSelect
DIVIDER
Group 2 (Vis): btnGrid, btnShowOuter, btnShowInner, btnShowArea, btnShowLabels
DIVIDER
Group 3 (Redigér): btnUndo, btnRedo, btnDoor, btnWindow
DIVIDER
Group 4 (Prosjekt): btnNew, btnSave, btnLoad, btnZoomFit, btnHelp
margin-left:auto → btnPNG, btnPDF
fileInput hidden

STYLES for icon buttons in src/styles.css:
Add these rules (keep all existing):
button svg { display:inline-block; vertical-align:middle; flex-shrink:0; }
button span { display:inline-block; vertical-align:middle; margin-left:4px; }
#toolbar button { display:inline-flex; align-items:center; gap:4px; padding:5px 10px; white-space:nowrap; }
button svg path, button svg rect, button svg circle, button svg line { stroke:currentColor; }
#btnPNG, #btnPDF { background:var(--accent); border-color:var(--accent); font-weight:600; }
#btnPNG:hover, #btnPDF:hover { filter:brightness(1.2); }

KEEP: all IDs, script load order, canvas, sidebar, statusbar structure exactly as-is from current files.
KEEP: title attributes on all buttons for tooltip on hover.

=== CURRENT index.html ===
${indexHtml}

=== CURRENT src/styles.css ===
${stylesCSS}

Return JSON: {"index.html":"...","src/styles.css":"..."}`}]
  });
  writeFiles(res.content[0].text, PROJECT_DIR);
  console.log("\n✅ Fix-F done. Run fix-G-push.mjs to push to GitHub.");
}
run().catch(e => { console.error("❌", e.message); process.exit(1); });
