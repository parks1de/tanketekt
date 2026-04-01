import fs from "fs";
import path from "path";
import dotenv from "dotenv";
dotenv.config();
const DIR = process.env.PROJECT_DIR || "C:\\Users\\bness\\OneDrive\\02_PARKSIDE\\05_PROSJEKT\\TankeTekt";

// Fix canvas.js: all Canvas/cCanvas variants → canvas (skip HTMLCanvasElement)
const cvFile = path.join(DIR, "src/canvas.js");
let cv = fs.readFileSync(cvFile, "utf8");
cv = cv.replace(/\bCanvas\b(?!Element|RenderingContext|\.)/g, "canvas");
cv = cv.replace(/\bcCanvas\b/g, "canvas");
// Expose functions globally at very top of file (safe even if defined later)
const expose = `
window.screenToWorld=(...a)=>typeof screenToWorld==='function'?screenToWorld(...a):{x:(a[0]-window.TK.panX)/window.TK.zoom,y:(a[1]-window.TK.panY)/window.TK.zoom};
window.worldToScreen=(...a)=>typeof worldToScreen==='function'?worldToScreen(...a):{x:a[0]*window.TK.zoom+window.TK.panX,y:a[1]*window.TK.zoom+window.TK.panY};
`;
if (!cv.includes("window.screenToWorld=(...a)")) cv = expose + cv;
fs.writeFileSync(cvFile, cv, "utf8");
console.log("✅ canvas.js: Capital-C Canvas fixed, window helpers exposed at top");

// Fix drawing.js: bare screenToWorld/worldToScreen → window. versions
const drFile = path.join(DIR, "src/drawing.js");
let dr = fs.readFileSync(drFile, "utf8");
dr = dr.replace(/(?<!\.)(?<!window\.)(?<!function )(?<!\w)\bscreenToWorld\b(?!\s*=)/g, "window.screenToWorld");
dr = dr.replace(/(?<!\.)(?<!window\.)(?<!function )(?<!\w)\bworldToScreen\b(?!\s*=)/g, "window.worldToScreen");
dr = dr.replace(/(?<!\.)(?<!window\.)(?<!function )(?<!\w)\bsnapPoint\b(?!\s*=)/g, "window.snapPoint");
dr = dr.replace(/(?<!\.)(?<!window\.)(?<!function )(?<!\w)\bredraw\b(?!\s*=|\s*\(.*\)\s*\{)/g, "window.redraw");
fs.writeFileSync(drFile, dr, "utf8");
console.log("✅ drawing.js: All bare function calls → window.* references");
console.log("\n✅ Done. Hard-refresh browser (Ctrl+Shift+R)");
