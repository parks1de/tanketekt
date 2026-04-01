/**
 * Patches canvas.js: fixes cCanvas typo + ensures window functions exposed
 * No API call — direct file fix
 */
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
dotenv.config();

const DIR = process.env.PROJECT_DIR || "C:\\Users\\bness\\OneDrive\\02_PARKSIDE\\05_PROSJEKT\\TankeTekt";
const file = path.join(DIR, "src/canvas.js");

let src = fs.readFileSync(file, "utf8");
const before = src.length;

// Fix 1: cCanvas typo → canvas
src = src.replace(/\bcCanvas\b/g, "canvas");

// Fix 2: ensure window.screenToWorld and window.worldToScreen exposed
// Add at end of file if not already there
if (!src.includes("window.screenToWorld")) {
  src += `\nwindow.screenToWorld=screenToWorld;\nwindow.worldToScreen=worldToScreen;\n`;
}
if (!src.includes("window.redraw=redraw")) {
  src += `\nwindow.redraw=redraw;\n`;
}
if (!src.includes("window.zoomToFit")) {
  src += `\nwindow.zoomToFit=typeof zoomToFit!=='undefined'?zoomToFit:()=>{};\n`;
}
if (!src.includes("window.getResizeHandle")) {
  src += `\nwindow.getResizeHandle=typeof getResizeHandle!=='undefined'?getResizeHandle:()=>null;\n`;
}
if (!src.includes("window.getWallHandle")) {
  src += `\nwindow.getWallHandle=typeof getWallHandle!=='undefined'?getWallHandle:()=>null;\n`;
}

fs.writeFileSync(file, src, "utf8");
console.log(`✅ canvas.js patched (${before} → ${src.length} chars)`);
console.log(`   Fixed ${(src.match(/canvas/g)||[]).length - (src.match(/cCanvas/g)||[]).length} cCanvas typos`);
console.log(`   Ensured window.screenToWorld, worldToScreen, redraw exposed`);
