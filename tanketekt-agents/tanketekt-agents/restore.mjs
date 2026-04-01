import Anthropic from "@anthropic-ai/sdk";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
dotenv.config();
const DIR = process.env.PROJECT_DIR || "C:\\Users\\bness\\OneDrive\\02_PARKSIDE\\05_PROSJEKT\\TankeTekt";
const client = new Anthropic();

async function run(){
  console.log("🔧 Restoring working state...");
  const res = await client.messages.create({
    model:"claude-sonnet-4-6", max_tokens:8192,
    system:`Output ONLY raw JSON. Keys=filepaths, values=complete file contents.`,
    messages:[{role:"user",content:`Write a clean working index.html for TankeTekt v.demo-002 floor planner.

Requirements:
- Load jsPDF CDN: https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js
- Load scripts IN THIS ORDER: src/app.js, src/canvas.js, src/drawing.js, src/elements.js, src/export.js
- Dark theme CSS inline in <style> tag
- Toolbar with these buttons (direct onclick attributes, NO addEventListener):
  select#wallThicknessSelect
  button#btnDraw onclick="setTool('draw');setStatus('Teikn rom')" class="active" — Teikn rom
  button#btnWall onclick="setTool('wall');setStatus('Teikn vegg')" — Teikn vegg
  button onclick="promptRoomDims&&promptRoomDims()" — ✛ Rom
  button onclick="placeDoor&&placeDoor()" — Dør
  button onclick="placeWindow&&placeWindow()" — Vindauge
  div.vis-wrap with button onclick toggle #visPanel + checkboxes for grid/outer/inner/area/labels
  button onclick="if(window.undo)undo()" — Angre
  button onclick="if(window.redo)redo()" — Gjer om
  div flex:1 spacer
  button onclick="if(window.zoomToFit)zoomToFit()" — Tilpass
  button onclick="if(window.promptRoomDims)promptRoomDims()" — Ny
  button onclick="if(window.saveProject)saveProject()" — Lagre
  input#fileInput type=file accept=.json style=display:none onchange="if(window.loadProject)loadProject(this.files[0])"
  button class=bexp onclick="if(window.exportPNG)exportPNG()" — PNG
  button class=bexp onclick="if(window.exportPDF)exportPDF()" — PDF
  button onclick="if(window.showHelpModal)showHelpModal()" — ?
- Main area: div#main flex row
  div#floorplan-wrap flex:1 overflow:hidden display:flex
  canvas#floorplan style="display:block;cursor:crosshair" (NO width/height attrs)
  div#sidebar 260px with tab system: buttons.tab for Rom/Veggar/Dør&Vindauge, div.tp panels with ul#room-list ul#wall-list ul#element-list div#tek17-warnings
- Bottom statusbar: span#scaleInfo span#coordInfo span#statusMsg

CSS vars: --bg:#0d1117 --surface:#161b22 --border:#30363d --accent:#238636 --hi:#e94560 --text:#c9d1d9 --muted:#8b949e
Dark theme. Canvas background white. Export buttons green.
Vis dropdown: position:relative, panel absolute below button with checkboxes.
Tab system: .tab buttons, .tp panes (display:none except .active).

Return JSON: {"index.html":"..."}`}]
  });
  let clean=res.content[0].text.trim().replace(/^[^{]*/,"").replace(/[^}]*$/,"").trim();
  try{
    const files=JSON.parse(clean);
    for(const [p,v] of Object.entries(files)){
      const f=path.join(DIR,p);
      fs.mkdirSync(path.dirname(f),{recursive:true});
      fs.writeFileSync(f,v,"utf8");
      console.log("  ✅ "+p+" ("+v.length+"ch)");
    }
    console.log("\n✅ Done. Ctrl+Shift+R");
    console.log("\n💡 Next: open terminal in TankeTekt folder, type 'claude' to use Claude Code directly");
  }catch(e){console.error("❌",e.message,"\nRaw:",res.content[0].text.slice(0,200));}
}
run().catch(e=>console.error("❌",e.message));
