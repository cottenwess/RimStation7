/* ================= doors, glass lips, tank ================= */
function doorFrame(time){
  const u = MODS.lab.u0;
  box(u, 0.94, u + WT, 1.1, 0, 26, PAL.wallTop, '#8d99ad', '#6b778c');
  box(u, 2.9, u + WT, 3.06, 0, 26, PAL.wallTop, '#8d99ad', '#6b778c');
  box(u, 0.94, u + WT, 3.06, 24, 29, PAL.wallTop, '#8d99ad', '#6b778c');
  qV(1.1, 1.3, u + WT, 22, 24, '#8d99ad'); qV(2.7, 2.9, u + WT, 22, 24, '#8d99ad');
  for(const v of [1.02, 2.98]){ const p = P(u + WT, v, 12); px([p[0], p[1] - 4], PAL.orange, 1, 8); }
  for(let k = 0; k < 8; k++) qZ(u - .05, 1.1 + k * .225, u + .25, 1.1 + k * .225 + .11, 0, k % 2 ? '#2b2614' : '#e6be3a');
  const sg = P(u + .1, 2.0, 36); b.fillStyle = '#273141'; b.fillRect(sg[0] - 12, sg[1] - 5, 25, 10); b.fillStyle = CL.bsl === 3 ? PAL.cyan : PAL.amber; b.fillRect(sg[0] - 11, sg[1] - 4, 23, 8);
  text('BSL-' + CL.bsl, sg[0] - 9, sg[1] - 2, '#1c1005'); ln([sg[0] - 6, sg[1] + 5], [sg[0] - 6, sg[1] + 8], '#6b778c'); ln([sg[0] + 6, sg[1] + 5], [sg[0] + 6, sg[1] + 8], '#6b778c');
  const l = P(u + .1, 2.0, 30); const on = LB() ? Math.floor(time * 6) % 2 : 1;
  px([l[0] - 2, l[1] - 3], on ? (LB() ? PAL.red : PAL.green) : '#3a1418', 4, 3);
}
function frontLips(m, glass, gap, gapU){
  for(const [u0, u1] of gapU ? [[m.u0, 1], [3, m.u1]] : [[m.u0, m.u1]]) box(u0, m.v1 - WT, u1, m.v1, 0, 6, PAL.wallTop, '#8d99ad', '#6b778c');
  ln(P(m.u0, m.v1, 6), P(m.u1, m.v1, 6), '#ffffff');
  const segs = m === MODS.hub || gap ? [[m.v0, 1], [3, m.v1]] : [[m.v0, m.v1]];
  for(const [v0, v1] of segs) box(m.u1 - WT, v0, m.u1, Math.min(v1, m.v1 - WT), 0, 6, PAL.wallTop, '#8d99ad', '#6b778c');
  qU(m.u0, m.u1, m.v1, 2, 3, PAL.trim);
  if(glass){
    qU(m.u0, m.u1, m.v1, 6, 17, 'rgba(160,230,240,.14)');
    for(const [v0, v1] of segs){ qV(v0, v1, m.u1, 6, 17, 'rgba(160,230,240,.10)'); ln(P(m.u1, v0, 17), P(m.u1, v1, 17), '#c9d2de'); for(let v = v0; v <= v1; v++) ln(P(m.u1, v, 6), P(m.u1, v, 17), '#a9b4c4'); }
    for(let u = m.u0; u <= m.u1; u++) ln(P(u, m.v1, 6), P(u, m.v1, 17), '#c9d2de');
    ln(P(m.u0, m.v1, 17), P(m.u1, m.v1, 17), '#e2e8f0');
    for(let k = 0; k < m.u1 - m.u0; k++){ const a = P(m.u0 + .3 + k, m.v1, 8), c = P(m.u0 + .5 + k, m.v1, 15); ln(a, c, 'rgba(255,255,255,.35)'); }
  }
}
const TK = {c:8, d:2, h:1.3, z0:6, z1:38};
function tankBack(time){
  const a = TK.c - TK.h, e = TK.c + TK.h, f = TK.d - TK.h, g = TK.d + TK.h, Z = TK.z1;
  box(a, f, e, g, 0, TK.z0, '#556076', '#3f485c', '#2f3747');
  const lc = LB() ? PAL.red : CL.bsl === 3 ? PAL.cyan : PAL.green;
  for(let k = 0; k < 10; k++){ const on = Math.sin(time * 3 + k) > -.3; px(P(a + .15 + k * .24, g, 3), on ? lc : '#22303a', 2, 1); }
  for(let k = 0; k < 10; k++) px(P(e, f + .15 + k * .24, 3), Math.sin(time * 2.4 + k) > 0 ? lc : '#1c2530', 1, 1);
  qU(a, e, f, TK.z0, Z, 'rgba(120,210,225,.10)'); qV(f, g, a, TK.z0, Z, 'rgba(120,210,225,.08)');
  const cs = labSpec(CL), nt = cs && CL.envMatched ? cs.truth.needs.temp : 'temperate';
  qZ(a, f, e, g, TK.z0, nt === 'cryogenic' ? '#5a7a9a' : nt === 'near-freezing' ? '#4a6a8a' : nt === 'scalding' ? '#6a3a2a' : '#36646c');
  for(let k = 0; k < 12; k++){ const p = P(a + .25 + hash(k, 1) * 2.1, f + .25 + hash(1, k) * 2.1, TK.z0); px(p, '#5d8c90', 3, 1); px([p[0], p[1] - 1], '#7fb0b3', 2, 1); }
  const ed = 'rgba(210,245,255,.28)';
  ln(P(a, f, TK.z0), P(a, f, Z), ed); ln(P(e, f, Z), P(a, f, Z), ed); ln(P(a, f, Z), P(a, g, Z), ed);
}
function tankFront(time){
  const a = TK.c - TK.h, e = TK.c + TK.h, f = TK.d - TK.h, g = TK.d + TK.h, Z = TK.z1;
  const cs = labSpec(CL), broken = LB();
  const red = cs && CL.envMatched && cs.truth.needs.light === 'dim red light', hot = cs && CL.envMatched && cs.truth.needs.temp === 'scalding';
  const tint = red ? 'rgba(200,50,70,.14)' : hot ? 'rgba(240,140,60,.12)' : cs && CL.envMatched && cs.truth.needs.pressure === 'high' ? 'rgba(220,210,180,.16)' : 'rgba(98,214,227,.08)';
  if(!broken && cs && cs.kind !== 'fossil') for(let k = 0; k < 9; k++){ const z = TK.z0 + 1 + ((time * 7 + k * 5.3) % (Z - TK.z0 - 2)); px(P(a + .3 + hash(k, 9) * 2, f + .3 + hash(9, k) * 2, z), 'rgba(220,250,255,.7)'); }
  const ed = 'rgba(220,248,255,.45)';
  if(!broken){
    qU(a, e, g, TK.z0, Z, tint); qV(f, g, e, TK.z0, Z, tint); qZ(a, f, e, g, Z, 'rgba(180,235,245,.07)');
    ln(P(a, g, TK.z0), P(a, g, Z), ed); ln(P(e, g, TK.z0), P(e, g, Z), 'rgba(235,252,255,.6)'); ln(P(e, f, TK.z0), P(e, f, Z), ed);
    ln(P(a, g, Z), P(e, g, Z), ed); ln(P(e, g, Z), P(e, f, Z), ed);
    ln(P(a + .25, g, 10), P(a + .7, g, Z - 4), 'rgba(255,255,255,.35)'); ln(P(a + .45, g, 10), P(a + .75, g, Z - 12), 'rgba(255,255,255,.18)');
    ln(P(e, f + .3, 12), P(e, f + .9, Z - 6), 'rgba(255,255,255,.22)');
    if(CL.integrity < 55){ const s = P(TK.c + .4, g, Z - 8); ln(s, [s[0] + 3, s[1] + 4], '#ffffff'); ln([s[0] + 3, s[1] + 4], [s[0] + 1, s[1] + 8], '#ffffff'); ln([s[0] + 3, s[1] + 4], [s[0] + 6, s[1] + 5], '#e8fbff'); }
  } else {
    poly([P(e, f, TK.z0), P(e, TK.d, TK.z0), P(e, TK.d - .2, 15), P(e, f, 24)], tint);
    poly([P(a, g, TK.z0), P(a + .6, g, TK.z0), P(a + .4, g, 14), P(a, g, 18)], tint);
    for(let k = 0; k < 12; k++) px(P(a + .3 + hash(k, 3) * 2.2, g + .15 + hash(3, k) * .5, 0), 'rgba(190,245,252,.8)', 2, 1);
  }
  if(CL.fault && !broken && Math.sin(time * 13) > .7){ const sp = P(a + .2, f + .2, TK.z0 + 2); px(sp, '#fff3a0', 2, 1); px([sp[0] + 2, sp[1] - 2], '#ffe066'); px([sp[0] - 1, sp[1] + 2], '#ffe066'); }
  if(red && !broken) qZ(a, f, e, g, Z, 'rgba(200,40,60,.10)');
}
const spBuf = document.createElement('canvas'); spBuf.width = 48; spBuf.height = 40; const spC = spBuf.getContext('2d');
function drawSpecimenBig(sp, x, y, time, o){ spC.clearRect(0, 0, 48, 40); drawSpecimen(spC, sp, 24, 34, time, o); b.imageSmoothingEnabled = false; b.drawImage(spBuf, x - 48, y - 68, 96, 80); }
function labFridge(time){
  box(6.25, 3.25, 6.75, 3.75, 0, 15, '#eef2f7', '#b9c3d2', '#98a4b6');
  ln(P(6.25, 3.75, 9), P(6.75, 3.75, 9), '#8d99ad'); px(P(6.68, 3.75, 12), '#6b778c', 1, 3);
  qU(6.32, 6.6, 3.75, 10, 14, '#6fb8c9'); px(P(6.4, 3.75, 13), '#e8fbff');
  px(P(6.3, 3.75, 4), Math.sin(time * 2) > 0 ? PAL.cyan : PAL.cyanDk, 2, 1);
  const n = CL.k === 0 ? S.specs.filter(s => s.alive && s.loc === 'hold').length : 0;
  for(let k = 0; k < Math.min(n, 6); k++) px(P(6.34 + k * .07, 3.75, 7), Math.sin(time * 1.5 + k) > -.5 ? PAL.green : '#2a4a2a', 1, 1);
}
