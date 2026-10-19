/* ================= guide, lab cards, star map ================= */
function guideCard(){
  if(!S.tut.on || S.tut.step >= TUT.length) return '';
  return `<section class="card guide"><div class="eyebrow">Station guide · step ${S.tut.step + 1} of ${TUT.length}</div><p class="small">${tutText(S.tut.step)}</p><div class="row"><button type="button" class="btn" data-act="tut-off">Hide guide</button></div></section>`;
}
function labCard(L){
  const k = L.k;
  if(L.building){
    const p = (S.t - L.building.start) / (L.building.until - L.building.start);
    return `<section class="card"><div class="eyebrow">${L.name} · under construction</div><div class="bar"><i style="width:${Math.round(p * 100)}%"></i></div><p class="est">Ready ${fmtT(L.building.until)}.</p></section>`;
  }
  if(!L.built){
    const blk = buildBlock(k);
    return `<section class="card ${L.destroyed ? 'alert' : ''}"><div class="eyebrow">${L.name} · ${L.destroyed ? 'destroyed' : 'expansion slot'}</div>
      <h3>${LAB_TYPES[L.type].label}</h3><p class="small">${LAB_TYPES[L.type].blurb}</p><p class="muted small">${SYNERGY[L.type]}</p>
      <p class="small ${labUnlocked(k) ? 'hint' : 'muted'}">${L.destroyed ? 'Detached during a breach. The foundation is still here.' : labUnlocked(k) ? 'Ready to build.' : labUnlockText(k)}</p>
      <div class="row"><button type="button" class="btn primary" data-act="build:${k}" ${blk ? 'disabled' : ''}>${L.destroyed ? 'Rebuild' : 'Build'} ${L.name} · ${LAB_COST[k]} cr · ${LAB_TIME[k]} h</button></div>
      ${blk && labUnlocked(k) ? `<p class="why">${blk}</p>` : ''}</section>`;
  }
  const cs = labSpec(L);
  let env = '';
  if(cs){
    if(cs.kind === 'fossil') env = `<p class="small">${cs.name} is inert rock and bone. No habitat to manage.</p>`;
    else if(valid(cs, 'habitat')) env = cs.truth.sensitive ? `<p class="small">${cs.name} needs ${cs.truth.needs.light}, ${cs.truth.needs.pressure} pressure, ${cs.truth.needs.temp} temperatures.</p><div class="row">${L.envMatched ? '<span class="hint">Matched. Stress is falling.</span>' : `<button type="button" class="btn primary" data-act="match:${k}" ${!canDecide() ? 'disabled' : ''}>Match the habitat · 10 cr</button>`}</div>` : `<p class="small">Standard conditions suit ${cs.name}.</p>`;
    else env = `<p class="muted small">Run a habitat sweep on ${cs.name} to learn what it needs.${ANIMAL(cs) ? ' A mismatched animal gets stressed.' : ''}</p>`;
  }
  const holds = LAB_TYPES[L.type].holds.length, busy = S.items.filter(x => x.lane === 'L' + k);
  return `<section class="card"><div class="eyebrow">${L.name} · ${LAB_TYPES[L.type].label} · BSL-${L.bsl}${S.t < L.haltUntil ? ` · halted ${L.haltUntil - S.t} h` : ''}</div>
    <h3>${cs ? `${cs.name} <span class="muted small">${cs.code}</span>` : holds ? 'Open, ready for a specimen' : busy.length ? `${busy.length} job${busy.length > 1 ? 's' : ''} scheduled` : 'Idle'}</h3>
    ${holds ? '' : `<p class="muted small">${SYNERGY[L.type]}</p>`}
    ${env}
    <div class="bar int ${L.integrity < 50 ? 'low' : ''}"><i style="width:${Math.round(L.integrity)}%"></i></div>
    <p class="est">Integrity ${Math.round(L.integrity)}%.${L.fault ? '' : ''}</p>
    <div class="row">
      <button type="button" class="btn" data-act="repair:${k}" ${L.integrity >= 99 || !canDecide() ? 'disabled' : ''}>Repair · 18 cr</button>
      ${L.bsl === 2 ? `<button type="button" class="btn" data-act="bsl-up:${k}" ${!canDecide() ? 'disabled' : ''}>Upgrade to BSL-3 · 35 cr</button>` : `<button type="button" class="btn" data-act="bsl-down:${k}" ${!canDecide() ? 'disabled' : ''}>Downgrade to BSL-2</button>`}
    </div>${!canDecide() ? '<p class="muted small">Repairs and upgrades are decided at the end of the shift.</p>' : ''}<div class="row">
    </div></section>`;
}
document.addEventListener('click', e => {
  const map = e.target.closest && e.target.closest('#starmap');
  if(map && S && !S.over){
    const r = map.getBoundingClientRect(), x = (e.clientX - r.left) * map.width / r.width, y = (e.clientY - r.top) * map.height / r.height;
    let best = null, bd = 22;
    for(const q of S.planets){ if(!q.known) continue; const [px2, py2] = mapPos(map, q); const d = Math.hypot(px2 - x, py2 - y); if(d < bd){ bd = d; best = q; } }
    if(best){ S.ui.planet = best.i; S.ui.planetPicked = true; tutTick(); S.dirty = true; }
  }
});
function mapPos(c, q){
  const cx = c.width * .5, cy = c.height * .47, rx = c.width * .43, ry = c.height * .38;
  const rad = .38 + (q.dist - 14) / 16 * .55, a = q.i * 2.4 + (S.seed % 7) * .5;
  return [Math.round(clamp(cx + Math.cos(a) * rad * rx, 30, c.width - 30)), Math.round(clamp(cy + Math.sin(a) * rad * ry, 14, c.height - 34))];
}
function drawStarMap(c, t){
  const g = c.getContext('2d'), W = c.width, H = c.height;
  g.imageSmoothingEnabled = false;
  g.fillStyle = '#0a0616'; g.fillRect(0, 0, W, H);
  const rs = mulberry(S.seed);
  for(let i = 0; i < 140; i++){ const a = .2 + rs() * .8; g.fillStyle = `rgba(230,220,255,${a * (.6 + .4 * Math.sin(t * 1.5 + i))})`; g.fillRect(Math.floor(rs() * W), Math.floor(rs() * H), 1, 1); }
  const neb = g.createRadialGradient(W * .75, H * .3, 4, W * .75, H * .3, W * .5); neb.addColorStop(0, 'rgba(120,60,170,.22)'); neb.addColorStop(1, 'rgba(120,60,170,0)'); g.fillStyle = neb; g.fillRect(0, 0, W, H);
  const cx = W * .5, cy = H * .47;
  g.strokeStyle = 'rgba(161,148,192,.25)'; g.setLineDash([2, 4]);
  for(const f of [.38, .65, .93]){ g.beginPath(); g.ellipse(cx, cy, W * .43 * f, H * .38 * f, 0, 0, Math.PI * 2); g.stroke(); }
  g.setLineDash([]);
  g.strokeStyle = 'rgba(255,150,90,.7)'; g.lineWidth = 2; g.beginPath(); g.ellipse(cx, cy, 13, 3.5, -.15, 0, Math.PI * 2); g.stroke(); g.lineWidth = 1;
  g.fillStyle = '#000'; g.beginPath(); g.arc(cx, cy, 6, 0, Math.PI * 2); g.fill();
  g.strokeStyle = 'rgba(255,225,180,.9)'; g.beginPath(); g.arc(cx, cy, 6.5, 0, Math.PI * 2); g.stroke();
  g.fillStyle = '#e2e8f0'; g.fillRect(cx + 9, cy - 9, 4, 3); g.fillStyle = '#62d6e3'; g.fillRect(cx + 10, cy - 8, 2, 1);
  g.font = '10px "Silkscreen", monospace'; g.fillStyle = '#a194c0'; g.fillText('R7', cx + 15, cy - 6);
  if(S.mission){
    const q = S.planets[S.mission.planet], [qx, qy] = mapPos(c, q), f = (S.t - S.mission.start) / (S.mission.dur * 2), f2v = f < .5 ? f * 2 : (1 - f) * 2;
    g.strokeStyle = 'rgba(243,154,43,.6)'; g.setLineDash([3, 3]); g.beginPath(); g.moveTo(cx + 11, cy - 7); g.lineTo(qx, qy); g.stroke(); g.setLineDash([]);
    g.fillStyle = '#f39a2b'; g.fillRect(Math.round(cx + 11 + (qx - cx - 11) * f2v) - 1, Math.round(cy - 7 + (qy - cy + 7) * f2v) - 1, 3, 3);
  }
  for(const q of S.planets){
    const [qx, qy] = mapPos(c, q);
    if(!q.known) continue;
    g.drawImage(planetCanvas(q), qx - 10, qy - 10, 20, 20);
    if(q.i === S.ui.planet){ g.strokeStyle = '#f39a2b'; g.beginPath(); g.arc(qx, qy, 14 + Math.sin(t * 3), 0, Math.PI * 2); g.stroke(); }
    g.fillStyle = q.i === S.ui.planet ? '#ece7f6' : '#a194c0'; g.font = '10px "Silkscreen", monospace';
    const label = q.name, tw = g.measureText(label).width;
    g.fillText(label, clamp(qx - tw / 2, 3, W - tw - 3), qy + 21);
  }
}

