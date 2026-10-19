/* ---------- specialty centerpieces (drawn at the tank spot, local coords around TK) ---------- */
function incubator(time, sp){
  const a = TK.c - .95, e = TK.c + .95, f = TK.d - .95, g = TK.d + .95, Z = 32;
  box(a, f, e, g, 0, 7, '#c9d2de', '#8d99ad', '#6b778c');
  for(let k = 0; k < 6; k++) px(P(a + .2 + k * .25, g, 4), Math.sin(time * 3 + k) > 0 ? PAL.green : '#22303a', 2, 1);
  const col = sp ? sp.pal.body : '#62d6e3';
  const lvl = 7 + 18 + Math.round(Math.sin(time * 1.2) * 1);
  qU(a + .05, e - .05, f + .05, 7, lvl, hexA(col, .14)); qV(f + .05, g - .05, a + .05, 7, lvl, hexA(col, .12));
  if(sp){ const q = isoXY(TK.c, TK.d); drawSpecimenBig(sp, q[0], q[1] - 14, time); }
  for(let k = 0; k < 8; k++){ const z = 8 + ((time * 5 + k * 3.1) % (lvl - 9)); px(P(a + .3 + hash(k, 4) * 1.3, f + .3 + hash(4, k) * 1.3, z), 'rgba(230,255,235,.75)'); }
  qU(a + .05, e - .05, g - .05, 7, lvl, hexA(col, .16)); qV(f + .05, g - .05, e - .05, 7, lvl, hexA(col, .14)); qZ(a + .05, f + .05, e - .05, g - .05, lvl, hexA(col, .22));
  const ed = 'rgba(220,248,255,.45)';
  for(const [u, v] of [[a, g], [e, g], [e, f]]) ln(P(u, v, 7), P(u, v, Z), ed);
  ln(P(a, g, Z), P(e, g, Z), ed); ln(P(e, g, Z), P(e, f, Z), ed); ln(P(a, f, Z), P(e, f, Z), 'rgba(220,248,255,.25)'); ln(P(a, f, Z), P(a, g, Z), 'rgba(220,248,255,.25)');
  qZ(a, f, e, g, Z, 'rgba(180,235,245,.06)');
  ln(P(a + .3, g, 10), P(a + .6, g, Z - 3), 'rgba(255,255,255,.3)');
  const lt = P(TK.c, f, Z); px([lt[0] - 2, lt[1] - 1], sp ? PAL.green : '#2a4a2a', 4, 2);
}
function scanTable(time, sp){
  const a = TK.c - 1.1, e = TK.c + 1.1, f = TK.d - .7, g = TK.d + .7;
  box(a, f, e, g, 0, 9, '#3a3f4c', '#262a34', '#1d2028');
  qZ(a + .1, f + .1, e - .1, g - .1, 9, '#d6dde7');
  if(sp){ const q = isoXY(TK.c, TK.d); drawSpecimenBig(sp, q[0], q[1] - 6, time); }
  const sx = TK.c - .9 + (.5 + .5 * Math.sin(time * .8)) * 1.8;
  b.globalCompositeOperation = 'lighter'; poly([P(sx, f, 22), P(sx + .05, f, 22), P(sx + .05, g, 9), P(sx, g, 9)], 'rgba(185,140,240,.35)'); b.globalCompositeOperation = 'source-over';
  box(sx - .05, f - .1, sx + .1, f, 9, 24, '#b98cf0', '#7d5ab0', '#5a3f84');
  for(const u of [TK.c + 1.6]){ box(u - .25, TK.d - .25, u + .25, TK.d + .25, 0, 30, '#c9d2de', '#8d99ad', '#6b778c'); qU(u - .2, u + .2, TK.d + .25, 4, 28, `rgba(120,220,140,${.25 + .1 * Math.sin(time * 2)})`); for(let k = 0; k < 4; k++){ const z = 6 + ((time * 6 + k * 6) % 20); px(P(u, TK.d + .25, z), 'rgba(220,255,230,.8)'); } }
}
function chemIsland(time){
  const a = TK.c - 1.1, e = TK.c + 1.1, f = TK.d - .6, g = TK.d + .6;
  box(a, f, e, g, 0, 9, '#e4782a', '#9aa6b5', '#7d8a99'); qZ(a, f, e, g, 9, '#f08a3a');
  const fl = [[a + .3, f + .3, '#8bd472'], [a + .8, f + .5, '#ff5d63'], [TK.c + .3, TK.d, '#62d6e3'], [e - .4, g - .3, '#b98cf0']];
  for(const [u, v, c] of fl){ const p = P(u, v, 9); ellipse(p[0], p[1] - 3, 3, 3, 'rgba(220,235,245,.6)'); ellipse(p[0], p[1] - 3, 2.2, 2, c); px([p[0] - 1, p[1] - 9], 'rgba(220,235,245,.7)', 2, 5); if(Math.sin(time * 4 + u) > .5) px([p[0], p[1] - 11 - Math.round((time * 6) % 4)], 'rgba(255,255,255,.6)'); }
  box(e - .3, TK.d - .15, e - .1, TK.d + .15, 9, 30, '#d6dde7', 'rgba(170,215,230,.5)', '#8d99ad');
  for(let k = 0; k < 4; k++) px(P(e - .2, TK.d + .15, 12 + k * 5), PAL.amber, 1, 2);
}
function physicsRig(time){
  const p = isoXY(TK.c, TK.d);
  box(TK.c - 1, TK.d - 1, TK.c + 1, TK.d + 1, 0, 6, '#3a3f4c', '#262a34', '#1d2028');
  const cx = p[0], cy = p[1] - 22, pulse = .5 + .5 * Math.sin(time * 2.5);
  b.strokeStyle = OUT; b.lineWidth = 6; b.beginPath(); b.ellipse(cx, cy, 22, 18, 0, 0, Math.PI * 2); b.stroke();
  b.strokeStyle = '#8d99ad'; b.lineWidth = 4; b.beginPath(); b.ellipse(cx, cy, 22, 18, 0, 0, Math.PI * 2); b.stroke(); b.lineWidth = 1;
  for(let k = 0; k < 12; k++){ const t = k / 12 * Math.PI * 2; px([Math.round(cx + Math.cos(t) * 22), Math.round(cy + Math.sin(t) * 18)], k % 3 ? '#c9d2de' : PAL.cyan, 2, 2); }
  b.globalCompositeOperation = 'lighter'; ellipse(cx, cy, 10 + pulse * 3, 8 + pulse * 2, `rgba(185,140,240,${.25 + pulse * .2})`); ellipse(cx, cy, 4, 3, 'rgba(255,255,255,.6)'); b.globalCompositeOperation = 'source-over';
  for(const [du, dv] of [[-.8, .8], [.8, .8]]) box(TK.c + du - .08, TK.d + dv - .08, TK.c + du + .08, TK.d + dv + .08, 6, 22, '#8d99ad', '#6b778c', '#556076');
}

