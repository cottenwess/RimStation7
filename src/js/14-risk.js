/* ================= risk ================= */
const MITIGATE = {
  none:{label:'Skip', costM:1, workM:1, riskM:1.6, breachM:1.3, desc:'No extra precautions. Faster and cheaper, and a lot more likely to go wrong.'},
  std:{label:'Standard', costM:1.25, workM:1.2, riskM:1, breachM:1, desc:'Restraint frame, a second spotter, double-gloved transfers.'},
  full:{label:'Full', costM:1.6, workM:1.5, riskM:0.45, breachM:0.6, desc:'Remote handling arms, a sealed transfer box, and a medic on standby.'}
};
const RISK_BASE = {sample:.3, stimulus:.42, challenge:.5, revive:.45, assay:.28};
const riskBase = id => RISK_BASE[id] || .3;
const mitOf = o => MITIGATE[(o && o.mit) || 'std'] || MITIGATE.std;
function studyCost(sp, id, o){ const c = STUDIES[id].cost(sp, o); return isTrigger(sp, id) ? Math.round(c * mitOf(o).costM) : c; }
function studyWork(sp, id, o){ const w = STUDIES[id].work(sp, o); return isTrigger(sp, id) ? Math.round(w * mitOf(o).workM) : w; }
function riskFactors(sp, id){
  const f = [], L = labOf(sp) || S.labs[0];
  if(!valid(sp, 'assay')) f.push(['Hazards not yet assayed', 1.15]);
  else if(sp.truth.lethal) f.push(['Lethal to people', 1.35]);
  else if(sp.truth.hazard === 'none') f.push(['No toxins or pathogens found', 0.7]);
  if(ANIMAL(sp) && valid(sp, 'obs')){ if(sp.find.obs.stance === 'danger') f.push(['Aggressive', 1.3]); else if(/Docile/.test(sp.find.obs.text)) f.push(['Docile', 0.8]); }
  if(ANIMAL(sp) && !valid(sp, 'obs')) f.push(['Behavior unknown', 1.1]);
  if(valid(sp, 'habitat') && sp.truth.sensitive && !L.envMatched) f.push(['Habitat not matched, specimen stressed', 1.2]);
  if(claimFor(sp, 'containment') && L.bsl < sp.truth.bsl) f.push([`${L.name} is below the BSL it needs`, 1.3]);
  if(L.fault) f.push([`${L.name} has an equipment fault`, 1.3]);
  if(L.integrity < 50) f.push([`${L.name} integrity is low`, 1.2]);
  if(S.lead === 'vasko') f.push(['Vasko cuts corners', 1.25]);
  else if(S.lead === 'okafor') f.push(['Okafor runs a careful room', 0.85]);
  /* Who is actually in the room. Named so the player can see why the estimate moved. */
  const w = {kind:'study', type:id, sp:sp.id}, mode = studyMode(sp, id), crew = projectCrew(w, mode);
  const cf = crewFactors(crew, mode, id);
  if(crew.length){
    const key = MODE_STAT[mode] || 'bench';
    const avg = crew.reduce((n, a) => n + statOf(a, key), 0) / crew.length;
    if(avg >= 3) f.push([`${crew.length > 1 ? 'Crew is' : crew[0].name + ' is'} practised at this`, 0.8]);
    else if(avg <= 1) f.push([`${crew.length > 1 ? 'Crew is' : crew[0].name + ' is'} inexperienced at this`, 1.25]);
    for(const a of crew) for(const t of traitsOf(a)) if(t.risk && t.risk !== 1) f.push([`${a.name}: ${t.label.toLowerCase()}`, t.risk]);
  }
  const miss = missingExpert(id);
  if(miss) f.push([`No ${ROLES[miss].label.toLowerCase()} on station`, 1.15]);
  return f;
}
function riskEst(sp, id, o){ return clamp(riskBase(id) * riskFactors(sp, id).reduce((a, x) => a * x[1], 1) * mitOf(o).riskM, 0.02, 0.95); }
function riskTrue(sp, id, o){
  const t = sp.truth, L = labOf(sp) || S.labs[0];
  let m = t.lethal ? 1.35 : t.hazard === 'none' ? 0.7 : 1;
  if(ANIMAL(sp)) m *= t.agg > .6 ? 1.3 : t.agg < .38 ? 0.8 : 1;
  m *= 0.8 + sp.stress * 0.4;
  if(L.bsl < t.bsl) m *= 1.3;
  if(L.fault) m *= 1.3;
  if(L.integrity < 50) m *= 1.2;
  m *= S.lead === 'vasko' ? 1.25 : S.lead === 'okafor' ? 0.85 : 1;
  /* The crew that is really on it, not the projection the planner showed. */
  const it = itemFor(sp, id), mode = studyMode(sp, id);
  const crew = it && it.state === 'running' ? crewOf(it) : projectCrew({kind:'study', type:id, sp:sp.id}, mode);
  m *= crewFactors(crew, mode, id).risk;
  if(missingExpert(id)) m *= 1.15;
  return clamp(riskBase(id) * m * mitOf(o).riskM, 0.02, 0.95);
}
function riskLabel(p){ return p < 0.15 ? {name:'Low', cls:'low', n:1} : p < 0.3 ? {name:'Moderate', cls:'mod', n:2} : p < 0.48 ? {name:'High', cls:'high', n:3} : {name:'Severe', cls:'sev', n:4}; }
