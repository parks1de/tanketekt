/**
 * TANKETEKT — Fix Agent B: canvas.js
 * Fixes: display toggles, wall dimensions, zoom-to-fit, dimension overlap prevention
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
  if (!clean.startsWith('{')) { console.log("  ⚠️  Skipped"); return 0; }
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
  console.log("🎨  [FIX-B] Fixing canvas rendering...\n");
  const canvasJs = readFile("src/canvas.js");

  const res = await client.messages.create({
    model: "claude-sonnet-4-6", max_tokens: 8192,
    system: `Output ONLY raw JSON object. No markdown. No explanation. Keys=filepaths, values=complete file contents.`,
    messages:[{ role:"user", content:`Rewrite src/canvas.js for TankeTekt v.demo-002 with all fixes. Return the complete file.

CRITICAL FIXES TO APPLY:

1. DISPLAY TOGGLES — redraw() must respect these TK flags:
   - TK.showOuterDims: show dimension lines OUTSIDE rooms (below + right, offset 25px from edge)
   - TK.showInnerDims: show dimension text INSIDE room (centered, smaller font)
   - TK.showAreaLabels: show area "X.XX m²" label inside room
   - TK.showRoomLabels: show room name label inside room
   Each renders independently. All can be on simultaneously.

2. WALL DIMENSIONS — for each wall in TK.walls:
   Draw a small dimension label at midpoint showing wall length in meters.
   e.g. "3.45m" in a small white pill background, 10px font, positioned perpendicular offset 14px from wall midpoint.

3. DIMENSION OVERLAP PREVENTION:
   Collect all dimension label positions before drawing. For each pair of labels within 20px:
   - Keep the longer dimension label in place
   - Offset the shorter one by +20px perpendicular
   Simple approach: track drawnLabels array [{x,y,w,h}], before drawing each label check overlap, if overlapping shift by 22px.

4. ZOOM TO FIT (window.zoomToFit):
   Compute bounding box of all rooms+walls. Add 80px padding.
   Set TK.zoom so bbox fits canvas. Set TK.panX/panY to center bbox.
   If no rooms/walls: reset zoom=1, panX=panY=0.
   Call redraw(). Update #scaleInfo.

5. KEEP ALL EXISTING functionality: grid, zoom/pan, north arrow, scale bar, room colors, selection highlight, coordinate display, activePreview, ResizeObserver.

6. ENSURE window.redraw, window.worldToScreen, window.screenToWorld, window.zoomToFit are all exposed.

=== CURRENT canvas.js ===
${canvasJs}

Return JSON: {"src/canvas.js":"..."}`}]
  });
  writeFiles(res.content[0].text, PROJECT_DIR);
  console.log("\n✅ Fix-B done.");
}
run().catch(e => { console.error("❌", e.message); process.exit(1); });
