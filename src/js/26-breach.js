/* ================= breach ================= */
function startBreach(sp, cause){
  const L = labOf(sp) || S.labs[0];
  S.breach = {stage:1, sp:sp.id, lab:L.k}; { const q = labNode(L, LAB_CU, 2); C.u = q.u; C.v = q.v; }
  dropItemsFor(sp, 'to the breach');
  const inLab = actors().filter(a => a.inLab && a.kind === 'tech');
  if(inLab.length && sp.truth.lethal && rnd() < (L.bsl >= sp.truth.bsl ? .3 : .5)) killTech(pick(inLab), 'containment breach');
  for(const a of actors()){ if(a.inLab || a.task === 'work'){ a.task = 'idle'; const k = a.labK; a.inLab = false; a.path = [labNode(S.labs[k], 6.4, 2.0)].concat(exitPath(k, a), [homeNode(a)]); } }
  say('ops', 'alarmed', `CONTAINMENT BREACH in ${L.name} ${cause}. ${ANIMAL(sp) ? `${sp.name} is out of its tank` : `${sp.name} has escaped as an aerosol`} and loose in the lab. Choose a failsafe.`, {kind:'warning'});
  S.dirty = true;
}
const FAILSAFES = [
  {id:'lock', name:'Lock down the lab', max:1, desc:'Seal the lab and flood it with sedative gas or sterilant.'},
  {id:'seal', name:'Seal the spoke', max:2, desc:'Blast doors between the labs and the hub. Anyone inside stays inside.'},
  {id:'vent', name:'Vent the lab to vacuum', max:2, desc:'Certain. Kills the specimen and anyone in the lab. The lab is out for a day.'},
  {id:'detach', name:'Detach the lab', max:3, desc:'Drop the whole lab into the black hole. You can rebuild it later.'},
  {id:'scuttle', name:'Scuttle the science vessel', max:4, desc:'The last failsafe. Drop the air-gapped vessel into the black hole and restart.'}
];
function breachLab(){ return S.breach ? S.labs[S.breach.lab] : S.labs[0]; }
function failOdds(id){
  const L = breachLab();
  if(id === 'lock') return clamp((L.bsl >= 3 ? .85 : .55) * (.5 + L.integrity / 200), .05, .95);
  if(id === 'seal') return L.bsl >= 3 ? .95 : .85;
  return 1;
}
function recontain(text){
  const sp = specById(S.breach.sp), L = breachLab();
  S.breach = null; { const q = labNode(L, LAB_CU, 2); C.u = q.u; C.v = q.v; }
  if(sp){ sedateSpec(sp); sp.stress = clamp(sp.stress + .3, .1, 1); }
  say('ops', 'neutral', text, {kind:'note'});
}
function doFailsafe(id){
  const b = S.breach; if(!b) return;
  const fs = FAILSAFES.find(f => f.id === id); if(b.stage > fs.max) return;
  const sp = specById(b.sp), L = breachLab();
  if(id === 'lock'){
    if(rnd() < failOdds('lock')){ L.integrity = Math.max(0, L.integrity - 12); L.haltUntil = S.t + 12; recontain(`${L.name} locked down. ${sp.name} is contained again. Integrity reduced. Lockdown lifts in 12 hours.`); }
    else escalate('The lockdown failed. The door seals did not hold.');
  } else if(id === 'seal'){
    if(rnd() < failOdds('seal')){
      if(rnd() < .4){ const v = onStation().find(a => !a.injured); if(v) killTech(v, 'sealed in the spoke during the breach'); }
      L.integrity = Math.max(0, L.integrity - 8); L.haltUntil = S.t + 24;
      recontain(`Spoke sealed. A retrieval team recovered ${sp.name}. ${L.name} is halted for 24 hours.`);
    } else escalate('The spoke doors jammed halfway.');
  } else if(id === 'vent'){
    if(rnd() < .5){ const v = onStation()[0]; if(v) killTech(v, 'venting of the lab'); }
    sp.alive = false; sp.loc = 'dead'; L.specId = null; S.breach = null; L.integrity = Math.max(0, L.integrity - 25); L.haltUntil = S.t + 24;
    say('ops', 'neutral', `${L.name} was vented. ${sp.name} is dead, and so is every study on it. The lab is out for 24 hours.`, {kind:'warning'});
  } else if(id === 'detach'){
    sp.alive = false; sp.loc = 'dead'; L.specId = null; L.built = false; L.destroyed = true; L.bsl = 2; L.envMatched = false; L.fault = false; S.breach = null;
    say('ops', 'neutral', `${L.name} has been detached. It is falling toward the black hole with ${sp.name} inside. You can rebuild it from the Station tab.`, {kind:'warning'});
    G.g++; saveG();
  } else if(id === 'scuttle') endRun('scuttle');
  S.dirty = true;
}
function escalate(reason){
  const b = S.breach; b.stage++;
  const sp = specById(b.sp);
  if(b.stage >= 3 && sp.truth.lethal && rnd() < .35){ const v = pick(onStation()); if(v) killTech(v, `${sp.name} reached the ${b.stage === 3 ? 'hub' : 'shuttle bay'}`); }
  if(b.stage > 4){ endRun('overrun'); return; }
  say('ops', 'alarmed', `${reason ? reason + ' ' : ''}${sp.name} is now ${BREACH_WHERE[b.stage]}.`, {kind:'warning'});
  S.dirty = true;
}

