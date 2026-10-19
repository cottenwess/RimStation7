/* ================= planner ================= */
function trayWork(){
  const out = [];
  for(const sp of S.specs.filter(s => s.alive)){
    const sk = suggestedKey(sp);
    for(const id of STUDY_ORDER){
      if(!STUDIES[id].applies(sp) || !shown(sp, id) || !canQueueMore(sp, id)) continue;
      const flagged = sp.find[id] && sp.find[id].flagged; if(sp.find[id] && !flagged) continue;
      if(!availSoon(sp, id)) continue;
      const w = {kind:'study', type:id, sp:sp.id}, lane = wLane(w); if(!lane) continue;
      const ql = itemsFor(sp, id).length;
      const pend = pendingPre(sp, id);
      out.push({w, lane, name:STUDIES[id].name(sp) + (ql ? ` · round ${ql + 1}` : ''), sub:sp.name + (ql ? ` · ${roundsLeft(sp, id)} more possible` : ''), rerun:flagged, star:sk === `study:${id}:${sp.id}`, tier:STUDIES[id].tier,
        after:pend.length ? pend.map(n => STUDIES[n].name(sp)).join(' and ') : '',
        alt:wLanes(w).slice(1).map(laneName).join(' or ')});
    }
  }
  for(const type in JOBS){
    if(!labOfType(JOBS[type].lab)) continue;
    for(const t of jobTargets(type)){
      const w = {kind:'job', type, tgt:t.id}, lane = wLane(w); if(S.items.some(x => sameWork(x, w))) continue;
      const sk = JOBS[type].of === 'spec' ? suggestedKey(t) : '';
      out.push({w, lane, name:JOBS[type].name(t), sub:t.short || t.name, rerun:false, star:sk === `job:${type}:${t.id}`, desc:JOBS[type].desc(t)});
    }
  }
  return out;
}
/* Why a queued item cannot start yet, in the player's words. */
function waitWhy(it){
  if(it.state === 'running') return '';
  if(it.why) return it.why;
  if(it.notBefore > S.t){
    const sp = it.sp ? specById(it.sp) : null;
    if(it.kind === 'study' && it.type === 'obs' && sp && ANIMAL(sp)) return `waiting on the sedative to clear, ${fmtShort(it.notBefore)}`;
    return `cannot start before ${fmtShort(it.notBefore)}`;
  }
  return '';
}
const wKey = w => `${w.kind}|${w.type}|${w.sp || ''}|${w.tgt || ''}`;
function parseKey(k){ const [kind, type, sp, tgt] = k.split('|'); return {kind, type, sp:sp || null, tgt:tgt || null}; }
function plannerDay(){ return hourOf(S.t) >= (S.ot[dayOf(S.t)] ? OT_END : WORK_END) ? dayOf(S.t) + 1 : dayOf(S.t); }
function plannerSheet(){
  const d = plannerDay(), ws = d * 24 + WORK_START, we = dayEnd(d), span = we - ws, ot = !!S.ot[d];
  const Y = S.yesterday, D = S.deadline;
  const hours = []; for(let h = WORK_START; h < WORK_START + span; h++) hours.push(h);
  const techs = onStation().filter(a => !a.injured).length;
  const load = hours.map(h => { const t = ws + h - WORK_START; return S.items.filter(x => x.start <= t && t < (x.multi ? x.start + 1 : x.end)).reduce((a, x) => a + (x.mode === 'handle' ? 2 : 1), 0); });
  const rows = laneRows().map(r => {
    const its = S.items.filter(x => x.lane === r.key && x.start < we && x.end > ws);
    const blocks = its.map(it => { const a = Math.max(it.start, ws), e = Math.min(it.end, we);
      return `<div class="pblk ${blkCls(it)} ${it.state}${waitWhy(it) ? ' waiting' : ''}" data-item="${it.id}" style="left:${(a - ws) / span * 100}%;width:${(e - a) / span * 100}%" title="${itemLabel(it)} · ${itemStatus(it)}${waitWhy(it) ? ' · ' + waitWhy(it) : ''}${it.state === 'running' ? '' : ' · drag to move, drag to the list to unschedule'}"><b>${wName(it)}</b><small>${itemSp(it) ? itemSp(it).name + ' · ' : ''}${it.multi ? it.dur + ' h' : hh(it.start) + '–' + hh(it.end)}</small></div>`; }).join('');
    /* Work pushed past tonight (a sedative washout, a full lane) still belongs on
       the schedule: it is parked at the edge with the hour it can actually start,
       so it can be seen and dragged rather than vanishing into a counter. */
    const beyond = S.items.filter(x => x.lane === r.key && x.start >= we).sort((a, b) => a.start - b.start);
    const parked = beyond.map((it, i) => `<div class="pblk ${blkCls(it)} ${it.state} parked${waitWhy(it) ? ' waiting' : ''}" data-item="${it.id}" style="right:${i * 7}px" title="${itemLabel(it)} · starts ${fmtShort(it.start)}${waitWhy(it) ? ' · ' + waitWhy(it) : ''} · drag onto the row to bring it forward"><b>${wName(it)}</b><small>${fmtShort(it.start)}</small></div>`).join('');
    return `<div class="prow" data-lane="${r.key}"><div class="plab">${r.label}${beyond.length ? `<em>+${beyond.length} later</em>` : ''}</div><div class="ptrack" data-lane="${r.key}">${hours.map((h, i) => `<span class="phr ${ws + i < S.t ? 'past' : ''} ${h >= WORK_END ? 'ot' : ''}" style="left:${i / span * 100}%;width:${100 / span}%"></span>`).join('')}${blocks}${parked}</div></div>`;
  }).join('');
  const tray = trayWork(), groups = {};
  for(const c of tray) (groups[c.lane] = groups[c.lane] || []).push(c);
  const trayLaneName = k => k === 'bench' ? 'Hub bench' : laneLab(k).name;
  const trayHtml = Object.keys(groups).length ? Object.keys(groups).map(k => `<div class="tgrp"><div class="eyebrow">${trayLaneName(k)}</div>${groups[k].map(c => {
      const o = S.ui, dur = wDur(c.w, o), cost = wCost(c.w, o), risky = wTrigger(c.w);
      const rk = risky && c.w.kind === 'study' ? riskLabel(riskEst(specById(c.w.sp), c.w.type, o)) : risky ? {name:'Volatile', cls:'high'} : null;
      return `<div class="tcard ${c.star ? 'star' : ''}" data-work="${wKey(c.w)}" tabindex="0" title="${c.desc || ''}${c.alt ? (c.desc ? ' ' : '') + 'Can also run in ' + c.alt + '.' : ''}"><div><b>${c.star ? '★ ' : ''}${c.name}</b><small>${c.sub} · ${dur} h${wMulti(c.w) ? ' around the clock' : ''} · ${cost} cr</small></div><div class="ttags">${c.rerun ? '<span class="tag-rerun">RERUN</span>' : ''}${c.after ? `<span class="tag-after" title="Can be scheduled now, and waits until the ${c.after.toLowerCase()} has run">AFTER ${c.after.toUpperCase()}</span>` : ''}${rk ? `<span class="tag-risk r-${rk.cls}">${rk.name.toUpperCase()}</span>` : ''}${c.alt ? `<span class="tag-alt" title="Drag onto ${c.alt} to run it there instead of the hub bench">OR ${c.alt.toUpperCase()}</span>` : ''}${c.tier ? `<span class="tierpill">T${c.tier}</span>` : ''}<button type="button" class="tadd" data-act="tadd:${wKey(c.w)}" aria-label="Add at the earliest slot" title="Add at the earliest slot">+</button></div></div>`; }).join('')}</div>`).join('')
    : '<p class="muted small">Nothing to schedule right now.</p>';
  const yHtml = Y ? `<div class="pyday"><b>Day ${Y.day}:</b> ${Y.done.length ? Y.done.map(x => `<span class="ychip ${x.flagged ? 'bad' : ''}" title="${(x.text || '').replace(/"/g, '&quot;')}">${x.name}${x.spName ? ' · ' + x.spName : ''}${x.flagged ? ' (unreliable)' : ''}</span>`).join('') : '<span class="muted">no studies finished</span>'}${Y.notes.length ? Y.notes.map(n => `<span class="ychip bad" title="${n.text.replace(/"/g, '&quot;')}">${PEOPLE[n.who] ? PEOPLE[n.who].name.split(' ').pop() : n.who}: ${n.text.slice(0, 60)}${n.text.length > 60 ? '…' : ''}</span>`).join('') : ''}<span class="ychip">${Y.net >= 0 ? '+' : ''}${Y.net} cr</span>${Y.injuries || Y.deaths ? `<span class="ychip bad">${Y.injuries} hurt · ${Y.deaths} dead</span>` : ''}</div>` : '';
  return `<div class="planner" role="dialog" aria-labelledby="plT">
    <header class="ph"><div><div class="eyebrow">Day planner</div><h2 id="plT">${fmtT(d * 24).split(' ').slice(0, 2).join(' ')} · shift ${String(WORK_START).padStart(2, '0')}:00–${ot ? OT_END : WORK_END}:00</h2></div>
      <div class="row">${!ot && (d > dayOf(S.t) || hourOf(S.t) < WORK_END) ? `<button type="button" class="btn" data-act="otd:${d}">Overtime to ${OT_END}:00 · ${OT_COST} cr</button>` : ot ? '<span class="hint">Overtime on</span>' : ''}<span class="chip"><b>FUNDS</b>${Math.round(S.funds)} cr</span>${D ? `<span class="chip ${D.t - S.t < 48 ? 'warn' : ''}"><b>PAPER DUE</b>${fmtShort(D.t).split(' ')[0]}</span>` : ''}${S.phase === 'evening' ? '<button type="button" class="btn primary" data-act="planner-close">Back to the briefing</button>' : S.phase === 'morning' ? '<button type="button" class="btn primary" data-act="startday">Run the day ▶</button>' : '<button type="button" class="btn primary" data-act="planner-close">Close</button>'}</div></header>
    ${yHtml}
    <div class="pbody"><aside class="ptray" data-tray="1"><div class="eyebrow">Available work</div>${trayHtml}</aside>
      <div class="pgrid"><div class="phead"><div class="plab"></div><div class="ptrack">${hours.map((h, i) => `<span style="left:${i / span * 100}%">${String(h).padStart(2, '0')}</span>`).join('')}</div></div>
        ${rows}
        <div class="prow pload"><div class="plab">Techs<small>${techs} on duty</small></div><div class="ptrack">${load.map((n, i) => `<span class="pl ${n > techs ? 'over' : n ? 'on' : ''}" style="left:${i / span * 100}%;width:${100 / span}%">${n || ''}</span>`).join('')}</div></div>
        <p class="muted small">Drag work onto its lab's row at the hour you want. Drag a block sideways to move it, or back to the list to unschedule. Hands-on work has to finish inside the shift. Multi-day work runs around the clock.</p>
      </div></div></div>`;
}
let pdrag = null;
function plannerHit(x, y){
  const el = document.elementFromPoint(x, y); if(!el) return null;
  const tray = el.closest('[data-tray]'); if(tray) return {tray:true};
  const tr = el.closest('.ptrack[data-lane]'); if(!tr) return null;
  const r = tr.getBoundingClientRect(), d = plannerDay(), span = dayEnd(d) - (d * 24 + WORK_START);
  const h = Math.floor((x - r.left - (pdrag && pdrag.grabX || 0)) / r.width * span + .5);
  return {lane:tr.dataset.lane, start:d * 24 + WORK_START + clamp(h, 0, span - 1), track:tr};
}
document.addEventListener('pointerdown', e => {
  const pl = e.target.closest && e.target.closest('.planner'); if(!pl || e.target.closest('button')) return;
  const card = e.target.closest('.tcard'), blk = e.target.closest('.pblk.queued');
  if(!card && !blk) return;
  e.preventDefault();
  const src = card ? {w:parseKey(card.dataset.work)} : {item:S.items.find(x => x.id === blk.dataset.item)};
  if(src.item === undefined && !src.w) return;
  const el = card || blk, r = el.getBoundingClientRect();
  const g = document.createElement('div'); g.className = 'pghost'; g.textContent = card ? card.querySelector('b').textContent : blk.querySelector('b').textContent;
  document.body.appendChild(g);
  pdrag = {...src, ghost:g, x0:e.clientX, y0:e.clientY, moved:false, el, grabX:blk ? e.clientX - r.left : 0};
  g.style.left = e.clientX + 'px'; g.style.top = e.clientY + 'px';
});
document.addEventListener('pointermove', e => {
  if(!pdrag) return;
  if(Math.hypot(e.clientX - pdrag.x0, e.clientY - pdrag.y0) > 4) pdrag.moved = true;
  pdrag.ghost.style.left = e.clientX + 'px'; pdrag.ghost.style.top = e.clientY + 'px';
  document.querySelectorAll('.pprev').forEach(n => n.remove());
  const h = plannerHit(e.clientX, e.clientY);
  if(h && h.lane){
    const w = pdrag.item || pdrag.w, d = plannerDay(), span = dayEnd(d) - (d * 24 + WORK_START), dur = pdrag.item ? pdrag.item.dur : wDur(w, S.ui);
    const why = pdrag.item ? placeCheck(pdrag.item, h.lane, h.start, pdrag.item.opts, pdrag.item) : (workBlock(w, S.ui) || placeCheck(w, h.lane, h.start, S.ui));
    const p = document.createElement('span'); p.className = 'pprev ' + (why ? 'bad' : 'ok');
    p.style.left = (h.start - (d * 24 + WORK_START)) / span * 100 + '%'; p.style.width = Math.min(dur, span) / span * 100 + '%';
    p.title = why; h.track.appendChild(p); pdrag.ghost.dataset.why = why || '';
  } else pdrag.ghost.dataset.why = '';
});
document.addEventListener('pointerup', e => {
  if(!pdrag) return;
  const D0 = pdrag; pdrag = null; D0.ghost.remove(); document.querySelectorAll('.pprev').forEach(n => n.remove());
  if(!D0.moved){ if(D0.w && D0.w.kind === 'study'){ S.ui.spec = D0.w.sp; S.ui.sel = D0.w.type; S.ui.studyOpen = true; S.dirty = true; } return; }
  const h = plannerHit(e.clientX, e.clientY); if(!h) return;
  let err = '';
  if(h.tray){ if(D0.item) cancelItem(D0.item); }
  else if(D0.item) err = moveItem(D0.item, h.start, h.lane);
  else err = placeWork(D0.w, h.lane, h.start);
  if(err) notify('ops', err, 'admin');
  S.dirty = true;
});

