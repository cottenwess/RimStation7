/* ================= camera ================= */
const view = $('#view'), cv = $('#cv'), ctx = cv.getContext('2d');
const buf = document.createElement('canvas'), bMain = buf.getContext('2d');
let b = bMain;
const sbuf = document.createElement('canvas'), sb = sbuf.getContext('2d', {willReadFrequently:false}), obuf = document.createElement('canvas'), obc = obuf.getContext('2d');
let BW = 220, BH = 170, K = 4, DPR = 1, ox = 0, oy = 0, stars = [], parts = [];
const cam = {zoom:0, px:0, py:0};
let SPAN_W = 242, SPAN_H = 190, CX = 49, CY = 31, OU = 0, CL = null;
function camFit(){
  if(!S) return;
  const nE = rowActive('E'), nS = rowActive('S');
  const uMax = nE ? 12 + STRIDE * (nE - 1) : 4, vMax = nS ? 12 + STRIDE * (nS - 1) : 4;
  const xmin = Math.min(-72, (-1 - vMax) * 16 - 10), xmax = Math.max(80, (uMax + 1) * 16 + 10), ymin = -64, ymax = Math.max((uMax + 5) * 8, (vMax + 5) * 8, 64) + 14;
  SPAN_W = xmax - xmin + 8; SPAN_H = ymax - ymin + 40; CX = Math.round((xmin + xmax) / 2); CY = Math.round((ymin + ymax) / 2);
  resize();
}
const LB = () => !!(S.breach && CL && S.breach.lab === CL.k);
function baseK(r){ const k = Math.min(r.width / SPAN_W, r.height / SPAN_H); return k >= 1.6 ? Math.max(2, Math.floor(k + 0.15)) : Math.max(1, k); }
function resize(){
  const r = view.getBoundingClientRect(); if(!r.width || !r.height) return;
  DPR = window.devicePixelRatio || 1;
  const bk = baseK(r);
  K = bk >= 2 ? clamp(bk + cam.zoom, 2, bk + 5) : clamp(bk * Math.pow(1.4, cam.zoom), 1, 8);
  BW = Math.ceil(r.width / K); BH = Math.ceil(r.height / K);
  buf.width = BW; buf.height = BH; sbuf.width = obuf.width = BW; sbuf.height = obuf.height = BH;
  cv.width = Math.round(r.width * DPR); cv.height = Math.round(r.height * DPR);
  cv.style.width = r.width + 'px'; cv.style.height = r.height + 'px';
  stars = []; for(let i = 0; i < Math.round(BW * BH / 650); i++) stars.push({x:Math.floor(vrnd() * BW), y:Math.floor(vrnd() * BH), a:0.3 + vrnd() * 0.7, tw:vrnd() < 0.15, ph:vrnd() * 6});
}
function zoomBy(d){
  if(d === 0){ cam.zoom = 0; cam.px = 0; cam.py = 0; }
  else cam.zoom = clamp(cam.zoom + d, -2, 5);
  resize();
}
new ResizeObserver(resize).observe(view);
view.addEventListener('wheel', e => { if(e.target !== cv) return; e.preventDefault(); zoomBy(e.deltaY < 0 ? 1 : -1); }, {passive:false});
let drag = null;
cv.addEventListener('pointerdown', e => { drag = {x:e.clientX, y:e.clientY, px:cam.px, py:cam.py}; cv.setPointerCapture(e.pointerId); cv.classList.add('drag'); });
cv.addEventListener('pointermove', e => { if(!drag) return; cam.px = clamp(drag.px + (e.clientX - drag.x) / K, -160, 160); cam.py = clamp(drag.py + (e.clientY - drag.y) / K, -120, 120); });
const endDrag = () => { drag = null; cv.classList.remove('drag'); };
cv.addEventListener('pointerup', e => { const d = drag; endDrag(); if(d && Math.hypot(e.clientX - d.x, e.clientY - d.y) < 5) viewClick(e); });
cv.addEventListener('pointercancel', endDrag);
cv.addEventListener('mousemove', e => { if(drag) return; cv.style.cursor = hitTest(e) ? 'pointer' : ''; });
function toBuf(e){ const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) / K, (e.clientY - r.top) / K]; }
function hitTest(e){
  if(!S || S.over) return null;
  const [bx, by] = toBuf(e), o = OU, ov = OV, sw = SW; OU = 0; OV = 0; SW = false;
  let best = null, bd = 1e9;
  const ppl = actors().slice(); if(S.inspector) ppl.push(S.inspector);
  for(const a of ppl){ const [x, y] = isoXY(a.u, a.v); if(Math.abs(bx - x) <= 5 && by >= y - 20 && by <= y + 2){ const d = Math.abs(bx - x) + Math.abs(by - (y - 9)) * .5; if(d < bd){ bd = d; best = {type:'person', id:actorKey(a)}; } } }
  if(!best && S.breach){ const [x, y] = isoXY(C.u, C.v); if(Math.abs(bx - x) <= 14 && by >= y - 18 && by <= y + 4) best = {type:'spec', id:S.breach.sp}; }
  if(!best) for(const L of S.labs){ const sp = labSpec(L); if(!L.built || !sp) continue; const q = labNode(L, LAB_CU, 2), [x, y] = isoXY(q.u, q.v); if(Math.abs(bx - x) <= 26 && by >= y - 72 && by <= y + 14){ best = {type:'spec', id:sp.id}; break; } }
  OU = o; OV = ov; SW = sw;
  return best;
}
function viewClick(e){ const h = hitTest(e); S.ui.focus = h; if(h && h.type === 'spec') S.ui.spec = h.id; S.dirty = true; }

