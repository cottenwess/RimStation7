/* ================= staff events ================= */
function hazardDemand(){
  say('bea', 'angry', `That's ${S.deaths} dead. My people want hazard pay, or they work strictly by the book from now on. Your call, Director.`, {kind:'warning', choices:[
    {label:'Approve hazard pay (+2.4 cr/day)', act:() => { S.hazardPay = true; log('bea', 'admin', 'Hazard pay approved.'); }},
    {label:'Refuse', act:() => { S.slowdown = true; log('bea', 'admin', 'Hazard pay refused. Techs working strictly to protocol.'); say('bea', 'numb', "Then it's by the book. Every step. Slowly.", {log:false}); }}
  ]});
}
function killTech(a, cause){
  if(!a || !a.alive) return;
  a.alive = false; a.inLab = false; S.deaths++;
  for(const o of S.techs) if(o.alive && o !== a) o.morale = clamp(o.morale - (o.inLab ? 14 : 7), 0, 100);
  reseatHeads();
  const [x, y] = isoXY(a.u, a.v);
  for(let i = 0; i < 16; i++) parts.push({x, y:y - 4, vx:(rnd() - .5) * 30, vy:-rnd() * 26, life:1, col:'#ff5d63'});
  say('ops', 'neutral', `Personnel notice: Tech ${a.name} is deceased (${cause}). Next of kin have been notified.`, {kind:'warning'});
  if(!S.hazardAsked){ S.hazardAsked = true; hazardDemand(); }
  else if(S.deaths === 4) say('ops', 'neutral', 'Recruitment notice: applications for Rim Station 7 have dropped sharply. Word travels, even out here.', {kind:'admin'});
  S.dirty = true;
}
function registerSkip(a){
  S.deconSkips++; S.skipsSince++; { const L = S.labs[a.labK || 0]; if(L) L.integrity = Math.max(0, L.integrity - 0.6); } a.flash = 1.8;
  if(S.inspector){ S.inspector.caught++; notify('calderon', `${a.kind === 'lead' ? 'Dr. Vasko' : a.name} just walked past the decon pad in front of me. Noted.`, 'warning'); return; }
  if(!S.reportsMuted && !traitFlag(a, 'mute') && S.nearMiss < 3 && rnd() < 0.6){
    S.nearMiss++;
    say('bea', 'uneasy', `Near miss: ${a.kind === 'lead' ? 'Dr. Vasko himself' : a.name} walked straight past the decon pad coming out of the cell. That's ${S.deconSkips} skipped decons on this crew.`, {kind:'warning', choices:[
      {label:'Thanks. Keep reporting these.', act:() => {}},
      {label:"Don't slow us down over this.", act:() => { S.reportsMuted = true; log('bea', 'admin', 'Director asked techs to stop filing near-miss reports.'); say('bea', 'numb', "Understood. You won't hear about it again.", {log:false}); }}
    ]});
  }
  S.dirty = true;
}
function assignLead(id){
  const L = LEADS[id]; if(L.quit || S.lead === id) return;
  if(S.lead) pullLead(true);
  if(S.over) return;
  S.lead = id;
  L.actor.task = 'idle'; L.actor.path = [homeNode(L.actor)];
  log(id, 'admin', `${PEOPLE[id].name} assigned as lead.`);
  replanAll();
  if(id === 'okafor'){
    const bad = [];
    S.specs.forEach(sp => Object.keys(sp.find).forEach(k => { const f = sp.find[k]; if(f.by === 'Vasko' && !f.ok && !f.flagged){ f.flagged = true; bad.push(`${sp.name}'s ${STUDIES[k].name(sp).toLowerCase()}`); } }));
    if(bad.length){
      say('okafor', 'uneasy', `I went through Dr. Vasko's notes. I'm flagging ${bad.join(', ')}. Sedated animals, cut-short sampling. None of it was marked.`, {kind:'anomaly'});
      S.specs.forEach(checkContradictions);
    }
  }
  S.dirty = true;
}
function pullLead(silent){
  const id = S.lead; if(!id) return;
  const L = LEADS[id]; L.pulls++;
  if(L.actor.task === 'work') sendHome(L.actor);
  S.lead = null; replanAll();
  log('ops', 'admin', `${PEOPLE[id].name} pulled from the project.`);
  if(L.pulls >= 3){
    L.quit = true;
    say(id, 'angry', id === 'vasko' ? "Fine. I'm taking the next shuttle to a station that wants results." : "I'm done being moved around like equipment. I'm leaving on the next shuttle. I've kept copies of everything.", {kind:'warning'});
    launchShuttle();
  } else if(L.pulls === 2 && !silent) say(id, 'angry', id === 'vasko' ? 'Twice now. People talk, Director.' : 'This is the second time. I would like to know why.', {kind:'note'});
  S.dirty = true;
}

