/* ================= frame composition ================= */
function inB(a, u0, u1, v0, v1){ return a.u >= u0 - .05 && a.u < u1 && a.v >= v0 - .3 && a.v < v1 + .3; }
function draw(time){
  OU = 0; OV = 0; SW = false; CL = null;
  ox = Math.round(BW / 2 - CX + cam.px); oy = Math.round(BH / 2 - CY + cam.py);
  drawBG(time); drawBlackHole(time);
  sb.clearRect(0, 0, BW, BH); b = sb;
  drawVessel(time);
  const people = actors().slice(); if(S.inspector) people.push(S.inspector);
  const creature = S.breach ? [{u:C.u, v:C.v}] : [];
  const layer = (u0, u1, v0, v1, off, items) => {
    items.forEach(it => { it.d += off; });
    for(const a of people) if(inB(a, u0, u1, v0, v1)) items.push({d:a.u + a.v, f:() => { const o = OU, ov = OV, sw = SW; OU = 0; OV = 0; SW = false; drawPerson(a, time); OU = o; OV = ov; SW = sw; }});
    for(const c of creature) if(inB(c, u0, u1, v0, v1)) items.push({d:c.u + c.v + .05, f:() => { const o = OU, ov = OV, sw = SW; OU = 0; OV = 0; SW = false; const [x, y] = isoXY(c.u, c.v); OU = o; OV = ov; SW = sw; const bs = specById(S.breach.sp); if(bs) drawSpecimenBig(bs, x, y, time, {loose:true, sed:0, stress:1}); }});
    items.sort((p, q) => p.d - q.d).forEach(o => o.f());
  };
  drawHubShell(time);
  layer(0, 4, 0, 4, 0, [
    {d:4.0, f:() => drawCore(time)},
    {d:1.0, f:() => drawConsoleDesk(time)}, {d:1.9, f:() => chair(1.0, 0.98)}, {d:2.9, f:() => chair(2.0, 0.98)},
    {d:2.9, f:() => pylon(2, 1.1)}, {d:3.9, f:() => pylon(1.1, 2)}, {d:3.95, f:() => pylon(2.9, 2)}, {d:4.9, f:() => pylon(2, 2.9)},
    {d:3.8, f:() => cryo(3.3, 0.5, time)}, {d:4.3, f:() => cryo(3.7, 0.55, time)},
    {d:6.4, f:() => drawBench(time)}, {d:3.9, f:() => crate(0.45, 3.45, .28, 11)}, {d:4.75, f:() => printer3d(time)}, {d:6.45, f:() => robotArm(3.62, 3.02, 9, time)}
  ]);
  frontLips(MODS.hub, false, false, rowActive('S') > 0);
  for(const row of ['E', 'S']){
    const n = rowActive(row), labs = rowLabs(row);
    for(let jj = 0; jj < n; jj++){
      const L = labs[jj], o = STRIDE * jj, next = jj + 1 < n;
      CL = L; OU = o; OV = 0; SW = row === 'S';
      const rg = (u0, u1, v0, v1) => SW ? [v0, v1, u0 + o, u1 + o] : [u0 + o, u1 + o, v0, v1];
      drawCorrShell(time);
      layer(...rg(4, 6, 1, 3), o, [{d:6.5, f:() => deconArch(time)}].concat(L.built || L.building ? [] : [{d:7.6, f:() => sealedBulkhead()}]));
      frontLips(MODS.corr, false);
      if(L.built){
        drawLabShell(time);
        const cs = labSpec(L), mark = () => { if(cs && S.ui.focus && S.ui.focus.type === 'spec' && S.ui.focus.id === cs.id){ const [x, y] = isoXY(TK.c, TK.d); const bob = Math.round(Math.sin(time * 5)); b.fillStyle = PAL.amber; b.fillRect(x - 3, y - 60 + bob, 7, 1); b.fillRect(x - 2, y - 59 + bob, 5, 1); b.fillRect(x - 1, y - 58 + bob, 3, 1); b.fillRect(x, y - 57 + bob, 1, 1); } };
        const items = [{d:7.0, f:() => doorFrame(time)}, {d:9.6, f:() => at(0, 0.2, () => labExtinguisher())}, {d:11.0, f:() => at(0, 1, () => labFridge(time))}];
        if(L.type === 'containment') items.push({d:6.2, f:() => at(0, -1, () => labDesk(time))}, {d:6.83, f:() => labChair(6.85, -0.02)}, {d:10.9, f:() => at(2, -1, () => labRacks(time))},
          {d:12.8, f:() => at(2, -0.3, () => labBins(time))}, {d:13.5, f:() => sampleBench(time)}, {d:15.6, f:() => at(2, 0.55, () => labConsole(time))},
          {d:10.95, f:() => at(1, 0, () => tankBack(time))},
          {d:11.0, f:() => at(1, 0, () => { if(cs && !LB()){ const [x, y] = isoXY(TK.c, TK.d); drawSpecimenBig(cs, x, y - 8, time); } })},
          {d:11.05, f:() => at(1, 0, () => { tankFront(time); mark(); })});
        else if(L.type === 'micro') items.push({d:11.0, f:() => at(1, 0, () => { incubator(time, LB() ? null : cs); mark(); })}, {d:13.5, f:() => sampleBench(time)}, {d:15.6, f:() => at(2, 0.55, () => labConsole(time))});
        else if(L.type === 'genetics') items.push({d:11.0, f:() => at(1, 0, () => { scanTable(time, cs); mark(); })}, {d:6.83, f:() => labChair(6.85, 0.1)}, {d:15.6, f:() => at(2, 0.55, () => labConsole(time))});
        else if(L.type === 'chem') items.push({d:11.0, f:() => at(1, 0, () => chemIsland(time))}, {d:12.8, f:() => at(2, -0.3, () => labBins(time))}, {d:6.83, f:() => labChair(7.6, 3.9)});
        else if(L.type === 'physics') items.push({d:11.0, f:() => at(1, 0, () => physicsRig(time))}, {d:10.9, f:() => at(2, -1, () => labRacks(time))}, {d:15.6, f:() => at(2, 0.55, () => labConsole(time))}, {d:13.5, f:() => crate(10.6, 3.9, .3, 10)});
        layer(...rg(6, 12, -1, 5), o, items);
        frontLips(MODS.lab, true, next);
        if(L.integrity < 50 && Math.sin(time * 17 + L.k) > 0.75) qZ(6.2, -0.8, 12, 5, 0, 'rgba(0,0,0,.25)');
      } else {
        drawLabSite(L, time);
        layer(...rg(6, 12, -1, 5), o, []);
        frontLips(MODS.lab, false, next);
      }
    }
  }
  SW = false; OV = 0;
  OU = 0; CL = null;
  b = bMain;
  obc.globalCompositeOperation = 'source-over'; obc.clearRect(0, 0, BW, BH); obc.drawImage(sbuf, 0, 0);
  obc.globalCompositeOperation = 'source-in'; obc.fillStyle = OUT; obc.fillRect(0, 0, BW, BH); obc.globalCompositeOperation = 'source-over';
  for(const [dx, dy] of [[-2, 0], [2, 0], [0, -2], [0, 2], [-1, -1], [1, -1], [-1, 1], [1, 1]]) b.drawImage(obuf, dx, dy);
  b.drawImage(sbuf, 0, 0);
  b.globalCompositeOperation = 'lighter';
  for(const p of parts){ b.fillStyle = p.col; b.globalAlpha = Math.max(0, p.life); b.fillRect(Math.round(p.x), Math.round(p.y), 1, 1); }
  b.globalAlpha = 1; b.globalCompositeOperation = 'source-over';
  drawShuttle(time); drawFlight(time);
  if(S.breach){ b.fillStyle = `rgba(255,40,60,${0.07 + 0.06 * Math.sin(time * 6)})`; b.fillRect(0, 0, BW, BH); }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(buf, 0, 0, BW, BH, 0, 0, Math.round(BW * K * DPR), Math.round(BH * K * DPR));
}

function stepParts(dt){
  for(const p of parts){ p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 30 * dt; p.life -= dt * 1.2; }
  for(let i = parts.length - 1; i >= 0; i--) if(parts[i].life <= 0) parts.splice(i, 1);
}


