/* ---------- hub ---------- */
function pegboard(uw, v0, v1, z0, z1){
  qV(v0, v1, uw, z0, z1, '#b98f5a'); qV(v0 + .03, v1 - .03, uw, z0 + 1, z1 - 1, '#c9a46a');
  for(let v = v0 + .08; v < v1 - .04; v += .1) for(let z = z0 + 2; z < z1 - 1; z += 2.5) px(P(uw, v, z), '#8a6838');
  const tools = [[.15, '#9aa6b5', 7], [.3, '#d63a35', 5], [.45, '#9aa6b5', 8], [.62, '#f3c14a', 5], [.78, '#9aa6b5', 6], [.92, '#3b74c4', 7]];
  for(const [f, c, h] of tools){ const v = v0 + (v1 - v0) * f; ln(P(uw, v, z1 - 4), P(uw, v, z1 - 4 - h), c); px(P(uw, v, z1 - 4), c, 2, 1); }
  qV(v0 + .1, v0 + .45, uw, z0 + 2, z0 + 6, '#3b74c4'); qV(v0 + .55, v1 - .1, uw, z0 + 2, z0 + 6, '#3b74c4');
}
function printer3d(time){
  const u0 = 0.85, u1 = 1.45, v0 = 3.3, v1 = 3.8;
  box(u0, v0, u1, v1, 0, 7, '#c9d2de', '#8d99ad', '#6b778c');
  box(u0 + .05, v0 + .05, u1 - .05, v1 - .05, 7, 19, '#2c3442', '#1d232e', '#161b24');
  qU(u0 + .1, u1 - .1, v1 - .05, 8, 17, 'rgba(255,150,60,.18)'); qV(v0 + .1, v1 - .1, u1 - .05, 8, 17, 'rgba(255,150,60,.12)');
  const g = .5 + .5 * Math.sin(time * 3), hp = P(u0 + .2 + (.5 + .5 * Math.sin(time * 1.7)) * .2, v1 - .05, 15);
  px([hp[0] - 1, hp[1]], '#d6dde7', 3, 2); ln([hp[0], hp[1] + 2], [hp[0], hp[1] + 4], '#ffb35c');
  const bed = P((u0 + u1) / 2, v1 - .05, 9); px([bed[0] - 3, bed[1] - 2], `rgba(255,${150 + Math.round(g * 60)},80,.9)`, 6, 2);
  px(P(u0 + .1, v1 - .05, 18), '#62d6e3', 3, 1);
}
function robotArm(u, v, z, time){
  const a = Math.sin(time * 1.3) * .6, base = P(u, v, z);
  px([base[0] - 3, base[1] - 1], '#3a4354', 6, 2);
  const j1 = [base[0], base[1] - 6], j2 = [Math.round(j1[0] + Math.cos(-1.9 + a) * 6), Math.round(j1[1] + Math.sin(-1.9 + a) * 6)], j3 = [Math.round(j2[0] + Math.cos(.4 - a) * 5), Math.round(j2[1] + Math.sin(.4 - a) * 5)];
  for(const [p, q] of [[base, j1], [j1, j2], [j2, j3]]){ ln(p, q, PAL.orangeDk); ln([p[0] + 1, p[1]], [q[0] + 1, q[1]], PAL.orange); }
  for(const p of [j1, j2]) px([p[0] - 1, p[1] - 1], '#3a4354', 3, 3);
  px([j3[0] - 1, j3[1]], '#d6dde7', 3, 1); if(Math.sin(time * 9) > .6) px([j3[0], j3[1] + 1], '#fff3a0');
}

function drawHubShell(time){
  const m = MODS.hub; slab(m); floorTiles(m);
  // walkway light strip from core to corridor
  for(let k = 0; k < 6; k++){ const on = Math.floor(time * 4 - k) % 6 === 0; px(P(2.95 + k * .17, 2.0, 0), on ? PAL.cyan : PAL.cyanDk, 2, 1); }
  hazardFloor(3.82, 1.0, 3.94, 3.0, 10); if(rowActive('S')) hazardFloor(1.0, 3.82, 3.0, 3.94, 10);
  // landing pad
  const [lx, ly] = isoXY(LANDING[0], LANDING[1]);
  ellipse(lx, ly, 13, 6.5, '#5d687c'); ellipse(lx, ly, 11, 5.5, '#2b2614');
  for(let a = 0; a < 12; a++){ const t = a / 12 * Math.PI * 2; px([Math.round(lx + Math.cos(t) * 11), Math.round(ly + Math.sin(t) * 5.5)], a % 2 ? '#e6be3a' : '#2b2614', 2, 1); }
  text('R7', lx - 3, ly - 2, '#e6be3a');
  // walls
  box(m.u0, m.v0, m.u0 + WT, m.v1, 0, m.H, PAL.wallTop, PAL.wallCut, PAL.wallInDk);
  box(m.u0, m.v0, m.u1, m.v0 + WT, 0, m.H, PAL.wallTop, PAL.wallIn, PAL.wallCut);
  const {vw} = wallBands(m, PAL.cyan);
  leftBands(m, m.v0 + WT, m.v1, m.H, PAL.cyan);
  const uw = m.u0 + WT;
  // monitor bank
  qU(0.42, 2.58, vw, 9, 25, '#4a5568');
  screenU(0.55, 1.15, vw, 11, 23); screenU(1.27, 1.87, vw, 11, 23); screenU(1.99, 2.45, vw, 11, 23);
  for(let k = 0; k < 5; k++){ const h = 3 + Math.round(4 + 3 * Math.sin(time * 1.5 + k * 1.3)); qU(0.6 + k * .11, 0.67 + k * .11, vw, 12, 12 + h, k % 2 ? PAL.cyan : PAL.cyanDk); }
  const g = P(1.57, vw, 17); ellipse(g[0], g[1], 5, 5, '#1f5f80'); ellipse(g[0] - 1 + Math.round(Math.sin(time * .6) * 2), g[1] - 1, 2, 2, '#5fae6a'); ellipse(g[0] + 2 + Math.round(Math.sin(time * .6) * 2), g[1] + 2, 1.5, 1.2, '#5fae6a'); px([g[0] - 3, g[1] - 3], '#bfe9f5');
  let prev = null;
  for(let k = 0; k <= 8; k++){ const u = 2.02 + k * .052, z = 16 + Math.round(4 * Math.sin(k * .9 + time * 2)); const p = P(u, vw, z); if(prev) ln(prev, p, PAL.amber); prev = p; }
  // pipe, valve, status panel
  conduitU(0, 4, vw, 27);
  stripLightU(0.3, 3.7, vw, 29.5, 1.6);
  const vv = P(3.3, vw, 26); ellipse(vv[0], vv[1], 3, 3, PAL.orange); ellipse(vv[0], vv[1], 1.4, 1.4, '#5a3a1a');
  screenU(2.85, 3.6, vw, 12, 19);
  for(let r = 0; r < 2; r++) for(let c = 0; c < 4; c++){ const on = Math.sin(time * 2 + r * 3 + c * 1.7) > -.2; px(P(2.95 + c * .17, vw, 17 - r * 3), on ? [PAL.green, PAL.amber, PAL.cyan, PAL.red][c] : '#2a3240', 2, 1); }
  // back-left wall: lockers, porthole, first aid, pipe
  pegboard(uw, 0.35, 1.5, 8, 24);
  cableTrayV(3.5, 3.68, uw, 3, m.H - 4);
  const po = P(uw, 2.4, 16); ellipse(po[0], po[1], 7, 8, '#5d687c'); ellipse(po[0], po[1], 5, 6, '#090614'); px([po[0] - 2, po[1] - 2], '#e8e2ff'); px([po[0] + 2, po[1] + 1], '#9b8ccf'); px([po[0] - 3, po[1] - 4], 'rgba(255,255,255,.5)', 2, 1);
  for(let a = 0; a < 8; a++){ const t = a / 8 * Math.PI * 2; px([Math.round(po[0] + Math.cos(t) * 6.5), Math.round(po[1] + Math.sin(t) * 7.5)], '#a9b4c4'); }
  qV(3.05, 3.4, uw, 8, 13, '#e8ecf2'); px(P(uw, 3.22, 12), PAL.red, 1, 3); px(P(uw, 3.17, 11), PAL.red, 3, 1);
  ln(P(uw, 3.7, 0), P(uw, 3.7, m.H - 3), '#6d7890'); ln(P(uw, 3.75, 0), P(uw, 3.75, m.H - 3), '#aab4c4');
  // exterior: solar array on the back corner, dish on the back wall
  const ms = P(0.1, 0.1, m.H); ln(ms, [ms[0], ms[1] - 16], '#9aa3ad'); ln([ms[0] + 1, ms[1]], [ms[0] + 1, ms[1] - 16], '#6b7484');
  const sx = ms[0], sy = ms[1] - 18;
  for(const [dx, dy] of [[-15, -2], [-5, -7], [5, 3], [15, -2]]){
    poly([[sx + dx - 6, sy + dy], [sx + dx + 2, sy + dy - 4], [sx + dx + 6, sy + dy + 2], [sx + dx - 2, sy + dy + 6]], '#2f5fa8');
    ln([sx + dx - 2, sy + dy - 2], [sx + dx + 2, sy + dy + 4], '#8fb8ec'); ln([sx + dx - 4, sy + dy + 3], [sx + dx + 4, sy + dy - 1], '#8fb8ec');
  }
  ln([sx - 9, sy + 1], [sx + 9, sy + 1], '#c9d2de');
  const dp = P(3.4, 0.1, m.H); ln(dp, [dp[0], dp[1] - 6], '#9aa3ad');
  b.fillStyle = '#e2e8f0'; b.beginPath(); b.ellipse(dp[0], dp[1] - 10, 7, 4, -0.5, 0, Math.PI * 2); b.fill();
  b.fillStyle = '#a9b4c4'; b.beginPath(); b.ellipse(dp[0] + 1, dp[1] - 9, 5, 2.6, -0.5, 0, Math.PI * 2); b.fill();
  ln([dp[0], dp[1] - 10], [dp[0] + 5, dp[1] - 15], '#6b7484'); px([dp[0] + 5, dp[1] - 16], Math.floor(time * 2) % 2 ? PAL.red : '#5a1a1e', 2, 2);
}
function drawCore(time){
  const [x, y] = isoXY(2, 2);
  ellipse(x, y + 2, 22, 11, '#3a4354'); ellipse(x, y, 22, 11, '#a9b4c4'); ellipse(x, y, 19, 9.5, '#4d586c');
  const pulse = .5 + .5 * Math.sin(time * 2);
  ellipse(x, y, 14, 7, `rgba(98,214,227,${.35 + pulse * .25})`); ellipse(x, y, 8, 4, 'rgba(190,245,252,.75)'); ellipse(x, y, 3, 1.5, '#ffffff');
  b.fillStyle = `rgba(98,214,227,${.08 + pulse * .06})`; b.fillRect(x - 6, y - 34, 12, 34);
  for(let a = 0; a < 10; a++){ const t = a / 10 * Math.PI * 2 + time * .8; px([Math.round(x + Math.cos(t) * 20.5), Math.round(y + Math.sin(t) * 10.2)], a % 2 ? PAL.cyan : '#e8fbff'); }
}
function pylon(u, v){ box(u - .07, v - .07, u + .07, v + .07, 0, 13, '#ffb35c', PAL.orange, PAL.orangeDk); const p = P(u, v, 14); px([p[0] - 1, p[1] - 1], '#fff3c4', 2, 2); }
function drawConsoleDesk(time){
  box(0.5, 0.3, 2.5, 0.72, 0, 8, '#d6dde7', '#8d99ad', '#6b778c');
  qZ(0.58, 0.36, 2.42, 0.56, 8, '#3a4454');
  for(let k = 0; k < 18; k++){ const on = Math.sin(time * 3 + k * 2.1) > .3; px(P(0.62 + k * .1, 0.66, 8), on ? [PAL.green, PAL.amber, PAL.cyan][k % 3] : '#566174'); }
  for(let k = 0; k < 9; k++) px(P(0.62 + k * .2, 0.72, 5), '#5a6578', 3, 1);
}
function chair(u, v){
  ln(P(u, v, 0), P(u, v, 5), '#3a4354');
  box(u - .16, v - .16, u + .16, v + .16, 5, 7, '#ffb35c', PAL.orange, PAL.orangeDk);
  box(u - .16, v + .1, u + .16, v + .16, 7, 15, '#ffb35c', PAL.orange, PAL.orangeDk);
}
function crate(u, v, s, h){
  box(u - s, v - s, u + s, v + s, 0, h, '#ffb35c', '#e58a2a', '#a65a14');
  for(const z of [3, h - 3]){ qU(u - s, u + s, v + s, z, z + 1, '#7a4310'); qV(v - s, v + s, u + s, z, z + 1, '#5e340c'); }
  qU(u - s * .4, u + s * .3, v + s, h * .45, h * .7, '#f2efe6'); px(P(u - s * .25, v + s, h * .6), '#3a4454', 3, 1);
  ln(P(u - s, v - s, h), P(u + s, v - s, h), '#ffd49a');
}
function cryo(u, v, time){
  const [x, y] = isoXY(u, v);
  ellipse(x, y, 6, 3, '#3a4354');
  b.fillStyle = '#7f8a94'; b.fillRect(x - 5, y - 22, 10, 22); b.fillStyle = '#c9d2da'; b.fillRect(x - 5, y - 22, 4, 22); b.fillStyle = '#5f6a76'; b.fillRect(x + 3, y - 22, 2, 22);
  ellipse(x, y - 22, 5, 2.5, '#eef3f8');
  b.fillStyle = PAL.trim; b.fillRect(x - 5, y - 9, 10, 2);
  px([x - 2, y - 17], '#e8fbff'); px([x - 4, y - 12], '#e8fbff'); px([x + 1, y - 6], 'rgba(232,251,255,.7)');
  px([x + 1, y - 15], Math.sin(time * 2 + u) > 0 ? PAL.cyan : PAL.cyanDk, 2, 2);
}
function drawBench(time){
  const active = S.items.some(x => x.state === 'running' && x.mode === 'bench');
  box(2.95, 2.75, 3.75, 3.65, 0, 9, '#eef2f7', '#a2aec0', '#7b879a');
  for(const u of [3.22, 3.48]) ln(P(u, 3.65, 1), P(u, 3.65, 8), '#7f8b9e');
  for(const u of [3.1, 3.36, 3.62]) px(P(u, 3.65, 6), '#5a6578', 2, 1);
  ln(P(2.95, 2.75, 9), P(3.75, 2.75, 9), '#ffffff');
  // microscope
  box(3.05, 2.85, 3.25, 3.05, 9, 10, '#3a4354', '#2c3442', '#232a36');
  const m0 = P(3.15, 2.92, 10); px([m0[0], m0[1] - 7], '#2c3442', 2, 7); px([m0[0] - 2, m0[1] - 9], '#e2e8f0', 4, 3); px([m0[0] - 1, m0[1] - 11], '#2c3442', 2, 2);
  // tube rack
  box(3.35, 2.85, 3.68, 2.98, 9, 11, '#d6dde7', '#8d99ad', '#6b778c');
  ['#ff5d63', '#62d6e3', '#8bd472', '#f3c14a', '#b98cf0'].forEach((c, k) => { const p = P(3.39 + k * .06, 2.92, 11); px([p[0], p[1] - 4], '#e8f4f7', 1, 4); px([p[0], p[1] - 2], c, 1, 2); });
  // monitor with DNA
  ln(P(3.55, 3.45, 9), P(3.55, 3.45, 11), '#3a4354');
  box(3.42, 3.3, 3.66, 3.58, 11, 20, '#2c3442', '#3a4454', '#2c3442');
  qU(3.45, 3.63, 3.58, 12, 19, PAL.screen);
  for(let k = 0; k < 7; k++){ const s = Math.sin(k * .9 + time * (active ? 4 : 1)); px(P(3.47 + k * .024, 3.58, 15.5 + s * 2.5), PAL.cyan); px(P(3.47 + k * .024, 3.58, 15.5 - s * 2.5), PAL.purple); }
  // laptop
  qZ(3.0, 3.25, 3.3, 3.55, 9, '#7b879a'); qU(3.0, 3.3, 3.25, 9, 14, '#3a4454'); qU(3.03, 3.27, 3.25, 10, 13, active ? '#2f6f7a' : '#1d2a33');
  if(active){ const p = P(3.6, 3.0, 13); px(p, Math.sin(time * 6) > 0 ? PAL.amber : '#6a4a1a', 2, 2); }
}

