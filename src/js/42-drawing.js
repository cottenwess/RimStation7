/* ================= drawing ================= */
const TW = 16, TH = 8, WT = 0.2;
const OUT = '#15131c';
const PAL = {
  hubFloor:'#56666f', hubInset:'#62747e', hubHi:'#7a8d97', labFloor:'#2a3b57', labInset:'#314565', labHi:'#41597f', corrFloor:'#48545e',
  seam:'#33404a', rivet:'#8797a3', slabL:'#45525c', slabR:'#323d46', slabLine:'#5b6a75',
  wallIn:'#c6cfd8', wallInDk:'#a5b0bd', wallLow:'#86929f', wallTop:'#3e3848', wallCut:'#2b2733',
  trim:'#3b6bb3', trimHi:'#6a9be0', orange:'#f08a2b', orangeDk:'#a85a18',
  screen:'#0b1f2b', frame:'#273141', cyan:'#62d6e3', cyanDk:'#2b7883', green:'#8bd472', amber:'#f3c14a', red:'#ff5d63', purple:'#b98cf0'
};
let OV = 0, SW = false;
function at(du, dv, f){ OU += du; OV += dv; try { f(); } finally { OU -= du; OV -= dv; } }
function isoXY(u, v){ u += OU; v += OV; if(SW){ const t = u; u = v; v = t; } return [Math.round(ox + (u - v) * TW), Math.round(oy + (u + v) * TH)]; }
function P(u, v, z){ u += OU; v += OV; if(SW){ const t = u; u = v; v = t; } return [Math.round(ox + (u - v) * TW), Math.round(oy + (u + v) * TH - z)]; }
function poly(pts, fill){ b.fillStyle = fill; b.beginPath(); b.moveTo(pts[0][0], pts[0][1]); for(let i = 1; i < pts.length; i++) b.lineTo(pts[i][0], pts[i][1]); b.closePath(); b.fill(); }
function qU(u0, u1, v, z0, z1, f){ poly([P(u0, v, z0), P(u1, v, z0), P(u1, v, z1), P(u0, v, z1)], f); }
function qV(v0, v1, u, z0, z1, f){ poly([P(u, v0, z0), P(u, v1, z0), P(u, v1, z1), P(u, v0, z1)], f); }
function qZ(u0, v0, u1, v1, z, f){ poly([P(u0, v0, z), P(u1, v0, z), P(u1, v1, z), P(u0, v1, z)], f); }
function box(u0, v0, u1, v1, z0, z1, top, left, right){
  if(SW){ const t = left; left = right; right = t; }
  qU(u0, u1, v1, z0, z1, left); qV(v0, v1, u1, z0, z1, right); qZ(u0, v0, u1, v1, z1, top);
  const a = P(u0, v1, z0), c = P(u1, v1, z0), d = P(u1, v0, z0), e = P(u1, v0, z1), f = P(u0, v0, z1), g = P(u0, v1, z1);
  ln(a, c, OUT); ln(c, d, OUT); ln(d, e, OUT); ln(e, f, OUT); ln(f, g, OUT); ln(g, a, OUT);
  if(z1 - z0 > 4 && (u1 - u0) > .15) ln(P(u1, v1, z1 - 1), P(u1, v1, z0 + 1), 'rgba(255,255,255,.12)');
}
function ln(a, c, col){
  b.fillStyle = col; let x0 = a[0], y0 = a[1]; const x1 = c[0], y1 = c[1];
  const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1; let err = dx + dy;
  for(let i = 0; i < 600; i++){ b.fillRect(x0, y0, 1, 1); if(x0 === x1 && y0 === y1) break; const e2 = 2 * err; if(e2 >= dy){ err += dy; x0 += sx; } if(e2 <= dx){ err += dx; y0 += sy; } }
}
function px(p, col, w = 1, h = 1){ b.fillStyle = col; b.fillRect(p[0], p[1], w, h); }
function hash(i, j){ let h = (i * 374761393 + j * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967295; }
const FONT = {B:['110','101','110','101','110'], S:['111','100','111','001','111'], L:['100','100','100','100','111'], '-':['000','000','111','000','000'], '2':['111','001','111','100','111'], '3':['111','001','111','001','111'], R:['110','101','110','101','101'], '7':['111','001','010','010','010']};
function text(str, x, y, col){ b.fillStyle = col; [...str].forEach((ch, i) => { const g = FONT[ch]; if(!g) return; g.forEach((row, r) => [...row].forEach((c, k) => { if(c === '1') b.fillRect(x + i * 4 + k, y + r, 1, 1); })); }); }
function ellipse(x, y, rx, ry, fill){ b.fillStyle = fill; b.beginPath(); b.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); b.fill(); }

