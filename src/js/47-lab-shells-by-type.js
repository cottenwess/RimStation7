/* ---------- lab shells by type ---------- */
const LABMOD = {
  containment:{floor:'#2a3b57', inset:'#314565', hi:'#41597f', strip:null},
  micro:{floor:'#28463f', inset:'#2f5249', hi:'#43705f', strip:'#8bd472'},
  genetics:{floor:'#33294a', inset:'#3b3056', hi:'#55467a', strip:'#b98cf0'},
  chem:{floor:'#3f3426', inset:'#4a3d2c', hi:'#66553c', strip:'#f3c14a'},
  physics:{floor:'#22323f', inset:'#28394a', hi:'#3d566c', strip:'#62d6e3'}
};
for(const k in LABMOD) Object.assign(LABMOD[k], {u0:6, u1:12, v0:-1, v1:5, H:42, lab:true});
function labBase(time, strip){
  const m = LABMOD[CL.type]; slab(m); floorTiles(m);
  box(m.u0, m.v0, m.u0 + WT, 1, 0, m.H, PAL.wallTop, PAL.wallCut, PAL.wallInDk);
  box(m.u0, 3, m.u0 + WT, m.v1, 0, 6, PAL.wallTop, PAL.wallCut, PAL.wallInDk);
  box(m.u0, m.v0, m.u1, m.v0 + WT, 0, m.H, PAL.wallTop, PAL.wallIn, PAL.wallCut);
  const {vw} = wallBands(m, strip);
  leftBands(m, m.v0 + WT, 1, m.H, strip);
  const uw = m.u0 + WT;
  cableTrayV(-0.75, -0.55, uw, 4, m.H - 3);
  qV(0.35, 0.8, uw, 10, 17, '#2c3442');
  for(let r = 0; r < 3; r++) for(let c = 0; c < 3; c++) px(P(uw, 0.42 + c * .12, 15 - r * 2), '#8d99ad');
  px(P(uw, 0.75, 16), LB() ? PAL.red : PAL.green, 1, 2);
  return {m, vw, uw};
}
function drawLabShell(time){
  if(CL.type !== 'containment') return SHELL[CL.type](time);
  const {m, vw} = labBase(time, labStrip(time));
  for(const [u0, v0, u1, v1] of [[7.4, 0.4, 10.6, 0.52], [7.4, 3.48, 10.6, 3.6], [7.4, 0.4, 7.52, 3.6], [10.48, 0.4, 10.6, 3.6]]) hazardFloor(u0, v0, u1, v1, 16);
  const cols = ['#e05a5a', '#5ab0e0', '#e0c05a', '#7ad07a'];
  cols.forEach((c, k) => { let prev = P(11.0 + k * .08, -0.26, 0); for(let s = 1; s <= 10; s++){ const p = P(11.0 + k * .08 - s * .34, -0.24 + .06 * Math.sin(s * 1.3 + k), 0); ln(prev, p, c); prev = p; } });
  screenU(8.95, 10.45, vw, 16, 31);
  for(let k = 0; k <= 28; k++){ const u = 9.0 + k * .05, sn = Math.sin(k * .55 + time * 1.8), zA = 23.5 + sn * 5, zB = 23.5 - sn * 5; if(k % 3 === 0) ln(P(u, vw, zA), P(u, vw, zB), 'rgba(98,214,227,.35)'); px(P(u, vw, zA), PAL.cyan); px(P(u, vw, zB), PAL.purple); }
  qU(6.32, 7.58, vw, 11, 26, '#7d8898'); qU(6.36, 7.54, vw, 12, 25, '#eef3f7');
  for(let k = 0; k < 7; k++){ const u = 6.45 + hash(k, 3) * .8, z = 14 + hash(3, k) * 9; ln(P(u, vw, z), P(u + .12 + hash(k, k) * .25, vw, z), '#4f7fd0'); if(k % 2) ln(P(u, vw, z), P(u, vw, z + 2 + hash(k, 9) * 3), '#4f7fd0'); }
  qU(6.5, 7.4, vw, 10, 11, '#5f6b7c'); px(P(6.7, vw, 11), PAL.red, 2, 1); px(P(6.85, vw, 11), '#3b74c4', 2, 1);
  bioPoster(7.72, 8.18, vw, 14, 25);
  qU(8.32, 8.7, vw, 20, 27, '#8a95a5'); for(let z = 21; z < 27; z += 1.5) ln(P(8.35, vw, z), P(8.67, vw, z), '#4c5666');
  stripLightU(6.3, 10.6, vw, 36, 1.8);
  conduitU(6, 12, vw, 39);
}
function bioPoster(u0, u1, vw, z0, z1){
  qU(u0, u1, vw, z0, z1, '#f2c230'); qU(u0, u1, vw, z0, z0 + 1, '#2b2614');
  const hz = P((u0 + u1) / 2, vw, (z0 + z1) / 2 + 1.5); ellipse(hz[0], hz[1], 3, 3, '#2b2614'); ellipse(hz[0], hz[1], 1.4, 1.4, '#f2c230'); px([hz[0] - 4, hz[1] + 1], '#2b2614', 2, 2); px([hz[0] + 3, hz[1] + 1], '#2b2614', 2, 2); px([hz[0] - 1, hz[1] - 5], '#2b2614', 2, 2);
}
function hood(u0, u1, vw, time, glow){
  box(u0, vw, u1, vw + .55, 0, 9, '#c9d2de', '#8d99ad', '#6b778c');
  box(u0, vw, u1, vw + .55, 9, 24, '#d6dde7', 'rgba(170,215,230,.35)', '#8d99ad');
  qU(u0 + .05, u1 - .05, vw + .55, 10, 22, glow);
  box(u0, vw, u1, vw + .55, 24, 28, '#e2e8f0', '#9aa6ba', '#7b879a');
  px(P(u0 + .12, vw + .55, 26), Math.sin(time * 2) > 0 ? PAL.green : '#2a4a2a', 2, 1);
}
const SHELL = {
  micro(time){
    const {vw} = labBase(time, LB() ? PAL.red : LABMOD.micro.strip);
    hood(6.3, 7.4, vw, time, 'rgba(120,140,255,.22)'); hood(7.5, 8.6, vw, time, 'rgba(120,140,255,.18)');
    bioPoster(8.8, 9.25, vw, 14, 25);
    for(const [z, c] of [[14, '#eef2f7'], [22, '#eef2f7']]) box(9.6, vw, 11.8, vw + .5, z - 8, z, c, '#b9c3d2', '#98a4b6');
    for(let k = 0; k < 4; k++){ px(P(9.8 + k * .5, vw + .5, 11), Math.sin(time * 2 + k) > 0 ? PAL.amber : '#5a4a1a', 3, 1); px(P(9.8 + k * .5, vw + .5, 19), '#62d6e3', 3, 1); }
    stripLightU(6.3, 11.7, vw, 36, 1.8); conduitU(6, 12, vw, 39);
    for(const [u0, v0, u1, v1] of [[7.4, 0.4, 10.6, 0.52], [7.4, 3.48, 10.6, 3.6]]) hazardFloor(u0, v0, u1, v1, 16);
  },
  genetics(time){
    const {vw} = labBase(time, LB() ? PAL.red : LABMOD.genetics.strip);
    screenU(6.35, 8.6, vw, 14, 32);
    for(let k = 0; k <= 42; k++){ const u = 6.42 + k * .05, sn = Math.sin(k * .45 + time * 1.4), zA = 23 + sn * 6, zB = 23 - sn * 6; if(k % 3 === 0) ln(P(u, vw, zA), P(u, vw, zB), 'rgba(185,140,240,.35)'); px(P(u, vw, zA), PAL.purple); px(P(u, vw, zB), PAL.cyan); }
    for(const u of [8.9, 9.9]){ box(u, vw, u + .85, vw + .6, 0, 14, '#eef2f7', '#b9c3d2', '#98a4b6'); qU(u + .1, u + .75, vw + .6, 8, 12, '#1d2a33'); for(let k = 0; k < 6; k++) px(P(u + .15 + k * .1, vw + .6, 10), Math.sin(time * 4 + k + u) > 0 ? ['#ff5d63', '#8bd472', '#62d6e3', '#f3c14a'][k % 4] : '#2c3442'); }
    stripLightU(6.3, 11.7, vw, 36, 1.8); conduitU(6, 12, vw, 39);
  },
  chem(time){
    const {vw} = labBase(time, LB() ? PAL.red : LABMOD.chem.strip);
    hood(6.3, 7.5, vw, time, 'rgba(243,193,74,.16)');
    qU(7.7, 9.6, vw, 8, 30, '#8592a6');
    for(const z of [12, 19, 26]){ box(7.7, vw, 9.6, vw + .32, z, z + 1, '#e2e8f0', '#a2aec0', '#7b879a'); for(let k = 0; k < 7; k++){ const p = P(7.82 + k * .25, vw + .16, z + 1), col = ['#f3c14a', '#ff5d63', '#8bd472', '#62d6e3', '#b98cf0', '#f08a2b', '#e8f4f7'][(k + z) % 7]; px([p[0] - 1, p[1] - 5], 'rgba(220,235,245,.5)', 3, 5); px([p[0] - 1, p[1] - 3], col, 3, 3); } }
    bioPoster(9.85, 10.3, vw, 14, 25);
    for(const u of [10.7, 11.15]){ box(u, vw + .05, u + .3, vw + .35, 0, 26, '#4f7fd0', '#3b67a6', '#2c4f80'); qU(u + .03, u + .27, vw + .35, 18, 22, '#f2f2e0'); }
    stripLightU(6.3, 10.4, vw, 36, 1.8); conduitU(6, 12, vw, 39);
  },
  physics(time){
    const {vw} = labBase(time, LB() ? PAL.red : LABMOD.physics.strip);
    screenU(6.35, 9.2, vw, 12, 32);
    let prev = null; for(let k = 0; k <= 56; k++){ const u = 6.42 + k * .05, z = 22 + Math.sin(k * .3 + time * 3) * 5 * Math.sin(k * .07 + time * .5); const p = P(u, vw, z); if(prev) ln(prev, p, PAL.cyan); prev = p; }
    for(let k = 0; k < 5; k++){ const p = P(6.5 + k * .55, vw, 14); px(p, '#62d6e3', 6, 1); }
    for(let r = 0; r < 4; r++) for(let c = 0; c < 6; c++) px(P(9.6 + c * .3, vw, 26 - r * 3), Math.sin(time * 3 + r * 2 + c) > 0 ? [PAL.green, PAL.amber, PAL.red][(r + c) % 3] : '#2a3240', 2, 1);
    qU(9.5, 11.6, vw, 14, 30, 'rgba(40,50,64,.6)');
    stripLightU(6.3, 11.7, vw, 36, 1.8); conduitU(6, 12, vw, 39);
    for(const [u0, v0, u1, v1] of [[7.4, 0.4, 10.6, 0.52], [7.4, 3.48, 10.6, 3.6], [7.4, 0.4, 7.52, 3.6], [10.48, 0.4, 10.6, 3.6]]) hazardFloor(u0, v0, u1, v1, 16);
  }
};
