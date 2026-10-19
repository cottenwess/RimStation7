/* ================= actions and input ================= */
function act(a){
  const [k, v] = a.split(':');
  if(k === 'tab'){ S.ui.tab = v; S.dirty = true; return; }
  if(k === 'speed'){ if(S.phase === 'evening' && +v) return; S.speed = +v; if(S.speed){ S.lastSpeed = S.speed; S.ui.planner = false; if(S.phase === 'morning') S.phase = 'shift'; } renderTop(); S.dirty = true; return; }
  if(k === 'zoom'){ zoomBy(+v); return; }
  if(k === 'newrun'){
    if(S.over){ newRun(); return; }
    say('ops', 'neutral', 'Starting a new survey ends this one. Nothing from Rim Station 7 carries over. Save the run first if you want to come back to it.', {log:false, choices:[
      {label:'Start a new survey', act:() => newRun()},
      {label:'Keep this run', act:() => { S.dirty = true; }}
    ]});
    return;
  }
  if(k === 'save'){ const why = writeSlot(v); notify('ops', why || `Run saved to slot ${v}.`, 'admin'); S.dirty = true; return; }
  if(k === 'load'){ const why = loadSlot(v); if(why) notify('ops', why, 'admin'); S.dirty = true; return; }
  if(k === 'delsave'){ deleteSlot(v); S.dirty = true; return; }
  if(S.over) return;
  const sp = selSpec();
  switch(k){
    case 'spec': S.ui.spec = v; S.ui.sel = 'obs'; S.ui.studyOpen = false; break;
    case 'sel': S.ui.sel = v; S.ui.studyOpen = true; break;
    case 'study-close': S.ui.studyOpen = false; break;
    case 'report': S.ui.report = v; break;
    case 'unfocus': S.ui.focus = null; break;
    case 'dossier': S.ui.spec = v; S.ui.tab = 'research'; S.ui.studyOpen = false; break;
    case 'plan': S.ui.spec = v; S.ui.sel = a.split(':')[2]; S.ui.tab = 'research'; S.ui.studyOpen = true; break;
    case 'report-close': S.ui.report = null; break;
    case 'report-publish': S.ui.report = null; S.ui.tab = 'papers'; break;
    case 'planet': S.ui.planet = +v; S.ui.planetPicked = true; break;
    case 'begin': { const n = S.items.length; scheduleExp(); if(S.items.length > n) S.ui.studyOpen = false; break; }
    case 'cancel': { const it = S.items.find(x => x.id === v); if(it) cancelItem(it); break; }
    case 'ot': authorizeOT(); break;
    case 'startday': startDay(); break;
    case 'planner': S.ui.planner = true; S.ui.studyOpen = false; break;
    case 'planner-close': S.ui.planner = false; break;
    case 'evening': S.ui.evening = true; break;
    case 'evening-hide': S.ui.evening = false; break;
    case 'mission-open': S.ui.mission = true; break;
    case 'mission-close': S.ui.mission = false; break;
    case 'closeday': closeDay(); break;
    case 'otd': authorizeOTDay(+v); break;
    case 'tadd': case 'qjob': {
      const w = k === 'tadd' ? parseKey(a.slice(5)) : {kind:'job', type:v, tgt:a.split(':')[2]};
      if(w.kind === 'study'){ S.ui.spec = w.sp; S.ui.sel = w.type; S.ui.studyOpen = true; }
      else { const why = workBlock(w, S.ui); if(why) notify('ops', why, 'admin'); else makeItem(w, S.ui); }
      break;
    }
    case 'cmp': { const [, how, id] = a.split(':'), c = tgtCompound(id); if(!c) break;
      if(how === 'lic') licenseCompound(c); else if(how === 'dir') sellCompound(c); else if(how === 'hold') c.state = 'held';
      else { c.state = how; log('ops', 'admin', `${c.name} sent to the ${how === 'micro' ? 'Micro' : 'Chem'} Lab.`); }
      break; }
    case 'mat': { const m = tgtMaterial(a.split(':')[2]); if(m && m.stressed && m.state === 'held'){ m.state = 'licensed'; S.funds += m.value; log('pruitt', 'admin', `Licensed ${m.name} data: +${m.value} cr.`); } break; }
    case 'assign': assignLead(v); break;
    case 'pull': pullLead(false); break;
    case 'dispatch': { S.ui.planetPicked = true; const before = S.mission; dispatch(S.planets[+v]); if(!before && S.mission) S.ui.mission = false; break; }
    case 'build': buildLab(+v); break;
    case 'ship': releaseSpec(specById(v), 'ship'); break;
    case 'euth': releaseSpec(specById(v), 'euth'); break;
    case 'tut-off': S.tut.on = false; break;
    case 'hire': hireStaff(v); break;
    case 'benchonly': { const a = byId(v); if(a) a.benchOnly = !a.benchOnly; break; }
    case 'hazard': S.hazardPay = true; S.slowdown = false; log('bea', 'admin', 'Hazard pay approved. Techs back to normal pace.'); break;
    case 'bsl-up': { if(!canDecide()){ notify('pruitt', 'Maintenance is scheduled at the end of the shift.', 'admin'); break; } const L = S.labs[+v]; const o = budgetTag(35); S.funds -= 35; L.bsl = 3; log('ops', 'admin', `${L.name} upgraded to BSL-3.${o ? ' Approved, ' + o + '.' : ''}`); break; }
    case 'bsl-down': { if(!canDecide()){ notify('pruitt', 'Maintenance is scheduled at the end of the shift.', 'admin'); break; } const L = S.labs[+v]; L.bsl = 2; log('ops', 'admin', `${L.name} downgraded to BSL-2 to save upkeep.`); break; }
    case 'repair': { if(!canDecide()){ notify('pruitt', 'Maintenance is scheduled at the end of the shift.', 'admin'); break; } const L = S.labs[+v]; const o = budgetTag(18); S.funds -= 18; L.integrity = Math.min(100, L.integrity + 30); log('ops', 'admin', `${L.name} repaired: +30% integrity.${o ? ' Approved, ' + o + '.' : ''}`); break; }
    case 'match': { if(!canDecide()){ notify('pruitt', 'Maintenance is scheduled at the end of the shift.', 'admin'); break; } const L = S.labs[+v], cs = labSpec(L); if(cs){ const o = budgetTag(10); S.funds -= 10; L.envMatched = true; log('ops', 'admin', `${L.name} environment matched to ${cs.name}.${o ? ' Approved, ' + o + '.' : ''}`); } break; }
    case 'publish-open': openPublish(); break;
    case 'publish-cancel': $('#pub').hidden = true; break;
    case 'publish-confirm': { const rec = +((document.querySelector('input[name="rec"]:checked') || {}).value || 2); $('#pub').hidden = true; if(sp) publish(sp, rec); break; }
    case 'retract': if(sp) retract(sp); break;
    case 'surprise': if(!S.inspector && !S.breach && S.t - S.lastSurprise >= 24) startWalkthrough('surprise'); break;
    case 'close-study': endRun('closed'); break;
    case 'fs': doFailsafe(v); break;
    case 'hold': escalate(''); break;
  }
  tutTick();
  S.dirty = true;
}
document.addEventListener('click', e => {
  if(e.target.id === 'report'){ S.ui.report = null; S.dirty = true; return; }
  if(e.target.id === 'study'){ S.ui.studyOpen = false; S.dirty = true; return; }
  const btn = e.target.closest('[data-act]');
  if(!btn || btn.disabled) return;
  act(btn.dataset.act);
});
document.addEventListener('change', e => {
  const el = e.target; const k = el.dataset && el.dataset.opt; if(!k) return;
  if(k === 'reps') S.ui.reps = +el.value;
  else if(k === 'washout') S.ui.washout = +el.value;
  else if(k === 'mit') S.ui.mit = el.value;
  else S.ui[k] = el.checked;
  S.dirty = true;
});

