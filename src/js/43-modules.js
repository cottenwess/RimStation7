/* ---------- modules ---------- */
const MODS = {
  hub:{u0:0, u1:4, v0:0, v1:4, H:30, floor:PAL.hubFloor, inset:PAL.hubInset, hi:PAL.hubHi},
  corr:{u0:4, u1:6, v0:1, v1:3, H:22, floor:PAL.corrFloor, grate:true},
  lab:{u0:6, u1:12, v0:-1, v1:5, H:42, floor:PAL.labFloor, inset:PAL.labInset, hi:PAL.labHi}
};
function slab(m){
  qU(m.u0, m.u1, m.v1, -10, 0, PAL.slabL); qV(m.v0, m.v1, m.u1, -10, 0, PAL.slabR);
  ln(P(m.u0, m.v1, -4), P(m.u1, m.v1, -4), PAL.slabLine); ln(P(m.u1, m.v0, -4), P(m.u1, m.v1, -4), '#4b5671');
  for(let u = m.u0; u < m.u1; u++){ ln(P(u, m.v1, -10), P(u, m.v1, 0), '#2f3a42'); ln(P(u + .03, m.v1, -9), P(u + .03, m.v1, -1), '#56646e'); px(P(u + .5, m.v1, -7), PAL.cyan, 2, 1); }
  for(let v = m.v0; v < m.v1; v++){ ln(P(m.u1, v, -10), P(m.u1, v, 0), '#232b32'); px(P(m.u1, v + .5, -7), PAL.cyanDk, 2, 1); }
  ln(P(m.u0, m.v1, 0), P(m.u1, m.v1, 0), '#7a8d97'); ln(P(m.u1, m.v0, 0), P(m.u1, m.v1, 0), '#56666f');
}
function floorTiles(m){
  for(let i = m.u0; i < m.u1; i++) for(let j = m.v0; j < m.v1; j++){
    qZ(i, j, i + 1, j + 1, 0, m.floor);
    if(m.grate){
      qZ(i + .08, j + .08, i + .92, j + .92, 0, '#465063');
      for(let k = 1; k < 7; k++) ln(P(i + .08 + k * .12, j + .1, 0), P(i + .08 + k * .12, j + .9, 0), '#363e4e');
      continue;
    }
    qZ(i + .07, j + .07, i + .93, j + .93, 0, m.inset);
    ln(P(i, j, 0), P(i + 1, j, 0), PAL.seam); ln(P(i, j, 0), P(i, j + 1, 0), PAL.seam);
    ln(P(i + .08, j + .08, 0), P(i + .92, j + .08, 0), m.hi); ln(P(i + .08, j + .08, 0), P(i + .08, j + .92, 0), m.hi);
    if(!m.lab) for(const [a, c] of [[.15, .15], [.85, .15], [.15, .85], [.85, .85]]) px(P(i + a, j + c, 0), PAL.rivet);
    if(!m.lab && hash(i * 3 + 7, j * 5 + 11) > .8){ qZ(i + .3, j + .32, i + .7, j + .6, 0, '#4f5a6c'); for(let k = 0; k < 3; k++) ln(P(i + .34, j + .38 + k * .08, 0), P(i + .66, j + .38 + k * .08, 0), '#3a4352'); }
    if(m.lab && CL && CL.integrity < 70){
      const n = Math.floor((70 - CL.integrity) / 12) + 1;
      for(let g = 0; g < n; g++) px(P(i + .2 + hash(i * 7 + g, j * 3) * .6, j + .2 + hash(j * 5 + g, i * 11) * .6, 0), 'rgba(40,30,24,.45)', 2, 1);
    }
  }
}
function wallBands(m, strip){
  const vw = m.v0 + WT, uw = m.u0 + WT, H = m.H;
  qU(m.u0, m.u1, vw, 0, 5, PAL.wallLow); ln(P(m.u0, vw, 5), P(m.u1, vw, 5), '#5f6b80');
  for(let u = Math.ceil(m.u0 + .01); u < m.u1; u++) ln(P(u, vw, 5), P(u, vw, H - 7), '#b0bac6');
  qU(m.u0, m.u1, vw, H - 7, H - 5, strip); qU(m.u0, m.u1, vw, H - 3, H, PAL.trim); ln(P(m.u0, vw, H - 3), P(m.u1, vw, H - 3), PAL.trimHi);
  ln(P(m.u0, vw, 0), P(m.u1, vw, 0), 'rgba(20,24,36,.5)');
  return {vw, uw};
}
function leftBands(m, v0, v1, H, strip){
  const uw = m.u0 + WT;
  qV(v0, v1, uw, 0, 5, '#69768b');
  for(let v = Math.ceil(v0 + .01); v < v1; v++) ln(P(uw, v, 5), P(uw, v, H - 7), '#8692a6');
  if(H > 12){ qV(v0, v1, uw, H - 7, H - 5, strip); qV(v0, v1, uw, H - 3, H, '#2f5a99'); }
}
function screenU(u0, u1, v, z0, z1){ qU(u0 - .05, u1 + .05, v, z0 - 1.5, z1 + 1.5, PAL.frame); qU(u0, u1, v, z0, z1, PAL.screen); }
function screenV(v0, v1, u, z0, z1){ qV(v0 - .05, v1 + .05, u, z0 - 1.5, z1 + 1.5, PAL.frame); qV(v0, v1, u, z0, z1, PAL.screen); }
function pipeU(u0, u1, v, z, col, hi){ ln(P(u0, v, z), P(u1, v, z), col); ln(P(u0, v, z + 1), P(u1, v, z + 1), hi); for(let u = Math.ceil(u0); u < u1; u++) px(P(u + .5, v, z - 1), '#3a4454', 2, 3); }

