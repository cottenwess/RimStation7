/* ================= UI ================= */
function renderAll(){ renderTop(); renderPanel(); renderOverlays(); renderInspect(); }
function renderTop(){
  const built = S.labs.filter(L => L.built).length, open = openLabs().length, weak = S.labs.some(L => L.built && L.integrity < 50);
  const m = S.mission ? Math.max(0, S.mission.start + S.mission.dur * 2 - S.t) : null;
  const D = S.deadline, dl = D ? D.t - S.t : 999;
  const live = S.specs.some(s => s.alive) && !S.over;
  $('#stats').innerHTML = `${live && S.phase === 'evening' && !S.ui.evening ? `<button type="button" class="btn primary startday pulse" data-act="evening">Evening briefing</button>` : ''}${live && !S.ui.planner ? `<button type="button" class="btn ${S.phase === 'morning' ? 'primary pulse' : ''} startday" data-act="planner">${S.phase === 'morning' ? `Plan ${fmtT(S.t).split(' ').slice(0, 2).join(' ')}` : 'Day planner'}</button>` : ''}
    <span class="chip"><b>TIME</b>${fmtT(S.t)}</span>
    <span class="chip ${overBudget() ? 'bad' : S.funds < 60 ? 'warn' : ''}" title="${overBudget() ? `Over budget by ${Math.round(deficit())} cr. Work continues; Meridian's confidence does not.` : 'Grant remaining'}"><b>${overBudget() ? 'OVER BUDGET' : 'FUNDS'}</b>${overBudget() ? '-' + Math.round(deficit()) : Math.round(S.funds)} cr</span>
    <span class="chip ${S.standing < 25 ? 'bad' : S.standing < 45 ? 'warn' : ''}"><b>STANDING</b>${Math.round(S.standing)}</span>
    ${D ? `<span class="chip ${dl < 0 ? 'bad' : dl < 48 ? 'warn' : ''}" title="Meridian deadline for a Tier ${D.tier} paper"><b>PAPER DUE</b>${fmtShort(D.t).split(' ')[0]}</span>` : ''}
    <span class="chip ${weak ? 'bad' : ''}"><b>LABS</b>${built} built · ${open} open</span>
    ${m !== null ? `<span class="chip warn"><b>MISSION</b>${m} h</span>` : ''}
    <span class="chip ${S.deaths + S.downstream ? 'bad' : ''}" title="Dead on station · dead at partner labs"><b>DEAD</b>${S.deaths} · ${S.downstream} ext</span>`;
  ['0', '1', '3', '6'].forEach(n => $('#sp' + n).setAttribute('aria-pressed', String(S.speed === +n)));
}
function updateLive(){
  renderTop(); renderInspect();
  document.querySelectorAll('[data-prog]').forEach(el => { const it = S.items.find(x => x.id === el.dataset.prog); if(it && it.state === 'running') el.style.width = Math.round(clamp((S.t - it.start) / it.dur, 0, 1) * 100) + '%'; });
  const nowm = $('#nowMark'); if(nowm){ const d = dayOf(S.t), ws = d * 24 + WORK_START, span = dayEnd(d) - ws; nowm.style.left = clamp((S.t - ws) / span, 0, 1) * 100 + '%'; }
  const mb = $('#misBar');
  if(mb && S.mission){ mb.style.width = Math.round((S.t - S.mission.start) / (S.mission.dur * 2) * 100) + '%'; }
}
function itemSp(it){ return it.sp ? specById(it.sp) : null; }
function itemLabel(it){ const sp = itemSp(it); return `${wName(it)}${sp ? ' · ' + sp.name : ''}`; }
function itemStatus(it){
  const sp = itemSp(it);
  if(it.state === 'running'){
    if(it.kind === 'study' && it.type === 'obs' && sp && ANIMAL(sp) && it.reps.length) return `Scores so far: ${it.reps.map(r => f2(r.v)).join(', ')}`;
    return it.multi ? `Running around the clock. Done ${fmtShort(it.end)}.` : `Underway. Done ${hh(it.end)}.`;
  }
  return `${it.why ? it.why + '. ' : ''}${dayOf(it.start) === dayOf(S.t) ? 'Today' : dayOf(it.start) === dayOf(S.t) + 1 ? 'Tomorrow' : fmtShort(it.start).split(' ')[0]} ${hh(it.start)}${it.multi ? `, runs ${it.dur} h` : `–${hh(it.end)}`}`;
}
function laneRows(){
  const rows = [];
  for(const L of rowLabs('E').concat(rowLabs('S'))){ if(!L.built) continue; const sp = labSpec(L); rows.push({key:'L' + L.k, label:`${L.name}<small>${sp ? sp.name : LAB_TYPES[L.type].holds.length ? 'empty' : LAB_TYPES[L.type].label}</small>`}); }
  rows.push({key:'bench', label:'Hub bench<small>shared</small>'});
  return rows;
}
const blkCls = it => it.mode === 'bench' ? 'm-bench' : it.mode === 'observe' ? 'm-obs' : 'm-hand';
function scheduleCard(){
  const d = dayOf(S.t), ws = d * 24 + WORK_START, we = dayEnd(d), span = we - ws, ot = !!S.ot[d];
  const ticks = []; for(let h = WORK_START; h <= (ot ? OT_END : WORK_END); h += 4) ticks.push(h);
  if(ot && ticks[ticks.length - 1] !== OT_END) ticks.push(OT_END);
  const lanes = laneRows().map(r => {
    const its = S.items.filter(x => x.lane === r.key && x.start < we && x.end > ws);
    const blocks = its.map(it => { const a = Math.max(it.start, ws), e = Math.min(it.end, we);
      return `<span class="blk ${blkCls(it)} ${it.state}" style="left:${(a - ws) / span * 100}%;width:${Math.max(2, (e - a) / span * 100)}%" title="${itemLabel(it)} · ${itemStatus(it)}">${it.state === 'running' ? `<i data-prog="${it.id}" style="width:${Math.round(clamp((S.t - it.start) / it.dur, 0, 1) * 100)}%"></i>` : ''}<em>${wName(it)}</em></span>`; }).join('');
    return `<div class="lane"><div class="lane-l">${r.label}</div><div class="lane-t">${blocks}${ot ? `<span class="otzone" style="left:${(WORK_END - WORK_START) / span * 100}%"></span>` : ''}</div></div>`;
  }).join('');
  const D = S.deadline, left = D ? D.t - S.t : 0;
  return `<section class="card sched"><div class="eyebrow">Today · ${fmtT(S.t).split(' ').slice(0, 2).join(' ')} · shift ${String(WORK_START).padStart(2, '0')}:00–${ot ? OT_END : WORK_END}:00</div>
    <div class="tl"><div class="tl-ticks">${ticks.map(h => `<span style="left:${(h - WORK_START) / span * 100}%">${String(h).padStart(2, '0')}</span>`).join('')}</div>${lanes}<div class="tl-over"><span class="now" id="nowMark" style="left:${clamp((S.t - ws) / span, 0, 1) * 100}%"></span></div></div>
    <div class="row"><button type="button" class="btn primary" data-act="planner">Open the planner</button>${S.items.length ? `<span class="muted small">${S.items.length} block${S.items.length > 1 ? 's' : ''} scheduled</span>` : ''}</div>
    ${D ? `<p class="small ${left < 48 ? 'why' : 'muted'}">Meridian expects a Tier ${D.tier} paper by ${fmtT(D.t)}${left > 0 ? ` (${left < 48 ? left + ' h' : Math.round(left / 24) + ' days'} left)` : ''}.</p>` : ''}
  </section>`;
}

