/* ================= evening briefing ================= */
function kindRoom(p){
  const kinds = [...new Set(ARCH[p.arch].pool)];
  return kinds.map(k => `<span class="room ${openLabs(k).length ? 'ok' : 'no'}" title="${openLabs(k).length ? 'An open lab can take it' : `No open ${LAB_TYPES[labTypeFor(k)].label === 'Containment' ? 'containment lab' : LAB_TYPES[labTypeFor(k)].label + ' Lab'}`}">${KIND_LABEL[k]}</span>`).join('');
}
/* Why no team can go out right now, if that is the case. The planet-specific
   reasons live in the dispatch sheet; this is the station-wide answer. */
function recoveryBlock(){
  if(S.mission) return '';
  const known = S.planets.filter(p => p.known);
  if(!known.length) return 'No charted worlds.';
  if(known.every(p => missionBlock(p))){
    const common = known.map(p => missionBlock(p));
    return common.every(w => w === common[0]) ? common[0] : 'No world can take a team right now.';
  }
  return '';
}
function missionSheet(){
  const out = S.planets.filter(p => p.known).map(p => { const blk = missionBlock(p);
    return `<li><canvas data-planet="${p.i}" width="48" height="48"></canvas><div class="evmain"><b>${p.name}</b><small>${ARCH[p.arch].label} · "${cap(p.nick)}" · hazard ${'●'.repeat(p.hazard + 1)}${'○'.repeat(4 - p.hazard)} · ${p.dist * 2} h round trip · ${missionCost(p)} cr</small>
      <small class="muted">${ATM[p.atm].bio}</small><div class="rooms">${kindRoom(p)}</div>${blk ? `<small class="why">${blk}</small>` : ''}</div>
      <button type="button" class="btn primary" data-act="dispatch:${p.i}" ${blk ? 'disabled' : ''}>Send team</button></li>`; }).join('');
  const hidden = S.planets.filter(q => !q.known).length;
  return `<div class="planner evening" role="dialog" aria-labelledby="misT">
    <header class="ph"><div><div class="eyebrow">Recovery</div><h2 id="misT">Send a team</h2></div>
      <div class="row"><span class="chip"><b>FUNDS</b>${Math.round(S.funds)} cr</span><span class="chip"><b>TECHS</b>${onStation().filter(a => !a.injured).length} fit</span><button type="button" class="btn primary" data-act="mission-close">Back</button></div></header>
    <div class="evbody one">
      <section class="evcol">
        ${S.mission ? `<p class="small">The team is on ${S.planets[S.mission.planet].name}. Back ${fmtT(S.mission.start + S.mission.dur * 2)}. ${S.mission.team.join(' and ')} are with Rook.</p>` : ''}
        <ul class="evlist">${out}</ul>
        <p class="muted small">Rook takes two fit techs and brings back only what you have an open lab for. ${hidden ? `${hidden} unconfirmed signal${hidden > 1 ? 's' : ''} out there; return trips to charted worlds can trace them.` : 'Every world in range is charted.'}</p>
      </section></div></div>`;
}
function eveningSheet(){
  const Y = S.yesterday, D = S.deadline;
  const maint = S.labs.filter(L => L.built).map(L => { const cs = labSpec(L), holds = LAB_TYPES[L.type].holds.length;
    const match = cs && valid(cs, 'habitat') && cs.truth.sensitive && !L.envMatched;
    return `<li><div class="evmain"><b>${L.name}</b><small>${LAB_TYPES[L.type].label}${labHeaded(L) ? ' · ' + headOf(L).name : ' · <span class="why">no head</span>'}${cs ? ' · ' + cs.name : ''}${holds ? ' · BSL-' + L.bsl : ''}${L.fault ? ' · <span class="why">equipment fault</span>' : ''}</small>
      <div class="bar int ${L.integrity < 50 ? 'low' : ''}"><i style="width:${Math.round(L.integrity)}%"></i></div><small>Integrity ${Math.round(L.integrity)}%</small></div>
      <div class="evbtns"><button type="button" class="btn" data-act="repair:${L.k}" ${L.integrity >= 99 ? 'disabled' : ''}>Repair · 18 cr</button>
      ${holds ? (L.bsl === 2 ? `<button type="button" class="btn" data-act="bsl-up:${L.k}">BSL-3 · 35 cr</button>` : `<button type="button" class="btn" data-act="bsl-down:${L.k}">Back to BSL-2</button>`) : ''}
      ${match ? `<button type="button" class="btn primary" data-act="match:${L.k}">Match habitat · 10 cr</button>` : ''}</div></li>`; }).join('');
  const exp = S.labs.filter(L => !L.built).map(L => { const blk = buildBlock(L.k), unl = labUnlocked(L.k);
    if(L.building){ const p = (S.t - L.building.start) / (L.building.until - L.building.start); return `<li><div class="evmain"><b>${L.name}</b><small>${LAB_TYPES[L.type].label} · under construction, ready ${fmtT(L.building.until)}</small><div class="bar"><i style="width:${Math.round(p * 100)}%"></i></div></div></li>`; }
    return `<li class="${unl ? '' : 'locked'}"><div class="evmain"><b>${L.name}${L.destroyed ? ' (destroyed)' : ''}</b><small>${LAB_TYPES[L.type].label} · ${unl ? SYNERGY[L.type] : labUnlockText(L.k)}</small>${unl && blk ? `<small class="why">${blk}</small>` : ''}</div>${unl ? `<button type="button" class="btn primary" data-act="build:${L.k}" ${blk ? 'disabled' : ''}>${L.destroyed ? 'Rebuild' : 'Build'} · ${LAB_COST[L.k]} cr · ${LAB_TIME[L.k]} h</button>` : ''}</li>`; }).join('');
  const held = S.compounds.filter(c => c.state === 'held').length, mats = S.materials.filter(m => m.state === 'held' && m.stressed).length;
  return `<div class="planner evening" role="dialog" aria-labelledby="evT">
    <header class="ph"><div><div class="eyebrow">End of shift</div><h2 id="evT">${fmtT(S.t).split(' ').slice(0, 2).join(' ')} · evening briefing</h2></div>
      <div class="row"><span class="chip"><b>FUNDS</b>${Math.round(S.funds)} cr</span><span class="chip"><b>UPKEEP</b>${(upkeepPerHour() * 24).toFixed(1)} cr/day</span>${D ? `<span class="chip ${D.t - S.t < 48 ? 'warn' : ''}"><b>PAPER DUE</b>${fmtShort(D.t).split(' ')[0]}</span>` : ''}<button type="button" class="btn" data-act="evening-hide">Hide</button><button type="button" class="btn ${S.mission || recoveryBlock() ? '' : 'primary'}" data-act="mission-open" ${S.mission ? 'disabled' : ''} title="${S.mission ? 'A team is already out.' : recoveryBlock()}">${S.mission ? `Team out · back ${fmtShort(S.mission.start + S.mission.dur * 2)}` : 'Send a recovery team'}</button><button type="button" class="btn" data-act="planner">Plan tomorrow</button><button type="button" class="btn primary" data-act="closeday">Close the day ▸</button></div></header>
    ${Y ? `<div class="pyday"><b>Today:</b> ${Y.done.length ? Y.done.map(x => `<span class="ychip ${x.flagged ? 'bad' : ''}" title="${(x.text || '').replace(/"/g, '&quot;')}">${x.name}${x.spName ? ' · ' + x.spName : ''}${x.flagged ? ' (unreliable)' : ''}</span>`).join('') : '<span class="muted">no studies finished</span>'}${Y.notes.map(n => `<span class="ychip bad" title="${n.text.replace(/"/g, '&quot;')}">${PEOPLE[n.who] ? PEOPLE[n.who].name.split(' ').pop() : n.who}: ${n.text.slice(0, 60)}${n.text.length > 60 ? '…' : ''}</span>`).join('')}<span class="ychip">${Y.net >= 0 ? '+' : ''}${Y.net} cr</span>${Y.injuries || Y.deaths ? `<span class="ychip bad">${Y.injuries} hurt · ${Y.deaths} dead</span>` : ''}</div>` : ''}
    <div class="evbody">
      <section class="evcol"><div class="eyebrow">Lab maintenance</div><ul class="evlist">${maint}</ul>${held || mats ? `<p class="small hint">${held ? `${held} compound${held > 1 ? 's' : ''}` : ''}${held && mats ? ' and ' : ''}${mats ? `${mats} material${mats > 1 ? 's' : ''}` : ''} waiting for a decision. <button type="button" class="linkbtn" data-act="tab:lab">Station tab</button></p>` : ''}</section>
      <section class="evcol"><div class="eyebrow">Expansion</div>${exp ? `<ul class="evlist">${exp}</ul>` : '<p class="muted small">Every lab is built.</p>'}</section>
    </div></div>`;
}


