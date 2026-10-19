/* ================= specimen & planet art ================= */
function gE(g, x, y, rx, ry, c){ g.fillStyle = c; g.beginPath(); g.ellipse(x, y, Math.max(.5, rx), Math.max(.5, ry), 0, 0, Math.PI * 2); g.fill(); }
function gF(g, x, y, w, h, c){ g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), w, h); }
function gL(g, x0, y0, x1, y1, c){
  g.fillStyle = c; x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
  const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1; let err = dx + dy;
  for(let i = 0; i < 200; i++){ g.fillRect(x0, y0, 1, 1); if(x0 === x1 && y0 === y1) break; const e2 = 2 * err; if(e2 >= dy){ err += dy; x0 += sx; } if(e2 <= dx){ err += dx; y0 += sy; } }
}
function hexA(hex, a){ const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16 & 255},${n >> 8 & 255},${n & 255},${a})`; }
function drawSpecimen(g, sp, x, y, time, o = {}){
  const sed = o.sed !== undefined ? o.sed : sp.sed || 0, stress = o.stress !== undefined ? o.stress : sp.stress || .3, loose = !!o.loose;
  const P = sp.pal, t = time;
  if(loose && !ANIMAL(sp)){
    for(let k = 0; k < 26; k++){ const a = k * 2.39 + t * .8, r = 3 + (k % 7) * 1.8; gF(g, x + Math.cos(a) * r * 1.6, y - 8 + Math.sin(a) * r * .8, 2, 2, hexA(P.body, .55)); }
    gE(g, x, y - 8, 12, 6, hexA(P.body, .18));
    return;
  }
  const twitch = (ANIMAL(sp) && stress > .6 && sed < .3 && Math.sin(t * 9) > .7) ? 1 : 0; x += twitch;
  const eyeOn = Math.sin(t * .7 + sp.id.length) < .97;
  const eye = sed > .3 ? '#8a6a3a' : P.eye;
  switch(sp.form){
    case 'dome': {
      gE(g, x, y + 1, 13, 3, 'rgba(0,0,0,.35)');
      for(const [dx, s] of [[-8, -1], [-3, -1], [3, 1], [8, 1]]) gL(g, x + dx, y - 4, x + dx + s * 2, y, P.dark);
      gE(g, x, y - 5, 12, 5, P.dark); gE(g, x, y - 6, 11, 4.5, P.body); gE(g, x - 1, y - 8, 8, 2.5, P.light);
      const ext = loose ? 4 : 0;
      [-8, -5, -2, 1, 4, 7].forEach((k, i) => { const h = 4 + (i % 2) + ext, top = y - 9 - h + Math.round(Math.abs(k) / 4); gF(g, x + k, top, 1, h, '#efe9f7'); if(Math.sin(t * 2 + k) > .75) gF(g, x + k, top, 1, 1, '#62d6e3'); });
      if(eyeOn){ gF(g, x - 9, y - 6, 2, 1, eye); gF(g, x - 5, y - 6, 2, 1, eye); }
      break;
    }
    case 'strider': {
      const bob = Math.round(Math.sin(t * 2) * (sed > .3 ? 0 : 1));
      gE(g, x, y + 1, 11, 2.5, 'rgba(0,0,0,.3)');
      for(const [dx, fx] of [[-5, -10], [-1, -4], [3, 4], [6, 11]]){ gL(g, x + dx, y - 14 + bob, x + (dx + fx) / 2, y - 18 + bob, P.dark); gL(g, x + (dx + fx) / 2, y - 18 + bob, x + fx, y, P.dark); }
      gE(g, x, y - 15 + bob, 8, 3.5, P.body); gE(g, x - 1, y - 16 + bob, 5, 1.5, P.light);
      gE(g, x - 9, y - 17 + bob, 3, 2.5, P.body);
      if(eyeOn){ gF(g, x - 11, y - 18 + bob, 1, 1, eye); gF(g, x - 9, y - 18 + bob, 1, 1, eye); }
      break;
    }
    case 'serpent': {
      gE(g, x, y + 1, 14, 2.5, 'rgba(0,0,0,.3)');
      for(let i = 9; i >= 0; i--){ const cx = x - 12 + i * 2.7, cy = y - 3 - Math.sin(t * (sed > .3 ? .5 : 2) + i * .7) * 2; gE(g, cx, cy, 3 - i * .12, 2.6 - i * .1, i % 2 ? P.body : P.light); }
      const hy = y - 3 - Math.sin(t * 2) * 2;
      for(let k = 0; k < 4; k++) gL(g, x - 13, hy - 1, x - 15 - k, hy - 5 - k, P.eye);
      if(eyeOn) gF(g, x - 13, hy - 1, 1, 1, '#111');
      break;
    }
    case 'crab': {
      gE(g, x, y + 1, 14, 3, 'rgba(0,0,0,.35)');
      for(const dx of [-9, -6, -3, 3, 6, 9]) gL(g, x + dx, y - 4, x + dx * 1.3, y, P.dark);
      gE(g, x, y - 6, 12, 5.5, P.dark); gE(g, x, y - 7, 11, 4.5, P.body);
      for(const dx of [-5, 0, 5]) gL(g, x + dx, y - 11, x + dx, y - 3, P.dark);
      gE(g, x - 1, y - 9, 7, 1.5, P.light);
      const op = loose || Math.sin(t * 1.5) > .6 ? 2 : 0;
      gE(g, x - 14, y - 6, 3.5, 2.5, P.body); gL(g, x - 17, y - 7 - op, x - 13, y - 8 - op, P.light); gL(g, x - 17, y - 5 + op, x - 13, y - 5, P.light);
      gL(g, x - 4, y - 11, x - 5, y - 15, P.dark); gL(g, x + 1, y - 11, x + 2, y - 15, P.dark);
      if(eyeOn){ gF(g, x - 6, y - 16, 2, 2, eye); gF(g, x + 1, y - 16, 2, 2, eye); }
      break;
    }
    case 'blind': {
      for(let k = 0; k < 6; k++){ const sx = x - 7 + k * 3; gL(g, sx, y - 6, sx + Math.sin(t * 2 + k) * 2, y + 1, hexA(P.light, .6)); }
      gE(g, x, y - 9, 11, 5, hexA(P.light, .55)); gE(g, x, y - 10, 8, 3, hexA('#ffffff', .35));
      for(let k = 0; k < 5; k++) if(Math.sin(t * 3 + k * 1.3) > -.2) gF(g, x - 7 + k * 3.5, y - 9, 1, 1, '#62d6e3');
      if(sp.truth.hazard === 'electric' && Math.sin(t * 11) > .9){ gL(g, x + 9, y - 10, x + 13, y - 14, '#ffe066'); gL(g, x + 13, y - 14, x + 15, y - 11, '#ffe066'); }
      break;
    }
    case 'lithovore': {
      gE(g, x, y + 1, 12, 3, 'rgba(0,0,0,.35)');
      gE(g, x, y - 5, 12, 5.5, P.dark); gE(g, x + 1, y - 6, 10, 4.5, P.body);
      for(const [dx, dy] of [[-4, -8], [2, -9], [6, -6]]) gE(g, x + dx, y + dy, 3, 1.6, P.light);
      gL(g, x - 11, y - 4, x - 7, y - 4, '#1a1418'); if(Math.sin(t * 4) > 0) gF(g, x - 12, y - 2, 1, 1, '#c9b89a');
      if(eyeOn) gF(g, x - 8, y - 7, 1, 1, eye);
      break;
    }
    case 'gasbag': {
      const fy = y - 20 + Math.round(Math.sin(t * 1.2) * 2);
      gE(g, x, y + 1, 8, 2, 'rgba(0,0,0,.2)');
      for(let k = 0; k < 5; k++){ const sx = x - 5 + k * 2.5; gL(g, sx, fy + 6, sx + Math.sin(t * 1.5 + k) * 2, fy + 16, hexA(P.light, .75)); }
      gE(g, x, fy, 10, 8, hexA(P.body, .85)); gE(g, x - 2, fy - 3, 6, 3.5, hexA(P.light, .7)); gE(g, x - 4, fy - 5, 2, 1, 'rgba(255,255,255,.7)');
      for(let k = 0; k < 4; k++) if(Math.sin(t * 2 + k * 1.7) > 0) gF(g, x - 5 + k * 3, fy + 3, 1, 1, P.eye);
      break;
    }
    case 'frond': {
      gE(g, x, y, 10, 3, '#3a2e24');
      for(let k = 0; k < 6; k++){
        const bx = x - 7 + k * 2.8, h = 12 + (k % 3) * 4, sw = Math.sin(t * 1.2 + k) * 2;
        gL(g, bx, y - 1, bx + sw, y - h, P.dark);
        for(let j = 3; j < h; j += 3) gE(g, bx + sw * j / h + (j % 2 ? 2 : -2), y - j, 2.2, 1, P.body);
        gF(g, bx + sw, y - h - 1, 1, 1, hexA(P.body, .9));
      }
      break;
    }
    case 'trap': {
      gE(g, x, y, 9, 3, '#3a2e24'); gL(g, x, y - 1, x, y - 10, P.dark);
      const open = loose ? 4 : Math.max(0, Math.round(3 * Math.sin(t * .8)));
      gE(g, x - 1, y - 12 - open, 7, 3, P.body); gE(g, x - 1, y - 10 + 1, 7, 3, P.body);
      for(let k = -5; k <= 4; k += 2){ gF(g, x + k, y - 10 - open, 1, 2, '#f2efe6'); gF(g, x + k, y - 9, 1, 2, '#f2efe6'); }
      gE(g, x + 6, y - 4, 3, 1.5, P.body);
      break;
    }
    case 'fungus': {
      gE(g, x, y, 10, 3, '#2a2420');
      for(const [dx, h, r] of [[-6, 9, 4], [1, 14, 5.5], [7, 7, 3.5]]){
        gL(g, x + dx, y - 1, x + dx, y - h, '#cfc6b8');
        gE(g, x + dx, y - h, r, r * .55, '#121014'); gE(g, x + dx - 1, y - h - 1, r * .6, r * .25, '#2a262e');
        if(Math.sin(t * 2 + dx) > .3) gF(g, x + dx + r - 1, y - h, 1, 1, '#8bd472');
      }
      break;
    }
    case 'ironplant': {
      gE(g, x, y, 9, 3, '#3a2a20');
      for(let k = 0; k < 6; k++){ const yy = y - 2 - k * 3, dx = (k % 2 ? 3 : -3); g.fillStyle = k % 2 ? '#a0522d' : '#c8743a'; g.beginPath(); g.moveTo(x, yy); g.lineTo(x + dx * 2, yy - 3); g.lineTo(x + dx, yy - 1); g.closePath(); g.fill(); }
      gL(g, x, y - 1, x, y - 19, '#5a3a24');
      break;
    }
    case 'crystal': {
      gE(g, x, y, 10, 3, '#3a4a5a');
      for(const [dx, h, w] of [[-6, 10, 3], [-1, 17, 4], [5, 12, 3], [8, 6, 2]]){
        g.fillStyle = hexA('#d8f4ff', .55); g.beginPath(); g.moveTo(x + dx - w, y - 1); g.lineTo(x + dx, y - h); g.lineTo(x + dx + w, y - 1); g.closePath(); g.fill();
        gL(g, x + dx, y - h, x + dx, y - 2, 'rgba(255,255,255,.7)');
        if(Math.sin(t * 3 + dx) > .8) gF(g, x + dx, y - h + 1, 1, 1, '#ffffff');
      }
      break;
    }
    case 'culture': {
      gF(g, x - 12, y - 3, 24, 3, '#8d99ad'); gF(g, x - 12, y - 3, 24, 1, '#c9d2de');
      for(const dx of [-8, 0, 8]){
        gE(g, x + dx, y - 4, 4, 1.6, 'rgba(220,245,250,.6)');
        for(let k = 0; k < 4; k++) if(Math.sin(t * 1.5 + k + dx) > -.3) gF(g, x + dx - 2 + k, y - 5 + (k % 2), 1, 1, P.body);
      }
      g.fillStyle = 'rgba(220,245,250,.55)'; g.beginPath(); g.moveTo(x + 3, y - 18); g.lineTo(x + 7, y - 18); g.lineTo(x + 10, y - 5); g.lineTo(x, y - 5); g.closePath(); g.fill();
      gF(g, x + 1, y - 10, 9, 4, hexA(P.body, .7)); gF(g, x + 4, y - 20, 2, 2, '#8d99ad');
      break;
    }
    case 'fossil': {
      g.fillStyle = '#6b6258'; g.beginPath(); g.moveTo(x - 13, y - 1); g.lineTo(x - 9, y - 9); g.lineTo(x + 11, y - 10); g.lineTo(x + 14, y - 1); g.closePath(); g.fill();
      g.fillStyle = '#857a6e'; g.beginPath(); g.moveTo(x - 11, y - 3); g.lineTo(x - 8, y - 8); g.lineTo(x + 10, y - 9); g.lineTo(x + 12, y - 3); g.closePath(); g.fill();
      gE(g, x - 6, y - 6, 2.5, 2, P.body); gF(g, x - 7, y - 6, 1, 1, P.dark);
      for(let k = 0; k < 5; k++){ gL(g, x - 3 + k * 2.5, y - 8, x - 2 + k * 2.5, y - 4, P.body); }
      gL(g, x - 3, y - 6, x + 9, y - 6, P.light);
      break;
    }
  }
  if(ANIMAL(sp) && sed > .25){ const k = (t * .6) % 1, yy = Math.round(y - 22 - k * 8); g.fillStyle = `rgba(220,215,240,${1 - k})`; g.fillRect(x + 10, yy, 3, 1); g.fillRect(x + 11, yy + 1, 1, 1); g.fillRect(x + 10, yy + 2, 3, 1); }
}
function drawSpecIcon(c, sp){
  const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
  g.fillStyle = '#0d1a20'; g.fillRect(0, 0, c.width, c.height);
  const p = planetOf(sp);
  g.fillStyle = hexA(ATM[p.atm].sky, .18); g.fillRect(0, c.height - 6, c.width, 6);
  drawSpecimen(g, sp, c.width / 2, c.height - 3, performance.now() / 1000, {sed:0, stress:.3});
}
function vnoise(seed, x, y){
  const h = (i, j) => { let n = (i * 374761393 + j * 668265263 + seed * 2246822519) | 0; n = (n ^ (n >>> 13)) * 1274126177; return ((n ^ (n >>> 16)) >>> 0) / 4294967295; };
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, s = v => v * v * (3 - 2 * v);
  const a = h(xi, yi), b2 = h(xi + 1, yi), c = h(xi, yi + 1), d = h(xi + 1, yi + 1);
  return a + (b2 - a) * s(xf) + (c - a) * s(yf) + (a - b2 - c + d) * s(xf) * s(yf);
}
function fbm(seed, x, y){ return vnoise(seed, x, y) * .55 + vnoise(seed + 7, x * 2.1, y * 2.1) * .3 + vnoise(seed + 13, x * 4.3, y * 4.3) * .15; }
function mixHex(a, b2, t){ const A = parseInt(a.slice(1), 16), B = parseInt(b2.slice(1), 16); const m = s => Math.round(((A >> s) & 255) * (1 - t) + ((B >> s) & 255) * t); return [m(16), m(8), m(0)]; }
/* Cached on the planet as _cv: the leading underscore keeps it out of saves. */
function planetCanvas(p){
  if(p._cv) return p._cv;
  const N = 48, r = 19, cx = 24, cy = 24, cv = document.createElement('canvas'); cv.width = N; cv.height = N;
  const g = cv.getContext('2d'), img = g.createImageData(N, N), sd = p.look.seed % 100000;
  const L = [-.55, -.45, .7], ll = Math.hypot(...L); L[0] /= ll; L[1] /= ll; L[2] /= ll;
  const flora = STARS[p.star].flora[0], sky = ATM[p.atm].sky;
  for(let y = 0; y < N; y++) for(let x = 0; x < N; x++){
    const nx = (x - cx + .5) / r, ny = (y - cy + .5) / r, d2 = nx * nx + ny * ny, i = (y * N + x) * 4;
    if(d2 > 1){
      const dd = Math.sqrt(d2);
      if(dd < 1.13 && p.atm !== 'none'){ const a = (1.13 - dd) / .13; const c = mixHex(sky, sky, 0); img.data[i] = c[0]; img.data[i + 1] = c[1]; img.data[i + 2] = c[2]; img.data[i + 3] = Math.round(a * 150); }
      continue;
    }
    const nz = Math.sqrt(1 - d2), lon = Math.atan2(nx, nz), lat = Math.asin(-ny);
    const n = fbm(sd, lon * 1.6 + 3, lat * 1.6 + 3);
    let col;
    switch(p.arch){
      case 'garden': col = Math.abs(lat) > 1.15 ? '#e8f0f8' : n > .55 ? (n > .64 ? '#7a6a4a' : flora) : (n > .5 ? '#3a78b8' : '#1f4f8a'); break;
      case 'botanical': col = Math.abs(lat) > 1.25 ? '#e8f0f8' : n > .4 ? (n > .7 ? '#5a4a3a' : flora) : '#2a5a8a'; break;
      case 'hostile': col = Math.abs(n - .5) < .025 ? '#ff7a2a' : n > .55 ? '#8a5a2a' : '#6a4a2a'; break;
      case 'barren': col = n > .62 ? '#b09070' : n > .45 ? '#8a6e52' : '#6a5644'; if(Math.abs(n - .4) < .012) col = '#4a3c30'; break;
      case 'ice': col = Math.abs(n - .52) < .015 ? '#5a8aa8' : n > .6 ? '#e8f4fc' : '#bcd6e8'; break;
      case 'cloud': { const band = Math.sin(lat * 7 + n * 4); col = band > .3 ? sky : band > -.3 ? '#f0ece0' : '#a89a80'; break; }
      case 'cryo': col = n > .62 && Math.abs(lat) > .5 ? '#3a2a30' : n > .5 ? '#d08a4a' : '#b8703a'; break;
      default: col = '#888888';
    }
    let shade = Math.max(0, -nx * L[0] + -(-ny) * -L[1] + nz * L[2]);
    shade = nx * L[0] + ny * L[1] + nz * L[2];
    if(p.tidal) shade = shade > 0 ? .55 + shade * .45 : .05; else shade = Math.max(.12, shade);
    const c = mixHex(col, col, 0);
    let rr = c[0] * shade, gg = c[1] * shade, bb = c[2] * shade;
    if(p.atm !== 'none' && p.atm !== 'thin'){ const hz = mixHex(sky, sky, 0), k = .12 + (1 - nz) * .35; rr = rr * (1 - k) + hz[0] * k * shade; gg = gg * (1 - k) + hz[1] * k * shade; bb = bb * (1 - k) + hz[2] * k * shade; }
    img.data[i] = rr; img.data[i + 1] = gg; img.data[i + 2] = bb; img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  if(p.look.ring){ g.strokeStyle = 'rgba(220,210,190,.55)'; g.lineWidth = 1; g.beginPath(); g.ellipse(cx, cy, 23, 5, -.35, Math.PI * .08, Math.PI * .92, true); g.stroke(); }
  p._cv = cv; return cv;
}
function drawPlanetIcon(c, p){
  const g = c.getContext('2d'); g.imageSmoothingEnabled = false; g.clearRect(0, 0, c.width, c.height);
  if(!p.known){ g.fillStyle = '#1a1430'; g.beginPath(); g.arc(24, 24, 18, 0, Math.PI * 2); g.fill(); g.strokeStyle = '#3a2e5e'; g.setLineDash([2, 2]); g.stroke(); g.setLineDash([]); g.fillStyle = '#a194c0'; g.font = '12px monospace'; g.fillText('?', 21, 28); return; }
  g.drawImage(planetCanvas(p), 0, 0);
}

