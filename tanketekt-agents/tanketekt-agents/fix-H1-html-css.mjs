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
  if(!c.startsWith("{"))return console.log("  ⚠️ skipped");
  const files=JSON.parse(c);
  for(const [p,v] of Object.entries(files)){const f=path.join(DIR,p);fs.mkdirSync(path.dirname(f),{recursive:true});fs.writeFileSync(f,v,"utf8");console.log(`  ✅ ${p}`);}
}
async function run(){
  console.log("🔧 [FIX-H1] index.html + styles.css...\n");
  const res = await client.messages.create({ model:"claude-sonnet-4-6", max_tokens:8192,
    system:`Output ONLY raw JSON object. No markdown. Keys=filepaths, values=complete file contents.`,
    messages:[{role:"user",content:`Write index.html and src/styles.css for TankeTekt v.demo-002.

INDEX.HTML structure:
<!DOCTYPE html><html lang="no"><head>charset, viewport, title "TankeTekt v.demo-002", link stylesheet src/styles.css, script src jsPDF CDN https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js</head>
<body>
  <div id="toolbar">
    <select id="wallThicknessSelect"></select>
    <button id="btnDraw"><svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M11 2l3 3-8 8H3v-3L11 2z"/></svg> Teikn rom</button>
    <button id="btnWall"><svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="5" width="12" height="3" rx="0.5"/><rect x="2" y="8" width="12" height="3" rx="0.5"/></svg> Teikn vegg</button>
    <div class="tb-div"></div>
    <button id="btnDoor"><svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><rect x="3" y="2" width="7" height="12" rx="0.5"/><path d="M10 2a6 6 0 0 1 0 6"/></svg> Dør</button>
    <button id="btnWindow"><svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><rect x="2" y="4" width="12" height="8" rx="0.5"/><path d="M8 4v8M2 8h12"/></svg> Vindauge</button>
    <div class="tb-div"></div>
    <div class="vis-wrap">
      <button id="btnVis">Vis ▾</button>
      <div id="visPanel">
        <label><input type="checkbox" id="cbGrid" checked> Rutenett</label>
        <label><input type="checkbox" id="cbOuter" checked> Ytre mål</label>
        <label><input type="checkbox" id="cbInner"> Indre mål</label>
        <label><input type="checkbox" id="cbArea" checked> Areal</label>
        <label><input type="checkbox" id="cbLabels" checked> Romnamn</label>
      </div>
    </div>
    <button id="btnUndo"><svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7V3L1 5"/><path d="M3 7c0-3 8-5 10 1s-2 7-6 7"/></svg> Angre</button>
    <button id="btnRedo"><svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M13 7V3l2 2"/><path d="M13 7c0-3-8-5-10 1s2 7 6 7"/></svg> Gjer om</button>
    <div style="flex:1"></div>
    <button id="btnZoomFit" title="Tilpass til skjerm"><svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M2 6V2h4M2 10v4h4M14 6V2h-4M14 10v4h-4"/></svg></button>
    <button id="btnNew" title="Nytt prosjekt"><svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M9 2H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V6L9 2z"/><path d="M9 2v4h4M8 9v4M6 11h4"/></svg> Ny</button>
    <button id="btnSave" title="Lagre"><svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M13 13H3a1 1 0 0 1-1-1V4l3-3h7a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1z"/><path d="M5 1v4h6V1M5 13v-4h6v4"/></svg> Lagre</button>
    <input id="fileInput" type="file" accept=".json" style="display:none">
    <div class="tb-div"></div>
    <button id="btnPNG" class="btn-export">PNG</button>
    <button id="btnPDF" class="btn-export">PDF</button>
  </div>
  <div id="main">
    <div id="floorplan-wrap"><canvas id="floorplan" style="display:block;cursor:crosshair"></canvas></div>
    <div id="sidebar">
      <div class="tab-bar">
        <button class="tab active" data-tab="rooms">Rom</button>
        <button class="tab" data-tab="walls">Veggar</button>
        <button class="tab" data-tab="elements">Dør/Vindauge</button>
      </div>
      <div id="tab-rooms" class="tab-pane active"><ul id="room-list"></ul><div id="tek17-warnings"></div></div>
      <div id="tab-walls" class="tab-pane"><ul id="wall-list"></ul></div>
      <div id="tab-elements" class="tab-pane"><ul id="element-list"></ul></div>
    </div>
  </div>
  <div id="statusbar"><span id="scaleInfo"></span><span id="coordInfo"></span><span id="statusMsg">Teikn rom: klikk og dra</span></div>
  <script src="src/app.js"></script>
  <script src="src/canvas.js"></script>
  <script src="src/drawing.js"></script>
  <script src="src/elements.js"></script>
  <script src="src/export.js"></script>
</body></html>

src/styles.css — complete stylesheet:
CSS vars: --bg:#0d1117;--surface:#161b22;--border:#30363d;--accent:#238636;--hi:#e94560;--text:#c9d1d9;--muted:#8b949e
*{box-sizing:border-box;margin:0;padding:0}
body{display:flex;flex-direction:column;height:100vh;background:var(--bg);color:var(--text);font-family:system-ui,sans-serif;overflow:hidden;font-size:13px}
#toolbar{display:flex;align-items:center;gap:5px;padding:5px 10px;background:var(--surface);border-bottom:1px solid var(--border);flex-shrink:0;flex-wrap:wrap}
.tb-div{width:1px;height:22px;background:var(--border);margin:0 4px}
#main{display:flex;flex:1;overflow:hidden}
#floorplan-wrap{flex:1;overflow:hidden;display:flex;background:#ffffff}
canvas#floorplan{flex:1;display:block;background:#ffffff}
#sidebar{width:260px;background:var(--surface);border-left:1px solid var(--border);overflow-y:auto;display:flex;flex-direction:column;flex-shrink:0}
#statusbar{display:flex;justify-content:space-between;padding:3px 12px;background:var(--surface);border-top:1px solid var(--border);font-size:12px;color:var(--text);flex-shrink:0}
button{background:var(--surface);color:var(--text);border:1px solid var(--border);border-radius:4px;padding:4px 9px;cursor:pointer;font-size:12px;display:inline-flex;align-items:center;gap:4px;white-space:nowrap}
button:hover{background:var(--accent);border-color:var(--accent)}
button.active{background:var(--hi);border-color:var(--hi);color:white}
select{background:var(--surface);color:var(--text);border:1px solid var(--border);border-radius:4px;padding:4px 6px;font-size:12px}
.btn-export{background:var(--accent);border-color:var(--accent);font-weight:600}
.btn-export:hover{filter:brightness(1.15)}
.vis-wrap{position:relative}
#visPanel{display:none;position:absolute;top:calc(100% + 4px);left:0;background:var(--surface);border:1px solid var(--border);border-radius:6px;padding:10px 14px;z-index:200;min-width:150px;box-shadow:0 4px 16px rgba(0,0,0,0.5)}
#visPanel.open{display:block}
#visPanel label{display:flex;align-items:center;gap:8px;padding:4px 0;cursor:pointer;font-size:12px}
#visPanel input[type=checkbox]{accent-color:var(--accent);width:14px;height:14px}
.tab-bar{display:flex;border-bottom:1px solid var(--border);flex-shrink:0}
.tab{flex:1;background:none;border:none;border-bottom:2px solid transparent;color:var(--muted);padding:7px 4px;font-size:11px;cursor:pointer;border-radius:0}
.tab.active{color:var(--text);border-bottom-color:var(--hi)}
.tab:hover{background:rgba(255,255,255,0.04)}
.tab-pane{display:none;padding:8px;overflow-y:auto}
.tab-pane.active{display:block}
.room-item{list-style:none;padding:6px 8px;border-radius:4px;cursor:pointer;border-left:4px solid #888;margin-bottom:4px;font-size:12px}
.room-item:hover,.room-item.selected{background:rgba(35,134,54,0.15)}
.room-item .rname{font-weight:bold;margin-bottom:2px}
.room-item .rinfo{color:var(--muted);font-size:11px}
.tek17-warn{color:#e6a817;font-size:11px;padding:3px 0}
.modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.75);display:flex;align-items:center;justify-content:center;z-index:1000}
.modal{background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:24px;min-width:280px}
.modal h2{margin-bottom:14px;font-size:14px}
.modal label{display:block;font-size:11px;color:var(--muted);margin-bottom:3px}
.modal input,.modal select{width:100%;background:var(--bg);color:var(--text);border:1px solid var(--border);border-radius:4px;padding:7px;margin-bottom:10px;font-size:13px}
.modal-btns{display:flex;gap:8px;justify-content:flex-end}
ul{list-style:none;padding:0;margin:0}

Return JSON: {"index.html":"...","src/styles.css":"..."}`}]
  });
  write(res.content[0].text);
  console.log("\n✅ H1 done. Run fix-H2-appjs.mjs next.");
}
run().catch(e=>{console.error("❌",e.message);process.exit(1);});
