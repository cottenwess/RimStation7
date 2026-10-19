/* ================= planets, papers, staff, station panes ================= */
function panePlanets(){
  const p = S.planets[S.ui.planet] && S.planets[S.ui.planet].known ? S.planets[S.ui.planet] : S.planets[0];
  let h = '';
  if(S.mission){
    const mp = S.planets[S.mission.planet], left = S.mission.start + S.mission.dur * 2 - S.t;
    h += `<section class="card"><div class="eyebrow">Recovery mission</div><h3>${mp.name} · back in ${left} h</h3><div class="bar"><i id="misBar" style="width:${Math.round((S.t - S.mission.start) / (S.mission.dur * 2) * 100)}%"></i></div><p class="muted small">Team: ${S.mission.team.join(', ')}, led by Rook Adebayo.</p></section>`;
  }
  const hidden = S.planets.filter(q => !q.known).length;
  h += `<section class="card"><div class="eyebrow">Star map · survey seed ${S.seed}</div>
    <canvas id="starmap" class="starmap" width="340" height="220" aria-label="Star map. Select a planet."></canvas>
    <div class="row">${S.planets.filter(q => q.known).map(q => `<button type="button" class="btn ${q.i === p.i ? 'primary' : ''}" data-act="planet:${q.i}">${q.name}</button>`).join('')}</div>
    <p class="muted small">${hidden ? `${hidden} unconfirmed signal${hidden > 1 ? 's' : ''}. Return trips to charted worlds can trace them.` : 'Every world in range is charted.'}</p></section>`;
  const A = ARCH[p.arch], st = STARS[p.star], at = ATM[p.atm], blk = missionBlock(p);
  h += `<section class="card planet"><div class="planet-h"><canvas data-planet="${p.i}" width="48" height="48"></canvas><div><div class="eyebrow">${A.label} · hazard ${'●'.repeat(p.hazard + 1)}${'○'.repeat(4 - p.hazard)}</div><h3>${p.name}</h3><p class="muted small">"${cap(p.nick)}"</p></div></div>
    <dl class="kv">
      <dt>Star</dt><dd>${st.name} (${st.desc})</dd>
      <dt>Mass · gravity</dt><dd>${p.mass} Earth · ${p.g} g</dd>
      <dt>Atmosphere</dt><dd>${at.name}, ${p.pres < 0.01 ? 'near vacuum' : p.pres + ' bar'}</dd>
      <dt>Surface</dt><dd>${p.temp}°C${p.tidal ? ', tidally locked' : ''}</dd>
      <dt>Sky</dt><dd>${at.skyName}</dd>
      <dt>Solvent</dt><dd>${A.solvent}</dd>
      <dt>Plant pigment</dt><dd>${['barren', 'ice'].includes(p.arch) ? 'none seen' : st.floraName}</dd>
      <dt>Magnetic field</dt><dd>${p.magnet ? 'Yes' : 'Weak or none'}</dd>
    </dl>
    <p class="small">${at.bio} ${soundImplication(p)}${!p.magnet && p.arch !== 'barren' ? ' Without a magnetic field, expect radiation-eating life.' : ''}</p>
    <dl class="kv"><dt>Trips</dt><dd>${p.missions}</dd><dt>Recovered</dt><dd>${p.recovered}</dd><dt>Round trip</dt><dd>${p.dist * 2} h · ${missionCost(p)} cr</dd><dt>Open labs</dt><dd>${openLabs().length} (the team brings back at most this many)</dd></dl>
    <div class="row"><button type="button" class="btn primary" data-act="dispatch:${p.i}" ${blk ? 'disabled' : ''}>Send recovery team</button></div>
    ${blk && !S.mission ? `<p class="why">${blk}</p>` : ''}
  </section>`;
  return h;
}
function panePapers(){
  const sp = selSpec();
  let h = `<section class="card"><div class="eyebrow">Meridian grant</div><h3>${S.granted} cr awarded</h3>
    <p class="muted small">Each specimen's first paper needs all of its Tier 1 studies. Publishing a paper that completes a new tier for a specimen renews the grant: about ${renewalFor(1)} cr for Tier 1, ${renewalFor(2)} for Tier 2, ${renewalFor(3)} for Tier 3. Standing scales the amount.</p></section>`;
  if(!sp) return h;
  h += `<section class="card"><div class="eyebrow">Specimens</div>${specChips()}</section>`;
  const secs = sectionsFor(sp), canPub = tierDone(sp, 1);
  if(!sp.paper){
    h += `<section class="card"><div class="eyebrow">${sp.code} · publication</div><h3>No paper on ${sp.name}</h3>
      <p class="small">Partner labs will follow whatever you publish, including the gaps.</p>
      <div class="row"><button type="button" class="btn primary" data-act="publish-open" ${canPub && !S.breach ? '' : 'disabled'}>Publish paper v${sp.paperV + 1}</button></div>
      ${canPub ? '' : `<p class="why">Complete every Tier 1 study first: ${tierStudies(sp, 1).filter(id => !valid(sp, id)).map(id => STUDIES[id].name(sp)).join(', ')}.</p>`}</section>`;
  } else {
    const bad = secs.some(s => claimStatus(sp, s)[1] === 'bad');
    h += `<section class="card ${bad ? 'alert' : ''}"><div class="eyebrow">In print · ${sp.name} v${sp.paper.v} · ${fmtShort(sp.paper.t)}</div>
      <h3>Recommends BSL-${sp.paper.rec}</h3>
      ${bad ? '<p class="why">Your own data contradicts the paper. The partner labs are still following it.</p>' : ''}
      <ul class="claims">${secs.map(s => { const [stx, cls] = claimStatus(sp, s); const p = sp.paper.claims[s]; return `<li class="${cls}"><b>${secLabel(sp, s)}</b><span>${p ? p.text : '<span class="muted">Not in the paper</span>'}</span><span class="st">${stx}</span></li>`; }).join('')}</ul>
      <div class="row"><button type="button" class="btn primary" data-act="publish-open" ${S.breach ? 'disabled' : ''}>Publish v${sp.paperV + 1}</button><button type="button" class="btn danger" data-act="retract">Retract (−20 cr)</button></div></section>`;
  }
  h += `<section class="card"><div class="eyebrow">Partner labs</div>
    <ul class="labs">${PARTNERS.map(l => `<li><span>${l}</span><span class="muted">${S.specs.filter(s => s.paper).length} paper${S.specs.filter(s => s.paper).length === 1 ? '' : 's'} in use</span></li>`).join('')}</ul>
    <dl class="kv"><dt>Dead at partner labs</dt><dd>${S.downstream}</dd></dl>
    ${S.reports.length ? `<ul class="claims">${S.reports.slice().reverse().map(r => `<li class="bad"><b>${fmtShort(r.t)} · ${r.lab}</b><span>${r.text}</span></li>`).join('')}</ul>` : '<p class="muted small">No incident reports.</p>'}</section>
    <section class="card"><div class="eyebrow">End the run</div><p class="muted small">Closing the station ends the run. Whatever is in print stays in print.</p>
    <div class="row"><button type="button" class="btn" data-act="close-study">Close the station</button></div></section>`;
  return h;
}
function paneStaff(){
  let h = '';
  for(const id of ['vasko', 'okafor']){
    const L = LEADS[id], P = PEOPLE[id], current = S.lead === id;
    const mood = L.quit ? 'angry' : L.pulls >= 2 ? 'angry' : L.pulls === 1 ? 'uneasy' : (id === 'vasko' ? 'smug' : 'neutral');
    let btn;
    if(L.quit) btn = '<button type="button" class="btn" disabled>Left the station</button>';
    else if(current) btn = '<button type="button" class="btn danger" data-act="pull">Pull from project</button>';
    else btn = `<button type="button" class="btn primary" data-act="assign:${id}" ${S.breach ? 'disabled' : ''}>Assign as lead</button>`;
    h += `<article class="card lead ${current ? 'current' : ''}"><canvas class="pt" data-portrait="${id}" data-mood="${mood}" width="16" height="16"></canvas>
      <div class="lead-body"><h3>${P.name}</h3><div class="tag">${L.temper} · Xenobiology</div><p class="small">${L.blurb}</p>
      <div class="traits">Pace: ${L.pace} · Protocol: ${L.protocol}</div><div class="row">${btn}</div></div></article>`;
  }
  const hz = S.hazardPay ? 'Approved' : S.slowdown ? 'Refused. Techs working strictly to protocol.' : 'Not requested';
  h += `<article class="card lead"><canvas class="pt" data-portrait="bea" data-mood="${S.reportsMuted ? 'numb' : S.deaths ? 'angry' : 'neutral'}" width="16" height="16"></canvas>
    <div class="lead-body"><h3>Bea Thornton</h3><div class="tag">Lead lab tech</div><p class="small">Knows every shortcut on the station and why each one is dangerous.</p>
    <div class="traits">Hazard pay: ${hz}</div>${S.slowdown && !S.hazardPay ? '<div class="row"><button type="button" class="btn" data-act="hazard">Approve hazard pay (+2.4 cr/day)</button></div>' : ''}</div></article>
    <article class="card lead"><canvas class="pt" data-portrait="rook" data-mood="neutral" width="16" height="16"></canvas>
    <div class="lead-body"><h3>Rook Adebayo</h3><div class="tag">Recovery team lead</div><p class="small">Takes two techs down to the planets and brings back whatever the planet allows. Not always everyone.</p></div></article>`;
  h += headsCard() + rosterCard() + candidateCard();
  h += `<section class="card"><div class="eyebrow">Record</div>
    <dl class="kv"><dt>Attrition</dt><dd>${S.deaths} dead · ${S.injuries} injured</dd><dt>Near-miss reports</dt><dd>${S.reportsMuted ? 'Discouraged' : 'Open'}</dd><dt>Salaries</dt><dd>${(staffUpkeep() * 24).toFixed(1)} cr/day</dd></dl></section>`;
  return h;
}
const staffStatus = a => !a.alive ? (a.quit ? 'Left the station' : 'Deceased') : a.away ? 'On a recovery mission' : a.injured ? 'Injured, out of rotation' : a.inLab ? 'In a lab' : a.task === 'work' ? 'At the bench' : 'On station';
function statRow(a){
  return `<div class="statrow">${STAT_KEYS.map(k => {
    const v = statOf(a, k), base = a.stats[k] || 0, capd = a.cap[k];
    const tip = `${STATS[k].label}: ${v} of ${STAT_MAX}${v !== base ? ` (${base} on paper)` : ''} · potential ${capd} · ${STATS[k].blurb}`;
    return `<span class="stat ${v > base ? 'up' : v < base ? 'down' : ''}" title="${tip}"><b>${STATS[k].label.slice(0, 3)}</b><i><em>${'★'.repeat(v)}</em>${'☆'.repeat(STAT_MAX - v)}</i></span>`;
  }).join('')}</div>`;
}
function traitRow(a){
  return traitsOf(a).map(t => `<span class="trait" title="${t.good}. ${t.bad}."><b>${t.label}</b><small>${t.good} · ${t.bad}</small></span>`).join('');
}
function staffCard(a, o = {}){
  const R = ROLES[a.role] || ROLES.tech, aff = a.alive ? affinity(a) : 0;
  const mood = !a.alive ? 'dead' : a.morale < 28 ? 'bad' : a.morale < 50 ? 'warn' : '';
  const affTxt = !S.lead || !a.alive ? '' : aff > 0 ? `Works well under ${PEOPLE[S.lead].name.split(' ').pop()}` : aff < 0 ? `Clashes with ${PEOPLE[S.lead].name.split(' ').pop()}` : '';
  return `<li class="staff ${a.alive ? '' : 'dead'}">
    <div class="staff-h"><div><b>${a.name}</b><small>${R.label}${a.alive && labOfHead(a) ? ' · heads ' + labOfHead(a).name : ''}${a.benchOnly ? ' · bench only' : ''}</small></div>
      <span class="muted small">${o.status || staffStatus(a)}</span></div>
    ${a.alive ? statRow(a) : ''}
    ${a.alive ? `<div class="mbar ${mood}" title="Morale ${Math.round(a.morale)} of 100${affTxt ? '. ' + affTxt : ''}"><span style="width:${clamp(a.morale, 0, 100)}%"></span></div>` : ''}
    <div class="traits-list">${traitRow(a)}</div>
    ${affTxt ? `<p class="small ${aff < 0 ? 'bad' : 'hint'}">${affTxt}.</p>` : ''}
    ${o.extra || ''}</li>`;
}
function headsCard(){
  const built = S.labs.filter(L => L.built);
  if(!built.length) return '';
  const rows = built.map(L => {
    const h = headOf(L), role = ROLES[headRoleFor(L)];
    return `<li><div><b>${L.name}</b><small>${LAB_TYPES[L.type].label}</small></div><div class="row">${h ? `<span class="muted small">${h.name}</span>` : `<span class="bad small">No ${role.label.toLowerCase()}</span>`}</div></li>`;
  }).join('');
  const unheaded = built.filter(L => !labHeaded(L)).length;
  const fr = Object.values(S.bonds || {}).filter(b => b.state === 'feud' || b.state === 'attached' || b.state === 'spy');
  let note = '';
  if(fr.length) note = `<p class="small ${fr.some(b => b.state !== 'attached') ? 'bad' : 'hint'}">${fr.map(b => {
    const A = byId(b.a), B = byId(b.b);
    if(!A || !B) return '';
    return b.state === 'feud' ? `${A.name} and ${B.name} are feuding.` : b.state === 'attached' ? `${A.name} and ${B.name} are close.` : `${A.name} is under audit.`;
  }).filter(Boolean).join(' ')}</p>`;
  return `<section class="card"><div class="eyebrow">Lab heads</div><ul class="inv">${rows}</ul>
    ${unheaded ? `<p class="small bad">${unheaded} lab${unheaded > 1 ? 's run' : ' runs'} without a head: slower, and the data comes back unreliable more often.</p>` : ''}${note}</section>`;
}
function rosterCard(){
  const live = S.techs.filter(a => a.alive), gone = S.techs.filter(a => !a.alive);
  const byRole = {};
  for(const a of live) (byRole[a.role] = byRole[a.role] || []).push(a);
  const order = ROLE_KEYS.filter(k => byRole[k]);
  let h = `<section class="card"><div class="eyebrow">Roster · ${live.length} on the books</div>`;
  if(!live.length) h += '<p class="muted small">Nobody left.</p>';
  for(const k of order){
    h += `<div class="eyebrow sub">${ROLES[k].label}${byRole[k].length > 1 ? ' · ' + byRole[k].length : ''}</div><ul class="stafflist">`;
    h += byRole[k].map(a => staffCard(a, {extra:a.alive && !a.away ? `<div class="row"><button type="button" class="btn" data-act="benchonly:${a.id}">${a.benchOnly ? 'Return to full rotation' : 'Keep off hands-on work'}</button></div>` : ''})).join('');
    h += '</ul>';
  }
  if(gone.length) h += `<div class="eyebrow sub">No longer on station</div><ul class="stafflist">${gone.map(a => staffCard(a)).join('')}</ul>`;
  return h + '</section>';
}
function candidateCard(){
  const cs = S.candidates || [];
  const why = cs.length ? hireBlock(cs[0]) : '';
  const closed = SPECIALIST_KEYS.filter(k => !roleOpen(k));
  let h = `<section class="card"><div class="eyebrow">Available for hire</div>`;
  h += cs.length ? `<ul class="stafflist">${cs.map(c => {
    const R = ROLES[c.role], b = hireBlock(c);
    return staffCard(c, {status:`${R.hire} cr${R.upkeep ? ` · ${R.upkeep} cr/day` : ''}`,
      extra:`<p class="muted small">${R.blurb}</p><div class="row"><button type="button" class="btn primary" data-act="hire:${c.id}" ${b ? 'disabled' : ''} title="${b}">Hire</button></div>`});
  }).join('')}</ul>` : '<p class="muted small">Meridian has nobody on the list this week.</p>';
  if(why && cs.length) h += `<p class="muted small">${why}</p>`;
  if(closed.length) h += `<p class="est">Not open yet: ${closed.map(k => `${ROLES[k].label.toLowerCase()} (${ROLES[k].lab === 'containment2' ? 'needs a second containment cell' : ROLES[k].lab ? 'unlocks with the ' + LAB_TYPES[ROLES[k].lab].label + ' lab' : k === 'speech' ? 'needs a specimen that vocalizes' : 'needs ruins, tools or a sapience finding'})`).join(', ')}.</p>`;
  return h + '</section>';
}
function fmtStamp(ms){
  const d = new Date(ms);
  return d.toLocaleDateString(undefined, {month:'short', day:'numeric'}) + ' ' + d.toLocaleTimeString(undefined, {hour:'2-digit', minute:'2-digit'});
}
function saveCard(){
  const why = saveBlocked();
  const rows = SAVE_SLOTS.map(slot => {
    const i = slotInfo(slot), label = slot === 'auto' ? 'Autosave' : 'Slot ' + slot;
    const sum = i ? `Day ${i.day}, ${String(i.hour).padStart(2, '0')}:00 · ${i.funds} cr · ${i.specs} specimen${i.specs === 1 ? '' : 's'} · ${i.papers} paper${i.papers === 1 ? '' : 's'} · saved ${fmtStamp(i.stamp)}` : 'Empty';
    return `<li><div><b>${label}</b><small>${sum}</small></div><div class="row">${slot === 'auto' ? '' : `<button type="button" class="btn" data-act="save:${slot}" ${why ? 'disabled' : ''} title="${why}">Save</button>`}<button type="button" class="btn" data-act="load:${slot}" ${i ? '' : 'disabled'}>Load</button>${i ? `<button type="button" class="btn danger" data-act="delsave:${slot}">Delete</button>` : ''}</div></li>`;
  }).join('');
  return `<section class="card"><div class="eyebrow">Saved runs</div><ul class="inv">${rows}</ul>
    <p class="muted small">${why || 'The station autosaves at the start of each morning and each evening briefing. Loading replaces the run in progress.'}</p>
    <div class="row"><button type="button" class="btn danger" data-act="newrun">Start a new survey</button></div></section>`;
}
function paneLab(){
  const up = upkeepPerHour() * 24, hold = S.specs.filter(s => s.alive && s.loc === 'hold');
  let h = `<p class="muted small">Containment labs hold creatures and plants. Microbes go to the Micro Lab, fossils to Genetics. Recovery teams only bring back what you have an open lab for. Chemistry and Physics work on what the other labs produce.</p>`;
  h += rowLabs('E').concat(rowLabs('S')).map(labCard).join('') + inventoryCards();
  if(hold.length) h += `<section class="card"><div class="eyebrow">Stasis · ${hold.length}</div><p class="muted small">No open lab, so these are frozen and sealed. They move into the next lab that opens.</p><ul class="labs">${hold.map(s => `<li><span>${s.name}</span><span class="muted">${KIND_LABEL[s.kind]}</span></li>`).join('')}</ul></section>`;
  h += `<section class="card"><div class="eyebrow">Safety walkthroughs</div><h3>Ines Calderón</h3>
      <p class="muted small">Calderón inspects every lab for safety violations and failing containment. Scheduled walkthroughs give 12 hours' notice. Surprise ones catch more but pause lab work for 2 hours.</p>
      <dl class="kv"><dt>Next scheduled</dt><dd>${S.inspector ? 'Underway' : S.nextInspect > 1e8 ? 'After your first specimen arrives' : fmtT(S.nextInspect)}</dd><dt>Decon protocol</dt><dd>${S.enforced ? 'Enforced' : 'Standard'}</dd></dl>
      <div class="row"><button type="button" class="btn" data-act="surprise" ${S.inspector || S.breach || S.t - S.lastSurprise < 24 || !S.specs.length ? 'disabled' : ''}>Call a surprise walkthrough</button></div></section>
    <section class="card"><div class="eyebrow">Upkeep</div><dl class="kv"><dt>Total</dt><dd>${up.toFixed(1)} cr/day</dd></dl><p class="est">Hub 3.6 cr/day, each lab 1.9, each BSL-3 lab 2.9 more${S.hazardPay ? ', hazard pay 2.4' : ''}.</p></section>`;
  h += saveCard();
  return h;
}
function paneNotes(){
  if(!S.notes.length) return '<p class="muted">The log fills as your staff report findings, anomalies and warnings.</p>';
  const tag = {finding:'Finding', anomaly:'Anomaly', warning:'Warning', note:'Note', admin:'Admin'};
  return `<ul class="notes">${S.notes.slice().reverse().map(n => `<li class="note k-${n.kind}"><div class="meta">${fmtShort(n.t)} · ${PEOPLE[n.who] ? PEOPLE[n.who].name : n.who} · ${tag[n.kind]}</div><p>${n.text}</p></li>`).join('')}</ul>`;
}
