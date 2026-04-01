import fs from "fs";
import path from "path";
import dotenv from "dotenv";
dotenv.config();
const DIR = process.env.PROJECT_DIR || "C:\\Users\\bness\\OneDrive\\02_PARKSIDE\\05_PROSJEKT\\TankeTekt";

const html = fs.readFileSync(path.join(DIR,"index.html"),"utf8");

// Check what buttons exist and their onclick
const btns = [...html.matchAll(/<button([^>]*)>/g)];
console.log("\n=== BUTTONS IN index.html ===");
btns.forEach(m => {
  const id = (m[1].match(/id="([^"]+)"/) || [])[1] || '(no id)';
  const oc = (m[1].match(/onclick="([^"]{0,60})/) || [])[1] || '(no onclick)';
  console.log(`  ${id.padEnd(20)} onclick: ${oc}`);
});

// Check script tags
console.log("\n=== SCRIPT TAGS ===");
const scripts = [...html.matchAll(/<script([^>]*)>/g)];
scripts.forEach((m,i) => console.log(`  [${i}] ${m[1]||'inline'}`));

// Check for syntax errors in the injected script
const inlineScripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
console.log("\n=== INLINE SCRIPT SIZES ===");
inlineScripts.forEach((m,i) => console.log(`  [${i}] ${m[1].length} chars`));

// Check if functions are defined
['exportPNG','exportPDF','saveProject','placeDoor','placeWindow','showHelpModal'].forEach(fn => {
  const found = html.includes('function '+fn) || html.includes('window.'+fn+'=');
  console.log(`  ${fn}: ${found ? '✅ defined' : '❌ NOT FOUND'}`);
});

// Check jsPDF CDN
console.log("\n=== jsPDF CDN ===", html.includes('jspdf') ? '✅ found' : '❌ missing');
