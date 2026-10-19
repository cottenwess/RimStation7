/* ================= containment lab props ================= */
function labDesk(time){
  const u0 = 6.3, u1 = 7.62, v0 = 0.22, v1 = 0.7;
  box(u0, v0, u1, v1, 0, 8, '#f08a3a', '#9aa6b5', '#7d8a99');
  qZ(u0, v0, u1, v1, 8, '#e4782a'); ln(P(u0, v1, 8), P(u1, v1, 8), '#ffb06a');
  for(const [a, c] of [[u0 + .05, u0 + .45], [u1 - .45, u1 - .05]]){ qU(a, c, v1, 1, 7, '#b4bfcc'); for(const z of [2.5, 4.5]) ln(P(a + .04, v1, z), P(c - .04, v1, z), '#6b778c'); px(P((a + c) / 2, v1, 6), '#3a4454', 2, 1); }
  // monitor with green text
  box(6.48, 0.3, 6.98, 0.36, 9, 17, '#2c3442', '#1d232e', '#161b24');
  qU(6.51, 6.95, 0.36, 10, 16, '#0d2a1f');
  for(let r = 0; r < 4; r++) ln(P(6.54, 0.36, 15 - r * 1.4), P(6.54 + .1 + hash(r, Math.floor(time * 1.5)) * .28, 0.36, 15 - r * 1.4), PAL.green);
  ln(P(6.73, 0.33, 8), P(6.73, 0.33, 9), '#2c3442');
  qZ(6.5, 0.45, 6.95, 0.6, 8.2, '#c9d2de'); for(let k = 0; k < 5; k++) px(P(6.55 + k * .08, 0.52, 8.3), '#8d99ad');
  // microscope and a sample tray
  box(7.15, 0.32, 7.3, 0.46, 8, 9, '#2c3442', '#1d232e', '#161b24');
  const mc = P(7.22, 0.38, 9); px([mc[0], mc[1] - 6], '#d6dde7', 2, 6); px([mc[0] - 2, mc[1] - 8], '#2c3442', 4, 2); px([mc[0] + 1, mc[1] - 3], '#2c3442', 3, 1);
  box(7.35, 0.4, 7.55, 0.6, 8, 9, '#3a8a5a', '#2a6a44', '#1f5034'); px(P(7.42, 0.5, 9.2), '#e8b84a', 2, 1);
}
function labChair(u, v){
  ln(P(u, v, 0), P(u, v, 5), '#2c3442');
  for(const [du, dv] of [[-.14, 0], [.14, 0], [0, -.14], [0, .14]]) px(P(u + du, v + dv, 0), '#1d2028', 2, 1);
  box(u - .17, v - .17, u + .17, v + .17, 5, 7, '#2c2f3a', '#1f2129', '#17191f');
  box(u - .17, v - .17, u + .17, v - .1, 7, 16, '#c43c3c', '#3a1d22', '#2a1418');
}
function serverRack(u0, u1, time){
  box(u0, 0.22, u1, 0.72, 0, 26, '#3a3f4c', '#262a34', '#1d2028');
  qU(u0 + .05, u1 - .05, 0.72, 2, 24, '#181b22');
  for(let r = 0; r < 9; r++){
    ln(P(u0 + .07, 0.72, 3 + r * 2.4), P(u1 - .07, 0.72, 3 + r * 2.4), '#2c3240');
    for(let c = 0; c < 3; c++) if(Math.sin(time * (4 + c) + r * 1.9 + u0 * 7 + c * 2.1) > .1) px(P(u0 + .1 + c * .08, 0.72, 4 + r * 2.4), [PAL.green, PAL.cyan, PAL.amber][c]);
  }
  qU(u0 + .05, u1 - .05, 0.72, 2, 24, 'rgba(120,180,210,.12)');
  ln(P(u0 + .1, 0.72, 6), P(u0 + .25, 0.72, 20), 'rgba(255,255,255,.18)');
}
function labRacks(time){ serverRack(8.82, 9.34, time); serverRack(9.38, 9.9, time); }
function labBins(time){
  for(const [z0, z1] of [[0, 5], [5, 10]]){ box(9.32, 1.25, 9.86, 1.78, z0, z1, '#5b8ad0', '#3f6db3', '#2d548e'); ln(P(9.32, 1.78, z1 - 1), P(9.86, 1.78, z1 - 1), '#7da6e3'); }
}
function labConsole(time){
  box(9.3, 3.15, 9.85, 3.72, 0, 9, '#c9d2de', '#8d99ad', '#6b778c');
  for(const z of [3, 6]) ln(P(9.33, 3.72, z), P(9.82, 3.72, z), '#6b778c');
  box(9.36, 3.25, 9.8, 3.6, 9, 15, '#d6dde7', '#8d99ad', '#6b778c');
  qU(9.4, 9.62, 3.6, 10, 14, '#0f2a24');
  let prev = null; for(let k = 0; k <= 8; k++){ const p = P(9.41 + k * .025, 3.6, 12 + Math.round(Math.sin(k * 1.2 + time * 5) * 1.5)); if(prev) ln(prev, p, PAL.green); prev = p; }
  for(let k = 0; k < 3; k++) px(P(9.67 + k * .04, 3.6, 12), [PAL.amber, PAL.red, PAL.cyan][k]);
}
function sampleBench(time){
  box(8.4, 4.22, 9.8, 4.72, 0, 8, '#e4782a', '#9aa6b5', '#7d8a99');
  qZ(8.4, 4.22, 9.8, 4.72, 8, '#f08a3a'); ln(P(8.4, 4.72, 8), P(9.8, 4.72, 8), '#ffb06a');
  for(const a of [8.45, 9.3]){ qU(a, a + .4, 4.72, 1, 7, '#b4bfcc'); ln(P(a + .04, 4.72, 4), P(a + .36, 4.72, 4), '#6b778c'); }
  box(8.55, 4.35, 8.95, 4.5, 8, 9, '#d6dde7', '#8d99ad', '#6b778c');
  ['#ff5d63', '#62d6e3', '#8bd472', '#f3c14a', '#b98cf0', '#62d6e3'].forEach((c, k) => { const p = P(8.6 + k * .06, 4.42, 9); px([p[0], p[1] - 4], '#e8f4f7', 1, 4); px([p[0], p[1] - 2], c, 1, 2); });
  box(9.15, 4.32, 9.45, 4.6, 8, 12, '#3a4454', '#2c3442', '#232a36'); const cn = P(9.3, 4.46, 12); px([cn[0] - 1, cn[1]], Math.sin(time * 4) > 0 ? PAL.green : '#2a4a2a', 2, 1);
  box(9.55, 4.38, 9.7, 4.55, 8, 10, '#c9d2de', '#8d99ad', '#6b778c');
}
function labExtinguisher(){
  box(6.24, 3.08, 6.36, 3.2, 0, 9, '#ff7466', '#d63a35', '#a82a28');
  const p = P(6.3, 3.14, 9); px([p[0] - 1, p[1] - 2], '#2c3442', 3, 2); px([p[0] + 1, p[1] - 1], '#2c3442', 2, 1);
}

