/**
 * TANKETEKT — Fix Agent C: drawing.js
 * Fixes: zigzag wall bug, edge snapping, door/window wall placement
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
  console.log("✏️  [FIX-C] Fixing drawing engine...\n");
  const drawingJs = readFile("src/drawing.js");

  const res = await client.messages.create({
    model: "claude-sonnet-4-6", max_tokens: 8192,
    system: `Output ONLY raw JSON object. No markdown. No explanation. Keys=filepaths, values=complete file contents.`,
    messages:[{ role:"user", content:`Rewrite src/drawing.js for TankeTekt v.demo-002 with all fixes. Return the complete file.

CRITICAL FIXES:

1. WALL DRAWING (already working — keep as-is):
   Wall drawing is confirmed working. Do NOT change the mousedown/mousemove/mouseup logic.
   Keep existing wall push-on-mouseup behavior intact.
   On mousemove: ONLY update window.activePreview = {type:'wall', x1,y1,x2,y2, thickness:TK.wallThickness}.
   On mouseup: push ONE wall to TK.walls, clear activePreview, redraw.
   Same pattern applies to room drawing — only push on mouseup.

2. SNAP TO EDGES (not just corners):
   snapPoint(sx, sy, shiftHeld) must check ALL of:
   a. Room corners: (x,y), (x+w,y), (x,y+h), (x+w,y+h) for each room
   b. Room edge midpoints: (x+w/2,y), (x+w/2,y+h), (x,y+h/2), (x+w,y+h/2)
   c. Room edges (closest point on each of 4 edges) — snap to nearest point on edge
   d. Wall endpoints: (x1,y1), (x2,y2) for each wall
   e. Wall midpoints: midpoint of each wall
   SNAP_RADIUS = 15 screen pixels. Convert to world: snapRadiusWorld = SNAP_RADIUS / TK.zoom.
   Priority: corners > edge midpoints > edge closest point > wall endpoints.
   Draw green circle at snap point when snapping (window.snapIndicator = {x,y} in world coords, canvas draws it).

3. WALL SNAPPING TO ALL 4 SIDES:
   When drawing a room, both the start point AND end point snap independently.
   When drawing a wall, both endpoints snap independently.
   This means a room corner will snap to any edge of any existing room on all 4 sides.

4. DOOR/WINDOW PLACEMENT ON WALL (fix click handler):
   When TK.currentTool === 'door' or 'window':
   On canvas click (not mouseup from a drag — check that mouse didn't move >5px):
     hitTestWall(worldX, worldY): for each wall, find closest point on segment.
     If distance < 0.5m world units: return {wall, t} where t is 0-1 position along wall.
     If wall found: saveSnapshot(). Push door/window with wallId and t. redraw(). updateElementList().
     TK.currentTool = 'draw'. setStatus('Dør/vindauge plassert. Teiknar rom...').
   On mousemove when in door/window mode: show preview — highlight nearest wall.

5. ROOM DOUBLE-CLICK MODAL:
   On dblclick: detect by checking timeSinceLastClick < 300ms.
   Show modal overlay div with room name input + type select.
   On save: update room name/type/color. saveSnapshot(). updateSidebar(). redraw(). remove modal.
   Prevent draw mode from triggering on dblclick.

6. KEEP ALL EXISTING: wallThicknessSelect populate, select mode, deleteSelected, copySelected, pasteClipboard, coordInfo update.

=== CURRENT drawing.js ===
${drawingJs}

Return JSON: {"src/drawing.js":"..."}`}]
  });
  writeFiles(res.content[0].text, PROJECT_DIR);
  console.log("\n✅ Fix-C done.");
}
run().catch(e => { console.error("❌", e.message); process.exit(1); });
