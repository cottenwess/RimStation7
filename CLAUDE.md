# Rim Station 7: working notes for Claude Code

## What this is
A browser game prototype: isometric pixel-art station sim about running a xenobiology lab at a black hole. Everything ships as one HTML file built from `src/`. Read `docs/DESIGN.md` for the systems and `docs/ROADMAP.md` for where it's going.

## Commands
- Build: `node tools/build.mjs` (writes `dist/rim-station-7.html` and `dist/game.js`)
- Syntax check: `npm run check`
- Smoke tests: `npm test`, then `python3 tests/smoke_all_labs.py`, `python3 tests/smoke_save_load.py`, `python3 tests/smoke_staff.py` and `python3 tests/smoke_planner.py`. Run all five after any gameplay change. They must end with `ERRORS []`, and `FAILURES []` where printed.
- Always rebuild before testing; tests load `dist/`, not `src/`.

## Code layout
All files in `src/js/` are concatenated in filename order inside one `(() => { 'use strict'; ... })()`. There are no imports; everything shares one scope. Order matters only for top-level `const` values used at load time, so keep new constants above their first top-level use. Add a new module by giving it a number that sorts where it belongs.

| Range | Area |
|---|---|
| 00-06 | utilities and the saveable RNG, people and portraits, leads and staff tables (`STATS`, `TRAITS`), staff runtime (`ROLES`, hiring, crewing, lab heads), lab-head dynamics, planet generation, specimen generation, studies table (`STUDIES`, `SEC_PRIORITY`, `PRE`), save/load |
| 07-10 | run state (`newRun`, `S`), lab definitions (`LAB_DEFS`, `LAB_TYPES`), tutorial (`TUT`), staff pathing, shuttle |
| 11-16 | dialog and toasts (`say`, `notify`, `log`), economy, experiment helpers, risk model, compounds and materials, lab jobs (`JOBS`) |
| 17-18 | scheduler (`S.items`, lanes, `fitSlot`, `planLane`, `makeItem`, `stepSchedule`) and the day cycle (morning, shift, evening) |
| 19-28 | tier report, study results (`RUN`), offers, papers and partner-lab incidents, missions, staff events, walkthroughs, breach, `tick`, end screen |
| 29-39 | UI: HUD, lead suggestions, planner (drag and drop), side panel panes, actions (`act`), Station tab, view inspection, evening briefing |
| 40-54 | art: specimen and planet sprites, camera, iso drawing helpers, hub, corridor, lab shells by type, props, tank, people, background, frame composition (`draw`) |
| 55 | main loop and boot |

## Key concepts
- **State** lives in one object `S` created by `newRun()`. `S.dirty = true` triggers a full re-render of the panel and overlays next frame.
- **Time**: one `tick()` is one in-game hour. Shift is 08:00 to 20:00 (23:00 with overtime). `S.phase` is `morning` (paused, plan), `shift` (clock runs), `evening` (paused, briefing). Missions, building, repairs and BSL changes are evening-only once a specimen exists (`canDecide()`).
- **Work** is a list `S.items`. Each item sits in a lane: `L<k>` for lab k or `bench` for the hub bench. Studies (`kind:'study'`) and lab jobs (`kind:'job'`) share the same scheduler through the `w*` helpers (`wName`, `wDur`, `wLane`, ...).
- **Labs**: six fixed slots. Containment A and B plus Physics run east of the hub; Micro, Genetics and Chem run south. The south row is drawn by swapping u/v (`SW`). Use `labNode(L, u, v)` for any world position inside a lab so both rows work.
- **Drawing**: isometric, `TW=16`, `TH=8`. `P(u, v, z)` projects to the low-res buffer. `box()` draws an outlined block. `at(du, dv, fn)` offsets drawing. `OU/OV/SW` are the current lab's offset and row swap. The station draws into a separate buffer and gets a dark silhouette outline before compositing.
- **Saving**: `06-storage.js` walks everything reachable rather than listing fields, so new state is saved without being registered anywhere. Four things live outside `S` and are captured beside it: the id counters (`specSeq`, `itemSeq`, `cmpSeq`, `matSeq`), the RNG position, the leads (`LEADS[k].pulls/quit/actor`) and the loose world objects `C` and `shuttle`. Rules that follow from this:
  - Keep new state inside `S`, or add it to `captureRun`/`restoreRun`. `encode()` throws on anything it cannot write, so the save test catches an unserializable field rather than shipping a broken save.
  - No functions in state. The shuttle carries a job tag into `SHUTTLE_JOBS`, not a callback, for exactly this reason.
  - Name drawing caches hung off state objects with a leading underscore (`p._cv`); those keys are never saved.
  - Reference other entities by id, never by object. `it.tobj` is a flat label snapshot, not a live specimen.
  - Saving is refused while a dialog choice is pending (`saveBlocked()`), because the branches are closures. Autosave waits for the queue to clear.
- **Randomness**: `rnd()` is a seeded stream whose position is saved, so a loaded run continues identically and a quoted `S.seed` reproduces a whole run. Visuals use `vrnd()`; never spend `rnd()` on anything a resize or a repaint could trigger.
- **Staff**: one roster in `S.techs`, every record the same shape with a `role` from `ROLES`. `02-leads-techs` holds the tables (stats, traits), `02b-staff` the runtime (hiring, growth, morale, crewing, lab heads), `02c-dynamics` the friction between heads of same-type labs. Each lab has a `head` (a staff id); `reseatHeads()` runs whenever the roster changes. Work is auto-crewed by discipline and a named `crewIds` always wins.
- **Money never blocks**: the station is R&D, so no study, lab, mission, hire or repair is ever refused for lack of credits. Overspending sets the over-budget state (`overBudget()`, `deficit()` in 12-economy), which costs standing daily and is logged on the work that caused it. Do not add `S.funds < x` gates; use `budgetTag(cost)` to mark the decision instead.
- **Debug handle**: `window.__hb` exposes `S()`, a few constructors, and the save hooks (`capture`, `restore`, `save`, `load`, `slots`, `rng`, `tick`) for tests. Keep it.

## Conventions
- In-game writing: plain, direct, a little dry. No em dashes anywhere in player-facing text. Characters speak in their own voices (Okafor careful and ethical, Vasko fast and glory-seeking, Pruitt administrative, Bea blunt, Calderón procedural).
- Humour is dry and comes from two places only: characters coping, and the institution being absurd (`24b-meridian.js`, Pruitt's asides, trait and role thoughts in `38-view-inspection.js`). It never comes from the narration winking at the player. Never write a joke at the moment of a death, during a breach, or anywhere near the sapience choice: the flatness of the personnel notice is the point. The funnier Meridian is, the worse Meridian is.
- The game takes moral stakes seriously: dual-use compounds, sapient specimens, staff deaths and partner-lab casualties have real costs, not flavor.
- Hide what the player can't act on. Gated studies stay hidden until they're available.
- Keep it one self-contained HTML file. No external JS libraries; fonts come from Google Fonts.
- Pixel art: integer scaling, `image-rendering: pixelated`, 1px outlines, limited palette (`PAL` in 42-drawing).

## Before you finish a change
1. `node tools/build.mjs`
2. All five smoke tests end with `ERRORS []` and `FAILURES []`
3. Open the screenshots in `tests/screenshots/` if you touched anything visual.
