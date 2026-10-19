/* ---------- corridor ---------- */
function drawCorrShell(time){
  const m = MODS.corr; slab(m); floorTiles(m);
  // floor pipes
  for(const [z, c, h] of [[1, '#6d7890', '#aab4c4'], [3, '#b86a2a', '#e09a52']]){ ln(P(4, 2.86, z), P(6, 2.86, z), c); ln(P(4, 2.86, z + 1), P(6, 2.86, z + 1), h); }
  box(m.u0, m.v0, m.u1, m.v0 + WT, 0, m.H, PAL.wallTop, PAL.wallIn, PAL.wallCut);
  const {vw} = wallBands(m, PAL.cyan);
  pipeU(4, 6, vw, 9, '#6d7890', '#aab4c4'); pipeU(4, 6, vw, 12, '#b86a2a', '#e09a52'); conduitU(4, 6, vw, 15);
  stripLightU(4.2, 5.8, vw, 18.5, 1.6);
  hazardFloor(4.05, 1.02, 5.95, 1.1, 14); hazardFloor(4.05, 2.9, 5.95, 2.98, 14);
  // decon pad with hazard stripes
  qZ(4.75, 1.15, 5.25, 1.85, 0, '#e6be3a');
  for(let k = 0; k < 5; k++) poly([P(4.75 + k * .1, 1.15, 0), P(4.8 + k * .1, 1.15, 0), P(4.8 + k * .1, 1.85, 0), P(4.75 + k * .1, 1.85, 0)], '#2b2614');
  qZ(4.85, 1.3, 5.15, 1.7, 0, '#3a4352');
  for(let k = 0; k < 3; k++) ln(P(4.88, 1.38 + k * .1, 0), P(5.12, 1.38 + k * .1, 0), '#2a303c');
}
function deconArch(time){
  const alarm = actors().some(a => a.flash > 0);
  box(4.92, 1.12, 5.06, 1.24, 0, 20, '#d6dde7', '#8d99ad', '#6b778c');
  box(4.92, 1.76, 5.06, 1.88, 0, 20, '#d6dde7', '#8d99ad', '#6b778c');
  box(4.92, 1.12, 5.06, 1.88, 18, 21, '#e2e8f0', '#9aa6ba', '#7b879a');
  for(let k = 0; k < 4; k++) px(P(4.99, 1.3 + k * .13, 18), PAL.cyan);
  const l = P(4.99, 1.5, 22); px([l[0] - 1, l[1] - 2], alarm ? (Math.floor(time * 8) % 2 ? PAL.red : '#5a1a1e') : PAL.green, 3, 2);
}

