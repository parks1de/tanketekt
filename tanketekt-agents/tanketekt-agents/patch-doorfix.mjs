import fs from "fs";
import path from "path";
import dotenv from "dotenv";
dotenv.config();
const DIR = process.env.PROJECT_DIR || "C:\\Users\\bness\\OneDrive\\02_PARKSIDE\\05_PROSJEKT\\TankeTekt";
const write = (f,v) => { fs.writeFileSync(path.join(DIR,f),v,"utf8"); console.log(`  ✅ ${f} (${v.length}ch)`); };

let el = fs.readFileSync(path.join(DIR,"src/elements.js"),"utf8");

// FIX 1: Stay in door/window mode after placement (keep pendingElement with same preset)
el = el.replace(
  `TK.pendingElement=null;TK.currentTool='draw';`,
  `// Keep same tool + preset for multiple placements
  TK.pendingElement={type:TK.pendingElement.type,preset:TK.pendingElement.preset};`
);
// Also remove any other tool reset after placement
el = el.replace(
  /TK\.currentTool\s*=\s*'draw';\s*\n?\s*if\(window\.updateElementList\)/,
  `if(window.updateElementList)`
);

// FIX 2: Remove swing arc from drawDoor — keep gap + panel + hinge dot only
el = el.replace(
  /\/\/ Swing arc[\s\S]*?ctx\.setLineDash\(\[\]\);/,
  `// Swing arc removed — direction indicator omitted`
);
// Also remove swingDir cycling from click handler (no longer relevant)
el = el.replace(/d\.swingDir=\(\(d\.swingDir\|\|0\)\+1\)%4;/g, '// swingDir removed');

write("src/elements.js", el);

// Also remove swingDir cycling from drawing.js
let dr = fs.readFileSync(path.join(DIR,"src/drawing.js"),"utf8");
dr = dr.replace(
  /if\(window\.saveSnapshot\)saveSnapshot\(\);d\.swingDir=.*?return;/s,
  `// swingDir removed`
);
write("src/drawing.js", dr);

console.log("\n✅ Done. Ctrl+Shift+R to reload.");
