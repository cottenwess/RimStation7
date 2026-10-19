# Rim Station 7: plan to ship on Steam, and what console would really take

Written 2026-10-17 against prototype v0.6 (3,754 lines of JS in 56 modules, 363 lines of CSS,
one 337 KB HTML file). This is a release plan, not a design doc. Design lives in `DESIGN.md`,
unbuilt ideas in `ROADMAP.md`.

---

## 1. Where the prototype actually stands

The good news first, because it is genuinely good: the hard part is done. There is a working
economy, a real scheduler, a risk model with teeth, procedural worlds built on actual
astrobiology, and a moral spine that most sims in this genre do not have. 16 study types,
11 lab jobs, 6 labs, ~7,200 words of player-facing writing. It runs with zero dependencies
and builds in under a second. That is a vertical slice worth taking to market.

Now the gaps, measured rather than guessed. Each of these is a shipping blocker, not a polish item.

| Gap | Current state | Why it blocks release |
|---|---|---|
| **No save system** | `src/js/06-storage.js` is 6 lines; `saveG(){}` is an empty stub and `G` is discarded | A sim with multi-day runs cannot ship without saves. This is the single largest piece of work. |
| **No audio** | Zero `AudioContext` references anywhere in `src/js/` | Steam reviews punish silent games hard. Needs music, ambience, UI and event SFX. |
| **No menus** | `55-loop.js` calls `newRun()` on boot; no title screen, no pause menu, no options | No volume control, no way to start a new run, no credits. Console cert requires all of this. |
| **No settings** | No matches for `settings`, `options` or `volume` in source | Text size and UI scale matter a lot for a text-dense game. |
| **Mouse-only input** | Pointer and wheel listeners in `41-camera.js` and `31-planner.js`; drag-and-drop planner | Keyboard is partial (Space to advance dialog). Gamepad is absent. Steam Deck needs this; console is impossible without it. |
| **Online font dependency** | `index.template.html` loads three families from Google Fonts over CDN | A shipped build must not touch the network. Fonts need embedding as woff2. |
| **Fixed desktop layout** | `styles.css` hardcodes a 400px panel; labels are 10.5px Silkscreen | Breaks at Steam Deck's 1280x800 and is unreadable at TV distance. |
| **Text is concatenated, not keyed** | Prose assembled from fragments in `03-planets.js`, `20-study-results.js` and elsewhere | English-only is a fine launch choice. But the current structure makes localization near impossible later, and the cost of fixing it rises with every word written. |
| **Unseeded gameplay rolls** | `rnd = Math.random` (`00-util.js`); the seeded `mulberry` RNG drives worldgen only | Saves still work via state snapshot, but bug reports are not reproducible and there is no replay or daily-seed option. |
| **Not under version control** | Working directory is not a git repo. One `.tgz` and Google Drive sync is the entire backup | Highest-severity item on this page. Fix it today. |

Two serialization hazards specific to saving this codebase: `S` holds 9 `Set` instances
(`kindsSeen`, `usedNames`, `sp.flags` and others) which `JSON.stringify` silently turns into
`{}`, and lead actors are stored on the module-level `LEADS` table (`L.actor`) rather than
inside `S`, so a naive snapshot of `S` loses them. Plan for a hand-written serializer with a
schema version field, not a blind stringify.

---

## 2. The one decision that shapes everything else

**Steam does not care what you built this in. Consoles do.**

There is no supported path for an Electron, Tauri or browser-wrapped game on Switch, Switch 2,
PS5 or Xbox Series. Not difficult: unavailable. So "Steam or console" is not one target, it is
a fork, and the fork is cheapest to take right now while the game is 3,754 lines.

**Path A: Web stack, Steam only.** Wrap `dist/` in Electron or Tauri, ship to Steam and
itch.io, Steam Deck verified. Keeps the entire existing codebase, the build script, the
Playwright tests and the fast iteration loop. Console stays closed unless you later pay for a
full rewrite against a much larger codebase.

**Path B: Port to Godot 4 now, then Steam, then console.** Rewrite in Godot before the content
expansion in Phase 2. You get, for free, the things Phase 1 otherwise builds by hand: save
serialization, an audio mixer with buses, gamepad input with remapping, a focus-based UI
system, localization tooling, and resolution scaling. Console then becomes a purchasable step:
[W4 Consoles](https://www.w4games.com/w4consoles) does one-click Switch and Xbox Series
deployment for Godot 4.3+ projects, with PS5 in early access and Switch 2 in beta, and studios
like Pineapple Works, Lone Wolf Technology and Seaven Studio do Godot console ports as
contract work.

**Recommendation: Path A, with Path B's exit kept open.**

Ship on Steam with the web stack. The prototype's velocity is its biggest asset and a rewrite
spends four to six months buying a console option you cannot yet justify. But during Phase 1,
do two things that keep Path B cheap: pull all content tables (`STUDIES`, `LAB_DEFS`, the
planet and atmosphere tables, dialog) out of code into JSON data files, and route every string
through a keyed lookup. Those two changes are worth doing for their own sake, and they mean a
future Godot port re-implements systems against data that ports unchanged, instead of
re-typing content out of JavaScript.

Revisit the fork after Steam launch, when you have sales data. If Steam does well, a port
funded by revenue and handed partly to a porting house is a sane business decision. If it does
not, you saved six months.

---

## 3. Phase 0: make this a project, not a prototype (this week)

1. **`git init`.** Then a private GitHub repo and a push. Google Drive is sync, not history.
   Right now one bad save loses everything.
2. **CI.** GitHub Actions on push: `npm run check`, then both Playwright smoke tests. They
   already exit on `ERRORS []`, so the harness is mostly written.
3. **Name and trademark check.** "Rim Station 7" sits close to RimWorld in a genre RimWorld
   owns. Search USPTO and EUIPO for live marks before any store page, art or domain spend. A
   rename after a wishlist campaign is expensive; a rename now is free. Buy the domain and
   grab the social handles once it clears.
4. **Business entity.** Steam needs tax and banking details in your legal name or an entity's.
   Every console platform requires a registered company. If console is plausible, form the LLC
   now and let it age.
5. **Pick the shape of the release.** Early Access or 1.0, and a target quarter. Everything
   below schedules backward from that date.

---

## 4. Phase 1: de-prototyping (8 to 10 weeks)

Engineering only. No new content. Ends with a build that could go on a store page.

**1. Save and load.** The big one. Budget 2 to 3 weeks.
   - A hand-written `serialize(S)` / `deserialize(json)` pair with a `version` integer.
     Handle the 9 `Set`s explicitly. Move lead actors out of `LEADS` into `S` or rebuild them
     on load from `S.lead` state.
   - Replace `rnd = Math.random` with a seeded stream stored in `S` so saves resume
     identically and bug reports reproduce.
   - Autosave at phase boundaries (`morning` and `evening` are already natural checkpoints and
     the clock is paused there), plus three manual slots.
   - Write a round-trip test: save at every phase transition across a scripted playthrough,
     reload, assert the state matches. Add it to the smoke suite.
2. **Content into data.** Extract `STUDIES`, `SEC_PRIORITY`, `LAB_DEFS`, `LAB_TYPES`, `JOBS`,
   the atmosphere and archetype tables and all dialog into JSON under `src/data/`, inlined by
   `tools/build.mjs`. Balance passes stop being code edits, and Path B stays cheap.
3. **Strings through `t()`.** Every player-facing string gets a key. Procedural prose becomes
   templates with named slots (`"{creature} vocalizes. {soundNote}"`) rather than `+`
   concatenation. English-only at launch is correct; this just stops the debt compounding.
4. **Input abstraction.** One action map over pointer, keyboard and gamepad, replacing the
   scattered per-element listeners. Full keyboard play, including the planner: a
   drag-and-drop-only scheduler is both an accessibility failure and the thing that would
   block a console port hardest. Give the planner a cursor-and-confirm mode alongside dragging.
5. **Audio.** A small WebAudio mixer with music, ambience, SFX and UI buses, and volume sliders
   per bus. Station hum, lab machinery, shuttle, breach alarm, UI clicks, dialog blips.
6. **Shell.** Title screen, new run, continue, load, options, credits, quit. Pause menu over
   gameplay. Options covering audio, UI scale, text size, high contrast, reduced motion,
   speed defaults.
7. **Offline build.** Embed the three font families as base64 woff2. Assert in CI that the
   built HTML contains no `http` references.
8. **Layout that scales.** The 400px panel becomes proportional with a minimum. A UI scale
   setting from roughly 0.75x to 2x. Verify at 1280x800 (Steam Deck), 1920x1080 and 3840x2160.
9. **Desktop wrapper.** Electron or Tauri around `dist/`, signed builds for Windows, macOS and
   Linux. Tauri is far smaller but leans on the system webview, and WebKitGTK on Linux is the
   risk; Electron is heavier and boring, which is what you want for a shipping dependency.
   Recommend Electron unless install size matters to you. Add Steamworks via `steamworks.js`
   for achievements and cloud saves.

Exit criteria: a signed desktop build with saves, sound, menus, full keyboard and gamepad play,
running offline, with CI green on both smoke tests.

---

## 5. Phase 2: prototype to product (5 to 8 months)

Phase 1 made it shippable. This phase makes it worth $17.

**Decide the session shape first.** Today a run ends and nothing carries over, which is a
defensible roguelike structure but currently has neither the run variety nor the meta-progression
that structure needs. Pick one and commit: longer authored campaign arcs, or short runs with
persistent unlocks across them. This choice determines how much content you need, so it comes
before any of the work below.

**Content, drawn from `ROADMAP.md` in priority order:**
- **A director.** Paced events in the RimWorld storyteller mould, replacing random rolls. This
  is the single highest-value addition for a sim; it is what turns systems into stories.
- **The black hole arc** as the campaign spine. Exotic matter and horizon observation are
  already the hooks. A sim needs a reason to keep playing past the point where you have
  mastered the loop, and this is it.
- **Hand-authored specimen anchors.** The 15-specimen catalog, as fixed set pieces among the
  procedural generation. Procedural content gives variety; authored content gives the moments
  players tell each other about.
- **Market paths**: military, biotech, industrial, each with distinct pay and distinct cost.
  Makes the moral system mechanical rather than narrative.
- **An engineering lab**, containment upgrades, equipment degradation and repair.
- **More people**: a speech researcher, xenoanthropologists, replacement leads arriving by
  shuttle, leads who grow cocky when favored.
- **Hybrids** with inherited traits and their own fallout.

**Production work beyond systems:**
- Tutorial rework. The current intro is four `say()` calls, and the game is complicated.
- Difficulty and accessibility presets, including a no-fail-state mode for people who want
  the sim without the breaches.
- Art: the code-drawn procedural sprites are a real differentiator and should stay. Hand work
  goes where code cannot reach, which is portraits, key art and the store capsules.
- Audio production: roughly 20 to 30 minutes of music, 100 to 200 SFX.
- Balance against telemetry from the demo, not against intuition.

---

## 6. Phase 3: the Steam machinery (runs parallel from about month 6)

**Hard dates to schedule backward from.** The fee-to-release wait is 30 days, and the store
page must be publicly visible for at least two weeks before launch, so **everything needs to
be set up at least six weeks before your launch date**, and build review adds a few business
days on top.

1. **Steamworks setup**, as early as possible: $100 per app, recoupable against revenue once
   the game crosses Valve's threshold. Tax interview and banking. Start the 30-day clock long
   before you need it.
2. **Store page up early.** The page is your wishlist collector and it works while you sleep.
   Put it up as soon as you have a trailer and five honest screenshots, which can be well
   before the game is finished. Verify current capsule dimensions in the Steamworks docs at
   the time you make them, since Valve revises the asset list: expect to need a main capsule,
   header, small capsule, vertical capsule, library capsule, library hero and logo.
3. **Trailer.** First five seconds decide everything. Lead with the isometric station and a
   breach, not with menus. Store page gameplay first, no logo card.
4. **Wishlists.** The community benchmark for meaningful launch-day visibility is in the
   neighborhood of 7,000 to 10,000 wishlists; treat that as a rule of thumb, not a Valve rule.
   Devlogs, short video of the procedural worlds and the iso art, the base-building and
   management-sim subreddits, and the sim and colony-sim content creators who already cover
   this genre.
5. **Demo.** Scope it to the existing opening arc: pick a world, first specimen, Tier 1
   dossier, first paper. That is 45 to 60 minutes and it ends on the game's best beat, which
   is a paper with consequences. Keep the demo live permanently.
6. **Steam Next Fest.** Once per game, before release, and it needs the demo. Aim it at the
   quarter before launch and do not waste it on a demo that is not ready.
7. **Early Access.** Recommended here. This genre's audience accepts it, the systems benefit
   from real player data, and it funds Phase 2's tail. 12 to 18 months, with a public roadmap
   and a visible update cadence. Price Early Access at $14.99 and 1.0 at $17.99 to $19.99.
8. **Platform features**: achievements, Steam Cloud saves, a Steam Input controller config,
   and Steam Deck Verified, which Phase 1's work on layout and gamepad largely earns you.
9. **Playtest.** Use a Steam Playtest branch for a closed group through Phase 2. Watch where
   people stop playing and what they misunderstand about the planner.

---

## 7. Phase 4: console, honestly (post-Steam, 4 to 8 months)

Only start this once Steam has shipped and sold. Console is a revenue multiplier on a proven
game, not a way to find an audience.

**What it requires:**
- **A rewrite or a porting partner.** Path B's Godot rewrite plus W4 Consoles, or a contract
  port. Expect 4 to 8 months and a five-figure budget if outsourced.
- **Platform onboarding.** ID@Xbox, PlayStation Partners and the Nintendo Developer Portal.
  All want a registered company, an NDA, and generally a shipped or credibly announced title,
  which Steam success provides. Dev kits follow approval.
- **Certification work**, which is where ports actually die. Suspend and resume, corrupted
  save handling, user account switching mid-session, controller disconnect and reconnect,
  safe area margins, platform button naming conventions, and trophy or achievement sets built
  to each platform's rules.
- **Ratings.** ESRB and PEGI via IARC questionnaires.

**The specific risk for this game.** It is a text-dense management sim with a 400px side panel
and 10.5px pixel labels. On a television at three meters, that is unplayable. A console version
needs a genuinely redesigned 10-foot UI with a gamepad-first scheduler, not a scaled-up port.
Budget that as a design project in its own right. Switch and Switch 2 are the natural first
platform: the audience for a dense, slow, text-heavy sim overlaps strongly with handheld play,
and the same work serves Steam Deck.

---

## 8. Timeline

Assuming a solo developer working at a steady pace, Early Access as the target.

| When | What |
|---|---|
| Week 1 | Phase 0. Git, CI, name clearance, entity. |
| Months 1 to 3 | Phase 1. Saves, audio, input, menus, offline build, wrapper. |
| Month 3 | Steamworks account and fee paid. 30-day clock starts early and quietly. |
| Months 3 to 9 | Phase 2 content. Director and black hole arc first. |
| Month 7 | Store page live with trailer and screenshots. Wishlist campaign begins. |
| Months 9 to 10 | Demo built and polished. Steam Playtest with a closed group. |
| Month 11 | Steam Next Fest. |
| Month 12 | Early Access launch at $14.99. |
| Months 12 to 27 | Early Access updates on a visible cadence. Console decision made on real sales data. |
| Month 27 | 1.0 at $17.99 to $19.99. |
| Month 30+ | Console, if the numbers justify it. |

## 9. Budget

| Item | Cost |
|---|---|
| Steam Direct | $100, recoupable |
| LLC formation | $100 to $800 depending on state |
| Code signing certificate (Windows, and Apple Developer for macOS) | $300 to $500 per year |
| Music, 20 to 30 minutes commissioned | $2,000 to $6,000 |
| SFX library plus custom work | $300 to $1,500 |
| Capsule and key art | $500 to $2,500 |
| Trailer, if not self-cut | $0 to $2,000 |
| **Steam total** | **roughly $3,500 to $13,000** |
| Console port, outsourced, per platform family | $25,000 to $60,000 |

## 10. The five risks that matter

1. **No version control.** Everything else on this page is moot if the directory is lost.
   Fix it first.
2. **The name.** "Rim Station 7" in a colony-sim context invites both a trademark problem and
   a derivative-work impression. Clear it before spending on art or a store page.
3. **Scope.** `ROADMAP.md` is a list of good ideas large enough to absorb five years. Early
   Access exists precisely so you can ship before it is all built. Pick the director and the
   black hole arc, ship, and let player data choose what comes next.
4. **Save system complexity.** `S` was written to be convenient, not serializable. Expect this
   to take longer than estimated and to surface bugs in places unrelated to saving.
5. **Console as an assumption.** If console is a requirement rather than a hope, the engine
   decision has to happen now, not after Phase 2. Porting 3,754 lines is a different project
   from porting 15,000.

## 11. This week

- [ ] `git init`, private remote, first push
- [ ] GitHub Actions running `npm run check` and both smoke tests
- [ ] Trademark search on the name, and a shortlist of alternatives in case
- [ ] Decide: is console a requirement or a hope? Write the answer down.
- [ ] Decide the session shape: long authored runs, or short runs with meta-progression
- [ ] Start the save system with the serializer and the round-trip test
