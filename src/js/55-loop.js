/* ================= loop ================= */
function stepParts(dt){
  for(const p of parts){ p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 30 * dt; p.life -= dt * 1.2; }
  for(let i = parts.length - 1; i >= 0; i--) if(parts[i].life <= 0) parts.splice(i, 1);
}
const STEP = {1:600, 3:190, 6:90};
let last = performance.now(), acc = 0, iconT = 0;
function frame(now){
  const dt = Math.min(100, now - last); last = now;
  if(running()){
    acc += dt;
    while(acc >= STEP[S.speed]){ acc -= STEP[S.speed]; tick(); if(!running()){ acc = 0; break; } }
    stepActors(dt / 1000);
  } else acc = 0;
  stepShuttle(dt / 1000);
  stepParts(dt / 1000);
  flushAutosave();
  if(S.dirty){ S.dirty = false; renderAll(); updateLive(); }
  iconT += dt;
  if(iconT > 120){ iconT = 0; document.querySelectorAll('#pane canvas[data-spec]').forEach(c => { const sp = specById(c.dataset.spec); if(sp) drawSpecIcon(c, sp); }); }
  draw(now / 1000);
  requestAnimationFrame(frame);
}
function intro(){
  const known = S.planets.filter(p => p.known);
  say('ops', 'neutral', `Rim Station 7 online. Survey seed ${S.seed}. Three worlds charted in range: ${known.map(p => p.name).join(', ')}. Two more signals are unconfirmed.`, {kind:'note'});
  say('pruitt', 'neutral', `Gerald Pruitt, station admin. Meridian has funded us properly: ${GRANT_START} credits, and a standing instruction that the science does not stop for accounting. Spend past it and we are over budget, which is my problem to report and your standing to lose. Lab A is built, sealed and empty. Nothing happens here until something alive, or once alive, comes through that door.`, {kind:'admin'});
  say('pruitt', 'smug', 'Pick a world on the star map. Each one tells you what kind of life to expect. The first specimen back is how we all learn the procedures, so choose like it matters.', {log:false});
  say('rook', 'neutral', `Rook Adebayo, recovery team. We're fueled and ready. One rule: we only bring back what you have a lab for. No open lab, no mission.`, {kind:'note'});
}
window.__hb = {S:() => S, camFit:() => camFit(), placeHeld:() => placeHeld(), genMaterials:p => genMaterials(p), makeCompound:(sp, t) => makeCompound(sp, t), genSpecimen:(p, k) => genSpecimen(p, k), placeSpecimen:sp => placeSpecimen(sp),
  capture:() => captureRun(), restore:d => restoreRun(d), encode:() => encode(S, 'S'), blocked:() => saveBlocked(),
  save:slot => writeSlot(slot || '1'), load:slot => loadSlot(slot || '1'), slots:() => SAVE_SLOTS.map(slotInfo), del:slot => deleteSlot(slot),
  rng:() => rngSnapshot(), tick:() => tick(),
  mkStaff:role => makeStaff(role, {reserve:false}), mkItem:(w, start, lane) => makeItem(w, S.ui, start, lane), moveItem:(it, start, lane) => moveItem(it, start, lane),
  st:{statOf:(id, k) => statOf(byId(id), k), pickCrew:(mode, n, id) => pickCrew(mode, n, {ignoreBusy:true, id}).map(a => a.id),
    roleOpen:k => roleOpen(k), openRoles:() => openRoles(), gatedBy:id => gatedBy(id), missingExpert:id => missingExpert(id),
    hire:id => hireStaff(id), awardXp:(id, k, h) => awardXp(byId(id), k, h), crewFactors:(ids, mode, id) => crewFactors(ids.map(byId), mode, id),
    workBlock:(w, o) => workBlock(w, o || S.ui), traits:() => TRAITS, roles:() => ROLES, upkeep:() => staffUpkeep(),
    heads:() => S.labs.map(L => ({lab:L.name, type:L.type, built:L.built, head:L.head, headed:labHeaded(L), need:headRoleFor(L)})),
    reseat:() => reseatHeads(), penalty:lane => headPenalty(lane), freeHeads:r => freeHeads(r).map(a => a.id), buildBlock:k => buildBlock(k),
    pairs:() => headPairs().map(p => ({a:p.a, b:p.b, type:p.type})), bonds:() => S.bonds,
    dayTick:() => { staffDayTick(); budgetDayTick(); dynamicsDayTick(); }, briefing:() => dynamicsBriefing(),
    overBudget:() => overBudget(), deficit:() => deficit(), meridian:() => meridianTick()}};
resize();
newRun();
requestAnimationFrame(frame);
