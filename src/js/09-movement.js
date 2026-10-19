/* ================= movement ================= */
const homeNode = a => ({u:a.home[0], v:a.home[1]});
function enterPath(k, spot){
  const L = S.labs[k], n = hubExit(L.row);
  for(const Q of rowLabs(L.row)) if(Q.j < L.j) n.push(labNode(Q, 6.4, 2.0), labNode(Q, 6.9, 3.9), labNode(Q, 11.1, 3.9), labNode(Q, 12.4, 2.0));
  n.push(labNode(L, 6.4, 2.0, {ev:'enter', k}));
  if(spot[0] > 10) n.push(labNode(L, 6.9, 3.9), labNode(L, 10.7, 3.9));
  n.push(labNode(L, spot[0], spot[1]));
  return n;
}
function exitPath(k, from){
  const L = S.labs[k], ld = S.lead ? LEADS[S.lead] : null;
  const soon = S.inspector || S.nextInspect - S.t <= 12;
  /* The lead sets the tone, but the person walking out decides. */
  const own = from && from.traits ? traitMult(from, 'skip') * (from.morale < 30 ? 1.4 : 1) : 1;
  const never = from && from.traits && traitFlag(from, 'noskip');
  const skip = !never && !S.slowdown && ld && rnd() < ld.skip * own * (S.enforced ? 0.35 : 1) * (soon ? 0.4 : 1);
  const pre = from && localU(L, from) > 9.6 ? [labNode(L, 10.7, 3.9), labNode(L, 6.9, 3.9)] : [];
  const n = pre.concat(skip ? [labNode(L, 6.4, 2.5, {ev:'leave'}), labNode(L, 5.0, 2.5, {ev:'skip', k}), labNode(L, 4.4, 2.5)]
    : [labNode(L, 6.4, 1.5, {ev:'leave'}), labNode(L, 5.0, 1.5, {wait:0.8, ev:'decon', k}), labNode(L, 4.4, 1.5)]);
  for(const Q of rowLabs(L.row).filter(Q => Q.j < L.j).reverse()) n.push(labNode(Q, 12.4, 2.0), labNode(Q, 11.1, 3.9), labNode(Q, 6.9, 3.9), labNode(Q, 6.4, 2.0), labNode(Q, 4.4, 2.0));
  n.push(hubExit(L.row)[0]);
  return n;
}
function onNode(a, ev, n){
  if(ev === 'enter'){ a.inLab = true; a.labK = n.k; }
  else if(ev === 'leave') a.inLab = false;
  else if(ev === 'decon'){ const [x, y] = isoXY(n.u, n.v); for(let i = 0; i < 14; i++) parts.push({x:x + (rnd() - .5) * 12, y:y - 16 + rnd() * 4, vx:(rnd() - .5) * 6, vy:6 + rnd() * 10, life:0.9, col:'#9eeaf2'}); }
  else if(ev === 'skip') registerSkip(a);
}
function speedMult(){ return S.speed === 6 ? 4 : S.speed === 3 ? 2.4 : 1; }
function breachTarget(st, k){ const p = BREACH_POS[Math.min(st, 4)]; if(st > 2) return p; const q = labNode(S.labs[k], p[0], p[1]); return [q.u, q.v]; }
function stepActors(dt){
  const mult = speedMult();
  for(const a of actors()){
    if(a.flash > 0) a.flash -= dt;
    if(a.wait > 0){ a.wait -= dt * mult; a.walking = false; continue; }
    const n = a.path[0];
    if(!n){
      a.walking = false;
      if(a.task === 'idle' && rnd() < 0.003 * mult){ const s = pick(HUB_SPOTS); a.path = [{u:s[0], v:s[1]}]; }
      continue;
    }
    const du = n.u - a.u, dv = n.v - a.v, d = Math.hypot(du, dv), sp = 1.5 * dt * mult * (S.slowdown ? 0.7 : 1);
    a.walking = true;
    if(d <= sp){ a.u = n.u; a.v = n.v; a.path.shift(); if(n.wait) a.wait = n.wait; if(n.ev) onNode(a, n.ev, n); }
    else { a.u += du / d * sp; a.v += dv / d * sp; }
  }
  stepInspector(dt, mult);
  if(S.breach){
    const tgt = breachTarget(S.breach.stage, S.breach.lab);
    const du = tgt[0] - C.u, dv = tgt[1] - C.v, d = Math.hypot(du, dv), sp = 1.1 * dt;
    if(d > sp){ C.u += du / d * sp; C.v += dv / d * sp; } else { C.u = tgt[0]; C.v = tgt[1]; }
  }
}

