/* ================= background ================= */
function drawBlackHole(time){
  const x = Math.round(BW * 0.15), y = Math.round(BH * 0.82);
  const gl = b.createRadialGradient(x, y, 6, x, y, 110); gl.addColorStop(0, 'rgba(255,130,70,.24)'); gl.addColorStop(1, 'rgba(255,130,70,0)');
  b.fillStyle = gl; b.fillRect(x - 110, y - 110, 220, 220);
  const ring = (k, start, end, dash) => {
    const rx = 28 + k * 9, ry = 5 + k * 1.8;
    b.strokeStyle = `rgba(255,${110 + k * 18},${60 + k * 22},${0.6 - k * 0.08})`; b.lineWidth = 2;
    if(dash){ b.setLineDash([6, 5]); b.lineDashOffset = -time * (28 - k * 3); }
    b.beginPath(); b.ellipse(x, y, rx, ry, -0.12, start, end); b.stroke(); b.setLineDash([]);
  };
  for(let k = 0; k < 6; k++) ring(k, Math.PI, Math.PI * 2, k % 2 === 1);
  b.strokeStyle = 'rgba(255,196,130,.75)'; b.lineWidth = 2; b.beginPath(); b.arc(x, y, 20, Math.PI * 1.04, Math.PI * 1.96); b.stroke();
  b.fillStyle = '#000'; b.beginPath(); b.arc(x, y, 15, 0, Math.PI * 2); b.fill();
  b.strokeStyle = 'rgba(255,225,180,.9)'; b.lineWidth = 1; b.beginPath(); b.arc(x, y, 15.5, 0, Math.PI * 2); b.stroke();
  for(let k = 0; k < 6; k++) ring(k, 0, Math.PI, k % 2 === 0);
  const n = Math.min(G.g, 14);
  for(let k = 0; k < n; k++){
    const ang = Math.PI * (0.18 + k * 0.047) + (k % 2 ? 0 : Math.PI * 0.62), rr = 19 + (k % 3) * 2.6;
    const gx = Math.round(x + Math.cos(ang) * rr * 1.25), gy = Math.round(y + Math.sin(ang) * rr * 0.42);
    b.fillStyle = 'rgba(200,60,70,.6)'; b.fillRect(gx - 2, gy, 4, 1); b.fillStyle = 'rgba(255,120,110,.55)'; b.fillRect(gx - 1, gy - 1, 2, 1);
  }
}
function drawBG(time){
  const g = b.createLinearGradient(0, 0, 0, BH); g.addColorStop(0, '#1d0f38'); g.addColorStop(1, '#0a0614');
  b.fillStyle = g; b.fillRect(0, 0, BW, BH);
  const n = b.createRadialGradient(BW * 0.78, BH * 0.18, 4, BW * 0.78, BH * 0.18, BW * 0.45); n.addColorStop(0, 'rgba(120,60,170,.18)'); n.addColorStop(1, 'rgba(120,60,170,0)');
  b.fillStyle = n; b.fillRect(0, 0, BW, BH);
  for(const s of stars){ const a = s.tw ? s.a * (0.5 + 0.5 * Math.sin(time * 2 + s.ph)) : s.a; b.fillStyle = `rgba(230,220,255,${a})`; b.fillRect(s.x, s.y, 1, 1); }
}
