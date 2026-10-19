/* ================= tick ================= */
function tick(){
  S.t++;
  S.funds -= upkeepPerHour();
  for(const L of S.labs){
    if(L.built) L.integrity = clamp(L.integrity - (S.funds < 0 ? 0.25 : 0.03) * (hasSpecialist('engineer') ? 0.55 : 1), 0, 100);
    if(L.building && S.t >= L.building.until){
      L.building = null; L.built = true; L.destroyed = false; L.integrity = 95;
      const head = assignHead(L);
      notify('pruitt', `${LAB_TYPES[L.type].holds.length ? `${L.name} is finished and open for a specimen.` : `${L.name} is online. ${LAB_TYPES[L.type].blurb}`}${head ? ` ${head.name} runs it.` : ` Nobody qualified is free to run it, so it works at half pace until you hire a ${ROLES[headRoleFor(L)].label.toLowerCase()}.`}`); camFit();
      placeHeld();
    }
    const cs = labSpec(L);
    if(cs){ const mis = cs.truth.sensitive && !L.envMatched; cs.stress = clamp(cs.stress + (mis ? .004 : -.006), .1, 1); }
    if(L.built && cs && !L.fault && rnd() < 0.004 * (1 + (100 - L.integrity) / 40) * (hasSpecialist('engineer') ? 0.5 : 1)) L.fault = true;
  }
  for(const sp of S.specs){ if(!sp.alive || !ANIMAL(sp)) continue; sp.sed *= Math.pow(0.5, 1 / sp.truth.sedHalf); if(sp.sed < .01) sp.sed = 0; }
  stepSchedule();
  if(S.over) return;
  if(S.mission && S.t >= S.mission.start + S.mission.dur * 2) missionReturn();
  for(const inc of S.pending.filter(p => S.t >= p.at)){ S.pending.splice(S.pending.indexOf(inc), 1); fireIncident(inc); }
  if(!S.inspectWarned && S.nextInspect - S.t === 12){ S.inspectWarned = true; notify('calderon', `Safety walkthrough scheduled for ${fmtT(S.nextInspect)}. The crew has been told.`); }
  if(S.t >= S.nextInspect && !S.inspector && !S.breach && inWork(S.t)) startWalkthrough('scheduled');
  checkDeadline();
  if(S.funds < 60 && S.funds >= 0 && !S.warnedLow){ S.warnedLow = true; notify('pruitt', 'The grant is nearly spent. Work carries on either way, but past zero we are over budget and Meridian counts it.', 'warning'); }
  if(S.funds > 140) S.warnedLow = false;
  if(S.funds < -60 && !S.bridged && !cur && !S.specs.some(s => s.grantTier >= 1) && S.specs.length){ S.bridged = true; bridgeOffer(); }
  if(onStation().filter(a => !a.injured).length < 3 && S.t >= S.nextTech){
    S.nextTech = S.t + 36;
    launchShuttle('tech');
  }
  tutTick();
  if(S.t === dayEnd(dayOf(S.t))) endOfDay();
  if(S.standing <= 0) endRun('standing');
  updateLive();
}
function bridgeOffer(){
  say('pruitt', 'uneasy', `Director, we are ${Math.round(deficit())} cr over budget with no paper filed yet. Meridian will cover the overrun with a bridge advance of ${BRIDGE} credits and take ${BRIDGE_PAYBACK} back out of the first renewal. It clears the red and stops the bleed on our standing. They only offer this once.`, {kind:'admin', choices:[
    {label:`Take the advance (+${BRIDGE} cr)`, act:() => { S.funds += BRIDGE; S.bridgeDebt = BRIDGE_PAYBACK; log('pruitt', 'admin', `Bridge advance accepted: +${BRIDGE} cr, ${BRIDGE_PAYBACK} cr repaid from the first renewal.`); S.dirty = true; }},
    {label:'Decline', act:() => { log('pruitt', 'admin', 'Bridge advance declined.'); }}
  ]});
}
function running(){ return S.speed > 0 && !cur && !S.breach && !S.over && $('#pub').hidden && $('#study').hidden && $('#report').hidden && !S.ui.planner && !S.ui.mission && S.phase !== 'evening' && S.phase !== 'morning'; }

