/* ================= lab jobs (non-specimen work) ================= */
const tgtCompound = id => S.compounds.find(c => c.id === id);
const tgtMaterial = id => S.materials.find(m => m.id === id);
const JOBS = {
  screen:{lab:'micro', mode:'bench', name:c => `Antimicrobial screen`, of:'compound', cost:12, work:5,
    list:() => S.compounds.filter(c => c.state === 'micro' && !c.screened),
    desc:c => `Test ${c.short.toLowerCase()} against the station's cultures and resistant reference strains.`,
    run(c){ c.screened = true; c.state = 'held'; const pathogen = S.specs.some(s => s.kind === 'microbe' && s.truth.hazard === 'pathogen' && valid(s, 'assay'));
      if(pathogen) c.value += 15;
      return {who:'okafor', mood:'excited', text:`Screen done on ${c.short.toLowerCase()}. ${COMPOUND_TYPES[c.type].screen}${pathogen ? ' It also slows the pathogen culture we have here. That adds to the value.' : ''}`, after:() => compoundChoice(c, 'Screened and ready:')}; }},
  vaccine:{lab:'micro', mode:'bench', name:() => 'Vaccine development', of:'spec', cost:24, work:30, multi:true,
    list:() => S.specs.filter(s => s.alive && s.kind === 'microbe' && s.truth.hazard === 'pathogen' && valid(s, 'assay') && valid(s, 'genome') && !s.vaccine),
    desc:s => `Build a vaccine against ${s.name} from its sequenced genome.`,
    run(s){ s.vaccine = true; S.funds += 90; standing(5); const n = S.pending.filter(p => p.sp === s.id).length; S.pending = S.pending.filter(p => p.sp !== s.id);
      return {who:'okafor', mood:'excited', text:`We have a vaccine candidate for ${s.name}. Meridian paid 90 cr for it.${n ? ` The partner labs have it now. ${n} outbreak${n > 1 ? 's' : ''} that would have happened won't.` : ''}`}; }},
  synth:{lab:'chem', mode:'bench', name:() => 'Synthesis route', of:'compound', cost:18, work:6,
    list:() => S.compounds.filter(c => c.state === 'chem' && !c.synth),
    desc:c => `Work out how to make ${c.short.toLowerCase()} without the specimen. Synthetic compounds license for 50% more.`,
    run(c){ c.synth = true; c.state = 'held'; return {who:'okafor', mood:'neutral', text:`We can make ${c.short.toLowerCase()} from scratch now. Nobody has to cut it out of ${c.spName} again.`, after:() => compoundChoice(c, 'Synthesized:')}; }},
  deriv:{lab:'chem', mode:'bench', name:() => 'Derivative search', of:'compound', cost:14, work:6,
    list:() => S.compounds.filter(c => c.synth && !c.derived && c.state !== 'sold'),
    desc:c => `Modify ${c.short.toLowerCase()} and look for a variant that does something new. Might find nothing.`,
    run(c){ c.derived = true;
      if(rnd() < .5){ const types = Object.keys(COMPOUND_TYPES).filter(k => k !== c.type); const sp = specById(c.sp) || {name:c.spName, id:c.sp}; const n = makeCompound(sp, pick(types)); n.synth = true; n.name = `${c.spName} derivative ${n.short.toLowerCase()}`;
        return {who:'okafor', mood:'excited', text:`A derivative of ${c.short.toLowerCase()} turned into something else entirely: ${n.short.toLowerCase()}.`, after:() => compoundChoice(n, 'New derivative:')}; }
      return {who:'okafor', mood:'neutral', text:`No useful derivatives of ${c.short.toLowerCase()}. Negative results go in the notebook too.`}; }},
  spectro:{lab:'physics', mode:'bench', name:() => 'Spectroscopy', of:'material', cost:10, work:4,
    list:() => S.materials.filter(m => !m.spectro && m.state === 'held'),
    desc:m => `Map what ${m.base} is made of and how it behaves under load.`,
    run(m){ m.spectro = true; m.value += 10;
      return {who:'okafor', mood:m.exotic ? 'alarmed' : 'neutral', text:m.exotic ? `The shard's mass reading changes depending on which way it faces the black hole. That should not be possible.` : `${cap(m.base)}: composition mapped.${m.volatile ? ' It is unstable under pressure. A stress test will be dangerous.' : ' Stable. Safe to stress test.'}`}; }},
  stress:{lab:'physics', mode:'handle', name:() => 'Stress test', of:'material', cost:16, work:4, risky:true,
    list:() => S.materials.filter(m => m.spectro && !m.stressed && m.state === 'held'),
    desc:m => `Push ${m.base} to failure.${m.volatile ? ' It is volatile. This can damage the lab.' : ''}`,
    run(m, it){ m.stressed = true; const L = S.labs[it.lab]; let hurt = '';
      if(m.volatile && rnd() < (it.opts.mit === 'full' ? .2 : it.opts.mit === 'none' ? .7 : .45)){ L.integrity = Math.max(0, L.integrity - 18); const t = actors().filter(a => a.job === it.id && a.kind === 'tech'); if(t.length && rnd() < .5){ const v = pick(t); v.injured = true; S.injuries++; hurt = ` ${v.name} was caught by the blast.`; } hurt = ` It failed violently and took ${L.name}'s integrity down to ${Math.round(L.integrity)}%.` + hurt; }
      m.value += m.volatile ? 30 : 15;
      return {who:'okafor', mood:hurt ? 'alarmed' : 'neutral', text:`Stress test on ${m.base} complete.${hurt}`, after:() => materialChoice(m)}; }},
  battery:{lab:'physics', mode:'bench', name:() => 'Bio-battery prototype', of:'compound', cost:22, work:7,
    list:() => S.compounds.filter(c => c.type === 'bioelectric' && !c.battery && (c.state === 'held')),
    desc:c => `Build a power cell around ${c.short.toLowerCase()} from ${c.spName}.`,
    run(c){ c.battery = true; return {who:'vasko', mood:'excited', text:`The cell holds a charge for days. ${c.spName}'s protein is now a battery.`, after:() => compoundChoice(c, 'Prototype ready:')}; }},
  shield:{lab:'physics', mode:'bench', name:() => 'Shielding test', of:'compound', cost:18, work:6,
    list:() => S.compounds.filter(c => c.type === 'melanin' && !c.shield && c.state === 'held'),
    desc:c => `Coat a panel with ${c.short.toLowerCase()} and put it in the black hole's radiation.`,
    run(c){ c.shield = true; return {who:'okafor', mood:'excited', text:`The coated panel blocks more radiation than our hull plating, and it repairs itself.`, after:() => compoundChoice(c, 'Shielding validated:')}; }},
  horizon:{lab:'physics', mode:'observe', name:() => 'Horizon observation', of:'station', cost:20, work:24, multi:true,
    list:() => S.items.some(x => x.type === 'horizon') ? [] : [{id:'bh', name:'the black hole'}],
    desc:() => `Point the instruments at the black hole for a full day.${S.materials.some(m => m.exotic && m.spectro) ? ' Calibrate against the exotic matter shard.' : ''}`,
    run(){ S.horizonRuns = (S.horizonRuns || 0) + 1; const ex = S.materials.some(m => m.exotic && m.spectro), g = ex ? 60 : Math.max(10, 35 - S.horizonRuns * 5);
      S.funds += g; standing(ex ? 4 : 1);
      const lore = ex ? 'With the shard as a reference, there is a pattern in the infall. Something at the horizon is repeating. It looks built.' : pick(['Hawking flux readings match the models. Mostly.', 'There is an echo in the accretion signal we cannot place.', 'Two of the frozen stations are visible at the horizon. Their lights are still on.']);
      return {who:'okafor', mood:ex ? 'alarmed' : 'neutral', text:`${lore} Meridian's physics desk paid ${g} cr for the data.`}; }},
  crop:{lab:'genetics', mode:'bench', name:() => 'Crop strain', of:'spec', cost:20, work:8,
    list:() => S.specs.filter(s => s.kind === 'flora' && s.flags.has('viable') && !s.crop),
    desc:s => `Breed a crop strain from ${s.name}'s genome for agricultural licensing.`,
    run(s){ s.crop = true; S.funds += 60; standing(3); return {who:'okafor', mood:'excited', text:`${s.name} crop strain is stable. It grows in soil that would starve wheat. Meridian Agriculture paid 60 cr.`}; }},
  hybrid:{lab:'genetics', mode:'bench', name:() => 'Hybridization', of:'pair', cost:40, work:48, multi:true,
    list:() => { const g = S.specs.filter(s => ANIMAL(s) && s.flags.has('viable') && s.origin !== 'hybrid'); const out = []; for(let i = 0; i < g.length; i++) for(let j = i + 1; j < g.length; j++) if(!S.items.some(x => x.type === 'hybrid')) out.push({id:g[i].id + '+' + g[j].id, name:`${g[i].name} × ${g[j].name}`, a:g[i].id, b:g[j].id}); return out.slice(0, 3); },
    desc:p => `Combine the genomes of ${p.name}. The result needs an open containment lab, and it will be something nobody has seen.`,
    block:() => openLabs('fauna').length ? '' : 'No open containment lab for whatever this makes.',
    run(p){ const A = specById(p.a), B = specById(p.b); const h = genSpecimen(planetOf(A), 'fauna', {origin:'hybrid'});
      h.form = A.form; h.pal = {body:B.pal.body, light:A.pal.light, dark:B.pal.dark, eye:B.pal.eye}; h.name = A.name.slice(0, Math.ceil(A.name.length / 2)) + B.name.slice(Math.floor(B.name.length / 2)).toLowerCase();
      h.truth.agg = clamp((A.truth.agg + B.truth.agg) / 2 + .15, .05, .97); h.truth.hazard = B.truth.hazard; h.truth.lethal = B.truth.lethal; h.truth.bsl = Math.max(A.truth.bsl, B.truth.bsl); h.truth.sapience = 0; h.truth.compounds = genCompounds(h);
      S.specs.push(h); const L = placeSpecimen(h); S.hybrids++;
      if(S.lead === 'okafor') standing(-2);
      return {who:S.lead || 'okafor', mood:S.lead === 'vasko' ? 'excited' : 'uneasy', text:`${h.name} is alive in ${L ? L.name : 'stasis'}. Half ${A.name}, half ${B.name}, ${S.lead === 'okafor' ? 'and I am not proud of it. We made something that has never existed and never asked to.' : 'and entirely ours. Nobody else has one.'}`}; }}
};
function materialChoice(m){
  say('pruitt', 'smug', `${cap(m.base)} is characterized. Meridian's materials division will license the data for ${m.value} cr.`, {log:false, choices:[
    {label:`License it (+${m.value} cr)`, act:() => { m.state = 'licensed'; S.funds += m.value; log('pruitt', 'admin', `Licensed ${m.name} data: +${m.value} cr.`); S.dirty = true; }},
    {label:'Keep it on station', act:() => {}}
  ]});
}
function jobTargets(type){ return JOBS[type].list(); }
function jobTargetById(type, id){ return jobTargets(type).find(t => t.id === id) || (JOBS[type].of === 'compound' ? tgtCompound(id) : JOBS[type].of === 'material' ? tgtMaterial(id) : JOBS[type].of === 'spec' ? specById(id) : null); }

