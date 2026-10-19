/* ================= study results ================= */
/* A finding can be unreliable for reasons the handlers already know about
   (sedation, a truncated protocol, unreadable biochemistry). On top of those, who
   ran it matters: an inexperienced crew, a slot too short to do it properly, or
   nobody on station who understands the work all produce data you cannot bank.
   Returns the reason to add to the lead's line, or '' when the run was clean. */
function recordFind(sp, id, r, it){
  let flagged = !!r.flagged, ok = r.ok !== false, why = '';
  if(!flagged && it){
    const crew = crewOf(it), q = crewFactors(crew, it.mode, id).quality * headPenalty(it.lane).quality;
    const p = clamp(0.05 * q + (it.rushed ? 0.16 : 0), 0, 0.55);
    if(rnd() < p){
      flagged = true; ok = false;
      const miss = missingExpert(id);
      const key = MODE_STAT[it.mode] || 'bench';
      const weak = crew.slice().sort((a, b) => statOf(a, key) - statOf(b, key))[0];
      const unheaded = laneLab(it.lane) && !labHeaded(laneLab(it.lane)) ? laneLab(it.lane) : null;
      why = unheaded ? `${unheaded.name} has nobody at its head, and nobody checked this before it was filed. Flagged as unreliable.`
        : miss ? `Nobody here is a ${ROLES[miss].label.toLowerCase()}, and it shows. Flagged as unreliable.`
        : it.rushed ? 'We ran out of shift and cut it short. Flagged as unreliable.'
        : weak ? `${weak.name} has not done enough of these. Flagged as unreliable, and worth a rerun.`
        : 'The run was not clean. Flagged as unreliable.';
    }
  }
  sp.find[id] = {text:r.text, ok, flagged, stance:r.stance || r.text, by:S.lead === 'vasko' ? 'Vasko' : 'Okafor', t:S.t,
    crew:it && it.crew ? it.crew.slice() : [], why};
  return why;
}
const pre = (V, a, b) => V ? a : b;
const RUN = {
  obs(sp, e, V){
    if(ANIMAL(sp)){
      while(e.reps.length < e.opts.reps) e.reps.push({v:measureAgg(sp), sed:sp.sed, t:S.t});
      const vals = e.reps.map(r => r.v), mean = vals.reduce((a, b) => a + b, 0) / vals.length, maxSed = Math.max(...e.reps.map(r => r.sed));
      const cls = classify(mean), scores = vals.map(f2).join(', ');
      const text = {docile:'Docile under observation', wary:'Wary under observation', aggressive:'Aggressive, high arousal even at rest'}[cls] + ` (mean ${f2(mean)}, n=${vals.length})`;
      const ok = cls === truthClass(sp), stance = cls === 'aggressive' ? 'danger' : 'safe';
      sp.flags.add('motile');
      let voc = '';
      if(sp.truth.vocal){ sp.flags.add('vocal'); voc = ` It vocalizes. ${soundNote(planetOf(sp))}`; }
      if(!V && maxSed > .2){
        const h = sinceSed(sp);
        return {text, ok, flagged:true, stance, line:['uneasy', `Scores ${scores}. I'm flagging this as unreliable: ${sp.name} was sedated ${h} hours ago.${e.opts.control ? ' The drug assay confirms it.' : ''}${vals.length > 1 && vals[vals.length - 1] - vals[0] > .08 ? ' The scores climbed every session as the drug wore off.' : ''} Rerun after a full washout.${voc}`]};
      }
      const lineV = {docile:['excited', `Scores ${scores}, mean ${f2(mean)}. Docile. We can relax the protocols on this one.${voc}`], wary:['smug', `Scores ${scores}, mean ${f2(mean)}. Wary, not dangerous. It'll settle.${voc}`], aggressive:['excited', `Scores ${scores}, mean ${f2(mean)}. It's a killer. Gorgeous. Give me a provocation test.${voc}`]}[cls];
      const lineO = {docile:['neutral', `Scores ${scores}, mean ${f2(mean)}. Low arousal. I'd still replicate before trusting it.${voc}`], wary:['neutral', `Scores ${scores}, mean ${f2(mean)}. Wary. Clean run.${voc}`], aggressive:['alarmed', `Clean run, no sedative on board. Scores ${scores}, mean ${f2(mean)}. It's dangerous.${voc}`]}[cls];
      if(V && e.opts.control && maxSed > .1) lineV[1] += ' The drug assay picked up some leftover sedative. Trace levels. Irrelevant.';
      return {text, ok, stance, line:V ? lineV : lineO};
    }
    sp.flags.add('sessile');
    const p = planetOf(sp);
    let text;
    if(sp.kind === 'flora') text = ({frond:`Fronds track the ${STARS[p.star].desc}'s light and fold shut at night`, trap:'Sticky traps snap shut on anything that moves within 3 cm', fungus:'Black caps grow toward radiation, not light', ironplant:'Plates itself with iron oxide as it grows', crystal:'Grows faceted lattices only below -170°C'})[sp.form] + `. Pigment: ${STARS[p.star].floraName}`;
    else if(sp.kind === 'microbe') text = `Colonies double every ${sp.truth.doubling} hours${sp.truth.biochem !== 'carbon-water' ? ' in a medium we had to improvise' : ''}`;
    else text = `Fragments of a ${pick(['small', 'large', 'very large'])} ${pick(['radially symmetric', 'segmented', 'six-limbed', 'shelled'])} organism${sp.truth.ruins ? '. Several bones show regular cut marks' : ''}`;
    if(sp.truth.ruins) sp.flags.add('ruins');
    return {text, ok:true, stance:'safe', line:[V ? 'smug' : 'neutral', pre(V, `Done. ${text}. Next.`, `${text}. Logged.`)]};
  },
  sample(sp, e, V){
    sp.flags.add('sample');
    const p = planetOf(sp);
    const t = ({dome:`Spined dome body; spines laced with ${pick(['tessellite', 'iron-silica', 'magnetite'])} crystals`, strider:`Six jointed legs built for ${p.g > 1.2 ? 'heavy' : 'light'} gravity (${p.g} g)`, serpent:'Long segmented body with a sensory frill',
      crab:'Armor plating mineralized with biological iron', blind:'No eyes; electroreceptive pits along the flanks', lithovore:'Grinding plates that chew rock for minerals',
      gasbag:`Gas bladders filled with ${p.atm === 'h2' ? 'hydrogen' : 'a light gas mix'}; trailing feeding tendrils`, frond:'Thin fronds with dense pigment layers', trap:'Hinged traps lined with digestive glands',
      fungus:'Melanin-packed caps that turn radiation into chemical energy', ironplant:'Stems sheathed in iron oxide scales', crystal:'Cells with rigid, phase-changing membranes',
      culture:`Single cells, ${pick(['rod-shaped', 'spherical', 'spiral'])}, with an unusual cell wall`, fossil:`Mineralized tissue with ${sp.truth.genome === 'viable' ? 'surprisingly intact' : 'heavily degraded'} organic traces`})[sp.form];
    return {text:t, ok:true, line:[V ? 'excited' : 'neutral', pre(V, `Sample's in. ${t}. Bench studies are open.`, `Clean sample. ${t}. That opens the bench studies.`)]};
  },
  habitat(sp, e, V){
    const n = sp.truth.needs;
    if(ANIMAL(sp) && sp.sed > .3){
      if(V) return {text:'No clear environmental preference', ok:false, line:['smug', 'No clear preference. It sat wherever we put it.']};
      return {text:'No clear environmental preference', ok:false, flagged:true, line:['uneasy', "It didn't move because it's still sedated. Flagged. We'll rerun it."]};
    }
    sp.flags.add('habitat');
    const text = `Prefers ${n.light}, ${n.pressure} pressure, ${n.temp} temperatures`;
    return {text, ok:true, line:[sp.truth.sensitive ? 'uneasy' : 'neutral', `${text}.${sp.truth.sensitive ? ' Our standard cell is stressing it. Match the environment in the Station tab.' : ' Standard conditions are fine.'}`]};
  },
  age(sp, e, V){
    const text = `About ${sp.truth.age} million years old${sp.truth.ruins ? '. The cut marks are tool marks' : ''}`;
    if(sp.truth.ruins) sp.flags.add('tools');
    return {text, ok:true, line:[sp.truth.ruins ? 'alarmed' : 'neutral', sp.truth.ruins ? `${text}. Something on that world made tools, ${sp.truth.age} million years ago, and something else ate it.` : `${text}.`]};
  },
  assay(sp, e, V){
    const h = sp.truth.hazard;
    const text = ({none:'No significant toxins or pathogens', venom:'Injects a fast-acting paralytic, lethal at full dose', electric:'Discharges strong enough to stop a human heart', acid:'Secretes acid that burns through standard gloves',
      spores:'Releases spores that inflame human airways', pathogen:sp.kind === 'fossil' ? 'Dormant cells in the residue revived in culture and infected human cells' : 'Infects human cell cultures. Treat as a pathogen', radiation:'Concentrates radioactive isotopes; mildly radioactive'})[h];
    if(h !== 'none') sp.flags.add(h);
    if(sp.kind === 'fossil' && h === 'pathogen') sp.flags.add('dormant');
    return {text, ok:true, line:[h === 'none' ? 'neutral' : 'alarmed', pre(V, h === 'none' ? `${text}. Boring, which is fine.` : `${text}. Useful. Very useful.`, h === 'none' ? `${text}.` : `${text}. That has to be in the paper.`)],
      after:() => { if(['venom', 'electric', 'pathogen'].includes(h) && S.whitcombDeals < 1 && !sp.whitcombAsked){ sp.whitcombAsked = true; whitcombOffer(sp); } }};
  },
  clearance(sp, e, V){
    if(e.truncated) return {text:`Half-life about ${Math.max(3, Math.round(sp.truth.sedHalf / 3))} h. Safe to observe ${Math.max(6, Math.round(sp.truth.sedHalf / 2))} h after a dose`, ok:false, line:['smug', "Clearance curve's done. I stopped sampling early; the trend was obvious."]};
    const hl = sp.truth.sedHalf, wash = Math.ceil(hl * 2.3 / 12) * 12;
    sp.washKnown = wash;
    return {text:`Half-life about ${hl} h. Behavior unreliable for ${wash} h after a dose`, ok:true, line:[V ? 'uneasy' : 'neutral', `Half-life about ${hl} hours. Any behavior data within ${wash} hours of sedation is suspect.`]};
  },
  stimulus(sp, e, V){
    sp.stress = clamp(sp.stress + .3, .1, 1);
    if(sp.sed > .3){
      if(V) return {text:'No response to the prey model', ok:false, stance:'safe', line:['smug', "Nothing. It barely reacted. It's harmless."]};
      return {text:'No response to the prey model', ok:false, flagged:true, stance:'safe', line:['uneasy', 'No response, but it still has sedative in its blood. This means nothing. Flagged.']};
    }
    const t = ({ambush:'Ambush predator. Holds still, then strikes in 40 ms', swarm:'Mobbing response. Attacks in coordinated bursts', wary:'Retreats, then defends hard when cornered', grazer:'Ignores the prey model, then tries to eat it. Not a predator', drifter:'Drifts away and vents gas from its bladders'})[sp.truth.temperament];
    const danger = sp.truth.agg > .6;
    const after = () => {
      if(!e.opts.remote && danger){
        const inLab = actors().filter(a => a.job === e.id && a.kind === 'tech' && a.alive);
        if(inLab.length && rnd() < ((labOf(sp) || S.labs[0]).bsl >= 3 ? .15 : .3)){ const v = pick(inLab); v.injured = true; S.injuries++; notify('bea', `${v.name} got too close during the provocation test. Injured, out of rotation.`, 'warning'); }
      }
    };
    return {text:t, ok:true, stance:danger ? 'danger' : 'safe', line:[danger ? 'alarmed' : 'neutral', pre(V, danger ? `${t}. Get this on video for the funders.` : `${t}. Told you it was harmless.`, `${t}.`)], after};
  },
  spread(sp, e, V){
    const spores = sp.truth.hazard === 'spores' || (sp.kind === 'microbe' && sp.truth.hazard === 'pathogen');
    if(spores) sp.flags.add('spores');
    const text = spores ? 'Spreads through the air. Particles pass a standard filter' : sp.kind === 'microbe' ? 'Spreads only on contact surfaces' : 'Spreads by runners only; stays where it is planted';
    return {text, ok:true, line:[spores ? 'uneasy' : 'neutral', `${text}.${spores ? ' That needs an aerosol challenge before anyone trusts our seals.' : ''}`]};
  },
  genome(sp, e, V){
    if(sp.truth.exotic && !sp.flags.has('biochem')){
      sp.flags.add('exotic');
      return {text:'Unreadable: not standard DNA chemistry', ok:false, flagged:true, line:['alarmed', `The sequencer can't read it. This isn't DNA as we know it. We need to characterize the biochemistry first.`], kind:'anomaly'};
    }
    if(sp.truth.genome === 'degraded'){ sp.flags.add('degraded'); return {text:'Badly fragmented. About 40% recoverable', ok:true, line:['neutral', 'Fragmented. About 40% of the genome is recoverable. Not enough to grow anything.']}; }
    sp.flags.add('viable');
    const bc = {'carbon-water':'Carbon-based, water solvent', methane:'Nitrogen-based membranes that work in liquid methane', silicon:'Silicon-oxygen polymers in a supercritical solvent', ammonia:'Carbon-based, ammonia solvent', sulfur:'Carbon-based, built around sulfur chemistry'}[sp.truth.biochem];
    const text = `Complete genome. ${bc}. Viable for cloning`;
    return {text, ok:true, line:[V ? 'excited' : 'neutral', pre(V, `${text}. We could grow our own.`, `${text}. That opens a cloning line, if we want one.`)]};
  },
  biochem(sp, e, V){
    sp.flags.add('biochem');
    const t = {methane:'Membranes built from small nitrogen compounds that stay flexible at -180°C. Its solvent is liquid methane', silicon:'Silicon-oxygen polymers dissolved in supercritical carbon dioxide. It exhales sand', ammonia:'Carbon chemistry with liquid ammonia as the solvent', sulfur:'Carbon chemistry that runs on sulfur instead of oxygen'}[sp.truth.biochem] || 'Standard chemistry after all';
    return {text:t, ok:true, line:['excited', `${t}. Now the sequencer can be retuned. Rerun the genome.`], kind:'finding'};
  },
  acoustic(sp, e, V){
    const s = sp.truth.sapience;
    const text = s >= 2 ? 'Calls have structure: repeated units and ordering rules' : s === 1 ? 'Calls vary by context and individual' : 'Simple alarm and contact calls';
    if(s >= 2) sp.flags.add('structured');
    return {text, ok:true, line:[s >= 2 ? 'alarmed' : 'neutral', s >= 2 ? `${text}. That looks like syntax. We should try to decode it.` : `${text}.`]};
  },
  revive(sp, e, V){
    sp.revived = true;
    const p = planetOf(sp);
    const m = genSpecimen(p, 'microbe', {origin:'revived'});
    m.truth.hazard = 'pathogen'; m.truth.lethal = true; m.truth.bsl = Math.max(3, sp.truth.bsl); m.name = 'Revenant ' + pick(['strain', 'culture', 'bloom']);
    S.specs.push(m); const ml = placeSpecimen(m);
    return {text:undefined, line:['alarmed', `The dormant cells woke up. They're growing. ${m.name} is in ${ml ? ml.name : 'stasis'} as ${m.code}. It has been dead for ${sp.truth.age} million years and it is not dead anymore.`], kind:'finding'};
  },
  extract(sp, e, V){
    if((sp.extracted || 0) >= sp.truth.compounds.length) return {text:undefined, line:['neutral', `Nothing left to extract from ${sp.name}. Every useful compound is already out.`], kind:'note'};
    const type = sp.truth.compounds[sp.extracted || 0]; sp.extracted = (sp.extracted || 0) + 1;
    const c = makeCompound(sp, type), left = sp.truth.compounds.length - sp.extracted;
    return {text:undefined, line:['excited', `Isolated ${c.short.toLowerCase()} from ${sp.name}.${left ? ` There ${left > 1 ? 'are' : 'is'} ${left} more compound${left > 1 ? 's' : ''} worth pulling.` : ' That is everything useful in it.'}`], kind:'finding', after:() => compoundChoice(c, 'Extracted:')};
  },
  challenge(sp, e, V){
    const need = sp.truth.bsl, L = labOf(sp) || S.labs[0];
    const text = need <= 2 ? `Held at BSL-2. BSL-${Math.max(1, need)} is enough` : `Breaks BSL-2 barriers. Needs BSL-${need}`;
    if(L.bsl < need) L.integrity = Math.max(0, L.integrity - 10);
    return {text, ok:true, stance:'bsl' + need, line:[need > 2 ? 'alarmed' : 'neutral', `${text}.${L.bsl < need ? ` ${L.name} is BSL-${L.bsl}, Director.` : ''}${need >= 4 ? ' We are not built for BSL-4.' : ''}`]};
  },
  clone(sp, e, V){
    const p = planetOf(sp);
    const kind = sp.kind === 'fossil' ? (rnd() < .6 ? 'fauna' : 'flora') : sp.kind;
    const c = genSpecimen(p, kind, {origin:'clone'});
    if(sp.kind !== 'fossil'){ c.form = sp.form; c.pal = {...sp.pal}; c.name = sp.name + ' II'; c.truth = JSON.parse(JSON.stringify(sp.truth)); c.truth.agg = clamp(c.truth.agg + gauss() * .12, .05, .97); c.truth.sedHalf = Math.round(c.truth.sedHalf * (0.8 + rnd() * .4)); }
    else { c.name = 'Neo-' + sp.name.toLowerCase(); c.truth.sapience = 0; c.truth.vocal = false; }
    S.specs.push(c); const cl = placeSpecimen(c);
    const o = S.lead === 'okafor';
    return {text:undefined, line:[o ? 'uneasy' : 'excited', sp.kind === 'fossil' ? `It's alive. ${c.name} (${c.code}) is in ${cl ? cl.name : 'stasis'}. It is not what died ${sp.truth.age} million years ago. It's our best guess, and our guess is breathing.` : `${c.name} (${c.code}) is in ${cl ? cl.name : 'stasis'}. Same genome, different life. Don't assume it behaves like the original.`], kind:'finding'};
  },
  language(sp, e, V){
    if(sp.truth.sapience >= 3){
      sp.flags.add('person');
      return {text:'Language. They are describing us: the glass, the shift change, the door', ok:true, line:['alarmed', "They aren't calling to each other. They're describing us. The glass. The shift change. Which door we use. This is language, Director."], kind:'finding', after:() => sapienceChoice(sp)};
    }
    return {text:'Proto-language, comparable to a dolphin pod', ok:true, line:['neutral', 'Complex, but not language. About as rich as a dolphin pod. Remarkable, and not people.']};
  }
};
