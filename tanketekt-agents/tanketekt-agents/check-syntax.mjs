import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
dotenv.config();
const DIR = process.env.PROJECT_DIR || "C:\\Users\\bness\\OneDrive\\02_PARKSIDE\\05_PROSJEKT\\TankeTekt";

const files = ["src/app.js","src/canvas.js","src/drawing.js","src/elements.js","src/export.js"];
files.forEach(f => {
  const full = path.join(DIR, f);
  try {
    execSync(`node --check "${full}"`, {encoding:"utf8"});
    console.log(`✅ ${f}`);
  } catch(e) {
    console.log(`❌ ${f} — SYNTAX ERROR:`);
    console.log("  " + e.stderr.split("\n").slice(0,3).join("\n  "));
  }
});
