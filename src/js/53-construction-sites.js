/* ================= construction sites ================= */
function drawLabSite(L, time){
  const m = MODS.lab; slab(m);
  const dead = !L.building;
  for(let i = m.u0; i < m.u1; i++) for(let j = m.v0; j < m.v1; j++){
    qZ(i, j, i + 1, j + 1, 0, dead ? '#3a3640' : '#6b7486');
    qZ(i + .07, j + .07, i + .93, j + .93, 0, dead ? (hash(i, j) > .5 ? '#2a2630' : '#332e38') : '#7a8396');
    ln(P(i, j, 0), P(i + 1, j, 0), dead ? '#24202a' : '#5a6578'); ln(P(i, j, 0), P(i, j + 1, 0), dead ? '#24202a' : '#5a6578');
  }
  if(dead){
    for(let g = 0; g < 20; g++) px(P(6.3 + hash(g, 2) * 5.4, -.7 + hash(2, g) * 5.4, 0), 'rgba(10,8,12,.75)', 3, 1);
    box(m.u0, m.v0, m.u0 + WT, 1, 0, 9, '#5a5560', '#3a3640', '#2c2832');
    box(m.u0, m.v0, m.u0 + 1.6, m.v0 + WT, 0, 14, '#5a5560', '#4a4550', '#2c2832');
    box(9.4, m.v0, 10.6, m.v0 + WT, 0, 6, '#5a5560', '#4a4550', '#2c2832');
    box(8.4, 1.6, 9.5, 2.5, 0, 3, '#4a4550', '#332e38', '#24202a');
    for(let g = 0; g < 5; g++) if(Math.sin(time * 3 + g * 2) > .2) px(P(6.6 + g * 1.0, -.5 + hash(g, 7) * 4.8, 0), '#ff7a3a');
    for(let g = 0; g < 3; g++){ const k = (time * .4 + g / 3) % 1, p = P(9.0, 2, 3 + k * 20); px([p[0] + Math.round(Math.sin(k * 6 + g) * 3), p[1]], `rgba(120,110,130,${.6 * (1 - k)})`, 2, 2); }
    return;
  }
  const p = clamp((S.t - L.building.start) / (L.building.until - L.building.start), 0, 1);
  const H = Math.max(2, Math.round(m.H * p));
  box(m.u0, m.v0, m.u0 + WT, 1, 0, H, PAL.wallTop, PAL.wallCut, PAL.wallInDk);
  box(m.u0, m.v0, m.u1, m.v0 + WT, 0, H, PAL.wallTop, PAL.wallIn, PAL.wallCut);
  if(H > 8) ln(P(m.u0, m.v0 + WT, H - 3), P(m.u1, m.v0 + WT, H - 3), PAL.trim);
  for(const [u, v] of [[6.45, -.55], [9.0, -.55], [11.6, -.55], [6.45, 2.0], [6.45, 4.55]]) box(u - .04, v - .04, u + .04, v + .04, 0, m.H + 4, '#ffb35c', PAL.orange, PAL.orangeDk);
  for(const z of [12, 24, m.H + 3]){ ln(P(6.45, -.55, z), P(11.6, -.55, z), PAL.orangeDk); ln(P(6.45, -.55, z), P(6.45, 4.55, z), PAL.orangeDk); }
  crate(9.6, 3.0, .3, 10); crate(10.8, 3.9, .22, 7); crate(10.4, 0.6, .25, 8);
  box(8.0, 1.0, 9.2, 1.7, 0, 3, '#556076', '#3f485c', '#2f3747');
  if(Math.sin(time * 11) > .3){ const s = P(6.5 + 3.0 * ((time * .13) % 1), .3, H); px(s, '#fff3a0', 2, 2); px([s[0] + 2, s[1] - 2], '#ffe066'); px([s[0] - 1, s[1] + 2], '#ffb35c'); }
  const sg = P(9.2, 2.2, 2); b.fillStyle = '#273141'; b.fillRect(sg[0] - 16, sg[1] - 4, 32, 7); b.fillStyle = '#3a4454'; b.fillRect(sg[0] - 15, sg[1] - 3, 30, 5); b.fillStyle = PAL.amber; b.fillRect(sg[0] - 15, sg[1] - 3, Math.round(30 * p), 5);
}
function sealedBulkhead(){
  box(5.7, 1.0, 5.9, 3.0, 0, 22, '#d6dde7', '#8d99ad', '#6b778c');
  for(let k = 0; k < 5; k++) qU(5.7, 5.9, 1.0 + k * .4 + .2, 0, 22, k % 2 ? '#2b2614' : '#e6be3a');
  for(let k = 0; k < 6; k++) qV(1.0 + k * .33, 1.0 + k * .33 + .16, 5.9, 2 + k * 3, 4 + k * 3, k % 2 ? '#2b2614' : '#e6be3a');
}
