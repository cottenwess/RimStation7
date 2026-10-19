/* ================= schedule ================= */
const WORK_START = 8, WORK_END = 20, OT_END = 23, OT_COST = 15;
const MULTI = new Set(['spread', 'genome', 'revive', 'clone', 'language']);
const STUDY_LAB = {clone:'genetics', revive:'genetics'};
const dayOf = t => Math.floor(t / 24);
const hourOf = t => ((t % 24) + 24) % 24;
const dayEnd = d => d * 24 + (S.ot[d] ? OT_END : WORK_END);
const inWork = t => hourOf(t) >= WORK_START && t < dayEnd(dayOf(t));
const inspectAt = t => { const h = hourOf(t); return h >= 10 && h < 18 ? t : (h < 10 ? t - h + 10 : t - h + 34); };
const hh = t => String(hourOf(t)).padStart(2, '0') + ':00';
let itemSeq = 0;
/* Some job target lists hand back live specimens and compounds. An item keeps only
   a flat copy for its label, so a save never stores a second copy of a live entity;
   the real target is always re-resolved through jobTargetById. */
function tobjSnapshot(t){
  if(!t) return null;
  const o = {id:t.id, name:t.name};
  if(t.short !== undefined) o.short = t.short;
  if(t.a !== undefined) o.a = t.a;
  if(t.b !== undefined) o.b = t.b;
  return o;
}
function leadSpeed(){ const L = S.lead ? LEADS[S.lead] : null; return (L ? L.speed : 1) * (S.slowdown ? 0.6 : 1) * (S.enforced ? 0.92 : 1); }
// A "work" descriptor normalizes studies and jobs: {kind, type, sp, tgt}
function wName(w){ if(w.kind === 'job'){ const t = jobTargetById(w.type, w.tgt) || w.tobj; return `${JOBS[w.type].name(t)}${t && t.name && JOBS[w.type].of !== 'station' ? ': ' + (t.short || t.name) : ''}`; } return STUDIES[w.type].name(specById(w.sp)); }
function wMode(w){ return w.kind === 'job' ? JOBS[w.type].mode : studyMode(specById(w.sp), w.type); }
function wMulti(w){ return w.kind === 'job' ? !!JOBS[w.type].multi : MULTI.has(w.type); }
function wTrigger(w){ return w.kind === 'job' ? !!JOBS[w.type].risky : isTrigger(specById(w.sp), w.type); }
function wCost(w, o){ if(w.kind === 'job'){ const c = JOBS[w.type].cost; return JOBS[w.type].risky ? Math.round(c * mitOf(o).costM) : c; } return studyCost(specById(w.sp), w.type, o); }
/* A lab with nobody at its head: work drags and the record is shakier. */
function headPenalty(lane){
  const L = laneLab(lane);
  return L && L.built && !labHeaded(L) ? {work:1.35, quality:1.5} : {work:1, quality:1};
}
function wDur(w, o){
  /* Multi-day work runs around the clock on its own schedule, so neither the
     lead's pace nor the crew's speeds it up; everything else does. */
  const cf = workCrewFactors(w);
  const hp = headPenalty(wLane(w));
  if(w.kind === 'job'){ const j = JOBS[w.type]; let x = j.work * (j.risky ? mitOf(o).workM : 1); return Math.max(1, Math.ceil(j.multi ? x : x * cf.work * hp.work / leadSpeed())); }
  const sp = specById(w.sp); let x = studyWork(sp, w.type, o);
  if(planetOf(sp).arch === 'cryo' && studyMode(sp, w.type) === 'observe') x *= 1.4;
  return Math.max(1, Math.ceil(MULTI.has(w.type) ? x : x * cf.work * hp.work / leadSpeed()));
}
function wLane(w){
  if(w.kind === 'job'){ const L = labOfType(JOBS[w.type].lab); return L ? 'L' + L.k : null; }
  const sp = specById(w.sp);
  if(STUDY_LAB[w.type]){ const L = labOfType(STUDY_LAB[w.type]); return L ? 'L' + L.k : null; }
  if(sp.kind === 'microbe' || sp.kind === 'fossil'){ const L = labOf(sp); return L ? 'L' + L.k : null; }
  if(studyMode(sp, w.type) === 'bench') return 'bench';
  return labOf(sp) ? 'L' + labOf(sp).k : null;
}
const laneLab = lane => lane && lane !== 'bench' ? S.labs[+lane.slice(1)] : null;
/* Every lane this work could run in. The first is where it goes if the player
   does not say otherwise; the rest are labs equipped to take it off the hub bench. */
function wLanes(w){
  const primary = wLane(w);
  if(!primary) return [];
  const out = [primary];
  if(w.kind !== 'study' || STUDY_LAB[w.type]) return out;
  const sp = specById(w.sp);
  if(!sp || studyMode(sp, w.type) !== 'bench') return out;
  for(const L of S.labs){
    if(!L.built || L.destroyed) continue;
    if((LAB_BENCH[L.type] || []).includes(w.type) && !out.includes('L' + L.k)) out.push('L' + L.k);
  }
  return out;
}
const laneName = lane => lane === 'bench' ? 'the hub bench' : laneLab(lane) ? laneLab(lane).name : 'another lab';
const durFor = (sp, id, o) => wDur({kind:'study', type:id, sp:sp.id}, o);
const laneOf = (sp, id) => wLane({kind:'study', type:id, sp:sp.id});
const itemFor = (sp, id) => S.items.find(x => x.kind === 'study' && x.sp === sp.id && x.type === id);
const itemsOf = sp => S.items.filter(x => x.sp === sp.id);
const runningItems = () => S.items.filter(x => x.state === 'running');
const sameWork = (a, b) => a.kind === b.kind && a.type === b.type && (a.kind === 'job' ? a.tgt === b.tgt : a.sp === b.sp);
function fitSlot(from, dur, multi){
  let t = Math.max(from, S.t);
  for(let i = 0; i < 400; i++){
    const d = dayOf(t), h = hourOf(t);
    if(h < WORK_START){ t = d * 24 + WORK_START; continue; }
    const end = dayEnd(d);
    if(t >= end){ t = (d + 1) * 24 + WORK_START; continue; }
    if(multi || t + dur <= end) return t;
    t = (d + 1) * 24 + WORK_START;
  }
  return t;
}
function laneFree(lane){ let f = S.t; for(const x of S.items) if(x.lane === lane) f = Math.max(f, x.end); return f; }
// Settle a lane: keep the order the player chose, honor chosen start times as lower bounds, and push anything that no longer fits to its next slot.
function planLane(lane){
  let cur = S.t;
  const its = S.items.filter(x => x.lane === lane).sort((a, b) => (a.state === 'running' ? -1 : 0) - (b.state === 'running' ? -1 : 0) || a.start - b.start);
  for(const it of its){
    if(it.state === 'running'){ cur = Math.max(cur, it.end); continue; }
    it.start = fitSlot(Math.max(cur, it.start || 0, it.notBefore || 0), it.dur, it.multi);
    it.end = it.start + it.dur; cur = it.end;
  }
}
function replanAll(){
  for(const it of S.items) if(it.state !== 'running'){ it.dur = wDur(it, it.opts); }
  [...new Set(S.items.map(x => x.lane))].forEach(planLane);
  S.dirty = true;
}
function workBlock(w, o){
  if(S.breach) return 'Deal with the breach first.';
  if(!S.lead) return 'Assign a lead scientist in the Staff tab first.';
  const lane = wLane(w);
  if(w.kind === 'job'){
    const j = JOBS[w.type]; if(!labOfType(j.lab)) return `Needs the ${LAB_TYPES[j.lab].label} lab.`;
    if(S.items.some(x => sameWork(x, w))) return 'Already on the schedule.';
    if(!jobTargets(w.type).some(t => t.id === w.tgt)) return 'Not available.';
    if(j.block && j.block()) return j.block();
    const jneed = gatedBy(w.type);
    if(jneed) return `Needs a ${ROLES[jneed].label.toLowerCase()} on station.`;
  } else {
    const sp = specById(w.sp), id = w.type;
    if(!canQueueMore(sp, id)) return itemFor(sp, id) ? (id === 'extract' ? 'Every remaining compound already has a round scheduled.' : id === 'clone' ? 'Each scheduled cloning line needs its own open lab.' : 'Already on the schedule.') : 'Nothing left to do here.';
    if(!availSoon(sp, id)) return 'Not available yet.';
    const need = gatedBy(id);
    if(need) return `Needs a ${ROLES[need].label.toLowerCase()} on station.`;
    if(invasive(sp, id)) return `${sp.name} has been recognized as a people. Invasive work is off the table.`;
    if(!lane) return STUDY_LAB[id] ? `Needs the ${LAB_TYPES[STUDY_LAB[id]].label} lab.` : `${sp.name} is in stasis. Free a lab first.`;
    if(id === 'clone' && !openLabs(sp.kind === 'fossil' ? 'fauna' : sp.kind).length) return 'No open lab to receive the clone.';
    if(id === 'revive' && !openLabs('microbe').length) return 'Needs an open Micro Lab to hold what wakes up.';
  }
  const dur = wDur(w, o);
  if(!wMulti(w) && dur > OT_END - WORK_START) return `This design runs ${dur} h, longer than any shift, even with overtime.`;
  return '';
}
function makeItem(w, o, start, lane){
  lane = lane || wLane(w);
  const cost = wCost(w, o);
  const overNote = budgetTag(cost);
  let dur = wDur(w, o), truncated = false;
  if(w.kind === 'study' && w.type === 'clearance' && S.lead === 'vasko' && rnd() < 0.55){ truncated = true; dur = Math.max(1, Math.round(dur * 0.45)); }
  S.funds -= cost;
  const sp = w.sp ? specById(w.sp) : null;
  const it = {id:'i' + (++itemSeq), kind:w.kind, type:w.type, sp:w.sp || null, tgt:w.tgt || null, mode:wMode(w), lane, lab:laneLab(lane) ? laneLab(lane).k : null, opts:{...o}, cost, dur, multi:wMulti(w),
    tobj:w.kind === 'job' ? tobjSnapshot(jobTargets(w.type).find(t => t.id === w.tgt)) : null,
    notBefore:Math.max(start === undefined && w.kind === 'study' && w.type === 'obs' && sp && ANIMAL(sp) ? S.t + (o.washout || 0) : 0, preEndFor(w)), start:start === undefined ? laneFree(lane) : start, state:'queued', reps:[], rolled:false, truncated, sedated:false, crew:[], crewIds:w.crewIds ? w.crewIds.slice() : [], pinned:!!(w.crewIds && w.crewIds.length), rushed:false, over:!!overNote, why:''};
  S.items.push(it); planLane(lane);
  log(S.lead, 'note', `Scheduled ${wName(it).toLowerCase()}${sp ? ` on ${sp.name}` : ''} for ${fmtShort(it.start)}, ${it.dur} h. Cost ${cost} cr.${overNote ? ` Approved, ${overNote}.` : ''}${wTrigger(it) ? ` Precautions: ${mitOf(o).label.toLowerCase()}.` : ''}`);
  tutTick(); S.dirty = true;
  return it;
}
// Kept for the study popup ("Add to schedule" = earliest slot)
function slotPreview(sp, id, o){
  const w = {kind:'study', type:id, sp:sp.id}, lane = wLane(w), multi = wMulti(w), dur = wDur(w, o);
  const nb = id === 'obs' && ANIMAL(sp) ? S.t + (o.washout || 0) : 0;
  const start = lane ? fitSlot(Math.max(laneFree(lane), nb), dur, multi) : S.t;
  const d = dayOf(S.t);
  const tooLong = !multi && dur > OT_END - WORK_START;
  const needOT = !multi && dur > WORK_END - WORK_START && !S.ot[dayOf(start)];
  let otToday = false;
  if(lane && !multi && !S.ot[d] && dayOf(start) > d && hourOf(S.t) < WORK_END){ const f = Math.max(laneFree(lane), nb, S.t, d * 24 + WORK_START); otToday = f + dur <= d * 24 + OT_END && dayOf(f) === d; }
  const why = dayOf(start) <= d ? '' : nb > S.t && dayOf(nb) > d ? 'washout' : lane && laneFree(lane) > S.t && fitSlot(S.t, dur, multi) < start ? 'busy' : 'fit';
  return {start, end:start + dur, dur, multi, tooLong, needOT, otToday, why};
}
function schedBlock(sp, id){
  if(!sp) return 'No specimen selected.';
  const b = workBlock({kind:'study', type:id, sp:sp.id}, S.ui); if(b) return b;
  const pv = slotPreview(sp, id, S.ui);
  if(pv.needOT) return `This design runs ${pv.dur} h, longer than a ${WORK_END - WORK_START}-hour shift. Authorize overtime for the day first.`;
  return '';
}
function scheduleExp(){ const sp = selSpec(), id = S.ui.sel; if(schedBlock(sp, id)) return; makeItem({kind:'study', type:id, sp:sp.id}, S.ui); }
// Planner placement: exact start hour in a lane. Returns '' or the reason it can't go there.
function placeCheck(w, lane, start, o, ignore){
  const ok = wLanes(w);
  if(!ok.includes(lane)) return `That work runs in ${ok.map(laneName).join(' or ')}.`;
  if(start < S.t) return 'That hour has already passed.';
  const d = dayOf(start), dur = wDur(w, o), multi = wMulti(w);
  if(hourOf(start) < WORK_START || start >= dayEnd(d)) return 'Outside the shift.';
  if(!multi && start + dur > dayEnd(d)) return `Needs ${dur} h and the shift ends at ${hh(dayEnd(d))}.${!S.ot[d] ? ' Overtime would help.' : ''}`;
  for(const x of S.items) if(x !== ignore && x.lane === lane && start < x.end && start + dur > x.start) return `Overlaps ${wName(x).toLowerCase()}.`;
  return '';
}
function placeWork(w, lane, start){
  const o = S.ui; const b = workBlock(w, o); if(b) return b;
  const c = placeCheck(w, lane, start, o); if(c) return c;
  makeItem(w, o, start, lane); return '';
}
function moveItem(it, start, lane){
  if(it.state === 'running') return 'Already running.';
  const to = lane || it.lane;
  const c = placeCheck(it, to, start, it.opts, it); if(c) return c;
  const from = it.lane;
  it.lane = to; it.lab = laneLab(to) ? laneLab(to).k : null;
  it.start = start; it.notBefore = 0;
  planLane(to); if(from !== to) planLane(from);
  S.dirty = true; return '';
}
/* When a study is queued ahead of the work it depends on, the honest answer to
   "when can this start" is "when that finishes", not "an hour from now". Returns
   the end of the last scheduled prerequisite, or 0 if nothing is pending. */
function preEndFor(w){
  if(w.kind !== 'study' || !w.sp) return 0;
  const sp = specById(w.sp);
  if(!sp) return 0;
  let t = 0;
  for(const n of pendingPre(sp, w.type)) for(const x of itemsFor(sp, n)) t = Math.max(t, x.end);
  return t;
}
function startBlock(it){
  if(!S.lead) return 'Waiting for a lead';
  if(S.breach) return 'Paused by the breach';
  const L = laneLab(it.lane);
  if(it.lane !== 'bench' && !L) return 'Lab unavailable';
  if(L && S.t < L.haltUntil) return `${L.name} is halted`;
  if(it.kind === 'study' && it.mode !== 'bench' && !labOf(specById(it.sp))) return 'Specimen is in stasis';
  if(it.kind === 'study'){
    const sp = specById(it.sp), pend = sp ? pendingPre(sp, it.type) : [];
    if(pend.length) return `Waiting on the ${STUDIES[pend[0]].name(sp).toLowerCase()}`;
  }
  const need = crewNeed(it.mode);
  const free = S.techs.filter(a => eligible(a, it.mode)).length;
  if(free < need) return it.mode === 'handle' && S.techs.filter(a => eligible(a, 'bench')).length >= need ? 'Nobody free will take hands-on work' : 'Not enough staff free';
  return '';
}
function moveTo(a, it, i){
  if(it.lane === 'bench'){ const p = BENCH_SPOTS[i % 3]; a.path = (a.inLab ? exitPath(a.labK, a) : []).concat([{u:p[0], v:p[1]}]); }
  else if(!a.inLab || a.labK !== it.lab) a.path = (a.inLab ? exitPath(a.labK, a) : []).concat(enterPath(it.lab, LAB_SPOTS[i % 4]));
}
function sendHome(a){ a.job = null; a.task = 'idle'; a.path = (a.inLab ? exitPath(a.labK, a) : []).concat([homeNode(a)]); }
function staffItem(it){
  const need = crewNeed(it.mode);
  /* A crew the player named in the planner is used as far as it is still
     available; anyone missing or hurt is backfilled with the best person free. */
  let c = (it.pinned ? crewOf(it) : []).filter(a => eligible(a, it.mode));
  if(c.length < need) c = c.concat(pickCrew(it.mode, need - c.length, {exclude:c.map(a => a.id), id:it.type}));
  c.forEach((a, i) => { a.job = it.id; a.task = 'work'; a.spot = i; a.workedRecently = true; moveTo(a, it, i); });
  it.crewIds = c.map(a => a.id);
  it.crew = c.map(a => a.name);
  const lead = S.lead ? LEADS[S.lead].actor : null;
  if(lead && !lead.job){ lead.job = it.id; lead.task = 'work'; lead.spot = 2; moveTo(lead, it, 2); }
}
function releaseCrew(it){
  actors().forEach(a => { if(a.job === it.id) sendHome(a); });
  it.crew = []; it.crewIds = [];
  const lead = S.lead ? LEADS[S.lead].actor : null;
  if(lead && !lead.job){ const other = runningItems().find(x => x !== it && x.crew.length); if(other){ lead.job = other.id; lead.task = 'work'; lead.spot = 2; moveTo(lead, other, 2); } }
}
function startItem(it){
  const sp = it.sp ? specById(it.sp) : null;
  it.state = 'running'; it.start = S.t; it.why = '';
  if(sp && it.kind === 'study' && !it.sedated && sedates(sp, it.type)){ sedateSpec(sp); it.sedated = true; }
  staffItem(it);
  /* The estimate assumed a projected crew. Now that real people are on it,
     settle the hours. Work that no longer fits the shift gets rushed instead of
     running into the night, and rushed work is likelier to come back unreliable. */
  it.dur = Math.max(1, wDur(it, it.opts));
  if(!it.multi){
    const room = dayEnd(dayOf(S.t)) - S.t;
    if(it.dur > room){ it.dur = Math.max(1, room); it.rushed = true; }
  }
  it.end = it.start + it.dur;
  if(it.multi) it.setupUntil = S.t + 1;
  planLane(it.lane);
}
function sendTrip(it){
  const c = actors().filter(a => a.job === it.id && a.inLab && !a.path.length && a.wait <= 0);
  if(!c.length) return;
  const a = pick(c);
  a.path = exitPath(it.lab, a).concat([{u:3.3, v:2.7, wait:1.4}], enterPath(it.lab, LAB_SPOTS[a.spot % 4]));
}
function removeItem(it){ const i = S.items.indexOf(it); if(i >= 0) S.items.splice(i, 1); releaseCrew(it); planLane(it.lane); }
function cancelItem(it){
  const sp = it.sp ? specById(it.sp) : null, nm = wName(it).toLowerCase();
  if(it.state === 'running'){
    log(S.lead || 'ops', 'note', `Aborted ${nm}${sp ? ` on ${sp.name}` : ''}. The ${it.cost} cr investment is lost.`);
    if(S.lead === 'okafor'){ S.funds += 4; notify('okafor', 'I wrote the abort up properly. Meridian pays 4 cr for a clean negative record.', 'note'); }
  } else { S.funds += it.cost; log('ops', 'admin', `Unscheduled ${nm}${sp ? ` on ${sp.name}` : ''}. ${it.cost} cr refunded.`); }
  removeItem(it); S.dirty = true;
}
function dropItemsFor(sp, why){
  for(const it of itemsOf(sp)){
    if(it.state === 'running') log('ops', 'note', `${wName(it)} on ${sp.name} lost ${why}. ${it.cost} cr investment gone.`);
    else S.funds += it.cost;
    removeItem(it);
  }
}
function stepSchedule(){
  for(const it of runningItems()){
    const sp = it.sp ? specById(it.sp) : null;
    if(it.kind === 'study' && (!sp || !sp.alive)){ removeItem(it); continue; }
    if(it.multi && it.setupUntil && S.t >= it.setupUntil && it.crew.length){ it.setupUntil = 0; releaseCrew(it); }
    if(it.kind === 'study' && it.type === 'obs' && ANIMAL(sp)){ const per = it.dur / it.opts.reps; while(it.reps.length < it.opts.reps && S.t - it.start >= (it.reps.length + 1) * per - 0.01) it.reps.push({v:measureAgg(sp), sed:sp.sed, t:S.t}); }
    if(it.kind === 'study' && isTrigger(sp, it.type) && !it.rolled && S.t - it.start >= it.dur / 2){ it.rolled = true; incidentRoll(sp, it); if(it.state !== 'running' || !S.items.includes(it)) continue; }
    if(it.lane !== 'bench' && it.crew.length && rnd() < 0.07) sendTrip(it);
    if(S.t >= it.end) completeItem(it);
  }
  for(const lane of [...new Set(S.items.map(x => x.lane))]){
    const it = S.items.filter(x => x.lane === lane).sort((a, b) => a.start - b.start)[0];
    if(!it || it.state === 'running') continue;
    if(S.t < it.start){ if(it.why && !startBlock(it)) it.why = ''; continue; }
    const why = startBlock(it);
    if(why){
      it.why = why;
      /* Waiting on scheduled work parks at that work's end and stays put. A
         transient shortage (no crew free, lab halted) only steps the item aside
         when something else in the lane could use the slot; otherwise it holds
         position and retries, instead of crawling across the day for no reason. */
      const pre = preEndFor(it);
      const waiting = S.items.some(x => x.lane === lane && x !== it && x.state !== 'running');
      const nb = pre > S.t ? pre : waiting ? S.t + 1 : it.notBefore;
      if(nb !== it.notBefore){ it.notBefore = nb; planLane(lane); }
      S.dirty = true; continue;
    }
    startItem(it); S.dirty = true;
  }
}
function completeItem(it){
  /* Credit the hours before the crew is released. */
  const did = crewOf(it), disc = MODE_STAT[it.mode];
  for(const a of did){ awardXp(a, disc, it.dur); if(it.multi) awardXp(a, 'nerve', it.dur * 0.1); }
  removeItem(it);
  if(it.kind === 'job'){
    const t = jobTargetById(it.type, it.tgt) || it.tobj;
    if(!t){ S.dirty = true; return; }
    const r = JOBS[it.type].run(t, it);
    S.dayDone.push({name:wName(it), text:r.text, spName:'', flagged:false});
    say(r.who || S.lead || 'okafor', r.mood || 'neutral', r.text, {kind:'finding'});
    if(r.after) r.after();
    S.dirty = true; return;
  }
  const sp = specById(it.sp), id = it.type;
  const V = S.lead === 'vasko', L = S.lead || 'okafor';
  const res = RUN[id](sp, it, V);
  if(res){
    if(res.text !== undefined){
      const why = recordFind(sp, id, res, it);
      if(why){
        res.flagged = true; res.ok = false;
        res.line = res.line ? [res.line[0] === 'excited' || res.line[0] === 'smug' ? 'uneasy' : res.line[0], res.line[1] + ' ' + why] : ['uneasy', why];
      }
    }
    if(res.line) say(L, res.line[0], res.line[1], {kind:res.kind || (res.flagged ? 'anomaly' : 'finding')});
    if(res.after) res.after();
  }
  S.dayDone.push({sp:sp.id, name:STUDIES[id].name(sp), text:res && res.text, flagged:!!(res && res.flagged), spName:sp.name});
  if(res && res.flagged) askRerun(sp, id);
  checkContradictions(sp);
  if(!sp.t1Said && tierDone(sp, 1) && sp.grantTier < 1){ sp.t1Said = true; S.ui.report = sp.id; sp.t1By = S.lead || 'okafor'; }
  else { const g = suggestFor(sp); if(g) notify(g.who, g.text, 'note'); }
  S.dirty = true;
}
function authorizeOTDay(d){
  if(S.ot[d] || (d === dayOf(S.t) && hourOf(S.t) >= WORK_END)) return;
  S.ot[d] = true; S.funds -= OT_COST; S.otCount++;
  log('pruitt', 'admin', `Overtime authorized for ${fmtT(d * 24).split(' ').slice(0, 2).join(' ')}: shift runs to ${OT_END}:00. ${OT_COST} cr.`);
  if(S.otCount === 3 && !S.hazardPay) notify('bea', "Third overtime shift. The techs are tired, and tired people skip steps.", 'warning');
  replanAll();
}
function authorizeOT(){
  const d = dayOf(S.t);
  if(S.ot[d] || hourOf(S.t) >= WORK_END) return;
  S.ot[d] = true; S.funds -= OT_COST; S.otCount++;
  log('pruitt', 'admin', `Overtime authorized for ${fmtT(d * 24).split(' ').slice(0, 2).join(' ')}: shift runs to ${OT_END}:00. ${OT_COST} cr.`);
  if(S.otCount === 3 && !S.hazardPay) notify('bea', "Third overtime shift. The techs are tired, and tired people skip steps.", 'warning');
  replanAll();
}


/* A finding came back unreliable and later work is already queued on top of it.
   Stop and ask, because building a dossier on bad data is the mistake the game
   is about: a rerun costs a day, and not rerunning costs the paper. */
function askRerun(sp, id){
  const deps = S.items.filter(x => x.kind === 'study' && x.sp === sp.id && (PRE[x.type] || []).includes(id) && x.state !== 'running');
  if(!deps.length || !canQueueMore(sp, id)) return;
  const who = S.lead || 'okafor';
  const nm = STUDIES[id].name(sp).toLowerCase();
  const names = deps.map(x => STUDIES[x.type].name(sp).toLowerCase());
  say(who, 'uneasy', `The ${nm} on ${sp.name} is unreliable, and ${names.join(' and ')} ${deps.length > 1 ? 'are' : 'is'} queued behind it. Everything we build on this inherits the problem. Rerun it first, or carry on?`, {kind:'anomaly', choices:[
    {label:`Rerun the ${nm} first`, act:() => {
      const w = {kind:'study', type:id, sp:sp.id};
      const why = workBlock(w, S.ui);
      if(why){ notify('ops', why, 'admin'); return; }
      const it = makeItem(w, S.ui, fitSlot(S.t, wDur(w, S.ui), wMulti(w)));
      /* Push the work that depends on it behind the rerun. */
      for(const d of deps){ d.notBefore = Math.max(d.notBefore || 0, it.end); d.start = Math.max(d.start, it.end); }
      [...new Set([it.lane, ...deps.map(d => d.lane)])].forEach(planLane);
      S.dirty = true;
    }},
    {label:'Carry on with what we have', act:() => { log(who, 'note', `Director chose to build on the unreliable ${nm} for ${sp.name}.`); }}
  ]});
}
