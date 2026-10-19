/* ---------- lab ---------- */
function labStrip(time){
  if(LB()) return Math.floor(time * 6) % 2 ? PAL.red : '#5a1a22';
  const cs = labSpec(CL);
  if(cs && CL.envMatched && cs.truth.needs.light === 'dim red light') return '#c8384e';
  if(cs && CL.envMatched && cs.truth.needs.light === 'darkness') return '#4a4f9a';
  return CL.bsl === 3 ? PAL.cyan : PAL.purple;
}
function stripLightU(u0, u1, v, z, reach){
  qU(u0, u1, v, z - 1, z + 2, '#262c38');
  qU(u0 + .06, u1 - .06, v, z, z + 1, '#f4fbff');
  b.globalCompositeOperation = 'lighter';
  poly([P(u0, v, z), P(u1, v, z), P(u1 - .3, v + reach, 0), P(u0 + .3, v + reach, 0)], 'rgba(140,180,220,.07)');
  b.globalCompositeOperation = 'source-over';
}
function stripLightV(v0, v1, u, z, reach){
  qV(v0, v1, u, z - 1, z + 2, '#262c38');
  qV(v0 + .06, v1 - .06, u, z, z + 1, '#e6f2fb');
  b.globalCompositeOperation = 'lighter';
  poly([P(u, v0, z), P(u, v1, z), P(u + reach, v1 - .3, 0), P(u + reach, v0 + .3, 0)], 'rgba(140,180,220,.05)');
  b.globalCompositeOperation = 'source-over';
}
function conduitU(u0, u1, v, z){
  ln(P(u0, v, z), P(u1, v, z), '#596577'); ln(P(u0, v, z + 1), P(u1, v, z + 1), '#9aa6b5'); ln(P(u0, v, z + 2), P(u1, v, z + 2), '#6b7789');
  for(let u = u0 + .3; u < u1; u += .7) qU(u, u + .06, v, z - 1, z + 3, '#3d4656');
}
function cableTrayV(v0, v1, u, z0, z1){
  qV(v0, v1, u, z0, z1, '#2f5fa8'); qV(v0 + .02, v1 - .02, u, z0 + 1, z1 - 1, '#3b74c4');
  for(let z = z0 + 3; z < z1; z += 5) ln(P(u, v0, z), P(u, v1, z), '#24477f');
}
function hazardFloor(u0, v0, u1, v1, n){
  qZ(u0, v0, u1, v1, 0, '#e6be3a');
  const horiz = (u1 - u0) > (v1 - v0);
  for(let k = 0; k < n; k += 2){
    if(horiz){ const a = u0 + (u1 - u0) * k / n; qZ(a, v0, a + (u1 - u0) / n, v1, 0, '#2b2614'); }
    else { const c = v0 + (v1 - v0) * k / n; qZ(u0, c, u1, c + (v1 - v0) / n, 0, '#2b2614'); }
  }
}
