/* ================= sections & studies ================= */
const SEC_LABEL = {behavior:'Behavior', anatomy:'Anatomy', hazard:'Hazards', handling:'Handling', habitat:'Habitat needs', age:'Age and context', comms:'Communication', containment:'Containment', genome:'Genome'};
function secLabel(sp, s){
  if(s === 'behavior' && !ANIMAL(sp)) return 'Growth and spread';
  if(s === 'anatomy' && (sp.kind === 'microbe' || sp.kind === 'fossil')) return 'Morphology';
  if(s === 'hazard' && sp.kind === 'microbe') return 'Pathogenicity';
  return SEC_LABEL[s];
}
function sectionsFor(sp){
  if(sp.kind === 'fossil') return ['anatomy', 'age', 'hazard', 'genome'];
  const s = ANIMAL(sp) ? ['behavior', 'anatomy', 'hazard', 'handling', 'habitat', 'containment', 'genome'] : ['behavior', 'anatomy', 'hazard', 'habitat', 'containment', 'genome'];
  if(sp.flags.has('vocal')) s.splice(3, 0, 'comms');
  return s;
}
const SEC_PRIORITY = {behavior:['stimulus', 'spread', 'obs'], anatomy:['sample', 'obs'], hazard:['assay'], handling:['clearance'], habitat:['habitat'], age:['age'], comms:['language', 'acoustic'], containment:['challenge'], genome:['genome']};
const valid = (sp, id) => sp.find[id] && !sp.find[id].flagged;
const secIds = (sp, sec) => SEC_PRIORITY[sec].filter(id => !(sec === 'anatomy' && id === 'obs' && ANIMAL(sp)));
const found = (sp, id) => !!sp.find[id];
const STUDIES = {
  obs:{tier:1, mode:() => 'observe', name:sp => ({fauna:'Containment observation', floater:'Containment observation', flora:'Growth observation', microbe:'Culture observation', fossil:'Imaging survey'})[sp.kind],
    applies:() => true, avail:() => true, cost:(sp, o) => ANIMAL(sp) ? 6 * o.reps + (o.control ? 6 : 0) : 8, work:(sp, o) => ANIMAL(sp) ? 3 * o.reps : 4,
    desc:sp => ANIMAL(sp) ? 'Score behavior through the glass. Each replicate is its own 8-hour session.' : sp.kind === 'fossil' ? 'Scan the specimen and map what survives.' : 'Watch it grow under standard conditions.'},
  sample:{tier:1, mode:sp => ANIMAL(sp) ? 'handle' : sp.kind === 'flora' ? 'handle' : 'bench', trigger:sp => ANIMAL(sp), sedates:sp => ANIMAL(sp),
    name:sp => ({fauna:'Tissue biopsy', floater:'Bladder sampling', flora:'Tissue cuttings', microbe:'Subculture', fossil:'Core extraction'})[sp.kind],
    applies:() => true, avail:sp => found(sp, 'obs'), cost:() => 14, work:() => 2,
    desc:sp => ANIMAL(sp) ? 'Sedate the specimen and take tissue. Supplies material for the bench studies.' : 'Take material for the bench studies.'},
  habitat:{tier:1, mode:() => 'observe', name:() => 'Habitat tolerance sweep', applies:sp => sp.kind !== 'fossil', avail:sp => found(sp, 'obs'), cost:() => 10, work:() => 6,
    desc:() => 'Sweep light, pressure and temperature inside the sealed tank and record what it prefers.'},
  age:{tier:1, mode:() => 'bench', name:() => 'Isotope dating', applies:sp => sp.kind === 'fossil', avail:sp => found(sp, 'sample'), cost:() => 12, work:() => 5,
    desc:() => 'Date the core samples and read the rock around them.'},
  assay:{tier:1, mode:() => 'bench', trigger:sp => sp.kind === 'microbe' || sp.kind === 'fossil',
    name:sp => ({fauna:'Venom and toxin assay', floater:'Gas and toxin assay', flora:'Phytochemical screen', microbe:'Pathogenicity assay', fossil:'Residue screen'})[sp.kind],
    applies:() => true, avail:sp => found(sp, 'sample'), cost:() => 16, work:() => 4,
    desc:sp => sp.kind === 'microbe' ? 'Expose human cell cultures to it and see what happens.' : sp.kind === 'fossil' ? 'Screen the residue for anything still active.' : 'Test what it produces against human tissue.'},
  clearance:{tier:2, mode:() => 'handle', sedates:() => true, name:() => 'Sedative clearance', applies:ANIMAL, avail:sp => found(sp, 'sample') && sp.flags.has('motile'), cost:() => 12, work:() => 8,
    desc:() => 'Sedate it again and draw blood every few hours to measure how long the drug lasts.'},
  stimulus:{tier:2, mode:() => 'handle', trigger:() => true, name:() => 'Provocation test', applies:ANIMAL, avail:sp => found(sp, 'obs') && sp.flags.has('motile'),
    cost:(sp, o) => 10 + (o.remote ? 8 : 0), work:() => 2, desc:() => 'Introduce a prey model and record the response. Dangerous to anyone in the room.'},
  spread:{tier:2, mode:() => 'observe', name:() => 'Spread test', applies:sp => sp.kind === 'flora' || sp.kind === 'microbe', avail:sp => found(sp, 'obs'), cost:() => 8, work:() => 36,
    desc:() => 'Give it room inside the sealed tank and measure how it spreads.'},
  genome:{tier:2, mode:() => 'bench', name:() => 'Genome sequencing', applies:() => true, avail:sp => found(sp, 'sample'), cost:() => 18, work:() => 14,
    desc:() => 'Sequence the sample.'},
  biochem:{tier:2, mode:() => 'bench', name:() => 'Biochemistry characterization', applies:() => true, avail:sp => sp.flags.has('exotic') && !found(sp, 'biochem'), cost:() => 20, work:() => 8,
    desc:() => 'Work out what this life is built from, so the sequencer can read it.'},
  acoustic:{tier:2, mode:() => 'observe', name:() => 'Acoustic analysis', applies:ANIMAL, avail:sp => sp.flags.has('vocal'), cost:() => 10, work:() => 6,
    desc:sp => `Record and analyze its calls. ${soundNote(planetOf(sp))}`},
  revive:{tier:2, mode:() => 'bench', trigger:() => true, name:() => 'Culture revival', applies:sp => sp.kind === 'fossil', avail:sp => sp.flags.has('dormant') && !sp.revived, cost:() => 22, work:() => 30,
    desc:() => 'Try to wake the dormant cells found in the residue.'},
  extract:{tier:2, mode:() => 'bench', name:sp => `Compound extraction (${(sp.extracted || 0) + itemsFor(sp, 'extract').filter(x => x.state === 'running').length}/${sp.truth.compounds.length})`, applies:sp => sp.truth.compounds.length > 0, avail:sp => valid(sp, 'assay') && (sp.extracted || 0) < sp.truth.compounds.length, cost:() => 14, work:() => 6,
    desc:() => 'Isolate the most useful compound and see if it can be licensed.'},
  challenge:{tier:3, mode:() => 'handle', trigger:() => true, name:sp => ANIMAL(sp) ? 'Containment challenge' : 'Aerosol challenge', applies:sp => sp.kind !== 'fossil',
    avail:sp => (ANIMAL(sp) && valid(sp, 'stimulus')) || (sp.kind === 'flora' && sp.flags.has('spores')) || (sp.kind === 'microbe' && sp.flags.has('pathogen')) || (!ANIMAL(sp) && valid(sp, 'spread') && sp.truth.hazard !== 'none'),
    cost:() => 20, work:() => 3, desc:sp => ANIMAL(sp) ? 'Provoke full strikes against BSL-2 and BSL-3 test panels.' : 'Push it against BSL-2 and BSL-3 filters and seals.'},
  clone:{tier:3, mode:() => 'bench', name:sp => sp.kind === 'fossil' ? 'De-extinction line' : 'Cloning line', applies:() => true, avail:sp => sp.flags.has('viable'), cost:() => 40, work:() => 72,
    desc:sp => sp.kind === 'fossil' ? 'Grow a living organism from the recovered genome. It will not be exactly what died.' : 'Grow a clone from the sequenced genome.'},
  language:{tier:3, mode:() => 'observe', name:() => 'Signal decoding', applies:ANIMAL, avail:sp => sp.flags.has('structured'), cost:() => 16, work:() => 48,
    desc:() => 'Bring in pattern analysis and try to decode the structure in its calls.'}
};
const STUDY_ORDER = ['obs', 'sample', 'habitat', 'age', 'assay', 'clearance', 'stimulus', 'spread', 'genome', 'biochem', 'acoustic', 'revive', 'extract', 'challenge', 'clone', 'language'];
const studyMode = (sp, id) => STUDIES[id].mode(sp);
const isTrigger = (sp, id) => !!(STUDIES[id].trigger && STUDIES[id].trigger(sp));
const sedates = (sp, id) => !!(STUDIES[id].sedates && STUDIES[id].sedates(sp));
const tierOpen = (sp, id) => STUDIES[id].tier <= sp.grantTier + 1;
const itemsFor = (sp, id) => S.items.filter(x => x.kind === 'study' && x.sp === sp.id && x.type === id);
// Studies that can be queued more than once: one round per remaining compound, one cloning line per open lab.
function roundsLeft(sp, id){
  const q = itemsFor(sp, id).length;
  if(id === 'extract') return sp.truth.compounds.length - (sp.extracted || 0) - q;
  if(id === 'clone') return openLabs(sp.kind === 'fossil' ? 'fauna' : sp.kind).length - q;
  return q ? 0 : 1;
}
const canQueueMore = (sp, id) => roundsLeft(sp, id) > 0;
/* Work that can be queued behind work already on the schedule, so a day is not
   one experiment long while the next waits on a finding that is certain anyway.
   Only listed here where the prerequisite's result is a foregone conclusion.
   Studies that open on a discovered trait (acoustic on vocalization, cloning on a
   viable genome, revival on dormant cells) stay hidden until the trait is found:
   offering them early would tell the player what the specimen is before they look. */
const PRE = {
  sample:['obs'], habitat:['obs'], spread:['obs'], stimulus:['obs'],
  age:['sample'], assay:['sample'], genome:['sample'], clearance:['sample'],
  extract:['assay']
};
const queuedOrDone = (sp, id) => found(sp, id) || itemsFor(sp, id).length > 0;
/* Available now, or available once what is already scheduled has run. */
function availSoon(sp, id){
  if(STUDIES[id].avail(sp)) return true;
  const pre = PRE[id];
  return !!pre && pre.every(n => queuedOrDone(sp, n));
}
/* What a provisionally-queued study is still waiting for. */
function pendingPre(sp, id){
  if(STUDIES[id].avail(sp)) return [];
  return (PRE[id] || []).filter(n => !found(sp, n));
}
const visible = (sp, id) => STUDIES[id].applies(sp) && ((availSoon(sp, id) && tierOpen(sp, id)) || found(sp, id) || !!itemFor(sp, id));
function studyState(sp, id){
  const it = itemFor(sp, id); if(it) return it.state === 'running' ? 'running' : 'queued';
  const f = sp.find[id];
  if(f) return f.flagged ? 'flagged' : 'done';
  return 'open';
}
function claimFor(sp, sec){
  for(const id of secIds(sp, sec)) if(valid(sp, id) && sp.find[id].text) return sp.find[id];
  return null;
}
const tierStudies = (sp, t) => STUDY_ORDER.filter(id => STUDIES[id].tier === t && STUDIES[id].applies(sp) && (t === 1 || STUDIES[id].avail(sp) || found(sp, id)));
function tierDone(sp, t){ const list = tierStudies(sp, t).filter(id => !['extract', 'clone', 'revive'].includes(id)); return list.length > 0 && list.every(id => valid(sp, id)); }
function topTier(sp){ let t = 0; while(t < 3 && tierDone(sp, t + 1)) t++; return t; }

