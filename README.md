# Rim Station 7

An isometric pixel-art lab sim. You direct a xenobiology research station orbiting a black hole at the edge of the galaxy. Recovery teams bring back specimens from procedurally generated worlds; your staff study them under strict containment, publish what they find, and live with what happens when the papers are wrong.

The prototype runs as a single self-contained HTML file. No server, no dependencies.

## Play

Open `dist/rim-station-7.html` in a browser.

## Build

```
node tools/build.mjs
```

This stitches `src/index.template.html`, `src/styles.css` and every file in `src/js/` (in filename order) into `dist/rim-station-7.html`. Node 18+ is the only requirement.

## Test

```
pip install playwright
python3 -m playwright install chromium
npm test                       # build, then tests/smoke_playthrough.py
python3 tests/smoke_all_labs.py
python3 tests/smoke_save_load.py
python3 tests/smoke_staff.py
python3 tests/smoke_planner.py
```

All five smoke tests drive the real game in headless Chromium and fail if the page throws. Screenshots land in `tests/screenshots/`.

## Saves

A run autosaves at the start of each morning and each evening briefing, and the Station tab
holds three manual slots. Saves live in the browser's local storage, so they are per browser
and per machine. Nothing carries between runs by design: a save restores one survey, it is not
a profile.

## Layout

```
src/
  index.template.html   page shell and DOM (HUD, overlays, side panel)
  styles.css            all styles
  js/                   game code, concatenated in order into one IIFE
tools/build.mjs         the build
tests/                  Playwright smoke tests (Python)
docs/DESIGN.md          how the game works today
docs/ROADMAP.md         ideas and open threads
docs/RELEASE_PLAN.md    plan for shipping on Steam, and what console would take
docs/DESIGN_STAFF.md    the staff roster: stats, traits, roles, lab heads
docs/PROPOSAL_LANDFALL.md  proposed re-premise: the lab is a ship that lands
docs/PROPOSAL_ANNEX.md     proposed alternative: dark-cozy expanding lab complex
dist/                   built, playable game
```

See `CLAUDE.md` for the architecture map and working conventions.
