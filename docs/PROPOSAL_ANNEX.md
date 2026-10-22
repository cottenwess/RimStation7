# Proposal: The Annex

A dark-cozy building sim about running an expanding research complex. Working title.
Written 2026-10-22 for review. Independent of `PROPOSAL_LANDFALL.md`; this is a different game
using the same staff and incident systems.

---

## The pitch

You run a research institute that keeps growing. You do not choose the science, you choose
where it happens: which labs get built, how close they sit, who staffs them, and what you are
willing to put next to what.

Some of the work is quiet. Herbarium cataloguing, imaging, materials testing, long patient
cultures. Some of it is not. Pathogen suites, reactive chemistry, bioreactors, things in cold
storage that have a protocol for what to do if the power fails.

**Both pay. You need both. They want opposite things from the floor plan.**

There are no visitors. Nothing flows through this building except the work itself and the
people doing it, and both of them are yours to route.

## The floor is the game

Every decision in The Annex resolves into a question about space.

**Throughput wants proximity.** A sample goes from prep to imaging to analysis to storage.
Every metre between those rooms is walking time, and walking time is the only budget that
never refills. A tight chain is a fast chain.

**Volatility wants isolation.** Dangerous work needs buffer: airlocks, dead corridors, no
shared wall with anything that matters. Each one of those costs floor area, and floor area is
the other budget that never refills.

**Incidents travel by adjacency.** A chemistry fire against the bioreactor wall is a different
evening from one against the archive. What you put next to what is a bet you place at build
time and settle months later.

So every efficient layout is a little unsafe and every safe layout is a little slow. The
building you end up with is a record of which way you leaned, repeatedly, under pressure.

## Lab types

Labs sit on a spectrum from benign to volatile. Benign work is slow, reliable and keeps the
lights on. Volatile work pays several times better, moves faster, and occasionally takes
something from you.

| Lab | Register | Produces | Emits / requires |
|---|---|---|---|
| Herbarium | Benign | Catalogue entries, botanical samples | Nothing. Raises morale in adjacent rooms |
| Microscopy | Benign | Imaging, structural analysis | Needs quiet and no vibration |
| Archive | Benign | Storage, records, retrieval | Needs stable climate, hates heat |
| Materials Bench | Benign | Stress and composition data | Noise, vibration |
| Prep Lab | Service | Sample preparation for everything | Contamination sensitive both ways |
| Cryogenics | Mixed | Long storage, cold-chain study | Thermal load, catastrophic on power loss |
| Vivarium | Mixed | Living specimens, behavioural work | Biological, needs care routines daily |
| Reactive Chemistry | Volatile | Synthesis, compounds, high-value contracts | Thermal, chemical, explosive |
| Pathogen Suite | Volatile | Pathogenicity, vaccine candidates | Biological, needs airlocks and pressure gradient |
| Bioreactor Hall | Volatile | Scaled culture, industrial yields | Biological, pressure, large footprint |
| Radiometrics | Volatile | Isotope work, dating, irradiation | Radiological, needs mass between it and people |

Service labs are the interesting middle. Prep feeds everything, so it wants to be central, which
means it is close to things it should not be close to. The player builds the knot themselves.

## Adjacency

Three relationships, all visible at build time, all violable.

**Wants** — pairs that gain throughput when adjacent. Prep next to Microscopy. Bioreactor next
to Cryogenics. Breaking these costs time, not safety.

**Avoids** — pairs that degrade each other. Microscopy next to Materials Bench, because
vibration ruins imaging. Archive next to anything thermal. These are quiet, constant taxes
rather than disasters.

**Never** — pairs where an incident in one becomes an incident in both. Reactive Chemistry
against the Bioreactor Hall. Vivarium against the Pathogen Suite. The game lets you do it. It
will cost about what you would expect, on a day you are not thinking about it.

Isolation infrastructure is placeable and takes space: airlocks, decon corridors, blast
baffles, shielding mass. These are the levers that let you cheat adjacency, and each one eats
the floor you wanted for another lab.

## Comfort is on the same budget

The cozy half is structural, not decorative. Your staff need somewhere that is not the bench:
a break room, daylight, plants, a kitchen that works, a route to it that does not pass the
pathogen suite.

All of it competes for the same floor area as the science. That is the whole trick. Warmth and
capability bid against each other every time you expand, and morale is a real input to work
speed, error rate and whether people stay.

A complex that is all laboratory runs hot and loses people. A complex that is half amenity is
pleasant and does not make rent. You will build something in between and feel slightly bad
about it, which is correct.

## Teams

Each lab has a small team, and they belong to it.

- A lab's team has an identity and a competence that grows with its hours.
- Pulling someone to cover elsewhere costs throughput in two places and they resent it.
- A lab that loses someone is visibly short until you hire, and the rest carry it.
- Teams in adjacent labs develop relationships. So do rival teams doing similar work.

This is the one area where the existing prototype is already further along than a typical
building sim: staff have four disciplines with potential ceilings, traits that cut both ways,
morale, affinity with supervisors, and friction between heads of same-discipline labs. All of
it attaches here without modification.

## Incidents, calibrated

The incident table is where dark-cozy is actually set. The ratio matters more than the
contents: roughly nine in ten should be mundane, human and recoverable.

**Mundane** — the autoclave is broken again. Someone left the freezer ajar overnight and a
culture line is gone. A power flicker ruined eleven hours of unattended work. The sample in
tray four is not labelled and nobody will admit to it.

**Costly** — contamination traced back through three rooms. A reagent order arrives wrong and
a contract slips. A fume hood fails its certification and the lab is shut for a week.

**Bad** — a fire. A breach. Someone hurt. Someone not coming back.

The mundane incidents are the texture, and they are funny in the way lab work is actually
funny. The bad ones are rare enough to land, and they land harder because the register around
them is warm. A game where everything is a catastrophe has no catastrophes.

## The loop

**Morning.** Assign the day. See who is in, who is short, what came in overnight.

**Day.** The chain runs. Samples move between rooms along the paths you built. Work completes,
contracts progress, something goes wrong somewhere.

**Evening.** Results, incident reports, contract decisions, and the expansion question: what do
you build next, and where does it have to go.

**Between.** Hiring, firing, contracts accepted and declined, the slow accumulation of a
building.

## Progression

The complex is the progression. You start with a prep lab, a bench, a corridor and three
people. You end with a sprawl you built one compromise at a time.

- New lab types unlock through completed work, and each brings a new hazard category that your
  existing floor plan either accommodates or does not.
- Expansion is physical: you acquire adjacent space, and the shape of what you can acquire is
  not always the shape you want.
- The building cannot be freely rearranged. Moving a lab is expensive and slow, so early
  decisions persist. This is the genre's real pleasure and should not be softened.

## Economy, without visitors

Money comes from **contracts** rather than footfall.

- **Retainers** from benign work: small, dependable, unexciting, and they cover payroll.
- **Commissions** for volatile work: large, deadlined, and the client does not care how you
  got there.
- **Residuals** on anything you discover that gets licensed later, which pays for years and
  arrives without ceremony.

The structural tension is that retainers keep you alive and commissions let you grow, so a
complex that takes only safe work stagnates and one that takes only dangerous work eventually
has a very bad month. Clients also have preferences about what you are willing to do, which is
where the dark half of the tone earns its keep.

## Tone

The cozy is the rhythm. The hum of a centrifuge, a clean run, the good pair of hands in Lab 4,
coffee that is always slightly wrong, rain on a skylight you paid too much for.

The dark is the content and the consequences. What is actually in the cold store. What the
commission is for. The fact that the team in Lab 4 is small because of something that happened
in Lab 4, and that everybody still works there.

Nearest relatives in tone: *Strange Horticulture*, *Graveyard Keeper*, *Papers, Please*. Warm
routine wrapped around something that is not.

## What this would cost

| Work | Scale |
|---|---|
| Modular room placement and corridors | Large. The core system, and new |
| Adjacency model: wants, avoids, never | Medium |
| Material flow between rooms, visible | Medium. Staff pathing already exists |
| Comfort and morale on the floor budget | Small. Morale already modelled |
| Teams bound to labs | Small. The roster systems transfer directly |
| Incident table and propagation | Medium |
| Contract economy | Medium |
| Art: placeable objects, room fittings, corridors | **Large, and the sleeper cost.** A building sim needs a deep object library, and the current art is drawn procedurally with no asset pipeline |

## Open questions

1. **How free is placement?** Fully drawn rooms like Two Point, or fixed lab footprints the
   player arranges? Fixed footprints keep the puzzle and cut the art cost substantially.
2. **Can the complex ever be rearranged?** Never is cleanest and harshest. A costly, slow
   relocation is kinder and removes some of the weight from early decisions.
3. **Does the player choose the science, or only where it happens?** The pitch says only where.
   Letting them choose projects adds a second decision layer and risks diluting the spatial one.
4. **One complex or several?** A single growing building has a stronger sense of place. Multiple
   sites give the genre's usual star-rating arc.
5. **How present are individual specimens?** The current prototype makes each one a character
   with a hidden truth. That could survive here, or the subject matter could recede behind the
   throughput and leave the game colder.
6. **What is the ending?** A building sim usually has none. A dark-cozy one might be better
   with a last day.
