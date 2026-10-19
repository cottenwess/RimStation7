/* ================= people problems between lab heads =================
   Two labs of the same type means two people with the same training, the same
   ambitions and one director's attention between them. That is where the station
   stops being a spreadsheet. Each same-discipline pair carries tension and a
   bond; traits decide which one grows. Nothing here is a relationship screen,
   it surfaces as incidents at the evening briefing. */
const PAIR_FLASH = 28;   /* tension that starts an authorship fight */
const PAIR_BURN = 64;    /* tension that turns into sabotage */
const PAIR_BOND = 58;    /* warmth that becomes an attachment */

const pairKey = (a, b) => [a, b].sort().join('|');
/* Heads who share a discipline, and so share a problem. */
function headPairs(){
  const out = [], byType = {};
  for(const L of S.labs){
    if(!L.built || !labHeaded(L)) continue;
    (byType[L.type] = byType[L.type] || []).push(L);
  }
  for(const t in byType){
    const ls = byType[t];
    for(let i = 0; i < ls.length; i++) for(let j = i + 1; j < ls.length; j++)
      out.push({a:ls[i].head, b:ls[j].head, labA:ls[i], labB:ls[j], type:t});
  }
  return out;
}
function bondOf(p){
  const k = pairKey(p.a, p.b);
  S.bonds = S.bonds || {};
  if(!S.bonds[k]) S.bonds[k] = {a:p.a, b:p.b, tension:0, bond:0, state:'', since:S.t, told:0};
  return S.bonds[k];
}
/* Which way a pairing drifts is written in who they are. */
function pairDrift(A, B){
  let t = 0.6, w = 0.4;
  for(const x of [A, B]){
    if(traitFlag(x, 'proud')) t += 1.3;              /* ambitious */
    if(traitsOf(x).some(y => y.label === 'Glory hound')) t += 1.6;
    if(traitsOf(x).some(y => y.label === 'Veteran')) t += 0.5;
    if(traitsOf(x).some(y => y.label === 'By the book')) t += 0.4;
    if(traitsOf(x).some(y => y.label === 'Quiet')) { t -= 0.7; w += 0.7; }
    if(traitsOf(x).some(y => y.label === 'Steady')) { t -= 0.5; w += 0.5; }
    if(x.morale < 35) t += 0.8;
    if(x.morale > 75) w += 0.5;
  }
  /* Two people who both want the same credit get on worst of all. */
  if(traitFlag(A, 'proud') && traitFlag(B, 'proud')) t += 1.2;
  return {t:Math.max(0, t), w:Math.max(0, w)};
}
function dynamicsDayTick(){
  S.bonds = S.bonds || {};
  const live = {};
  for(const p of headPairs()){
    const A = byId(p.a), B = byId(p.b);
    if(!A || !B) continue;
    const st = bondOf(p), d = pairDrift(A, B);
    live[pairKey(p.a, p.b)] = true;
    st.tension = clamp(st.tension + d.t - (st.state === 'attached' ? 1.5 : 0), 0, 100);
    st.bond = clamp(st.bond + d.w - (st.state === 'feud' ? 1.2 : 0), 0, 100);
    if(st.state === 'attached'){ A.morale = clamp(A.morale + 2, 0, 100); B.morale = clamp(B.morale + 2, 0, 100); }
  }
  /* A pairing that no longer exists (a death, a rebuild) stops mattering. */
  for(const k in S.bonds) if(!live[k] && S.bonds[k].state !== 'spy') delete S.bonds[k];
}
/* One people problem per briefing at most. The station has enough going on. */
function dynamicsBriefing(){
  if(S.breach || S.over) return;
  const ps = headPairs();
  if(!ps.length) return;
  for(const p of ps){
    const A = byId(p.a), B = byId(p.b);
    if(!A || !B) continue;
    const st = bondOf(p);
    if(S.t - st.told < 48) continue;
    if(A.spy || B.spy){ if(spyEvent(p, A.spy ? A : B, A.spy ? B : A, st)) return; }
    if(st.tension >= PAIR_BURN && st.state !== 'feud'){ feudEvent(p, A, B, st); return; }
    if(st.tension >= PAIR_FLASH && !st.told){ authorshipEvent(p, A, B, st); return; }
    if(st.bond >= PAIR_BOND && st.state !== 'attached'){ attachEvent(p, A, B, st); return; }
  }
}
const markTold = st => { st.told = S.t; };

/* Two heads, one discipline, one paper. Somebody's name goes first. */
function authorshipEvent(p, A, B, st){
  markTold(st);
  const disc = LAB_TYPES[p.type].label.toLowerCase();
  say('pruitt', 'uneasy', `${A.name} and ${B.name} have both been to see me, separately, about whose name leads on the ${disc} work. Neither of them mentioned that the other one had been in. I would like a decision, Director, before this becomes a thing I am managing instead of a station.`, {kind:'warning', choices:[
    {label:`${A.name} leads`, act:() => creditTo(A, B, st)},
    {label:`${B.name} leads`, act:() => creditTo(B, A, st)},
    {label:'Joint credit, no lead author', act:() => {
      st.tension = clamp(st.tension - 14, 0, 100);
      A.morale = clamp(A.morale - 5, 0, 100); B.morale = clamp(B.morale - 5, 0, 100);
      log('pruitt', 'admin', `Joint credit on the ${disc} work. Both of them said that was fine in a tone that indicated it was not fine. That is usually how I know a call was fair.`);
    }}
  ]});
}
function creditTo(win, lose, st){
  st.tension = clamp(st.tension + 18, 0, 100);
  win.morale = clamp(win.morale + 16, 0, 100);
  lose.morale = clamp(lose.morale - 18, 0, 100);
  log('pruitt', 'admin', `${win.name} named lead author over ${lose.name}.`);
  if(lose.morale < 25) notify('bea', `${lose.name} said congratulations and then recalibrated a scale that did not need recalibrating for forty minutes. Watch them.`, 'warning');
}

/* Tension with nowhere to go turns into damage. */
function feudEvent(p, A, B, st){
  markTold(st); st.state = 'feud';
  const spiteful = traitFlag(A, 'proud') || traitsOf(A).some(y => y.label === 'Glory hound') ? A : B;
  const victim = spiteful === A ? B : A;
  const lab = labOfHead(victim);
  say('bea', 'angry', `I am going to say this once. ${spiteful.name} has been in ${lab ? lab.name : "the other lab"} out of hours, and ${victim.name}'s last run did not fail by itself. This is past professional now.`, {kind:'warning', choices:[
    {label:`Move ${spiteful.name} off the rotation for a week`, act:() => {
      spiteful.benchOnly = true; spiteful.morale = clamp(spiteful.morale - 10, 0, 100);
      st.tension = clamp(st.tension - 40, 0, 100); st.state = '';
      log('pruitt', 'admin', `${spiteful.name} pulled off full rotation after the ${lab ? lab.name : 'lab'} business.`);
    }},
    {label:`Dismiss ${spiteful.name}`, act:() => {
      dismiss(spiteful, 'dismissed after sabotaging a colleague');
      st.tension = 0; st.state = '';
      standing(-3);
    }},
    {label:'Say nothing and let them work it out', act:() => {
      log('pruitt', 'admin', 'Director declined to act on the sabotage report.');
      sabotage(victim, spiteful);
    }}
  ]});
}
/* Quiet damage: a failing seal, a run that comes back wrong. */
function sabotage(victim, by){
  const lab = labOfHead(victim);
  if(lab){ lab.integrity = Math.max(0, lab.integrity - 14); lab.fault = true; }
  victim.morale = clamp(victim.morale - 12, 0, 100);
  for(const it of S.items.filter(x => lab && x.lane === 'L' + lab.k && x.state === 'running')) it.rushed = true;
  log('ops', 'warning', `${lab ? lab.name : 'A lab'} lost integrity overnight. Nobody filed a reason.`);
}

/* Two people who hold each other up, and cover for each other. */
function attachEvent(p, A, B, st){
  markTold(st); st.state = 'attached';
  A.morale = clamp(A.morale + 12, 0, 100); B.morale = clamp(B.morale + 12, 0, 100);
  say('bea', 'neutral', `${A.name} and ${B.name} have got close. I am not here to police it, the hub has six chairs and nobody has gone home in a year. They work better for it. You should know it means they will cover for each other, including the near misses, and that if anything happens to one of them you will lose the other too.`, {kind:'note', choices:[
    {label:'Leave them to it', act:() => { log('bea', 'admin', `${A.name} and ${B.name} noted as attached. Morale is up in both labs and I am not putting the reason in the log.`); }},
    {label:'Separate their rotations', act:() => {
      st.state = ''; st.bond = clamp(st.bond - 30, 0, 100);
      A.morale = clamp(A.morale - 14, 0, 100); B.morale = clamp(B.morale - 14, 0, 100);
      log('pruitt', 'admin', `${A.name} and ${B.name} moved onto separate rotations at the director's instruction.`);
    }}
  ]});
}
/* Someone else is paying them. */
function spyEvent(p, spy, other, st){
  if(!spy.spy || spy.spyKnown) return false;
  markTold(st); spy.spyKnown = true; st.state = 'spy';
  const who = spy.spyFor || 'a partner lab';
  say('calderon', 'alarmed', `Audit finding, Director. ${spy.name} has been copying ${other.name}'s raw data off station, to ${who}. They were placed here to do it. I want it on record that I found this during a routine check of the transfer logs, which is the kind of check people tell me is a waste of everyone's time.`, {kind:'warning', choices:[
    {label:`Dismiss ${spy.name}`, act:() => { dismiss(spy, `dismissed for passing data to ${who}`); standing(2); }},
    {label:'Leave them in place and feed them bad numbers', act:() => {
      spy.fedFalse = true;
      log('calderon', 'admin', `${spy.name} left in place and fed falsified figures.`);
      say('okafor', 'uneasy', "We are now knowingly putting wrong numbers into somebody else's hands. Whatever they build on them is on us too.", {kind:'warning'});
    }},
    {label:'Do nothing', act:() => { standing(-5); log('pruitt', 'admin', `Director took no action on ${spy.name}.`); }}
  ]});
  return true;
}
function dismiss(a, why){
  a.alive = false; a.quit = true; a.dismissed = true;
  reseatHeads();
  log('pruitt', 'admin', `${a.name} ${why}.`);
  notify('pruitt', `${a.name} is off the station on the next shuttle.`);
  launchShuttle();
  S.dirty = true;
}
/* A spy is placed, not grown: the chance exists only once the station has
   something worth stealing and a second lab of the same kind to steal it from. */
function maybePlant(a){
  if(a.role === 'tech' || !S.specs.some(s => s.paperV > 0)) return;
  if(rnd() < 0.12){ a.spy = true; a.spyFor = pick(['Kepler Deep Lab', 'Halden Station', 'Vireo Biolabs', 'the Directorate']); }
}
