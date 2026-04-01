# TankeTekt — Agent System

These 4 Claude API agents build TankeTekt v.demo-001 by writing code files directly into your project folder.

## Prerequisites (verify before starting)

- [ ] Node.js installed → `node -v` (need v18+)
- [ ] Git installed and configured with GitHub → `git --version`
- [ ] GitHub repo `parks1de/tanketekt` exists and you have push access
- [ ] Anthropic API key from https://console.anthropic.com
- [ ] The TankeTekt project folder exists at the path in `.env`

## Setup (one time)

```
# 1. Copy and fill in .env
copy .env.example .env
# Edit .env: add your ANTHROPIC_API_KEY

# 2. Install dependencies
npm install
```

## Running the agents (4 terminal windows, IN ORDER)

### Terminal 1 — Manager Agent
```
node agent-manager.mjs
```
**Wait for:** `✅ Manager done. Next → node agent-ui.mjs`

### Terminal 2 — UI Agent
```
node agent-ui.mjs
```
**Wait for:** `✅ UI Agent done. Next → node agent-export.mjs`

### Terminal 3 — Export Agent
```
node agent-export.mjs
```
**Wait for:** `✅ Export Agent done. Next → node agent-qa.mjs`

### Terminal 4 — QA Agent
```
node agent-qa.mjs
```
**Wait for:** `✅ QA Agent done.`

### Back to Terminal 1 — Push to GitHub
```
git-push.bat
```

## Test before pushing
Open `TankeTekt/index.html` in your browser and verify:
- [ ] Canvas renders with grid
- [ ] Click Draw Room → drag → room appears with label, dimensions, m²
- [ ] Double-click room → rename prompt works
- [ ] Sidebar updates with room list
- [ ] Export PNG → downloads a .png
- [ ] Export PDF → downloads a .pdf with room table

## Re-running a single agent
If one agent's output is wrong, just re-run that agent. Each reads fresh from disk.
To redo everything from scratch: delete the src/ folder and index.html, then run all 4 again.
