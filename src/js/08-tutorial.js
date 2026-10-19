/* ================= station guide ================= */
const TUT = [
  {text:'Pick a world on the star map. Each one shows what Meridian already knows about it.', done:() => S.ui.planetPicked},
  {text:'Send the first recovery team. Lab A is empty and waiting for whatever comes back.', done:() => !!S.mission || S.specs.length > 0},
  {text:'While the team is out, assign a lead scientist in the Staff tab.', done:() => !!S.lead},
  {text:'Wait for the team to come back. Use 3x or 6x to speed up time. Once research starts, each evening brings a briefing for missions, maintenance and building, and each morning waits for you to plan the day.', done:() => S.specs.length > 0},
  {text:'Schedule a sealed observation: open the planner and drag it onto Lab A\'s row. Sealed studies cannot cause a breach. If it is an animal, Rook sedated it for the trip, so put the observation on tomorrow\'s shift or the behavior data comes back unreliable.', done:() => S.specs[0] && valid(S.specs[0], 'obs')},
  {text:sp => sp && sp.kind === 'fossil' ? 'Fossils have no habitat to match. Take a core extraction next: it feeds every bench study after it.' : 'Run a habitat sweep. If it needs special conditions, match the environment in the Station tab.', done:() => { const sp = S.specs[0]; if(!sp) return false; if(sp.kind === 'fossil') return found(sp, 'sample'); const L = labOf(sp); return valid(sp, 'habitat') && (!sp.truth.sensitive || (L && L.envMatched)); }},
  {text:'Take a sample. Hands-on studies carry a risk factor. Precautions lower it but cost time and money; skipping them is cheap until it isn\'t.', done:() => S.specs[0] && found(S.specs[0], 'sample')},
  {text:'Run the bench assay. Bench studies use the sample at the hub, away from the animal.', done:() => S.specs[0] && found(S.specs[0], 'assay')},
  {text:'Finish any Tier 1 study still open, then publish the first paper in the Papers tab. Publishing renews the grant.', done:() => S.specs.some(s => s.paperV > 0)},
  {text:'The renewal unlocks new labs. At the end of the shift, build Lab B from the evening briefing.', done:() => S.labs[1].built || !!S.labs[1].building},
  {text:'With an open lab ready, send the next recovery mission from the evening briefing.', done:() => S.planets.reduce((a, p) => a + p.missions, 0) >= 2 || (!!S.mission && !S.firstMission)}
];
function tutText(i){ const t = TUT[i].text; return typeof t === 'function' ? t(S.specs[0]) : t; }
function tutTick(){
  if(!S || !S.tut.on) return;
  let moved = false;
  while(S.tut.step < TUT.length && TUT[S.tut.step].done()){ S.tut.step++; moved = true; }
  if(!moved) return;
  S.dirty = true;
  if(S.tut.step >= TUT.length){ S.tut.on = false; notify('pruitt', "That's the whole loop. From here the station is yours."); }
  else notify('pruitt', tutText(S.tut.step));
}

