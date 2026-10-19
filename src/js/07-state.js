/* ================= state ================= */
let S = null;
const C = {u:8, v:2};
const ARRIVAL_GRANT = 45, GRANT_START = 1400, BRIDGE = 180, BRIDGE_PAYBACK = 90;
const GRANT_RENEW = {1:140, 2:110, 3:90};
const LAB_DEFS = [
  {type:'containment', name:'Lab A', row:'E', j:0, cost:0, time:0},
  {type:'containment', name:'Lab B', row:'E', j:1, cost:70, time:24},
  {type:'physics', name:'Physics Lab', row:'E', j:2, cost:140, time:36},
  {type:'micro', name:'Micro Lab', row:'S', j:0, cost:80, time:24},
  {type:'genetics', name:'Genetics Lab', row:'S', j:1, cost:110, time:36},
  {type:'chem', name:'Chem Lab', row:'S', j:2, cost:120, time:36}
];
const LAB_COST = LAB_DEFS.map(d => d.cost), LAB_TIME = LAB_DEFS.map(d => d.time);
/* Bench work a built lab can host as well as the hub. The hub has one bench, so
   without this every bench study in the station queues behind the last one; a lab
   with the right equipment is parallel capacity and a reason to build it. */
const LAB_BENCH = {
  genetics:['genome', 'biochem'],
  chem:['extract'],
  micro:['assay'],
  physics:[],
  containment:[]
};
const LAB_TYPES = {
  containment:{label:'Containment', holds:['fauna', 'floater', 'flora'], blurb:'Holds one creature or plant in a sealed tank.'},
  micro:{label:'Microbiology', holds:['microbe'], blurb:'Cultures bacteria, viruses and archaea, kept away from the animals. Also screens compounds from the other labs.'},
  genetics:{label:'Genetics', holds:['fossil'], blurb:'Works fossils, clones viable genomes, breeds hybrids and crop strains.'},
  chem:{label:'Chemistry', holds:[], blurb:'Synthesizes and refines compounds extracted from specimens.'},
  physics:{label:'Physics', holds:[], blurb:'Tests materials the recovery teams bring back, and watches the black hole.'}
};
function mkLab(k, built){ const d = LAB_DEFS[k]; return {k, type:d.type, name:d.name, row:d.row, j:d.j, built, building:null, destroyed:false, bsl:2, integrity:92, envMatched:false, fault:false, haltUntil:0, specId:null, head:null}; }
function newRun(){
  G = {g:0, runs:0};
  const seed = Math.floor(rnd() * 900000) + 100000;
  /* The survey seed drives the gameplay stream too, so quoting a seed reproduces
     the whole run and not just its planets. */
  seedRng(seed);
  specSeq = 0; itemSeq = 0; cmpSeq = 0; matSeq = 0; staffSeq = 0;
  S = {
    seed, t:8, speed:1, kindsSeen:new Set(), items:[], ot:{}, otCount:0, yesterday:null, lastSpeed:1, phase:'shift', dayStartT:8, fundsDay:GRANT_START, dayDone:[], deathsDay:0, injDay:0, deadline:null, funds:GRANT_START, granted:GRANT_START, standing:60,
    labs:LAB_DEFS.map((d, k) => mkLab(k, k === 0)), compounds:[], materials:[], hybrids:0,
    planets:[], specs:[], exp:null, mission:null, flight:null, firstMission:true,
    lead:null, notes:[], deaths:0, injuries:0, downstream:0, reports:[], pending:[], labIdx:0,
    hazardPay:false, slowdown:false, hazardAsked:false, reportsMuted:false, nearMiss:0, deconSkips:0, whitcombDeals:0,
    breach:null, over:false, warnedLow:false, overDays:0, overRun:0, overPeak:0, nextBulletin:120, saidBulletins:[],
    nextInspect:1e9, inspectWarned:false, skipsSince:0, enforced:false, lastSurprise:-99, inspector:null,
    techs:[], nextTech:0, usedNames:new Set(), candidates:[], nextCandidate:0, bonds:{}, dirty:true, sapientChoice:null,
    tut:{on:true, step:0},
    ui:{tab:'planets', spec:null, sel:'obs', mit:'std', reps:2, control:false, washout:0, remote:false, planet:0, planetPicked:false}
  };
  S.planets = genPlanets(seed);
  for(const k in LEADS){
    const L = LEADS[k]; L.pulls = 0; L.quit = false;
    const home = k === 'vasko' ? [1.4, 1.25] : [2.7, 1.3];
    L.actor = {kind:'lead', id:k, name:PEOPLE[k].name, u:home[0], v:home[1], path:[], wait:0, inLab:false, labK:0, task:'idle', flash:0, alive:true,
      look:{skin:PEOPLE[k].skin, hair:PEOPLE[k].hair, coat:'#eeeaf4', accent:PEOPLE[k].accent, puff:k === 'okafor'}, home, spot:0};
  }
  ['tech', 'tech', 'tech', 'xenobio', 'zoologist'].forEach(r => addTech(false, r));
  reseatHeads();
  refreshCandidates();
  C.u = 8; C.v = 2;
  shuttle.active = false; shuttle.p = 0; shuttle.leg = 0; shuttle.job = null; shuttle.queue = [];
  Q.length = 0; cur = null; $('#dlg').hidden = true;
  $('#end').hidden = true; $('#pub').hidden = true; $('#breach').hidden = true; $('#toast').hidden = true;
  cam.px = 0; cam.py = 0; cam.zoom = 0; camFit();
  intro();
  renderAll();
}
function addTech(arrive, role){
  const a = makeStaff(role || 'tech');
  if(arrive){ a.u = LANDING[0]; a.v = LANDING[1]; a.path = [{u:a.home[0], v:a.home[1]}]; }
  S.techs.push(a);
  return a;
}
const aliveTechs = () => S.techs.filter(a => a.alive);
const onStation = () => S.techs.filter(a => a.alive && !a.away);
function actors(){ const list = onStation(); if(S.lead && !LEADS[S.lead].quit) list.push(LEADS[S.lead].actor); return list; }
function crew(){ const list = onStation().filter(a => !a.injured).slice(0, 2); if(S.lead) list.push(LEADS[S.lead].actor); return list; }
const labSpec = L => L && L.specId ? (S.specs.find(s => s.id === L.specId && s.alive) || null) : null;
const holdsKind = (L, kind) => LAB_TYPES[L.type].holds.includes(kind);
const labTypeFor = kind => kind === 'microbe' ? 'micro' : kind === 'fossil' ? 'genetics' : 'containment';
const labOfType = t => S.labs.find(L => L.type === t && L.built) || null;
const openLabs = kind => S.labs.filter(L => L.built && LAB_TYPES[L.type].holds.length && !labSpec(L) && (!kind || holdsKind(L, kind)));
const toG = (row, u, v) => row === 'E' ? {u, v} : {u:v, v:u};
const labNode = (L, u, v, extra) => Object.assign(toG(L.row, u + STRIDE * L.j, v), extra || {});
const rowLabs = row => S.labs.filter(L => L.row === row).sort((a, b) => a.j - b.j);
const rowActive = row => { let n = 0; rowLabs(row).forEach(L => { if(L.built || L.building || L.destroyed) n = Math.max(n, L.j + 1); }); return n; };
const hubExit = row => [toG(row, 3.9, 2.0), toG(row, 4.4, 2.0)];
const localU = (L, a) => (L.row === 'E' ? a.u : a.v) - STRIDE * L.j;
const labOf = sp => sp && sp.lab !== null && sp.lab !== undefined ? S.labs[sp.lab] : null;
const selSpec = () => S.specs.find(s => s.id === S.ui.spec && s.alive) || S.specs.find(s => s.alive) || null;
const specById = id => S.specs.find(s => s.id === id);
function placeSpecimen(sp){
  const L = openLabs(sp.kind)[0];
  if(!L){ sp.loc = 'hold'; sp.lab = null; return null; }
  sp.lab = L.k; sp.loc = 'lab'; L.specId = sp.id; L.envMatched = false;
  return L;
}
const anyTier = t => S.specs.some(s => s.grantTier >= t);
function labUnlocked(k){
  const t = S.labs[k].type;
  if(k === 0) return true;
  if(t === 'containment' || t === 'micro') return anyTier(1);
  if(t === 'genetics') return anyTier(1);
  if(t === 'chem') return S.compounds.length > 0 || anyTier(2);
  if(t === 'physics') return S.materials.length > 0 && anyTier(1);
  return false;
}
function labUnlockText(k){
  return ({containment:'Unlocks when a paper renews the grant.', micro:'Unlocks when a paper renews the grant.', genetics:'Unlocks when a paper renews the grant.',
    chem:'Unlocks once you extract a compound from a specimen, or reach Tier 2.', physics:'Unlocks once a recovery team brings back materials and a paper renews the grant.'})[S.labs[k].type];
}
const chainPrev = L => rowLabs(L.row).find(P => P.j === L.j - 1) || null;
function buildBlock(k){
  const L = S.labs[k];
  if(L.built || L.building) return 'Already built.';
  const prev = chainPrev(L); if(prev && !prev.built && !prev.destroyed) return `Build ${prev.name} first.`;
  if(!canDecide()) return 'Construction is approved at the end of the shift.';
  if(!labUnlocked(k)) return labUnlockText(k);
  const role = headRoleFor(L);
  if(!freeHeads(role).length) return `No ${ROLES[role].label.toLowerCase()} free to run it. Hire one in the Staff tab.`;
  if(S.breach) return 'Deal with the breach first.';
  return '';
}
function buildLab(k){
  if(buildBlock(k)) return;
  const L = S.labs[k];
  const over = budgetTag(LAB_COST[k]);
  S.funds -= LAB_COST[k]; L.building = {start:S.t, until:S.t + LAB_TIME[k]};
  log('pruitt', 'admin', `${L.destroyed ? 'Rebuilding' : 'Construction started on'} ${L.name}. ${LAB_COST[k]} cr, ${LAB_TIME[k]} h.${over ? ' Approved ' + over + '.' : ''}`);
  notify('pruitt', `${L.destroyed ? 'Rebuilding' : 'Building'} ${L.name}. It will be ready in ${LAB_TIME[k]} hours.`);
  camFit(); S.dirty = true;
}
function releaseSpec(sp, how){
  if(!sp || !sp.alive || itemsOf(sp).some(x => x.state === 'running') || (S.breach && S.breach.sp === sp.id)) return;
  dropItemsFor(sp, 'when it left the station');
  const L = labOf(sp);
  if(how === 'ship'){ if(!sp.paper) return; S.funds += 25; log('pruitt', 'admin', `${sp.name} shipped to the Meridian archive: +25 cr.`); }
  else {
    if(sp.person === 'recognized') return;
    if(ANIMAL(sp)) standing(-2); log('ops', 'admin', `${sp.name} ${ANIMAL(sp) ? 'euthanized and preserved' : 'destroyed, samples kept'}.`);
    if(S.lead === 'okafor' && ANIMAL(sp)) notify('okafor', 'Logged. I hope the data was worth it.', 'note');
    if(sp.truth.sapience >= 3){ standing(-10); notify('okafor', `You killed a person, Director. ${sp.name} could talk.`, 'warning'); }
  }
  sp.alive = false; sp.released = how; if(L) L.specId = null; sp.lab = null; sp.loc = how;
  placeHeld();
  S.dirty = true;
}
function placeHeld(){ for(const s of S.specs) if(s.alive && s.loc === 'hold' && openLabs(s.kind).length) placeSpecimen(s); }

