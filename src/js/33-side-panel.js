/* ================= side panel ================= */
function renderPanel(){
  ['research', 'planets', 'papers', 'staff', 'lab', 'notes'].forEach(t => $('#tab-' + t).setAttribute('aria-selected', String(S.ui.tab === t)));
  const bad = S.specs.some(sp => sp.paper && sectionsFor(sp).some(s => claimStatus(sp, s)[1] === 'bad'));
  $('#tab-papers').innerHTML = 'Papers' + (bad ? '<span class="dot" aria-label="A paper is contradicted"></span>' : '');
  const pane = $('#pane');
  const html = (S.ui.tab === 'notes' ? '' : guideCard()) + {research:paneResearch, planets:panePlanets, papers:panePapers, staff:paneStaff, lab:paneLab, notes:paneNotes}[S.ui.tab]();
  const scroll = pane.scrollTop;
  pane.innerHTML = html; pane.scrollTop = scroll;
  pane.querySelectorAll('canvas[data-portrait]').forEach(c => drawPortrait(c.getContext('2d'), c.dataset.portrait, c.dataset.mood));
  pane.querySelectorAll('canvas[data-spec]').forEach(c => { const sp = specById(c.dataset.spec); if(sp) drawSpecIcon(c, sp); });
  pane.querySelectorAll('canvas[data-planet]').forEach(c => drawPlanetIcon(c, S.planets[+c.dataset.planet]));
  const map = $('#starmap'); if(map) drawStarMap(map, performance.now() / 1000);
}
function specChips(){
  return `<div class="specs">${S.specs.filter(s => s.alive).map(sp => {
    const sel = selSpec() && selSpec().id === sp.id, L = labOf(sp);
    return `<button type="button" class="spec ${sel ? 'sel' : ''}" data-act="spec:${sp.id}" aria-pressed="${sel}"><canvas data-spec="${sp.id}" width="36" height="26"></canvas><span><b>${sp.name}</b><small>${sp.code} · ${L ? L.name : 'Stasis'}</small></span></button>`;
  }).join('')}</div>`;
}
function paneResearch(){
  const sp = selSpec();
  if(!sp) return `<section class="card"><div class="eyebrow">No specimens yet</div><p class="small">${S.mission ? 'The recovery team is out. Whatever they bring back starts your research.' : 'Lab A is built and empty. Pick a world on the star map and send a recovery team.'}</p><div class="row"><button type="button" class="btn primary" data-act="tab:planets">Open the star map</button></div></section>`;
  const p = planetOf(sp), h = sinceSed(sp);
  let out = scheduleCard() + `<section class="card"><div class="eyebrow">Specimens · ${S.specs.filter(s => s.alive).length}</div>${specChips()}</section>`;
  out += `<section class="card">
    <div class="spec-head"><canvas data-spec="${sp.id}" width="36" height="26"></canvas><div><div class="eyebrow">${sp.code} · ${KIND_LABEL[sp.kind]}${sp.origin !== 'recovered' ? ' · ' + sp.origin : ''}</div><h3>${sp.name}</h3></div></div>
    <dl class="kv">
      <dt>From</dt><dd>${p.name} (${p.nick})</dd>
      <dt>Location</dt><dd>${labOf(sp) ? `${labOf(sp).name}, BSL-${labOf(sp).bsl}` : 'Stasis (sealed)'}</dd>
      ${ANIMAL(sp) ? `<dt>Last sedated</dt><dd>${h === null ? 'Never' : `${fmtShort(sp.lastSedT)} (${h} h ago)`}</dd>` : ''}
      ${sp.person ? `<dt>Status</dt><dd>${sp.person === 'recognized' ? 'Recognized as people' : 'Filed as specimen'}</dd>` : ''}
    </dl>
    <div class="row"><button type="button" class="btn" data-act="ship:${sp.id}" ${!sp.paper || itemsOf(sp).some(x => x.state === 'running') || S.breach ? 'disabled' : ''}>Ship to Meridian · +25 cr</button><button type="button" class="btn danger" data-act="euth:${sp.id}" ${itemsOf(sp).some(x => x.state === 'running') || S.breach || sp.person === 'recognized' ? 'disabled' : ''}>${ANIMAL(sp) ? 'Euthanize and preserve' : sp.kind === 'fossil' ? 'Scrap the specimen' : 'Destroy, keep samples'}</button></div>
    <p class="muted small">${sp.paper ? 'Releasing it frees its lab for the next specimen.' : 'Meridian takes specimens once they have a paper. Releasing one frees its lab.'}</p>
    </section>` + suggestCard(sp);
  const pillTxt = {open:'Ready', running:'Running', queued:'Scheduled', done:'Done', flagged:'Rerun advised'};
  const secs = sectionsFor(sp);
  const filled = secs.filter(s => claimFor(sp, s)).length;
  const t1 = tierStudies(sp, 1), t1d = t1.filter(id => valid(sp, id)).length;
  out += `<section class="card"><div class="eyebrow">Dossier · ${filled} of ${secs.length} sections filled</div>
    ${sp.grantTier < 1 ? `<p class="small ${t1d === t1.length ? 'hint' : 'muted'}">${t1d === t1.length ? 'Tier 1 complete. You can publish the first paper.' : `Tier 1: ${t1d} of ${t1.length} studies done. All are needed before the first paper.`}</p>` : ''}
    ${sp.t1Said ? `<div class="row"><button type="button" class="btn" data-act="report:${sp.id}">Read the Tier 1 report</button></div>` : ''}
    <div class="doss">` + secs.map(sec => {
      const c = claimFor(sp, sec);
      const ids = secIds(sp, sec).slice().reverse().filter(id => shown(sp, id));
      const flagged = !c && secIds(sp, sec).some(id => sp.find[id] && sp.find[id].flagged);
      if(!c && !flagged && !ids.length) return '';
      return `<div class="sec"><div class="sec-h"><span class="box ${c ? 'on' : flagged ? 'flag' : ''}" aria-hidden="true"></span><b>${secLabel(sp, sec)}</b></div>
        <p class="claim ${c ? '' : flagged ? 'flag' : 'empty'}">${c ? `${c.text} <span class="by">· ${c.by}</span>` : flagged ? 'Unreliable data. Needs a rerun.' : 'Empty'}</p>
        ${ids.length ? `<div class="studies">${ids.map((id, i) => studyBtn(sp, id, i, pillTxt)).join('')}</div>` : ''}</div>`;
    }).join('');
  const extras = ['biochem', 'revive', 'extract', 'clone'].filter(id => shown(sp, id));
  if(extras.length) out += `<div class="sec"><div class="sec-h"><span class="box" aria-hidden="true"></span><b>Applied research</b></div><div class="studies">${extras.map((id, i) => studyBtn(sp, id, 0, pillTxt)).join('')}</div></div>`;
  out += `</div></section>`;
  return out;
}
// Only what the player can act on: done, scheduled, or runnable now. Gated studies stay hidden.
function gated(sp, id){
  if(invasive(sp, id)) return true;
  if(studyMode(sp, id) !== 'bench' && !labOf(sp)) return true;
  if((id === 'clone' || id === 'revive') && !openLabs().length) return true;
  return slotPreview(sp, id, {...S.ui, mit:S.ui.mit}).tooLong;
}
const shown = (sp, id) => (visible(sp, id) || availSoon(sp, id)) && (found(sp, id) || !!itemFor(sp, id) || !gated(sp, id));
function studyBtn(sp, id, i, pillTxt){
  const st = studyState(sp, id), sel = S.ui.sel === id;
  const badge = studyMode(sp, id) === 'observe' ? '<span class="tag-safe" title="Sealed: no escape possible">SEALED</span>' : isTrigger(sp, id) ? (r => `<span class="tag-risk r-${r.cls}" title="Risk factor with standard precautions">RISK ${r.name.toUpperCase()}</span>`)(riskLabel(riskEst(sp, id, {mit:'std'}))) : '';
  return `<button type="button" class="study st-${st} ${sel ? 'sel' : ''} ${i ? 'follow' : ''}" data-act="sel:${id}" aria-pressed="${sel}"><span>${i ? '↳ ' : ''}${STUDIES[id].name(sp)}</span><span class="pills">${badge}<span class="tierpill">T${STUDIES[id].tier}</span><span class="pill">${pillTxt[st]}</span></span></button>`;
}
function riskBlock(sp, id, u){
  const p = riskEst(sp, id, u), r = riskLabel(p), f = riskFactors(sp, id);
  const base = STUDIES[id].cost(sp, u), w = STUDIES[id].work(sp, u);
  const opts = ['none', 'std', 'full'].map(k => { const m = MITIGATE[k], rr = riskLabel(riskEst(sp, id, {mit:k}));
    return `<label><input type="radio" name="mit" value="${k}" data-opt="mit" ${u.mit === k ? 'checked' : ''}><b>${m.label}</b><small>${rr.name} · ${m.costM > 1 ? '+' + (Math.round(base * m.costM) - base) + ' cr' : 'no extra cost'} · ${m.workM > 1 ? '+' + (Math.round(w * m.workM) - w) + ' h' : 'no extra time'}</small></label>`; }).join('');
  return `<div class="riskbox r-${r.cls}"><div class="risk-h"><b>Risk factor</b><span class="rk">${r.name}</span><span class="rbars" aria-hidden="true">${[1, 2, 3, 4].map(i => `<i class="${i <= r.n ? 'on' : ''}"></i>`).join('')}</span></div>
    ${f.length ? `<ul class="rfac">${f.map(x => `<li class="${x[1] > 1 ? 'up' : 'down'}">${x[1] > 1 ? '▲' : '▼'} ${x[0]}</li>`).join('')}</ul>` : ''}
    <p class="muted small">Hands-on work can go wrong. If it does, ${claimFor(sp, 'containment') ? `${sp.name} needs BSL-${sp.truth.bsl} and ${labOf(sp) ? labOf(sp).name : 'its lab'} is BSL-${labOf(sp) ? labOf(sp).bsl : 2}` : `nobody has measured what containment ${sp.name} needs yet`}, and that decides how bad.</p>
    <div class="mit-h">Precautions</div>
    <div class="mit">${opts}</div>
    <p class="small ${u.mit === 'none' ? 'why' : 'muted'}">${mitOf(u).desc}</p></div>`;
}
function designCard(sp){
  let id = S.ui.sel;
  if(!visible(sp, id)) id = S.ui.sel = STUDY_ORDER.find(k => visible(sp, k) && !valid(sp, k)) || 'obs';
  const st = STUDIES[id], u = S.ui, L = S.lead ? LEADS[S.lead] : null, mode = studyMode(sp, id);
  const cost = studyCost(sp, id, u);
  const hrs = Math.round((id === 'obs' && ANIMAL(sp) ? u.washout : 0) + studyWork(sp, id, u) / ((L ? L.speed : 1) * (S.slowdown ? 0.6 : 1)));
  const unlocks = STUDY_ORDER.filter(k => k !== id && STUDIES[k].applies(sp) && !visible(sp, k));
  let params = '';
  if(id === 'obs' && ANIMAL(sp)){
    const hs = sinceSed(sp);
    params = `
      <div class="row"><span class="muted small">Replicates</span><div class="seg">${[1, 2, 3].map(n => `<label><input type="radio" name="reps" value="${n}" data-opt="reps" ${u.reps === n ? 'checked' : ''}>${n}</label>`).join('')}</div></div>
      <div class="row"><span class="muted small">Washout first</span><div class="seg">${[0, 12, 24, 48, 72].map(n => `<label><input type="radio" name="wash" value="${n}" data-opt="washout" ${u.washout === n ? 'checked' : ''}>${n} h</label>`).join('')}</div></div>
      <label class="check"><input type="checkbox" data-opt="control" ${u.control ? 'checked' : ''}><span>Drug assay control (+6 cr)<small>Measures sedative in the blood before each session.</small></span></label>
      ${hs !== null ? `<p class="hint">${sp.name} was last sedated ${hs} h ago.${valid(sp, 'clearance') ? ` Your clearance data says wait ${sp.washKnown || '?'} h after a dose.` : sp.find.clearance ? ` Vasko's clearance data says wait ${Math.max(6, Math.round(sp.truth.sedHalf / 2))} h.` : ' You have no clearance data for it yet.'}</p>` : ''}`;
  } else if(id === 'stimulus'){
    params = `<label class="check"><input type="checkbox" data-opt="remote" ${u.remote ? 'checked' : ''}><span>Remote rig (+8 cr)<small>Runs the prey model by cable. Fewer people in the room.</small></span></label>`;
  }
  const safety = mode === 'observe' ? '<p class="safe-note"><b>Sealed study.</b> The specimen stays locked in its containment the whole time. It cannot escape during this study.</p>'
    : isTrigger(sp, id) ? riskBlock(sp, id, u)
    : sedates(sp, id) ? '<p class="hint">Sedates the specimen. Behavior studies will be confounded for a while afterward.</p>' : '';
  const why = schedBlock(sp, id), pv = slotPreview(sp, id, u);
  return `<div class="sheet" role="dialog" aria-labelledby="stT"><div class="eyebrow">Study design · ${sp.name} · Tier ${st.tier}</div>
    <h2 id="stT">${st.name(sp)}</h2>
    <p class="muted small">${st.desc(sp)}</p>
    <dl class="kv"><dt>Where</dt><dd>${mode === 'bench' ? 'Hub bench (uses samples)' : (labOf(sp) ? labOf(sp).name : 'Lab')}</dd></dl>
    ${safety}${params}
    <div class="est">Cost ${cost} cr · ${pv.dur} h${pv.multi ? ' around the clock (runs overnight)' : ' of work'}${L ? ' with ' + PEOPLE[S.lead].name : ''}</div>
    ${!why ? `<p class="small hint">Earliest slot: ${dayOf(pv.start) === dayOf(S.t) ? 'today' : dayOf(pv.start) === dayOf(S.t) + 1 ? 'tomorrow' : fmtShort(pv.start).split(' ')[0]} ${hh(pv.start)}${pv.multi ? `, done ${fmtShort(pv.end)}` : `–${hh(pv.end)}`}.${pv.otToday ? ` It would fit today with overtime.` : pv.why === 'washout' ? ' The washout pushes it to a later shift.' : pv.why === 'busy' ? ' Earlier slots are taken.' : pv.why === 'fit' ? ` It won't finish before ${WORK_END}:00 today, and hands-on work can't be split across shifts.` : ''}</p>` : ''}
    <div class="row"><button type="button" class="btn primary" data-act="begin" ${why ? 'disabled' : ''}>${itemFor(sp, id) ? 'Schedule another round' : sp.find[id] ? 'Schedule a rerun' : 'Add to schedule'}</button>${(pv.otToday || /overtime/.test(why)) && !S.ot[dayOf(S.t)] && hourOf(S.t) < WORK_END ? `<button type="button" class="btn" data-act="ot">Authorize overtime · ${OT_COST} cr</button>` : ''}<button type="button" class="btn" data-act="study-close">Cancel</button></div>
    ${why ? `<p class="why">${why}</p>` : ''}
  </div>`;
}
