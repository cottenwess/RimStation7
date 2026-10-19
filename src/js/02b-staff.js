/* ================= staff: roster, growth, morale, crewing ================= */
/* Sorts between 02-leads-techs (the tables) and 03-planets. Everything here
   operates on records held in S.techs, so it all saves without special cases. */
/* The roster opens general and narrows as the station grows. Lab techs,
   xenobiologists and zoologists can be hired from day one; every other
   discipline is unlocked by the lab that needs it, or by finding something that
   needs that kind of mind. `covers` is the work a role is the expert for: with
   the expert on the crew it goes faster and cleaner, and with nobody on station
   qualified it comes back unreliable more often. `gates` is work that simply is
   not on the table without them. */
const ROLES = {
  tech:{label:'Lab tech', tag:'Tech', general:true, hire:18, upkeep:0, strong:null, covers:[],
        blurb:'Runs the cells and the bench. Two are needed for anything hands-on, and they are who you lose first.'},
  xenobio:{label:'Xenobiologist', tag:'Xenobio', general:true, hire:34, upkeep:0.7, strong:'bench', covers:['sample', 'assay', 'biochem', 'extract'],
           blurb:'Tissue, toxins and what alien life is built from. The backbone of a dossier.'},
  zoologist:{label:'Zoologist', tag:'Zoology', general:true, hire:32, upkeep:0.7, strong:'observe', covers:['obs', 'habitat', 'clearance', 'stimulus'],
             blurb:'Reads animals through the glass. Scores behavior properly and knows when a specimen is about to go for someone.'},
  micro:{label:'Microbiologist', tag:'Micro', lab:'micro', hire:46, upkeep:0.8, strong:'bench', covers:['spread', 'revive', 'screen', 'vaccine'],
         blurb:'Cultures, pathogenicity and vaccine work. Microbe findings without one are guesses with a number attached.'},
  geneticist:{label:'Geneticist', tag:'Genetics', lab:'genetics', hire:50, upkeep:0.8, strong:'bench', covers:['genome', 'clone', 'crop'], gates:['hybrid'],
              blurb:'Sequencing, cloning lines and hybridization. Nobody else on station can run a hybridization at all.'},
  chemist:{label:'Chemist', tag:'Chem', lab:'chem', hire:46, upkeep:0.8, strong:'bench', covers:['synth', 'deriv'],
           blurb:'Synthesis routes and derivative searches. Turns a compound into something Meridian pays more for.'},
  physicist:{label:'Physicist', tag:'Physics', lab:'physics', hire:52, upkeep:0.9, strong:'bench', covers:['spectro', 'stress', 'battery', 'shield', 'horizon'],
             blurb:'Materials under load, bio-batteries and the horizon. The only one who knows what the exotic matter readings mean.'},
  engineer:{label:'Containment engineer', tag:'Engineer', lab:'containment2', hire:45, upkeep:0.8, strong:'handling', covers:['challenge'],
            blurb:'Seals, glazing and remote handling. Slows integrity loss across every built lab and finds faults before Calderon does.'},
  speech:{label:'Speech researcher', tag:'Speech', when:() => S.specs.some(s => s.flags.has('vocal')), hire:55, upkeep:0.9, strong:'observe', covers:['acoustic'], gates:['language'],
          blurb:'Finds structure in what a specimen says. Signal decoding is closed without one, and Meridian considers the post expendable.'},
  anthro:{label:'Xenoanthropologist', tag:'Anthro', when:() => S.specs.some(s => s.flags.has('ruins') || s.flags.has('tools') || s.truth.sapience >= 3) || S.planets.some(p => p.missions > 0 && p.ruins), hire:60, upkeep:1.0, strong:'observe', covers:['age', 'language'],
          blurb:'Ruins, tools and the question of personhood. The only person here qualified to put a sapience finding in front of Meridian.'}
};
const ROLE_KEYS = Object.keys(ROLES);
const SPECIALIST_KEYS = ROLE_KEYS.filter(k => k !== 'tech');
/* Containment engineers come with the second cell, where handling rigs start to matter. */
const labBuilt = t => S.labs.some(L => L.built && L.type === t);
/* A discipline opens as soon as its lab is RESEARCH-unlocked, not once the lab
   stands. It has to be this way round: building a lab needs its head hired, so
   gating the hire on the finished building would deadlock the pair and strand
   every specialty lab for the rest of the run. You hire the geneticist, then
   they build you the Genetics Lab. */
const labOpenFor = t => S.labs.some(L => L.type === t && (L.built || L.building || labUnlocked(L.k)));
function roleOpen(key){
  const R = ROLES[key];
  if(!R) return false;
  if(R.general) return true;
  if(R.lab === 'containment2') return S.labs.filter(L => L.built && L.type === 'containment').length >= 2 || (labBuilt('containment') && S.labs.some(L => L.type === 'containment' && !L.built && labUnlocked(L.k)));
  if(R.lab) return labOpenFor(R.lab);
  return R.when ? !!R.when() : true;
}
const openRoles = () => ROLE_KEYS.filter(roleOpen);
/* Who, if anyone, is the expert for a piece of work. */
function expertRole(id){ return ROLE_KEYS.find(k => (ROLES[k].covers || []).includes(id)) || null; }
function gateRole(id){ return ROLE_KEYS.find(k => (ROLES[k].gates || []).includes(id)) || null; }
/* Work that needs a discipline nobody on station has. Returns the role, or null. */
function gatedBy(id){ const k = gateRole(id); return k && !hasSpecialist(k) ? k : null; }
function expertOnStation(id){ const k = expertRole(id); return k && hasSpecialist(k) ? k : null; }
function missingExpert(id){ const k = expertRole(id); return k && k !== 'tech' && !hasSpecialist(k) ? k : null; }

let staffSeq = 0;
function makeStaff(role, opts = {}){
  const R = ROLES[role] || ROLES.tech;
  const taken = new Set([...S.usedNames, ...(S.candidates || []).map(c => c.name)]);
  const name = opts.name || TECH_NAMES.find(n => !taken.has(n)) || (R.tag + ' ' + (S.techs.length + 1 + taken.size));
  if(opts.reserve !== false) S.usedNames.add(name);
  const {stats, cap} = rollStats(role);
  const home = HUB_SPOTS[S.techs.length % HUB_SPOTS.length];
  const lk = pick(TECH_LOOKS);
  return {
    id:'p' + (++staffSeq), kind:'tech', role, name, alive:true, injured:false, away:false,
    stats, cap, xp:{handling:0, bench:0, observe:0, nerve:0}, traits:rollTraits(role), morale:62 + Math.floor(rnd() * 16),
    hours:0, since:S ? S.t : 0, grumbled:0,
    u:home[0], v:home[1], path:[], wait:0, inLab:false, labK:0, task:'idle', flash:0,
    look:{skin:lk.skin, hair:lk.hair, coat:R.coat, accent:R.accent}, home, spot:0
  };
}
/* ---- lab heads ----
   Every lab is run by someone qualified. Containment cells are a xenobiology
   post; each specialty lab is headed by its own discipline. A built lab with
   nobody at its head still runs, but slowly and with data you cannot bank. */
const LAB_HEAD_ROLE = {containment:'xenobio', micro:'micro', genetics:'geneticist', chem:'chemist', physics:'physicist'};
const headRoleFor = L => LAB_HEAD_ROLE[L.type] || 'xenobio';
const headOf = L => L && L.head ? byId(L.head) : null;
const headIsFit = a => !!(a && a.alive && !a.away);
const labHeaded = L => headIsFit(headOf(L));
const labOfHead = a => S.labs.find(L => L.built && L.head === a.id) || null;
/* Qualified people not already running a lab. */
function freeHeads(role){
  return S.techs.filter(a => a.alive && !a.away && a.role === role && !S.labs.some(L => L.built && L.head === a.id));
}
function assignHead(L){
  if(labHeaded(L)) return headOf(L);
  const a = freeHeads(headRoleFor(L))[0];
  if(!a) { L.head = null; return null; }
  L.head = a.id;
  return a;
}
/* Called whenever the roster or the labs change under us. */
function reseatHeads(){
  for(const L of S.labs){
    if(!L.built){ L.head = null; continue; }
    if(!headIsFit(headOf(L))) L.head = null;
  }
  for(const L of S.labs) if(L.built && !L.head) assignHead(L);
}
const specialists = () => S.techs.filter(a => a.alive && a.role !== 'tech');
const specialistOn = role => S.techs.find(a => a.alive && !a.away && !a.injured && a.role === role) || null;
const hasSpecialist = role => !!specialistOn(role);

/* ---- growth ---- */
const statFromXp = (a, key) => { let n = 0; while(n < STAT_MAX && a.xp[key] >= XP_STEPS[n + 1]) n++; return Math.min(n, a.cap[key]); };
function awardXp(a, key, hours){
  if(!a || !a.alive || !key) return;
  a.xp[key] = (a.xp[key] || 0) + hours * traitMult(a, 'xp');
  a.hours = (a.hours || 0) + hours;
  const was = a.stats[key] || 0, now = Math.max(was, statFromXp(a, key));
  if(now > was){
    a.stats[key] = now;
    log('bea', 'note', `${a.name} is rated ${now} of ${STAT_MAX} on ${STATS[key].label.toLowerCase()} now. The hours show.`);
    if(now >= 3 && was < 3) notify('bea', `${a.name} has got good at ${STATS[key].label.toLowerCase()}. Worth putting on the work that needs it.`, 'note');
  }
}
/* Surviving a breach marks people. Nerve is the one stat that can fall. */
function scar(a, why){
  if(!a || !a.alive || traitFlag(a, 'nerve')) return;
  if(a.stats.nerve <= 0) return;
  a.stats.nerve--; a.xp.nerve = XP_STEPS[a.stats.nerve] || 0;
  a.morale = clamp(a.morale - 18, 0, 100);
  log('bea', 'warning', `${a.name} came out of ${why} shaken. Their nerve is not what it was.`);
}

/* ---- morale and friction with the lead ---- */
function staffDayTick(){
  for(const a of S.techs){
    if(!a.alive) continue;
    const aff = affinity(a);
    let d = aff * 6 - 1;
    if(a.injured) d -= 4;
    if(S.hazardPay) d += 2;
    if(S.slowdown) d += 1;
    if(traitFlag(a, 'proud') && !a.workedRecently) d -= 3;
    a.workedRecently = false;
    a.morale = clamp(a.morale + d, 0, 100);
  }
}
/* Bea raises it once per person, when it is bad enough to act on. */
function reportFriction(){
  if(!S.lead || S.breach) return;
  const sore = S.techs.filter(a => a.alive && !a.away && a.morale < 28 && affinity(a) < 0 && !a.grumbled);
  if(!sore.length) return;
  const a = pick(sore); a.grumbled = 1;
  const t = traitsOf(a).find(x => x.clashes === S.lead);
  say('bea', 'uneasy', `${a.name} wants off ${PEOPLE[S.lead].name}'s rotation. ${t ? t.bad + '.' : 'They are not getting on.'} I can move them to bench work only, or you can leave it and risk losing them.`, {kind:'warning', choices:[
    {label:'Keep them off hands-on work', act:() => { a.benchOnly = true; a.morale = clamp(a.morale + 22, 0, 100); log('bea', 'admin', `${a.name} moved to bench and observation work only.`); }},
    {label:'They work where they are needed', act:() => { a.morale = clamp(a.morale - 10, 0, 100); log('bea', 'admin', `${a.name} kept on full rotation over their objection.`); }}
  ]});
}
function staffQuit(a){
  a.alive = false; a.quit = true;
  reseatHeads();
  say('bea', 'numb', `${a.name} took the shuttle. Their words were that they would rather be unemployed than work another breach under ${S.lead ? PEOPLE[S.lead].name : 'this administration'}.`, {kind:'warning'});
  launchShuttle();
  S.dirty = true;
}
function checkWalkouts(){
  for(const a of S.techs.filter(x => x.alive && !x.away && x.morale <= 0)) staffQuit(a);
}

/* ---- crewing ----
   Auto-assign picks the best available person for the discipline the work needs,
   so a hands-off player gets sensible crews; a named crew on the item always wins. */
/* ignoreBusy is what keeps the planner still: an estimate asks who could do this
   work at all, not who happens to be free this second, so a queued block's hours
   stop drifting every time another item picks up a crew. */
function eligible(a, mode, ignoreBusy){
  if(!a.alive || a.away || a.injured) return false;
  if(!ignoreBusy && a.job) return false;
  if(refuses(a, mode)) return false;
  if(a.benchOnly && mode === 'handle') return false;
  return true;
}
function crewScore(a, mode, id){
  const key = MODE_STAT[mode] || 'bench';
  let s = statOf(a, key) * 10 + statOf(a, 'nerve') * 2 + a.morale / 50;
  /* Having the right discipline outranks raw pips, so the geneticist gets the
     genome work without being told and a hire stays legible. Skill is the
     tiebreaker among equals, and specialists are kept off work that is not
     theirs so they are free when it is. */
  if(id && (ROLES[a.role].covers || []).includes(id)) s += 100;
  else if(a.role !== 'tech') s -= 4;
  return s;
}
function pickCrew(mode, need, o = {}){
  const pool = S.techs.filter(a => eligible(a, mode, o.ignoreBusy) && !(o.exclude || []).includes(a.id));
  return pool.sort((x, y) => crewScore(y, mode, o.id) - crewScore(x, mode, o.id)).slice(0, need);
}
const crewNeed = mode => mode === 'handle' ? 2 : 1;
const crewOf = it => (it.crewIds || []).map(byId).filter(a => a && a.alive);
/* Who would take this work. A crew the player named always wins. */
function projectCrew(w, mode){
  const m = mode || w.mode || wMode(w);
  const named = crewOf(w);
  if(named.length) return named;
  return pickCrew(m, crewNeed(m), {ignoreBusy:true, id:w.type});
}
/* How a crew bends the work: 0 pips is slow and sloppy, 4 is fast and clean.
   On top of raw skill, having the right discipline on the job matters, and
   having nobody on station who understands the work matters more. */
function crewFactors(crew, mode, id){
  const key = MODE_STAT[mode] || 'bench';
  let work = 1, risk = 1, quality = 1, nerve = 0;
  if(crew.length){
    const avg = crew.reduce((n, a) => n + statOf(a, key), 0) / crew.length;
    nerve = crew.reduce((n, a) => n + statOf(a, 'nerve'), 0) / crew.length;
    for(const a of crew){ work *= traitMult(a, 'work'); risk *= traitMult(a, 'risk'); quality *= traitMult(a, 'quality'); }
    work *= 1.18 - avg * 0.09;
    risk *= 1.3 - avg * 0.12;
    quality *= 1.5 - avg * 0.22;
    if(id && crew.some(a => (ROLES[a.role].covers || []).includes(id))){ work *= 0.85; quality *= 0.5; risk *= 0.85; }
  }
  if(id && missingExpert(id)) quality *= 1.55;
  return {work:clamp(work, 0.55, 1.6), risk:clamp(risk, 0.45, 1.8), quality:clamp(quality, 0.2, 2.4), nerve};
}
function workCrewFactors(w, mode){
  const m = mode || w.mode || wMode(w);
  return crewFactors(projectCrew(w, m), m, w.type);
}

/* What Pruitt adds after the paperwork, which is where he lives. */
const HIRE_NOTE = {
  tech:'They asked what the hazard pay arrangement is. I said I would look into it.',
  xenobio:'Meridian attached a note calling the posting "an unrivalled opportunity". I have not forwarded it.',
  zoologist:'They asked whether the specimens have names. I said the director names them. They seemed pleased, which surprised me.',
  micro:'They have asked for their own autoclave and a door that locks from inside. Both reasonable, apparently.',
  geneticist:'They read the hybridization policy on the shuttle and had questions. Meridian does not have a hybridization policy.',
  chemist:'They want the extraction logs going back to the first specimen. All of them. Tonight.',
  physicist:'They spent the approach staring out of the port at the horizon and did not unpack. I think that is enthusiasm.',
  engineer:'First thing they did was put a hand on Lab A and say "hm". I have not slept properly since.',
  speech:'They asked what happens if the answer is yes. I did not have an answer prepared.',
  anthro:'They asked to see the ruins survey before they saw their quarters.'
};
/* ---- hiring ----
   Meridian keeps a short list in front of you, weighted to the posts the station
   does not have filled. Candidates expire when their post closes. */
const HIRE_EVERY = 48, CANDIDATES = 3;
function refreshCandidates(){
  S.candidates = (S.candidates || []).filter(c => roleOpen(c.role));
  if(S.t < (S.nextCandidate || 0) && S.candidates.length >= CANDIDATES) return;
  S.nextCandidate = S.t + HIRE_EVERY;
  const roles = openRoles();
  const want = roles.filter(k => k !== 'tech' && !hasSpecialist(k));
  let guard = 0;
  while(S.candidates.length < CANDIDATES && guard++ < 12){
    const role = want.length && rnd() < 0.7 ? pick(want) : pick(roles);
    if(S.candidates.some(c => c.role === role) && guard < 8) continue;
    S.candidates.push(makeStaff(role, {reserve:false}));
  }
}
function hireBlock(c){
  if(!c) return 'Nobody by that name.';
  if(S.breach) return 'Deal with the breach first.';
  if(!canDecide()) return 'Hiring is approved at the end of the shift.';
  if(!roleOpen(c.role)) return 'That post is not open yet.';
  return '';
}
function hireStaff(id){
  const i = (S.candidates || []).findIndex(c => c.id === id);
  if(i < 0) return;
  const c = S.candidates[i], why = hireBlock(c);
  if(why){ notify('pruitt', why, 'admin'); return; }
  const R = ROLES[c.role];
  S.funds -= R.hire;
  S.candidates.splice(i, 1);
  S.usedNames.add(c.name);
  c.since = S.t;
  maybePlant(c);
  c.home = HUB_SPOTS[S.techs.length % HUB_SPOTS.length];
  c.u = LANDING[0]; c.v = LANDING[1]; c.path = [{u:c.home[0], v:c.home[1]}];
  S.techs.push(c);
  reseatHeads();
  launchShuttle();
  log('pruitt', 'admin', `${c.name} hired as ${R.label.toLowerCase()}: ${R.hire} cr${R.upkeep ? `, ${R.upkeep} cr/day` : ''}.`);
  notify('pruitt', `${c.name} is on the next shuttle. ${R.label}.${R.upkeep ? ` Salary runs ${R.upkeep} cr a day from now on.` : ''}${HIRE_NOTE[c.role] ? ' ' + HIRE_NOTE[c.role] : ''}`);
  S.dirty = true;
}
