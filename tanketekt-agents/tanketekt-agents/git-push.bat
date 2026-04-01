@echo off
echo.
echo [GIT] Committing and pushing TankeTekt v.demo-001...
echo.

cd /d "C:\Users\bness\OneDrive\02_PARKSIDE\05_PROSJEKT\TankeTekt"

git add .
git commit -m "feat: TankeTekt v.demo-001 — initial floorplanner demo

- Draw rectangular rooms by click + drag on canvas
- Room labels, dimension lines (m), sq/m per room
- Export PNG (canvas direct)
- Export PDF with room schedule table
- Dark theme UI, 1m grid overlay
- Built by 4 Claude API agents (manager/ui/export/qa)"

git push origin main

echo.
echo Done! Check: https://github.com/parks1de/tanketekt
pause
