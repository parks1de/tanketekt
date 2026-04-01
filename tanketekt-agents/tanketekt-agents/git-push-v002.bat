@echo off
echo.
echo [GIT] Pushing TankeTekt v.demo-002...
echo.

cd /d "C:\Users\bness\OneDrive\02_PARKSIDE\05_PROSJEKT\TankeTekt"

git add .
git commit -m "feat: TankeTekt v.demo-002

- Full zoom/pan canvas (scroll to zoom, alt+drag to pan)
- Dynamic scale bar + north arrow
- Grid toggle (denser, on/off)
- Wall snapping (Shift to disable)
- Draw single walls with Norwegian thickness presets
- Always-on draw mode (no click needed between rooms)
- Room types with color coding (Stove, Soverom, Bad etc.)
- TEK17 minimum area warnings
- Doors and windows (Norwegian standard presets + custom)
- Undo/Redo (Ctrl+Z/Y)
- Save/Load project as JSON
- Copy/Paste rooms (Ctrl+C/V)
- Vector PDF export (crisp, no bitmap)
- Full Nynorsk/Bokmål UI
- Toolbar split: teikneverktøy / element / eksport
- Built by 6 Claude API agents"

git push origin main

echo.
echo Done! https://github.com/parks1de/tanketekt
pause
