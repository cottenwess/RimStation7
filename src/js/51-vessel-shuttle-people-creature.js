/* ---------- vessel, shuttle, people, creature ---------- */
function drawVessel(time){
  const bob = Math.round(Math.sin(time * 1.2) * 1.5), z0 = 4 + bob, z1 = 24 + bob;
  const [tx, ty] = P(1.0, -3.0, z0 - 6); ellipse(tx, ty, 10, 4, 'rgba(98,214,227,.10)');
  for(const [u, v] of [[0.6, -2.6], [1.4, -3.4]]){ const p = P(u, v, z0); px([p[0] - 1, p[1]], `rgba(98,214,227,${.5 + .3 * Math.sin(time * 9 + u)})`, 3, 2); }
  box(0.2, -3.8, 1.8, -2.2, z0, z1, '#e1e7ef', '#c3ccd8', '#8e9ab0');
  ln(P(0.2, -2.2, z1), P(1.8, -2.2, z1), '#ffffff');
  qU(0.2, 1.8, -2.2, z0 + 13, z0 + 15, PAL.trim); qV(-3.8, -2.2, 1.8, z0 + 13, z0 + 15, '#2f5a99');
  for(const u of [0.4, 1.6]) qU(u - .04, u + .04, -2.2, z0, z1, PAL.orange);
  qV(-3.62, -3.22, 1.8, z0 + 6, z0 + 11, '#1d3d55'); qV(-3.58, -3.26, 1.8, z0 + 7, z0 + 10, PAL.cyan);
  qV(-2.98, -2.58, 1.8, z0 + 6, z0 + 11, '#1d3d55'); qV(-2.94, -2.62, 1.8, z0 + 7, z0 + 10, PAL.cyan);
  qU(0.72, 1.28, -2.2, z0 + 2, z0 + 12, '#8592a6'); qU(0.78, 1.22, -2.2, z0 + 3, z0 + 11, '#5f6b80');
  const h = P(1.0, -2.2, z0 + 7); px([h[0] - 1, h[1] - 2], '#e2e8f0', 3, 1); px([h[0], h[1] - 1], '#e2e8f0', 1, 2); px([h[0] - 1, h[1] + 1], PAL.cyan, 3, 1);
  for(const u of [0.7, 1.3]){ const p = P(u, -2.2, z0 + 7); px([p[0], p[1] - 3], PAL.orange, 1, 6); }
  const top = P(0.6, -3.4, z1); ln(top, [top[0], top[1] - 5], '#9aa3ad');
  b.fillStyle = '#e2e8f0'; b.beginPath(); b.ellipse(top[0], top[1] - 8, 6, 3.5, -0.5, 0, Math.PI * 2); b.fill();
  b.fillStyle = '#a9b4c4'; b.beginPath(); b.ellipse(top[0] + 1, top[1] - 7, 4, 2.2, -0.5, 0, Math.PI * 2); b.fill();
  const an = P(1.55, -3.6, z1); ln(an, [an[0], an[1] - 12], '#c9d2de'); ln([an[0] + 3, an[1] + 1], [an[0] + 3, an[1] - 7], '#9aa3ad');
  px([an[0], an[1] - 13], Math.floor(time * 2) % 2 ? PAL.red : '#5a1a1e', 2, 2);
  qZ(1.0, -3.2, 1.7, -2.5, z1 + 3, '#2f5fa8'); ln(P(1.35, -3.2, z1 + 3), P(1.35, -2.5, z1 + 3), '#8fb8ec'); ln(P(1.0, -2.85, z1 + 3), P(1.7, -2.85, z1 + 3), '#8fb8ec');
  ln(P(1.35, -2.85, z1), P(1.35, -2.85, z1 + 3), '#9aa3ad');
}
function drawFlight(time){
  if(!S.flight) return;
  const a = P(1.0, -3.0, 32), c = [BW + 30, -30];
  const p = S.flight.dir === 'out' ? S.flight.p : 1 - S.flight.p;
  const e = p * p;
  const x = Math.round(a[0] + (c[0] - a[0]) * e), y = Math.round(a[1] + (c[1] - a[1]) * e);
  const back = S.flight.dir === 'out' ? -1 : 1;
  px([x - 10, y + 2], Math.sin(time * 30) > 0 ? '#ffb35c' : '#f3c14a', 5, 2);
  ellipse(x, y, 9, 4, '#e2e8f0'); b.fillStyle = '#9aa6b4'; b.fillRect(x - 9, y + 1, 18, 2);
  px([x + 2, y - 2], PAL.cyan, 4, 2); px([x - 4, y - 5], PAL.orange, 6, 1);
}
function drawShuttle(time){
  if(!shuttle.active) return;
  const a = P(1.0, -2.0, 12), c = P(LANDING[0], LANDING[1], 3);
  const from = shuttle.leg === 0 ? a : c, to = shuttle.leg === 0 ? c : a, p = shuttle.p;
  const mx = (from[0] + to[0]) / 2 - 24, my = Math.min(from[1], to[1]) - 30, q = 1 - p;
  const x = Math.round(q * q * from[0] + 2 * q * p * mx + p * p * to[0]);
  const y = Math.round(q * q * from[1] + 2 * q * p * my + p * p * to[1]);
  const dir = (shuttle.leg === 0) ? -1 : 1;
  px([x + dir * 6, y], Math.sin(time * 30) > 0 ? '#ffb35c' : '#f3c14a', 3, 2);
  ellipse(x, y, 6, 3.5, '#e2e8f0'); b.fillStyle = '#9aa6b4'; b.fillRect(x - 6, y + 1, 12, 2);
  px([x - dir * 2 - 1, y - 2], PAL.cyan, 3, 2); px([x, y - 4], Math.floor(time * 4) % 2 ? PAL.orange : '#7a4a14');
}
function drawPerson(a, time){
  const [x, y] = isoXY(a.u, a.v);
  const step = a.walking ? (Math.floor(time * 8 + a.u * 3) % 2) : 0;
  const L = a.look, suit = a.inLab && a.task !== 'inspect';
  const coat = suit ? '#eef2f7' : L.coat, shade = suit ? '#b9c3d2' : 'rgba(0,0,0,.18)';
  b.fillStyle = 'rgba(0,0,0,.3)'; b.fillRect(x - 3, y, 7, 2);
  const legC = suit ? '#d6dde7' : '#2f3346';
  b.fillStyle = legC; b.fillRect(x - 2, y - 4 - (step ? 1 : 0), 2, 4); b.fillRect(x + 1, y - 4 - (step ? 0 : 1), 2, 4);
  b.fillStyle = '#1d1f2b'; b.fillRect(x - 2, y - 1, 2, 1); b.fillRect(x + 1, y - 1, 2, 1);
  b.fillStyle = coat; b.fillRect(x - 3, y - 10, 7, 6);
  b.fillStyle = shade; b.fillRect(x + 2, y - 10, 2, 6);
  b.fillStyle = coat; b.fillRect(x - 4, y - 9 + step, 1, 4); b.fillRect(x + 4, y - 9 + (1 - step), 1, 4);
  if(!suit){ b.fillStyle = L.accent; b.fillRect(x, y - 10, 1, 3); }
  else { b.fillStyle = PAL.trim; b.fillRect(x - 3, y - 7, 7, 1); b.fillStyle = '#9aa6b8'; b.fillRect(x - 4, y - 10, 1, 3); }
  if(a.injured){ b.fillStyle = PAL.red; b.fillRect(x + 4, y - 8, 1, 1); }
  if(suit){
    b.fillStyle = '#f4f7fb'; b.fillRect(x - 3, y - 16, 7, 6); b.fillRect(x - 2, y - 17, 5, 1);
    b.fillStyle = '#1f6f86'; b.fillRect(x - 2, y - 14, 5, 2); b.fillStyle = '#9feaf5'; b.fillRect(x - 2, y - 14, 2, 1);
  } else {
    b.fillStyle = L.skin; b.fillRect(x - 2, y - 15, 5, 5);
    b.fillStyle = L.hair; b.fillRect(x - 2, y - 16, 5, 2); b.fillRect(x - 2, y - 15, 1, 2);
    if(L.puff){ b.fillRect(x - 3, y - 18, 7, 3); }
    b.fillStyle = '#1b1020'; b.fillRect(x + 1, y - 13, 1, 1); b.fillRect(x - 1, y - 13, 1, 1);
    if(L.clip){ b.fillStyle = '#f3c14a'; b.fillRect(x - 3, y - 17, 7, 2); b.fillStyle = '#e8e2d0'; b.fillRect(x + 4, y - 9, 2, 4); b.fillStyle = '#f2f2e0'; b.fillRect(x - 3, y - 8, 7, 1); }
  }
  if(a.kind === 'lead'){ b.fillStyle = L.accent; b.fillRect(x, y - 21, 1, 1); b.fillRect(x - 1, y - 20, 3, 1); b.fillRect(x, y - 19, 1, 1); }
  if(S.ui.focus && S.ui.focus.type === 'person' && S.ui.focus.id === actorKey(a)){ const bob = Math.round(Math.sin(time * 5)); b.fillStyle = PAL.amber; b.fillRect(x - 2, y - 27 + bob, 5, 1); b.fillRect(x - 1, y - 26 + bob, 3, 1); b.fillRect(x, y - 25 + bob, 1, 1); b.fillStyle = 'rgba(243,154,43,.35)'; b.fillRect(x - 4, y, 9, 2); }
  if(a.flash > 0 && Math.floor(time * 6) % 2 === 0){ b.fillStyle = PAL.red; b.fillRect(x, y - 27, 2, 5); b.fillRect(x, y - 21, 2, 1); }
}
function drawHushBig(x, y, time, sed, stress, loose){
  const tw = (stress > .6 && sed < .3 && Math.sin(time * 9) > .7) ? 1 : 0; x += tw;
  const eye = sed > .3 ? '#8a6a3a' : '#ffb13b';
  ellipse(x, y + 1, 13, 3, 'rgba(0,0,0,.35)');
  for(const [dx, s] of [[-8, -1], [-3, -1], [3, 1], [8, 1]]){ ln([x + dx, y - 4], [x + dx + s * 2, y], '#1e1630'); ln([x + dx + 1, y - 4], [x + dx + 1 + s * 2, y], '#2b2140'); }
  ellipse(x, y - 5, 12, 5, '#2b2140'); ellipse(x, y - 6, 11, 4.5, '#4b3a6b'); ellipse(x - 1, y - 8, 8, 2.5, '#6f5a9a'); ellipse(x - 2, y - 9, 4, 1, '#9a86c4');
  const ext = loose ? 4 : 0;
  [-8, -5, -2, 1, 4, 7].forEach((k, i) => {
    const h = 4 + (i % 2) + ext, top = y - 9 - h + Math.round(Math.abs(k) / 4);
    b.fillStyle = '#efe9f7'; b.fillRect(x + k, top, 1, h); b.fillStyle = '#b3a6cf'; b.fillRect(x + k + 1, top + 1, 1, h - 1);
    if(Math.sin(time * 2 + k) > .75){ b.fillStyle = PAL.cyan; b.fillRect(x + k, top, 1, 1); }
  });
  const blink = Math.sin(time * .7 + 1.3) > .97;
  if(!blink){ b.fillStyle = eye; b.fillRect(x - 9, y - 6, 2, 1); b.fillRect(x - 5, y - 6, 2, 1); if(sed < .3){ b.fillStyle = 'rgba(255,177,59,.35)'; b.fillRect(x - 10, y - 7, 8, 3); } }
  if(sed > .25){ const k = (time * .6) % 1, yy = Math.round(y - 18 - k * 10); b.fillStyle = `rgba(220,215,240,${1 - k})`; b.fillRect(x + 10, yy, 3, 1); b.fillRect(x + 11, yy + 1, 1, 1); b.fillRect(x + 10, yy + 2, 3, 1); }
}
function drawHush(g, x, y, time, sed, stress, loose){
  const body = '#3b2f4f', dark = '#241b33', spine = '#ddd5ea', eye = sed > 0.3 ? '#7a5a2a' : '#ffb13b';
  g.fillStyle = dark; g.fillRect(x - 7, y - 3, 14, 3);
  g.fillStyle = body; g.fillRect(x - 6, y - 5, 12, 2); g.fillRect(x - 4, y - 6, 8, 1);
  g.fillStyle = spine; for(const k of [-4, -1, 2, 5]) g.fillRect(x + k, y - 8, 1, 2);
  g.fillStyle = eye; g.fillRect(x - 3, y - 4, 1, 1); g.fillRect(x + 1, y - 4, 1, 1);
}
