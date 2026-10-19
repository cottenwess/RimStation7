/* ================= tier 1 report sheet ================= */
function reportSheet(sp){
  const R = tierReport(sp), P = PEOPLE[R.by];
  const pips = n => Array.from({length:8}, (_, i) => `<i class="${i < n ? 'on' : ''}"></i>`).join('');
  const riskCls = {Low:'ok', Elevated:'warn', Severe:'bad', Unknown:''}[R.risk];
  return `<div class="sheet report" role="dialog" aria-labelledby="rpT"><div class="eyebrow">Tier 1 report · ${sp.code} · filed by ${P.name}</div>
    <h2 id="rpT">${sp.name}: what's left to learn</h2>
    <div class="rp-grid">
      <div><b>Research viability</b><span class="via">${R.via}</span><span class="pips" aria-hidden="true">${pips(R.score)}</span></div>
      <div><b>Risk profile</b><span class="risk ${riskCls}">${R.risk}</span><span class="muted small">${R.risk === 'Severe' ? 'Lethal to people. Containment first.' : R.risk === 'Elevated' ? 'Hurts people. Handle with care.' : R.risk === 'Low' ? 'Nothing lethal found.' : 'Run the assay.'}</span></div>
      <div><b>Tier 2 program</b><span class="via">${R.prog.ids.length} ${R.prog.ids.length === 1 ? 'study' : 'studies'}</span><span class="muted small">About ${R.prog.cost} cr once the paper is out</span></div>
    </div>
    <div class="eyebrow">Worth investigating</div>
    <ul class="rp-list">${R.traits.map(t => `<li><b>${t.t}</b><span>${t.d}</span></li>`).join('')}</ul>
    <div class="eyebrow">Possible applications</div>
    <ul class="rp-list">${R.apps.map(a => `<li class="${a.dual ? 'dual' : ''}"><b>${a.t}</b><span>${a.d}</span></li>`).join('')}</ul>
    <div class="rp-rec"><canvas data-portrait="${R.by}" data-mood="${R.score >= 5 ? 'excited' : R.score >= 3 ? 'neutral' : 'uneasy'}" width="16" height="16"></canvas><p>"${R.rec}"</p></div>
    <div class="row"><button type="button" class="btn primary" data-act="report-publish">Go to publishing</button><button type="button" class="btn" data-act="report-close">Close</button></div>
  </div>`;
}
function renderOverlays(){
  const ev = $('#evening');
  if(S.ui.evening && S.phase === 'evening' && !S.over && !cur){ const sc = ev.querySelector('.evbody') ? ev.querySelector('.evbody').scrollTop : 0; ev.innerHTML = eveningSheet(); const t = ev.querySelector('.evbody'); if(t) t.scrollTop = sc; ev.querySelectorAll('canvas[data-planet]').forEach(c => drawPlanetIcon(c, S.planets[+c.dataset.planet])); ev.hidden = false; }
  else ev.hidden = true;
  const pl = $('#planner');
  if(S.ui.planner && !S.over){ if(!pdrag){ const sc = pl.querySelector('.ptray') ? pl.querySelector('.ptray').scrollTop : 0; pl.innerHTML = plannerSheet(); const t = pl.querySelector('.ptray'); if(t) t.scrollTop = sc; } pl.hidden = false; }
  else pl.hidden = true;
  const ms = $('#mission');
  if(S.ui.mission && !S.over && !S.breach && !cur){
    const sc = ms.querySelector('.evbody') ? ms.querySelector('.evbody').scrollTop : 0;
    ms.innerHTML = missionSheet();
    const t = ms.querySelector('.evbody'); if(t) t.scrollTop = sc;
    ms.querySelectorAll('canvas[data-planet]').forEach(c => drawPlanetIcon(c, S.planets[+c.dataset.planet]));
    ms.hidden = false;
  } else {
    /* Emptied on close, not just hidden: its Send team buttons duplicate the ones in
       the Planets tab, and leaving them in the DOM makes them ambiguous to find. */
    if(!ms.hidden || ms.innerHTML) ms.innerHTML = '';
    ms.hidden = true;
    if(S.ui.mission && (S.over || S.breach)) S.ui.mission = false;
  }
  const rp = $('#report'), rsp = S.ui.report ? specById(S.ui.report) : null;
  if(rsp && rsp.alive && !S.breach && !S.over && !cur){
    if(rp.hidden || rp.dataset.sp !== rsp.id){ rp.innerHTML = reportSheet(rsp); rp.dataset.sp = rsp.id; rp.querySelectorAll('canvas[data-portrait]').forEach(c => drawPortrait(c.getContext('2d'), c.dataset.portrait, c.dataset.mood)); }
    rp.hidden = false;
  } else { rp.hidden = true; rp.dataset.sp = ''; }
  const so = $('#study'), ssp = selSpec();
  if(S.ui.studyOpen && ssp && !S.breach && !S.over && visible(ssp, S.ui.sel)){ so.innerHTML = designCard(ssp); so.hidden = false; }
  else { so.hidden = true; S.ui.studyOpen = false; }
  const b = $('#breach');
  if(S.breach && !S.over){
    const st = S.breach.stage, sp = specById(S.breach.sp);
    b.innerHTML = `<div class="sheet" role="dialog" aria-labelledby="brT"><div class="eyebrow">Containment breach · stage ${st} of 4</div>
      <h2 id="brT">${sp.name} is ${BREACH_WHERE[st]}</h2>
      <ol class="ladder">${FAILSAFES.map((f, i) => {
        const on = st <= f.max, odds = failOdds(f.id);
        return `<li class="${on ? '' : 'off'}"><span class="n">${i + 1}</span><span><b>${f.name}</b><small>${f.desc}${on && odds < 1 ? ` Estimated success ${Math.round(odds * 100)}%.` : ''}${on ? '' : ' Too late for this.'}</small></span><button type="button" class="btn ${f.id === 'scuttle' ? 'danger' : ''}" data-act="fs:${f.id}" ${on ? '' : 'disabled'}>Do it</button></li>`;
      }).join('')}</ol>
      <div class="row"><button type="button" class="btn" data-act="hold">Hold and watch</button><span class="muted" style="font-size:11.5px">Waiting lets it move one section closer.</span></div></div>`;
    b.hidden = false;
  } else b.hidden = true;
}
function openPublish(){
  const sp = selSpec(); if(!sp) return;
  const claims = snapshotClaims(sp), grant = publishPay(sp), pay = grant.amt, secs = sectionsFor(sp);
  const defRec = claimFor(sp, 'containment') ? Math.min(3, sp.truth.bsl) : (sp.paper ? sp.paper.rec : 2);
  const n = secs.filter(s => claims[s]).length;
  $('#pub').innerHTML = `<div class="sheet" role="dialog" aria-labelledby="pubT"><div class="eyebrow">Publish to the Meridian catalog</div>
    <h2 id="pubT">${sp.name}, paper v${sp.paperV + 1}</h2>
    <p class="small">The partner labs will start handling their own ${sp.name} specimens according to this paper. Empty sections mean they guess.</p>
    <ul class="claims">${secs.map(s => `<li class="${claims[s] ? 'ok' : 'bad'}"><b>${secLabel(sp, s)}</b><span>${claims[s] ? claims[s].text : 'No data. Partner labs will guess.'}</span></li>`).join('')}</ul>
    ${sp.kind !== 'fossil' ? `<div class="row"><span class="muted small">Recommended containment</span><div class="seg">${[1, 2, 3].map(k => `<label><input type="radio" name="rec" value="${k}" ${defRec === k ? 'checked' : ''}>BSL-${k}</label>`).join('')}</div></div>` : ''}
    <p class="est">${n} of ${secs.length} sections. ${pay ? `Completes Tier ${grant.tier}: Meridian renews the grant for ${pay} cr${S.bridgeDebt ? `, minus ${Math.min(pay, S.bridgeDebt)} cr to repay the bridge advance` : ''}.` : 'No grant renewal: this version completes no new tier.'}</p>
    <div class="row"><button type="button" class="btn primary" data-act="publish-confirm">Publish</button><button type="button" class="btn" data-act="publish-cancel">Not yet</button></div></div>`;
  $('#pub').hidden = false;
}
