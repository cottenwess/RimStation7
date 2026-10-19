/* ================= walkthroughs ================= */
function startWalkthrough(kind){
  const path = [{u:2.4, v:1.2}];
  for(const row of ['E', 'S']){
    const labs = rowLabs(row).filter(L => L.built); if(!labs.length) continue;
    path.push(hubExit(row)[0]);
    labs.forEach((L, idx) => { path.push(labNode(L, 4.7, 1.9, {wait:1.2}), labNode(L, 6.4, 2.0, {wait:1.0}), labNode(L, 6.9, 3.9), labNode(L, 9.0, 3.9, {wait:1.0})); if(idx < labs.length - 1) path.push(labNode(L, 11.1, 3.9), labNode(L, 12.4, 2.0)); });
    for(let j = labs.length - 1; j >= 0; j--){ const L = labs[j]; if(j < labs.length - 1) path.push(labNode(L, 12.4, 2.0), labNode(L, 11.1, 3.9)); path.push(labNode(L, 6.9, 3.9), labNode(L, 6.4, 2.0), labNode(L, 4.4, 2.0)); }
    path.push(hubExit(row)[0]);
  }
  path.push({u:2.4, v:2.6});
  S.inspector = {kind, caught:0, alive:true, u:LANDING[0], v:LANDING[1], wait:0, task:'inspect', flash:0, path,
    look:{skin:PEOPLE.calderon.skin, hair:PEOPLE.calderon.hair, coat:'#e0702a', accent:'#f2d14a', clip:true}};
  if(kind === 'scheduled'){ S.nextInspect = inspectAt(S.t + 72); S.inspectWarned = false; }
  else { S.lastSurprise = S.t; S.labs.forEach(L => { L.haltUntil = Math.max(L.haltUntil, S.t + 2); }); notify('calderon', 'Surprise safety walkthrough. Nobody touch anything.', 'admin'); }
  S.dirty = true;
}
function stepInspector(dt, mult){
  const a = S.inspector; if(!a) return;
  if(a.wait > 0){ a.wait -= dt * mult; a.walking = false; return; }
  const n = a.path[0];
  if(!n){ finishWalkthrough(); return; }
  const du = n.u - a.u, dv = n.v - a.v, d = Math.hypot(du, dv), sp = 1.2 * dt * mult;
  a.walking = true;
  if(d <= sp){ a.u = n.u; a.v = n.v; a.path.shift(); if(n.wait) a.wait = n.wait; }
  else { a.u += du / d * sp; a.v += dv / d * sp; }
}
function finishWalkthrough(){
  const I = S.inspector; S.inspector = null;
  const surprise = I.kind === 'surprise';
  let caught = I.caught;
  for(let i = 0; i < Math.max(0, S.skipsSince - I.caught); i++) if(rnd() < (surprise ? .85 : .4)) caught++;
  S.skipsSince = 0;
  const F = [], choices = [];
  if(caught) F.push(`${caught} decon skip${caught > 1 ? 's' : ''} on the lab exits since my last walkthrough${S.lead === 'vasko' ? ", mostly Dr. Vasko's crew" : ''}.`);
  if(caught && S.reportsMuted) F.push('The techs say they were told to stop filing near-miss reports. That is a violation in itself.');
  let fixLab = null, upLab = null, matchLab = null;
  for(const L of S.labs.filter(l => l.built)){
    const cs = labSpec(L);
    if(L.fault && rnd() < (surprise ? .95 : .6)){ L.fault = false; F.push(`${L.name}: a seal on the tank feed port was failing. My team replaced it before it let go.`); }
    if(L.integrity < 60){ F.push(`${L.name}: hairline fractures in the glazing, integrity ${Math.round(L.integrity)}%.`); fixLab = fixLab || L; }
    if(!cs) continue;
    const cc = claimFor(cs, 'containment'), bc = claimFor(cs, 'behavior');
    let need = 0;
    if(cc && cs.truth.bsl > L.bsl) need = cs.truth.bsl;
    else if(!cc && bc && bc.stance === 'danger' && L.bsl < 3) need = 3;
    if(need){ F.push(`${L.name}: ${cs.name} is housed at BSL-${L.bsl}. ${cc ? 'Your own data' : 'Its behavior'} says BSL-${need}.`); if(need === 3 && L.bsl === 2) upLab = upLab || L; }
    if(valid(cs, 'habitat') && cs.truth.sensitive && !L.envMatched){ F.push(`${L.name}: the environment contradicts your own habitat finding for ${cs.name}.`); matchLab = matchLab || L; }
    if(ANIMAL(cs) && cs.stress > .75) F.push(`${L.name}: ${cs.name} is pacing and testing the glass. Stressed animals breach.`);
  }
  const inj = onStation().filter(a => a.injured).length;
  if(inj) F.push(`${inj} injured tech${inj > 1 ? 's' : ''} on the roster with no incident review filed.`);
  if(!F.length){ notify('calderon', surprise ? 'Surprise walkthrough clean. I looked hard.' : 'Walkthrough clean. No violations found.'); return; }
  if(caught && !S.enforced) choices.push({label:'Enforce decon protocol', act:() => { S.enforced = true; log('calderon', 'admin', 'Decon protocol enforced. Lab exits are now checked. Work runs about 8% slower.'); if(S.lead === 'vasko') say('vasko', 'angry', 'Checked exits. Wonderful. Science at the speed of paperwork.', {kind:'note'}); }});
  if(fixLab) choices.push({label:`Repair ${fixLab.name} (18 cr)`, act:() => { S.funds -= 18; fixLab.integrity = Math.min(100, fixLab.integrity + 30); log('ops', 'admin', `${fixLab.name} repaired after walkthrough.`); }});
  if(upLab) choices.push({label:`Upgrade ${upLab.name} to BSL-3 (35 cr)`, act:() => { S.funds -= 35; upLab.bsl = 3; log('ops', 'admin', `${upLab.name} upgraded to BSL-3 after walkthrough.`); }});
  if(matchLab) choices.push({label:`Match ${matchLab.name}'s habitat (10 cr)`, act:() => { S.funds -= 10; matchLab.envMatched = true; log('ops', 'admin', `${matchLab.name} environment matched.`); }});
  choices.push({label:'Noted', act:() => {}});
  say('calderon', F.length > 2 ? 'angry' : 'uneasy', `${surprise ? 'Surprise walkthrough' : 'Walkthrough'} findings. ${F.join(' ')}`, {kind:'warning', choices});
}

