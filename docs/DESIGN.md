# Rim Station 7: design as built (prototype v0.6)

## Premise
Meridian Exobiotics runs Rim Station 7, a research station in orbit around a black hole at the edge of the galaxy. You are the director. Recovery teams bring back life from nearby worlds; your scientists study it under containment, publish papers that partner labs rely on, and keep the grant coming. The station is air-gapped and can be dropped into the black hole if something gets out.

## Run structure
- Each new game generates five planets from a seed: three charted, two hidden. Hidden worlds are found on return trips to the charted planet they're linked to.
- Planets are built from real astrobiology: star class sets plant pigment, mass sets gravity, atmosphere sets sky color, sound speed and biosignatures. Biochemistry can be water-carbon or exotic (methane, silicon, ammonia, sulfur). Archetypes: garden, hostile, botanical, dead (fossils and microbes), ice-shell ocean, cloud, cryogenic. About 70% of seeds hold a sapient species somewhere.
- A run ends when you close the station, go bankrupt, lose all standing, or scuttle the station into the black hole. Nothing carries over between runs.

## Day loop
- One tick is one in-game hour. The shift runs 08:00 to 20:00, or to 23:00 with paid overtime.
- **Morning:** the clock waits. Open the day planner to schedule the day, then press Run the day.
- **Shift:** staff walk to their stations and do the work; you watch from above. Click people to see what they're doing and thinking. Click specimens for their record.
- **Evening:** the briefing opens. This is when you send recovery missions, repair and upgrade labs, match habitats, and build new labs. Close the day and the night passes on its own.

## Day planner
- Work cards are listed by lab on the left: studies, reruns (tagged), and lab jobs, each with risk, cost and hours. The lead's suggestion is starred.
- Drag a card onto its lab's row at an hour, drag blocks to move them, drag back to unschedule. + adds at the end of that lab's queue.
- Hands-on and bench work must finish inside the shift. Multi-day work (genome sequencing, spread tests, revival, cloning, signal decoding, hybridization, horizon observation) runs around the clock.
- One study at a time per specimen. The hub bench is shared. A techs row shows hourly staffing load.
- Some work repeats: one extraction round per remaining compound, one cloning line per open lab.

## Labs
Six fixed slots. The east wing holds Containment A, Containment B and Physics; the south wing holds Micro, Genetics and Chem.

| Lab | Holds | Work |
|---|---|---|
| Containment | creatures, plants | glass tank; observation, habitat, sampling, provocation, challenge |
| Microbiology | microbes | cultures; compound screening; vaccines from sequenced pathogens |
| Genetics | fossils | cloning, de-extinction, hybrids from two animals, crop strains from plants |
| Chemistry | nothing | synthesis (licenses for 50% more), derivative search |
| Physics | nothing | spectroscopy and stress tests on mission materials, bio-batteries, melanin shielding, black hole observation |

Labs unlock from progress: Lab B, Micro and Genetics after a paper renews the grant; Chem after the first compound; Physics once a mission brings back materials. Recovery teams only bring back what you have an open lab for.

## Research
- Studies sit in dossier sections (behavior, anatomy, hazards, handling, habitat, containment, genome, communication when relevant). Tier 1 must be complete before the first paper; Tier 2 opens after it, Tier 3 after Tier 2. Gated studies stay hidden.
- Sealed studies cannot cause a breach. Hands-on studies carry a risk factor shaped by what you know (hazards, behavior, BSL, lab condition, lead) and by precautions: Skip, Standard or Full, which trade money and hours for safety.
- Sedation confounds behavior. Washout is real hours; a sedated animal gives unreliable data, flagged with a rerun label.
- When Tier 1 is done, the lead files a report: research viability, risk profile, what's worth investigating, possible applications, and a recommendation.
- The lead also suggests the next step for each specimen: a study, a rerun, publishing, sending a compound or genome to another lab, or shipping the specimen out.

## Compounds and materials
- Each specimen holds 2 or 3 compounds drawn from 11 types (neurotoxin, analgesic, antimicrobial, enzyme, pigment, polymer, bioelectric protein, cryoprotectant, melanin, alkaloid, adhesive). Each extraction pulls one.
- After extraction you choose: license to Meridian, send to Micro for screening, send to Chem for synthesis, sell weapons-grade compounds to the Directorate, or hold.
- Recovery trips also bring back planet materials for Physics. Rare exotic matter ties into the black hole.

## Money and standing
- Starting grant 400 cr. Each new specimen brings an arrival grant (more for a new kind). Papers that complete a tier renew the grant, scaled by standing. A one-time bridge advance exists if you run dry before your first paper.
- A paper deadline applies only while some specimen still has work toward its next tier.
- Upkeep scales with labs, BSL-3 upgrades, hazard pay and stasis.

## Papers and consequences
- Partner labs (Kepler Deep Lab, Halden Station, Vireo Biolabs) follow your papers. Gaps and wrong claims become incidents there, with deaths you hear about. Corrections can prevent pending incidents; retractions cost standing.
- Military interest (Colonel Whitcomb, the Directorate) pays better and turns your work into weapons.
- Sapient specimens force a choice: recognize them as people (invasive work stops) or keep the specimen label.

## People
- Leads: Dr. Adaeze Okafor (meticulous, slower, audits bad data) and Dr. Imre Vasko (maverick, fast, skips steps). Pulling a lead repeatedly makes them quit.
- Bea Thornton runs the techs. Techs are mortal; deaths lead to hazard-pay demands.
- Rook Adebayo leads recovery missions. Gerald Pruitt is the administrator. Ines Calderón runs safety walkthroughs that catch decon skips and failing seals.

## Breach
A failed hands-on study can breach. The ladder: lock down, seal, vent the lab (kills the specimen), detach the lab into the black hole, scuttle the station. Each step costs more.

## Visual style
Isometric pixel art at integer scale with 1px dark outlines, a dark silhouette around the whole station, slate and deep-blue floors, lit by wall strip lights. References: single-room cutaway dioramas, tiled space platforms, multi-floor workshop cutaways.
