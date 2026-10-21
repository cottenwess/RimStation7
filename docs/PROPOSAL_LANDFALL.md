# Proposal: Landfall

A revised premise for Rim Station 7. Written 2026-10-21 against prototype v0.6 for review.
Nothing here is committed. The current design is in `DESIGN.md`; the staff systems it depends
on are in `DESIGN_STAFF.md`.

---

## The pitch

**The lab is a ship, and it lands.**

You are still the director of a Meridian Exobiotics research vessel. You still never leave the
lab. But the lab now sets down on a world, and it is there for a reason: long-range
spectroscopy found something in that planet's chemistry that should not be there. Oxygen and
methane coexisting. Sulfur cycling with no volcanic source. Hydrogen disappearing from the
lakes faster than anything abiotic can explain.

Something alive is doing that. Your job is to find out what, catch it, prove it, and publish.

You leave when you can explain the anomaly, not when a counter fills.

## Why this premise and not another

The hooks are already written. Every generated planet carries a biosignature line that the
game currently prints on a card and then ignores:

> "Hydrogen depletion over the lakes. Possible methane-based life."
> "Unexplained sulfur cycling. Possible life."
> "Plume chemistry suggests a living ocean under the ice."
> "No active biosignature. Organic traces in the regolith."

Nine of these exist across the atmosphere table. Landfall does not invent a premise, it
activates one that has been sitting in `03-planets.js` as decoration.

It is also real. Biosignatures genuinely are detected as atmospheric disequilibrium: a gas
mixture that chemistry alone would have settled long ago, held out of balance by something
that keeps breathing. The game already computes the disequilibrium. It just never asked the
player to explain it.

## What changes, and what does not

| | Status under Landfall |
|---|---|
| You are the director, in the lab | **Unchanged.** You never go outside. |
| Scheduler, crews, lab heads, staff | **Unchanged.** The best systems are untouched. |
| Studies, tiers, dossiers, papers | **Unchanged in mechanism**, transformed in purpose |
| Specimens have a hidden truth | **Unchanged**, and now load-bearing |
| Planets as distant destinations | **Replaced.** You are standing on one. |
| Recovery trips of 60 to 90 hours | **Replaced** by sorties of a few hours |
| The campaign has no shape | **Replaced** by a per-world investigation with an answer |

The critical property: this adds a layer of **intent** above the existing game without
requiring any of it to be automated or thinned. Everything that works today keeps working.

## The loop

1. **Arrive.** Instruments read the atmosphere. Meridian names the anomaly and asks you to
   account for it. You have a planet's chemistry and nothing else.
2. **Survey.** Short sorties from the landed vessel bring back candidates. Each world holds a
   limited number of viable subjects, so every capture is a choice rather than a harvest.
3. **Research.** The existing game. Study what you caught, under containment, with the staff
   and the scheduler and the risk you already have.
4. **Hypothesise.** Decide which organism is responsible for the chemistry, and what it is
   doing. This is a claim, and claims can be wrong.
5. **Publish.** Account for the anomaly. Meridian renews the grant, partner labs build on your
   explanation, and you lift off.
6. **Return, later.** The subjects you left behind are still there. A world is never finished,
   only answered.

## The anomaly as the campaign

Each world's biosignature implies a mechanism, and the mechanism implies an organism. The
player's goal is to connect the two with evidence.

| Observed chemistry | What has to be true | How the lab proves it |
|---|---|---|
| Hydrogen depletion over the lakes | Something metabolises hydrogen | Biochemistry characterization plus a metabolic assay |
| Unexplained sulfur cycling | Something oxidises or reduces sulfur | Assay plus culture work in the Micro Lab |
| Oxygen and methane out of balance | Two populations, one producing each | At least two specimens, and the relationship between them |
| Plume chemistry under the ice | A biosphere under 10 km of ice shell | Reaching it at all is the problem |
| Organic traces, no active signature | It is dead. Something *was* here | Fossils, dating, and possibly revival |

The last two are the interesting ones. "It is dead" turns the world into an archaeology
problem and makes the Genetics Lab the centre of the run. The ice shell makes access itself
the obstacle, which is a different kind of pressure from hazard.

**The answer can be wrong, and that is the point.** You might catch the obvious candidate, run
a clean dossier, publish it as the sulfur-cycler, and be mistaken. The organism actually
responsible was the one you left behind because its hazard rating was too high. Partner labs
build on your explanation. The correction, when it comes, costs what corrections cost here
already.

## The hunt

**Viable subjects are finite.** A world holds a fixed, small number of specimens worth
recovering. The number is visible in aggregate ("survey suggests four viable subjects") but
not in detail, so you know scarcity exists without knowing exactly what you are passing up.

**Sorties are directed.** Rook takes a brief rather than a destination: work the lake margin,
work the high desert, follow the sulfur, go back for the one we left. Each brief biases what
comes back, costs time, and carries hazard scaled to the world.

**The roster changes outcomes.** This is where the staff systems pay off a second time. A
zoologist on the team reads behaviour in the field and brings back a better-conditioned
animal. A xenoanthropologist spots worked stone instead of walking past it. A containment
engineer makes the transfer survivable for something that should not be handled at all. Two
green techs bring back whatever they could catch.

**Leaving is allowed.** You can lift off with the anomaly unexplained. It costs standing, it
leaves an open question on your record, and a rival lab may publish the answer you walked away
from. There is no locked door, only a consequence. The over-budget model in the current build
works exactly this way and works well.

## Containment, on a surface

This is where the premise earns something the station version cannot have.

On a station you vent the lab to vacuum. **On a world with an atmosphere you cannot.** The
failsafe ladder loses its top rungs and gains worse ones:

- Lock down the lab. As now.
- Seal the vessel. Anyone outside stays outside.
- **Lift off and leave it.** The specimen is loose in the biosphere it evolved in. The study
  site is contaminated. Whatever you concluded about this world is now unreliable, and you did
  that.
- **Sterilise the site.** Available, catastrophic, and it ends any further work here.

Containment failure stops meaning "we lost the specimen" and starts meaning "we have altered
the thing we came to study." For a game about the integrity of what you publish, that is a
better failure than venting.

## The setting

Recommendation: **the planets orbit the black hole.**

All five worlds sit in its gravity well. This keeps everything the current fiction does well
and costs the least to reconcile:

- The horizon is visible from every surface. The imagery survives.
- Tidal heating explains liquid water on an ice moon this far out.
- Time dilation is a real pressure on long studies: a multi-day culture costs more than a day
  depending on where you are in the well.
- Exotic matter and horizon observation stay in the Physics Lab unchanged.
- The vessel is still air-gapped and still droppable into the horizon as the final failsafe.

The black hole is referenced in 19 places across 7 files, concentrated in the physics lab jobs
and the breach ladder. Under this option almost none of it needs rewriting.

Two alternatives considered and not recommended: making the black hole a home base you return
to between worlds (costs a second location to build and maintain), or writing it out entirely
as backstory (cheapest, but it throws away the strongest imagery in the game).

## Progression

A run is a sequence of worlds rather than one station's history.

- **Within a world:** the anomaly is the objective, the viable subjects are the budget, and
  the dossier is the method.
- **Across worlds:** the vessel accumulates labs, staff and reputation. Specimens can be kept
  aboard between worlds, at upkeep, or shipped to Meridian for money and lost to you.
- **Returning:** worlds remember what you took. The subjects left behind are still there, and
  so is anything you released.

This gives the game a shape it currently lacks. Today a run ends when you close the station,
go bankrupt or scuttle. Under Landfall a run is a career with a route through it, and the
ending is the body of work: five worlds, what you claimed about each, and what was true.

## What it costs to build

Honest estimate, in rough order.

| Work | Scale |
|---|---|
| Background and lighting per world: sky colour, horizon, weather | Small. `52-background.js` is 30 lines and sky colour is already computed per planet |
| Anomaly objective: generate the mechanism, track the hypothesis, resolve it | Medium. New, but it reads existing planet data |
| Sortie briefs replacing missions | Medium. `dispatch` and `missionReturn` already exist and would be retargeted |
| Finite viable subjects, world memory, return trips | Medium |
| Breach ladder rewritten for a surface | Small |
| Lift-off, world selection, between-world state | Medium |
| Writing: anomalies, briefs, the new failsafes, Rook's field reports | Large, and the part most worth doing well |
| Reconciling the black hole fiction | Small under the recommended option |

Nothing here needs a second renderer, a tactical layer, or any automation of the lab. That is
the test this proposal was designed to pass.

## Open questions for review

1. **Does the vessel carry all six labs, or fewer with expansion across the run?** Fewer makes
   each world a different shape. All six keeps the current game intact from day one.
2. **Do specimens travel between worlds?** Keeping them is upkeep and containment risk;
   shipping them is money and losing access to your own evidence.
3. **How many worlds in a run?** Five is what the generator makes now. Three longer ones may
   read better than five short ones.
4. **Is the anomaly always solvable?** A world where the responsible organism is unreachable
   is a strong story and a frustrating hour.
5. **What happens to the tutorial?** The current opening teaches the lab. Landfall needs to
   teach the lab *and* the investigation, and that is a lot for a first world.
6. **Does the player ever see the surface?** This proposal says no, and that the view stays on
   the vessel. Worth confirming that is a choice rather than an omission.
