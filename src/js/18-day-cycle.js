/* ================= day cycle ================= */
// One stop per day: at the end of the shift the night passes on its own, and the planner opens at 08:00 with yesterday's results.
function endOfDay(){
  S.yesterday = {day:dayOf(S.t) + 1, done:S.dayDone.slice(), funds:Math.round(S.funds), net:Math.round(S.funds - S.fundsDay),
    notes:S.notes.filter(n => n.t > S.dayStartT && (n.kind === 'warning' || n.kind === 'anomaly')).map(n => ({who:n.who, text:n.text})),
    deaths:S.deaths - S.deathsDay, injuries:S.injuries - S.injDay};
  if(!S.specs.some(s => s.alive)){ nightSkip(); return; }
  if(S.speed) S.lastSpeed = S.speed;
  S.phase = 'evening'; S.ui.evening = true; S.ui.planner = false; S.speed = 0; S.dirty = true;
  checkWalkouts(); reportFriction(); dynamicsBriefing(); meridianTick();
  requestAutosave();
}
// Missions, maintenance and expansion are evening decisions once research is underway.
const canDecide = () => S.phase !== 'shift' || !S.specs.some(s => s.alive);
const decideWhy = () => canDecide() ? '' : 'Decided at the end of the shift.';
function closeDay(){ S.ui.evening = false; S.ui.planner = false; nightSkip(); }
function nightSkip(){
  let guard = 0;
  while(!S.over && hourOf(S.t) !== WORK_START && guard++ < 30) tick();
  if(S.over) return;
  S.dayStartT = S.t; S.fundsDay = S.funds; S.dayDone = []; S.deathsDay = S.deaths; S.injDay = S.injuries;
  staffDayTick(); budgetDayTick(); dynamicsDayTick(); refreshCandidates();
  if(S.specs.some(s => s.alive)){ if(S.speed) S.lastSpeed = S.speed; S.speed = 0; S.phase = 'morning'; }
  else S.phase = 'shift';
  requestAutosave();
  S.dirty = true;
}
function startDay(){ S.ui.planner = false; S.phase = 'shift'; S.speed = S.lastSpeed || 1; S.dirty = true; }
function researchTier(sp){
  if(!sp.alive) return 0;
  const t = sp.grantTier + 1; if(t > 3) return 0;
  if(topTier(sp) > sp.grantTier) return t;
  return STUDY_ORDER.some(id => STUDIES[id].tier === t && STUDIES[id].applies(sp) && !valid(sp, id) && (STUDIES[id].avail(sp) || itemFor(sp, id))) ? t : 0;
}
function refreshDeadline(){
  const tiers = S.specs.map(researchTier).filter(Boolean);
  if(!tiers.length){ if(S.deadline){ S.deadline = null; S.dirty = true; } return; }
  const tier = Math.min(...tiers);
  if(!S.deadline){ S.deadline = {t:(dayOf(S.t) + 10) * 24 + 20, tier}; S.dirty = true; }
  else S.deadline.tier = tier;
}
function checkDeadline(){
  refreshDeadline();
  const D = S.deadline; if(!D || S.t < D.t) return;
  standing(-8);
  say('pruitt', 'uneasy', `We missed Meridian's deadline for a Tier ${D.tier} paper. They've marked us down, and that comes out of the next renewal. They gave us one more week.`, {kind:'warning'});
  D.t += 7 * 24;
}

function incidentRoll(sp, e){
  const name = STUDIES[e.type].name(sp).toLowerCase();
  if(rnd() >= riskTrue(sp, e.type, e.opts)) return;
  const L = labOf(sp) || S.labs[0];
  const adequate = L.bsl >= sp.truth.bsl;
  let pb = adequate ? 0.12 : 0.7;
  pb *= (S.lead ? LEADS[S.lead].risk : 1) * (L.fault ? 1.8 : 1) * (L.integrity < 50 ? 1.5 : 1) * (0.7 + sp.stress * 0.6);
  if(e.type === 'stimulus' && e.opts.remote) pb *= 0.8;
  pb *= mitOf(e.opts).breachM;
  pb = clamp(pb, 0.03, 0.95);
  if(e.mode === 'bench' && !ANIMAL(sp)) pb *= adequate ? 0.6 : 0.9;
  if(rnd() < pb){ startBreach(sp, `during the ${name}`); return; }
  L.integrity = Math.max(0, L.integrity - 6);
  const inCell = actors().filter(a => a.job === e.id && a.kind === 'tech' && a.alive);
  let txt = `Something went wrong during the ${name}, and containment held.${e.opts.mit === 'none' ? ' We skipped the precautions on this one.' : ''}`;
  if(inCell.length && rnd() < (e.type === 'stimulus' && e.opts.remote ? 0.1 : 0.35) * (e.opts.mit === 'full' ? 0.4 : e.opts.mit === 'none' ? 1.4 : 1)){
    /* Nerve is who gets caught and how badly it goes for them. */
    const v = inCell.slice().sort((x, y) => statOf(x, 'nerve') - statOf(y, 'nerve'))[rnd() < 0.7 ? 0 : inCell.length - 1];
    const steady = statOf(v, 'nerve');
    if(sp.truth.lethal && rnd() < clamp(0.3 * (1.3 - steady * 0.2), 0.08, 0.45)){
      killTech(v, `${sp.truth.hazard === 'pathogen' ? 'infection' : 'exposure'} during the ${name}`);
      txt += ` We lost ${v.name}.`;
      inCell.filter(a => a !== v).forEach(a => scar(a, `watching ${v.name} go`));
    }
    else { v.injured = true; v.morale = clamp(v.morale - 12, 0, 100); S.injuries++; txt += ` ${v.name} was hurt and is out of rotation.${steady >= 3 ? ' Kept their head doing it, which is why it was not worse.' : ''}`; }
  }
  say('bea', 'uneasy', txt, {kind:'warning'});
}
