/**
 * TANKETEKT — Fix G: Push v.demo-002 to GitHub
 * No API call — just git. Run last after all fixes verified in browser.
 */
import { execSync } from "child_process";
import path from "path";
import dotenv from "dotenv";
dotenv.config();

const PROJECT_DIR = process.env.PROJECT_DIR ||
  "C:\\Users\\bness\\OneDrive\\02_PARKSIDE\\05_PROSJEKT\\TankeTekt";

function run(cmd) {
  console.log(`  > ${cmd}`);
  try {
    const out = execSync(cmd, { cwd: PROJECT_DIR, encoding: "utf8" }).trim();
    if (out) console.log("  " + out);
  } catch(e) {
    console.error("  ❌ " + (e.stderr || e.message));
    process.exit(1);
  }
}

async function main() {
  console.log("🚀  [FIX-G] Pushing TankeTekt v.demo-002 to GitHub...\n");
  console.log(`  📁 Project: ${PROJECT_DIR}\n`);

  run("git status --short");
  console.log();

  run("git add .");

  const commitMsg = [
    "feat: TankeTekt v.demo-002",
    "",
    "Canvas & navigation:",
    "- Full zoom/pan (scroll + alt+drag), dynamic scale bar, north arrow",
    "- Denser grid with on/off toggle",
    "- Display toggles: ytre mål, indre mål, areal, romnamn",
    "- Zoom to fit, new project / clear",
    "",
    "Drawing:",
    "- Always-on draw mode, snapping to room edges + corners (all 4 sides)",
    "- Wall snapping to edges, shift to disable snap",
    "- Standalone walls with length labels",
    "- Resize rooms + walls with drag handles",
    "- Norwegian wall thickness presets (98/148/198/248mm)",
    "",
    "Industry standard wall appearance:",
    "- Exterior walls (>=150mm): filled solid dark",
    "- Interior walls: medium gray",
    "- Partition walls: light gray",
    "",
    "Elements:",
    "- Doors + windows with Norwegian standard presets",
    "- Reposition doors/windows along wall after placement",
    "- All elements (walls/doors/windows) in sidebar with delete",
    "",
    "Export:",
    "- Working PNG export",
    "- Vector PDF matching professional floor plan layout",
    "- Optional area table in PDF (toggle)",
    "- Consistent Lengd/Breidd terminology",
    "",
    "UI:",
    "- Clean SVG icons throughout toolbar",
    "- Room type color coding + TEK17 warnings",
    "- Undo/Redo (Ctrl+Z/Y), Copy/Paste (Ctrl+C/V)",
    "- localStorage auto-save (30s + on every action)",
    "- Save/Load project as JSON",
    "- Help modal with keyboard shortcuts",
    "- Nynorsk/Bokmål mixed UI labels",
    "",
    "Built by 6 Claude API agents + 7 targeted fix agents"
  ].join("\n");

  run(`git commit -m "${commitMsg.replace(/"/g, '\\"')}"`);
  run("git push origin main");

  console.log("\n✅ Pushed to GitHub!");
  console.log("🔗 https://github.com/parks1de/tanketekt");
}
main().catch(e => { console.error("❌", e.message); process.exit(1); });
