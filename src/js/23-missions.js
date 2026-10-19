/* ================= missions ================= */
function missionCost(p){ return S.firstMission ? 0 : 25 + p.hazard * 8; }
function missionBlock(p){
  if(!p.known) return 'Unknown planet.';
  if(S.mission) return 'A recovery team is already out.';
  if(S.breach) return 'Deal with the breach first.';
  if(!canDecide()) return 'Recovery teams launch at the end of the shift.';
  if(!ARCH[p.arch].pool.some(k => openLabs(k).length)) return openLabs().length || S.labs.some(L => L.built && L.type !== 'containment' && LAB_TYPES[L.type].holds.length) ? `No open lab for what lives on ${p.name}. ${ARCH[p.arch].pool.some(k => k === 'fossil') ? 'Fossils need the Genetics Lab. ' : ''}${ARCH[p.arch].pool.includes('microbe') ? 'Microbes need the Micro Lab.' : ''}`.trim() : 'No open lab. Build a new lab or free one up before bringing anything back.';
  if(onStation().filter(a => !a.injured).length < 3) return 'You need at least 3 healthy techs on station to send 2.';
  return '';
}
function dispatch(p){
  if(missionBlock(p)) return;
  const team = onStation().filter(a => !a.injured && a.task !== 'work').slice(0, 2);
  if(team.length < 2) return;
  const free = S.firstMission;
  S.funds -= missionCost(p);
  if(free) log('pruitt', 'admin', 'Meridian covered the cost of the first recovery trip.');
  team.forEach(a => { a.away = true; a.inLab = false; a.task = 'idle'; a.path = []; });
  S.mission = {planet:p.i, start:S.t, dur:p.dist, team:team.map(a => a.name)};
  S.flight = {dir:'out', p:0};
  log('rook', 'admin', `Recovery team dispatched to ${p.name} (${p.nick}) with ${team.map(a => a.name).join(' and ')}. Round trip about ${p.dist * 2} h.`);
  notify('rook', `Rook Adebayo here. We're away for ${p.name}. Back in about ${p.dist * 2} hours.`);
  S.dirty = true;
}
function firstKind(p){ const pool = ARCH[p.arch].pool; return pool.includes('fauna') ? 'fauna' : pool.includes('floater') ? 'floater' : pool.includes('flora') ? 'flora' : pool.find(k => openLabs(k).length) || pool[0]; }
function missionReturn(){
  const m = S.mission, p = S.planets[m.planet]; S.mission = null;
  const first = S.firstMission; S.firstMission = false;
  S.flight = {dir:'in', p:0};
  const risk = first ? 0 : [0.02, 0.05, 0.1, 0.18, 0.3][p.hazard];
  const team = S.techs.filter(a => m.team.includes(a.name));
  const lost = [];
  team.forEach(a => { a.away = false; a.u = LANDING[0]; a.v = LANDING[1]; a.path = [homeNode(a)]; if(rnd() < risk){ a.alive = false; S.deaths++; lost.push(a.name); } });
  const roll = rnd();
  let count = first ? 1 : p.hazard >= 3 ? (roll < .2 ? 0 : roll < .5 ? 1 : roll < .8 ? 2 : 3) : (roll < .12 ? 0 : roll < .55 ? 1 : roll < .88 ? 2 : 3);
  const haul = [], left = {}, pool = ARCH[p.arch].pool;
  for(let i = 0; i < count; i++){
    let kind = first ? firstKind(p) : pick(pool);
    if(!openLabs(kind).length){ const alt = pool.find(k => openLabs(k).length); if(alt && rnd() < .5) kind = alt; }
    if(!openLabs(kind).length){ left[kind] = (left[kind] || 0) + 1; continue; }
    const s = genSpecimen(p, kind, {tutorial:first});
    S.specs.push(s); placeSpecimen(s); haul.push(s);
    if(ANIMAL(s)){ s.sed = .5; s.lastSedT = S.t - 4; }
  }
  const mats = first ? [] : genMaterials(p);
  if(haul.length && !S.ui.spec) S.ui.spec = haul[0].id;
  if(haul.length && S.nextInspect > 1e8) S.nextInspect = inspectAt(S.t + 48);
  p.recovered += haul.length;
  if(haul.length){
    let g = 0; for(const s of haul){ g += ARRIVAL_GRANT + (S.kindsSeen.has(s.kind) ? 0 : 20); S.kindsSeen.add(s.kind); }
    S.funds += g; S.granted += g;
    log('pruitt', 'admin', `Meridian grant for new specimen${haul.length > 1 ? 's' : ''}: +${g} cr.`);
    notify('pruitt', `Meridian sent ${g} cr for ${haul.length > 1 ? 'the new specimens' : `${haul[0].name}`}. New material keeps the money coming.`);
  }
  let disc = null;
  const prior = p.missions; p.missions++;
  const hidden = S.planets.find(q => !q.known && q.link === p.i);
  if(hidden && prior >= 1 && (prior >= 2 || rnd() < .45)){ hidden.known = true; disc = hidden; }
  let txt = haul.length ? `We're back from ${p.name}. Recovered ${haul.map(s => `${s.name} (${KIND_LABEL[s.kind].toLowerCase()}) into ${labOf(s).name}`).join(', ')}.` : `We're back from ${p.name}, empty-handed. Weather never cleared.`;
  const lk = Object.keys(left);
  if(lk.length) txt += ` We also found ${lk.map(k => `${left[k] > 1 ? left[k] + ' ' : 'a '}${KIND_LABEL[k].toLowerCase()}${left[k] > 1 && k !== 'fauna' ? 's' : ''}`).join(' and ')} but had no ${lk.map(k => LAB_TYPES[labTypeFor(k)].label === 'Containment' ? 'open containment lab' : LAB_TYPES[labTypeFor(k)].label + ' Lab').join(' or ')} for ${Object.values(left).reduce((a, b) => a + b, 0) > 1 ? 'them' : 'it'}, so we left ${Object.values(left).reduce((a, b) => a + b, 0) > 1 ? 'them' : 'it'} on the surface.`;
  if(mats.length) txt += ` We bagged ${mats.map(m => m.base).join(' and ')} for ${labOfType('physics') ? 'the Physics Lab' : 'the stores, until there is a Physics Lab to study it'}.`;
  if(lost.length) txt += ` We lost ${lost.join(' and ')} down there.`;
  if(disc) txt += ` One more thing. We picked up a signal on the way home and traced it to ${disc.name}. It's not on any chart. It's on the star map now.`;
  say('rook', lost.length ? 'numb' : disc ? 'excited' : 'neutral', txt, {kind:lost.length ? 'warning' : 'note'});
  if(first && haul.length){
    const s = haul[0];
    if(ANIMAL(s)) say('bea', 'uneasy', `${s.name} is in Lab A. One thing before anyone scores its behavior: Rook sedated it for the trip home. Watch it now and you're measuring the drug, not the animal. Use the washout option on the observation.`, {kind:'note'});
    else say('bea', 'neutral', `${s.name} is sealed in Lab A. Start with an observation. Nothing gets out during a sealed study.`, {kind:'note'});
  }
  if(lost.length && !S.hazardAsked){ S.hazardAsked = true; hazardDemand(); }
  S.dirty = true;
}

