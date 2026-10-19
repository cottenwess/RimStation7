/* ================= compounds & materials ================= */
const COMPOUND_TYPES = {
  toxin:{label:'paralytic neurotoxin', value:40, dual:true, screen:'Blocks nerve signals at tiny doses. A surgical anesthetic, or a weapon.'},
  analgesic:{label:'analgesic peptide', value:50, dual:false, screen:'Kills pain without touching the opioid pathways. Hospitals will want this.'},
  antimicrobial:{label:'antimicrobial peptide', value:50, dual:false, screen:'Shreds bacterial membranes, including two resistant strains.'},
  enzyme:{label:'industrial enzyme', value:35, dual:false, screen:'Breaks down plastics at room temperature.'},
  pigment:{label:'photoprotective pigment', value:30, dual:false, screen:'Absorbs harsh light. Sunscreen, coatings, sensors.'},
  polymer:{label:'self-repairing biopolymer', value:45, dual:true, screen:'Reseals cracks on its own. Armor plating, or hull patches.'},
  bioelectric:{label:'bioelectric protein', value:50, dual:true, screen:'Stores and releases charge. The Physics Lab could build a power cell around it.'},
  cryo:{label:'cryoprotectant', value:40, dual:false, screen:'Keeps cells alive at deep cold. Organ transport, long missions.'},
  melanin:{label:'radiotrophic melanin', value:45, dual:false, screen:'Turns radiation into chemical energy. The Physics Lab could test it as shielding.'},
  alkaloid:{label:'psychoactive alkaloid', value:35, dual:true, screen:'Alters perception and suggestibility. Psychiatric use, or interrogation.'},
  adhesive:{label:'wet adhesive', value:30, dual:false, screen:'Sticks underwater and to living tissue. Surgical glue.'}
};
function genCompounds(sp){
  const t = sp.truth, out = [];
  const add = k => { if(!out.includes(k)) out.push(k); };
  if(t.hazard === 'venom'){ add('toxin'); add('analgesic'); }
  if(t.hazard === 'electric') add('bioelectric');
  if(t.hazard === 'pathogen') add('antimicrobial');
  if(t.hazard === 'acid') add('enzyme');
  if(t.hazard === 'spores') add('alkaloid');
  if(t.hazard === 'radiation') add('melanin');
  if(sp.form === 'crab' || sp.form === 'ironplant') add('polymer');
  if(sp.form === 'fungus') add('melanin');
  if(sp.form === 'crystal' || t.needs.temp === 'cryogenic' || t.needs.temp === 'near-freezing') add('cryo');
  if(sp.form === 'frond') add('pigment');
  if(sp.form === 'trap') add('adhesive');
  if(sp.kind === 'microbe') add(rnd() < .5 ? 'antimicrobial' : 'enzyme');
  for(const k of ['enzyme', 'pigment', 'adhesive', 'analgesic']) if(out.length < 2) add(k);
  const max = sp.kind === 'fossil' ? 1 : sp.kind === 'microbe' ? 2 : (rnd() < .5 ? 2 : 3);
  return out.slice(0, max);
}
let cmpSeq = 0, matSeq = 0;
function makeCompound(sp, type){
  const T = COMPOUND_TYPES[type];
  const c = {id:'c' + (++cmpSeq), type, name:`${sp.name} ${T.label}`, short:cap(T.label), sp:sp.id, spName:sp.name, value:T.value, dual:T.dual, state:'held', screened:false, synth:false, derived:false, battery:false, shield:false};
  S.compounds.push(c); return c;
}
const compoundValue = c => Math.round(c.value * (c.synth ? 1.5 : 1) * (c.screened ? 1.4 : 1) * (c.battery || c.shield ? 1.6 : 1));
function compoundChoice(c, intro){
  const v = compoundValue(c), ch = [];
  ch.push({label:`License to Meridian (+${v} cr)`, act:() => licenseCompound(c)});
  if(labOfType('micro') && !c.screened) ch.push({label:'Send to the Micro Lab for screening', act:() => { c.state = 'micro'; log('ops', 'admin', `${c.name} sent to the Micro Lab.`); S.dirty = true; }});
  if(labOfType('chem') && !c.synth) ch.push({label:'Send to the Chem Lab for synthesis', act:() => { c.state = 'chem'; log('ops', 'admin', `${c.name} sent to the Chem Lab.`); S.dirty = true; }});
  if(c.dual) ch.push({label:`Sell to the Directorate (+${Math.round(v * 1.8)} cr)`, act:() => sellCompound(c)});
  ch.push({label:'Hold it for now', act:() => { c.state = 'held'; S.dirty = true; }});
  say('pruitt', 'smug', `${intro} ${cap(c.short)} from ${c.spName}. Meridian will license it as is for ${v} cr.${!labOfType('micro') && !labOfType('chem') ? ' A Micro or Chem Lab could make it worth more.' : ''}${c.dual ? ' The Directorate has made a higher offer.' : ''}`, {log:false, choices:ch});
}
function licenseCompound(c){ const v = compoundValue(c); c.state = 'licensed'; S.funds += v; standing(1); log('pruitt', 'admin', `Licensed ${c.name} to Meridian: +${v} cr.`); S.dirty = true; }
function sellCompound(c){
  const v = Math.round(compoundValue(c) * 1.8); c.state = 'sold'; S.weapons = true; S.funds += v; standing(-4); log('whitcomb', 'admin', `Sold ${c.name} to the Directorate: +${v} cr.`);
  if(S.lead === 'okafor') say('okafor', 'angry', `That ${c.short.toLowerCase()} is a weapons program now. You know that.`, {kind:'warning'});
  S.dirty = true;
}
const MATERIALS = {
  garden:[['magnetite sand', false], ['biogenic clay', false]], hostile:[['volcanic glass', true], ['sulfide crust', true]], botanical:[['biogenic silica', false], ['amber resin', false]],
  barren:[['shock quartz', false], ['meteoric iron', false]], ice:[['clathrate ice', true], ['tidal brine', false]], cloud:[['metallic hydrogen trace', true], ['aerogel flakes', false]], cryo:[['tholin crust', false], ['nitrogen frost', true]]
};
function genMaterials(p){
  const out = [], n = 1 + (p.hazard >= 2 ? 1 : 0);
  for(let i = 0; i < n; i++){ const [name, volatile] = pick(MATERIALS[p.arch]); out.push({id:'m' + (++matSeq), name:`${cap(name)} (${p.name})`, base:name, planet:p.i, volatile, value:20 + p.hazard * 8, spectro:false, stressed:false, state:'held'}); }
  if(rnd() < .15) out.push({id:'m' + (++matSeq), name:`Exotic matter shard (${p.name})`, base:'exotic matter', planet:p.i, volatile:true, exotic:true, value:70, spectro:false, stressed:false, state:'held'});
  S.materials.push(...out);
  return out;
}

